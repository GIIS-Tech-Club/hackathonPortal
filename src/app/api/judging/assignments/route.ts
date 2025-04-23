import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import JudgingAssignment from '@/models/JudgingAssignment';
import Judge from '@/models/Judge';
import Team from '@/models/Team';
import JudgingEvent from '@/models/JudgingEvent';
import mongoose from 'mongoose';

// Get judging assignments
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
        const judgeId = searchParams.get('judgeId');
        const teamId = searchParams.get('teamId');

        if (!eventId) {
            return NextResponse.json(
                { message: 'Event ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const query: any = { event: eventId };

        if (judgeId) query.judge = judgeId;
        if (teamId) query.team = teamId;

        // Check permissions
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

        // If user is a judge (not admin), they should only see their assignments
        if (!isAdmin && isJudge) {
            const judge = await Judge.findOne({
                event: eventId,
                user: session.user.id
            });
            query.judge = judge._id;
        }

        const assignments = await JudgingAssignment.find(query)
            .populate('judge', 'name email')
            .populate('team', 'name tableNumber')
            .sort({ timestamp: -1 });

        return NextResponse.json({ assignments }, { status: 200 });
    } catch (error) {
        console.error('Get assignments error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a judging assignment
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { judgeId, teamId, eventId } = body;

        if (!judgeId || !teamId || !eventId) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if event exists and is active
        const event = await JudgingEvent.findById(eventId);
        if (!event) {
            return NextResponse.json(
                { message: 'Judging event not found' },
                { status: 404 }
            );
        }

        if (event.status !== 'active') {
            return NextResponse.json(
                { message: 'Judging event is not active' },
                { status: 400 }
            );
        }

        // Check if judge exists
        const judge = await Judge.findById(judgeId);
        if (!judge) {
            return NextResponse.json(
                { message: 'Judge not found' },
                { status: 404 }
            );
        }

        // Check if team exists
        const team = await Team.findById(teamId);
        if (!team) {
            return NextResponse.json(
                { message: 'Team not found' },
                { status: 404 }
            );
        }

        // Check permissions
        const isAdmin = session.user.role === 'admin';
        const isJudgeUser = judge.user && judge.user.toString() === session.user.id;

        if (!isAdmin && !isJudgeUser) {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        // For demo day, check if this judge has already judged this team
        if (event.type.startsWith('demo_')) {
            const existingAssignment = await JudgingAssignment.findOne({
                judge: judgeId,
                team: teamId,
                event: eventId
            });

            if (existingAssignment) {
                return NextResponse.json(
                    { message: 'Judge has already been assigned this team' },
                    { status: 409 }
                );
            }
        }

        // Create the assignment
        const newAssignment = new JudgingAssignment({
            judge: judgeId,
            team: teamId,
            event: eventId
        });

        await newAssignment.save();

        // Update judge's current assignment
        judge.currentAssignment = newAssignment._id;
        await judge.save();

        return NextResponse.json(
            {
                message: 'Judging assignment created successfully',
                assignment: newAssignment
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create assignment error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}