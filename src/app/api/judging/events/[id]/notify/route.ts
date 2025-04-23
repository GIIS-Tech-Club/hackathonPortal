// src/app/api/judging/events/[id]/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import JudgingEvent from '@/models/JudgingEvent';
import Judge from '@/models/Judge';
import { emailHelper } from '@/lib/emailHelper';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can send notifications
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const event = await JudgingEvent.findById(params.id);
        if (!event) {
            return NextResponse.json(
                { message: 'Judging event not found' },
                { status: 404 }
            );
        }

        // Get all judges for this event
        const judges = await Judge.find({ event: params.id });
        if (judges.length === 0) {
            return NextResponse.json(
                { message: 'No judges found for this event' },
                { status: 400 }
            );
        }

        // Send activation notifications to all judges
        const results = {
            total: judges.length,
            success: 0,
            failed: 0,
            failures: [] as string[]
        };

        for (const judge of judges) {
            try {
                const success = await emailHelper.sendEventActivation(
                    {
                        name: judge.name,
                        email: judge.email,
                        accessCode: judge.accessCode,
                        assignedRoom: judge.assignedRoom
                    },
                    {
                        _id: event._id.toString(),
                        name: event.name,
                        type: event.type,
                        startTime: event.startTime,
                        endTime: event.endTime
                    }
                );

                if (success) {
                    results.success++;
                } else {
                    results.failed++;
                    results.failures.push(`Failed to send email to ${judge.email}`);
                }
            } catch (err) {
                results.failed++;
                results.failures.push(`Error sending email to ${judge.email}: ${(err as Error).message}`);
            }
        }

        // Update event status to active if requested
        const body = await request.json();
        if (body.updateStatus && event.status === 'setup') {
            event.status = 'active';
            await event.save();
        }

        return NextResponse.json(
            {
                message: `Activation notifications sent to ${results.success} out of ${results.total} judges`,
                statusUpdated: body.updateStatus && event.status === 'active',
                results
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Notify judges error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Extend the PUT method in src/app/api/judging/events/[id]/route.ts to notify judges when status changes
// Add this logic to the existing PUT function:

/*
// When event status changes to 'active', send notifications to judges
if (status && status === 'active' && event.status !== 'active') {
    // Get all judges for this event
    const judges = await Judge.find({ event: params.id });
    
    // Send activation emails in the background
    for (const judge of judges) {
        try {
            emailHelper.sendEventActivation(
                {
                    name: judge.name,
                    email: judge.email,
                    accessCode: judge.accessCode,
                    assignedRoom: judge.assignedRoom
                },
                {
                    _id: event._id.toString(),
                    name: event.name,
                    type: event.type,
                    startTime: event.startTime,
                    endTime: event.endTime
                }
            ).catch(err => console.error(`Failed to send activation email to ${judge.email}:`, err));
        } catch (emailError) {
            console.error(`Error preparing email for ${judge.email}:`, emailError);
        }
    }
}
*/