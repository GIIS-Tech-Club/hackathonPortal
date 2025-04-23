import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import JudgingEvent from '@/models/JudgingEvent';
import Judge from '@/models/Judge';
import Team from '@/models/Team';
import JudgingAssignment from '@/models/JudgingAssignment';
import mongoose from 'mongoose';

// Get next team to judge using the demo day algorithm
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('Here!');

        const searchParams = request.nextUrl.searchParams;
        console.log('Search params:', searchParams.toString());
        console.log('URL:', request.nextUrl.toString());
        const eventId = searchParams.get('eventId');
        const judgeId = searchParams.get('judgeId');

        if (!eventId || !judgeId) {
            return NextResponse.json(
                { message: 'Event ID and Judge ID are required' },
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
        const judge = await Judge.findById(judgeId).populate('user');
        if (!judge) {
            return NextResponse.json(
                { message: 'Judge not found' },
                { status: 404 }
            );
        }

        // Check permissions
        const isAdmin = session.user.role === 'admin';
        const isJudgeUser = judge.user && judge.user._id.toString() === session.user.id;

        if (!isAdmin && !isJudgeUser) {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        // Find all teams this judge has already judged
        const judgedTeamIds = (await JudgingAssignment.find({
            judge: judgeId,
            event: eventId
        })).map(assignment => assignment.team.toString());

        // Find teams eligible for judging
        // For participants judging, exclude their own team
        let excludeTeamIds = [...judgedTeamIds];
        if (judge.type === 'participant' && judge.user) {
            const participantTeam = await Team.findOne({
                members: judge.user._id
            });

            if (participantTeam) {
                excludeTeamIds.push(participantTeam._id.toString());
            }
        }

        // Find teams with assigned tables
        const eligibleTeams = await Team.find({
            _id: { $nin: excludeTeamIds },
            tableNumber: { $ne: null }
        }).sort({ timesJudged: 1 });

        if (eligibleTeams.length === 0) {
            return NextResponse.json(
                { message: 'No eligible teams to judge' },
                { status: 404 }
            );
        }

        // Select team with fewest judgings
        const nextTeam = eligibleTeams[0];

        // Create assignment
        const newAssignment = new JudgingAssignment({
            judge: judgeId,
            team: nextTeam._id,
            event: eventId
        });

        await newAssignment.save();

        // Update judge's current assignment
        judge.currentAssignment = newAssignment._id;
        await judge.save();

        // Update team's judging count
        nextTeam.timesJudged += 1;
        await nextTeam.save();

        return NextResponse.json(
            {
                message: 'Next team assigned successfully',
                assignment: await JudgingAssignment.findById(newAssignment._id)
                    .populate('team', 'name tableNumber description')
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Demo day algorithm error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}