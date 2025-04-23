// src/app/api/judging/tables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Team from '@/models/Team';
import User from '@/models/User';
import JudgingEvent from '@/models/JudgingEvent';
import { emailHelper } from '@/lib/emailHelper';

// Assign table numbers to teams
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can assign tables
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { teamId, tableNumber, tableMap, eventId, sendNotification } = body;

        if (!teamId || !tableNumber) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find the team
        const team = await Team.findById(teamId).populate('members', 'name email');
        if (!team) {
            return NextResponse.json(
                { message: 'Team not found' },
                { status: 404 }
            );
        }

        // Check if table number is already assigned to another team
        const existingTeam = await Team.findOne({
            _id: { $ne: teamId },
            tableNumber
        });

        if (existingTeam) {
            return NextResponse.json(
                { message: `Table ${tableNumber} is already assigned to team ${existingTeam.name}` },
                { status: 409 }
            );
        }

        // Get previous table number for notification purposes
        const previousTableNumber = team.tableNumber;

        // Update team
        team.tableNumber = tableNumber;
        if (tableMap !== undefined) team.tableMap = tableMap || null;
        await team.save();

        // Send notification email if requested
        if (sendNotification) {
            try {
                // Get member emails
                const memberEmails = team.members.map((member: any) => member.email);

                // Get event information if provided
                let eventDetails;
                if (eventId) {
                    const event = await JudgingEvent.findById(eventId);
                    if (event) {
                        eventDetails = {
                            setupTime: new Date(event.startTime).toLocaleString(),
                            demoTime: `${new Date(event.startTime).toLocaleString()} - ${new Date(event.endTime).toLocaleString()}`
                        };
                    }
                }

                // Send the email
                await emailHelper.sendTableAssignment(
                    {
                        name: team.name,
                        emails: memberEmails,
                        tableNumber,
                        tableMap: tableMap || team.tableMap
                    },
                    eventDetails
                );
            } catch (emailError) {
                console.error('Failed to send table assignment notification:', emailError);
                // Continue with the request even if email fails
            }
        }

        return NextResponse.json(
            {
                message: `Table ${tableNumber} assigned to ${team.name}${previousTableNumber ? ` (previous: ${previousTableNumber})` : ''
                    }`,
                team: {
                    id: team._id,
                    name: team.name,
                    tableNumber: team.tableNumber,
                    tableMap: team.tableMap
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Assign table error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Bulk assign table numbers to teams
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can bulk assign tables
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { assignments, eventId, sendNotifications } = body;

        if (!assignments || !Array.isArray(assignments) || assignments.length === 0 || !eventId) {
            return NextResponse.json(
                { message: 'Invalid assignments or missing event ID' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if event exists
        const event = await JudgingEvent.findById(eventId);
        if (!event) {
            return NextResponse.json(
                { message: 'Judging event not found' },
                { status: 404 }
            );
        }

        // Prepare event details for notifications
        const eventDetails = {
            setupTime: new Date(event.startTime).toLocaleString(),
            demoTime: `${new Date(event.startTime).toLocaleString()} - ${new Date(event.endTime).toLocaleString()}`
        };

        // Process assignments
        const results = [];
        const errors = [];
        const emailResults = {
            sent: 0,
            failed: 0
        };

        for (const assignment of assignments) {
            const { teamId, tableNumber, tableMap } = assignment;

            if (!teamId || !tableNumber) {
                errors.push(`Missing teamId or tableNumber for an assignment`);
                continue;
            }

            try {
                const team = await Team.findById(teamId).populate('members', 'name email');
                if (!team) {
                    errors.push(`Team with ID ${teamId} not found`);
                    continue;
                }

                team.tableNumber = tableNumber;
                if (tableMap !== undefined) team.tableMap = tableMap || null;
                await team.save();

                // Add to successful results
                results.push({
                    teamId,
                    teamName: team.name,
                    tableNumber,
                    success: true
                });

                // Send notification if requested
                if (sendNotifications) {
                    try {
                        // Get member emails
                        const memberEmails = team.members.map((member: any) => member.email);

                        // Send the email
                        const emailSuccess = await emailHelper.sendTableAssignment(
                            {
                                name: team.name,
                                emails: memberEmails,
                                tableNumber,
                                tableMap: tableMap || team.tableMap
                            },
                            eventDetails
                        );

                        if (emailSuccess) {
                            emailResults.sent++;
                        } else {
                            emailResults.failed++;
                        }
                    } catch (emailError) {
                        console.error(`Failed to send table assignment notification to team ${team.name}:`, emailError);
                        emailResults.failed++;
                    }
                }
            } catch (err) {
                errors.push(`Error assigning table ${tableNumber} to team ${teamId}: ${(err as Error).message}`);
            }
        }

        return NextResponse.json(
            {
                message: 'Bulk table assignment completed',
                results,
                errors,
                success: results.length,
                failed: errors.length,
                emailResults: sendNotifications ? emailResults : undefined
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Bulk assign tables error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Get all table assignments
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // All users can view table assignments
        const teams = await Team.find({
            tableNumber: { $ne: null }
        })
            .select('name tableNumber tableMap status')
            .sort({ tableNumber: 1 });

        return NextResponse.json({ teams }, { status: 200 });
    } catch (error) {
        console.error('Get table assignments error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

