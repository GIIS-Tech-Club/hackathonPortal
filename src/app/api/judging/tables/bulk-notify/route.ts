import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Team from '@/models/Team';
import JudgingEvent from '@/models/JudgingEvent';
import { emailHelper } from '@/lib/emailHelper';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can send bulk notifications
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { eventId, teamIds } = body;

        if (!eventId) {
            return NextResponse.json(
                { message: 'Event ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Get the event
        const event = await JudgingEvent.findById(eventId);
        if (!event) {
            return NextResponse.json(
                { message: 'Event not found' },
                { status: 404 }
            );
        }

        // Prepare event details for notifications
        const eventDetails = {
            setupTime: new Date(event.startTime).toLocaleString(),
            demoTime: `${new Date(event.startTime).toLocaleString()} - ${new Date(event.endTime).toLocaleString()}`
        };

        // Get teams to notify
        let teamsQuery: Record<string, any> = { tableNumber: { $ne: null } };

        if (teamIds && Array.isArray(teamIds) && teamIds.length > 0) {
            // Notify specific teams
            teamsQuery = {
                ...teamsQuery,
                _id: { $in: teamIds }
            };
        }

        const teams = await Team.find(teamsQuery)
            .populate('members', 'name email');

        if (teams.length === 0) {
            return NextResponse.json(
                { message: 'No teams found with table assignments' },
                { status: 400 }
            );
        }

        // Send notifications
        const results = {
            total: teams.length,
            success: 0,
            failed: 0,
            failures: [] as string[]
        };

        for (const team of teams) {
            try {
                if (!team.tableNumber) {
                    results.failed++;
                    results.failures.push(`Team ${team.name} has no table assigned`);
                    continue;
                }

                // Get member emails
                const memberEmails = team.members.map((member: any) => member.email);

                const success = await emailHelper.sendTableAssignment(
                    {
                        name: team.name,
                        emails: memberEmails,
                        tableNumber: team.tableNumber,
                        tableMap: team.tableMap
                    },
                    eventDetails
                );

                if (success) {
                    results.success++;
                } else {
                    results.failed++;
                    results.failures.push(`Failed to send email to team ${team.name}`);
                }
            } catch (err) {
                results.failed++;
                results.failures.push(`Error sending email to team ${team.name}: ${(err as Error).message}`);
            }
        }

        return NextResponse.json(
            {
                message: `Table notifications sent to ${results.success} out of ${results.total} teams`,
                results
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Bulk notify teams error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}