import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import JudgingEvent from '@/models/JudgingEvent';

// Get all judging events
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can access all events
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const events = await JudgingEvent.find().sort({ startTime: -1 });

        return NextResponse.json({ events }, { status: 200 });
    } catch (error) {
        console.error('Get judging events error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a new judging event
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can create events
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, type, startTime, endTime, settings } = body;

        if (!name || !type || !startTime || !endTime) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        const newEvent = new JudgingEvent({
            name,
            type,
            startTime,
            endTime,
            settings: settings || {},
        });

        await newEvent.save();

        return NextResponse.json(
            {
                message: 'Judging event created successfully',
                event: newEvent
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create judging event error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}