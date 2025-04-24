// src/app/api/judging/judges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Judge from '@/models/Judge';
import User from '@/models/User';
import JudgingEvent from '@/models/JudgingEvent';
import { emailHelper } from '@/lib/emailHelper';

// Get judges for an event
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json(
                { message: 'Event ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user is admin or a judge for this event
        const isAdmin = session.user.role === 'admin';
        const isJudge = await Judge.exists({
            event: eventId,
            user: session.user.id
        });

        if (!isAdmin && !isJudge) {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        const judges = await Judge.find({ event: eventId })
            .populate('user', 'name email')
            .populate('currentAssignment')
            .sort({ name: 1 });

        return NextResponse.json({ judges }, { status: 200 });
    } catch (error) {
        console.error('Get judges error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a new judge
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can create judges
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, email, type, eventId, userId, assignedRoom } = body;

        if (!name || !email || !type || !eventId) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if the event exists
        const event = await JudgingEvent.findById(eventId);
        if (!event) {
            return NextResponse.json(
                { message: 'Judging event not found' },
                { status: 404 }
            );
        }

        // Check if judge already exists for this event
        const existingJudge = await Judge.findOne({
            email: email.toLowerCase(),
            event: eventId
        });

        if (existingJudge) {
            return NextResponse.json(
                { message: 'Judge already exists for this event' },
                { status: 409 }
            );
        }

        let user = null;
        if (userId) {
            // If userId is provided, link to existing user
            user = await User.findById(userId);
        } else {
            // Otherwise, check if user exists by email
            user = await User.findOne({ email: email.toLowerCase() });
        }

        const newJudge = new Judge({
            name,
            email: email.toLowerCase(),
            type,
            event: eventId,
            user: (type === 'external') ? null : (user ? user._id : null),
            assignedRoom: assignedRoom || null
        });

        await newJudge.save();

        // If user exists, update the isJudge flag and reference
        if (user) {
            user.isJudge = true;
            user.judgeProfile = newJudge._id;
            await user.save();
        }

        // Send invitation email to the judge
        try {
            await emailHelper.sendJudgeInvitation(
                {
                    name: newJudge.name,
                    email: newJudge.email,
                    accessCode: newJudge.accessCode,
                    assignedRoom: newJudge.assignedRoom
                },
                {
                    _id: event._id.toString(),
                    name: event.name,
                    type: event.type,
                    startTime: event.startTime,
                    endTime: event.endTime
                }
            );
        } catch (emailError) {
            console.error('Failed to send judge invitation email:', emailError);
            // Continue with the request even if email fails
        }

        return NextResponse.json(
            {
                message: 'Judge created successfully',
                judge: newJudge
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create judge error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}