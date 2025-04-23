import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import JudgingCriteria from '@/models/JudgingCriteria';
import JudgingEvent from '@/models/JudgingEvent';

// Get all criteria for an event
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

        const criteria = await JudgingCriteria.find({ event: eventId });

        return NextResponse.json({ criteria }, { status: 200 });
    } catch (error) {
        console.error('Get criteria error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a new criterion
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can create criteria
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, description, weight, minScore, maxScore, eventId } = body;

        if (!name || !description || !eventId) {
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

        const newCriterion = new JudgingCriteria({
            name,
            description,
            weight: weight || 1,
            minScore: minScore || 1,
            maxScore: maxScore || 10,
            event: eventId
        });

        await newCriterion.save();

        return NextResponse.json(
            {
                message: 'Judging criterion created successfully',
                criterion: newCriterion
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create criterion error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}