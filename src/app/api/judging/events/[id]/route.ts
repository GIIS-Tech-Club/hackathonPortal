import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import JudgingEvent from '@/models/JudgingEvent';
import JudgingCriteria from '@/models/JudgingCriteria';
import Judge from '@/models/Judge';
import JudgingAssignment from '@/models/JudgingAssignment';
import JudgingResult from '@/models/JudgingResult';
import { emailHelper } from '@/lib/emailHelper';

// Get a single judging event
export async function GET(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        // Properly await the params object
        const params = await context.params;
        const eventId = params.id;
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const event = await JudgingEvent.findById(eventId);

        if (!event) {
            return NextResponse.json(
                { message: 'Judging event not found' },
                { status: 404 }
            );
        }

        // If user is not an admin, check if they're a judge for this event
        if (session.user.role !== 'admin') {
            const isJudge = await Judge.exists({
                event: eventId,
                user: session.user.id
            });

            if (!isJudge) {
                return NextResponse.json(
                    { message: 'Access denied' },
                    { status: 403 }
                );
            }
        }

        // Get related data
        const criteria = await JudgingCriteria.find({ event: eventId });
        const judges = await Judge.find({ event: eventId });

        return NextResponse.json(
            {
                event,
                criteria,
                judges
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get judging event error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update a judging event
export async function PUT(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        // Properly await the params object
        const params = await context.params;
        const eventId = params.id;
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can update events
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const event = await JudgingEvent.findById(eventId);

        if (!event) {
            return NextResponse.json(
                { message: 'Judging event not found' },
                { status: 404 }
            );
        }


        const body = await request.json();
        const { name, type, status, startTime, endTime, settings } = body;

        // Update fields
        if (name) event.name = name;
        if (type) event.type = type;
        if (status) event.status = status;
        if (startTime) event.startTime = startTime;
        if (endTime) event.endTime = endTime;
        if (settings) event.settings = { ...event.settings, ...settings };

        if (status && status === 'active' && event.status !== 'active') {
            // Get all judges for this event
            const judges = await Judge.find({ event: eventId });

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
                    ).catch((err: Error) => console.error(`Failed to send activation email to ${judge.email}:`, err));
                } catch (emailError) {
                    console.error(`Error preparing email for ${judge.email}:`, emailError);
                }
            }
        }

        await event.save();

        return NextResponse.json(
            {
                message: 'Judging event updated successfully',
                event
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update judging event error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete a judging event
export async function DELETE(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        // Properly await the params object
        const params = await context.params;
        const eventId = params.id;
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can delete events
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const event = await JudgingEvent.findById(eventId);

        if (!event) {
            return NextResponse.json(
                { message: 'Judging event not found' },
                { status: 404 }
            );
        }

        // Delete related data
        await JudgingCriteria.deleteMany({ event: eventId });
        await Judge.deleteMany({ event: eventId });
        await JudgingAssignment.deleteMany({ event: eventId });
        await JudgingResult.deleteMany({ event: eventId });

        // Delete the event
        await JudgingEvent.deleteOne({ _id: eventId });

        return NextResponse.json(
            { message: 'Judging event and related data deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete judging event error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}