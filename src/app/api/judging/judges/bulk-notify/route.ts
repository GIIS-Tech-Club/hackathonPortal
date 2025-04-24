import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Judge from '@/models/Judge';
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
        const { eventId, notificationType, judgeIds } = body;

        if (!eventId || !notificationType) {
            return NextResponse.json(
                { message: 'Missing required fields' },
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

        // Get judges to notify
        let judges;
        if (judgeIds && Array.isArray(judgeIds) && judgeIds.length > 0) {
            // Notify specific judges
            judges = await Judge.find({
                _id: { $in: judgeIds },
                event: eventId
            });
        } else {
            // Notify all judges for this event
            judges = await Judge.find({ event: eventId });
        }

        if (judges.length === 0) {
            return NextResponse.json(
                { message: 'No judges found to notify' },
                { status: 400 }
            );
        }

        // Send notifications
        const results = {
            total: judges.length,
            success: 0,
            failed: 0,
            failures: [] as string[]
        };

        for (const judge of judges) {
            try {
                let success = false;

                if (notificationType === 'invitation') {
                    success = await emailHelper.sendJudgeInvitation(
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
                } else if (notificationType === 'activation') {
                    success = await emailHelper.sendEventActivation(
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
                }

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

        return NextResponse.json(
            {
                message: `Notifications sent to ${results.success} out of ${results.total} judges`,
                results
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Bulk notify judges error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}