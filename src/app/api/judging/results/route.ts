// src/app/api/judging/results/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import JudgingResult from '@/models/JudgingResult';
import JudgingAssignment from '@/models/JudgingAssignment';
import JudgingEvent from '@/models/JudgingEvent';
import Judge from '@/models/Judge';
import Team from '@/models/Team';
import mongoose from 'mongoose';

// Get judging results
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
        const teamId = searchParams.get('teamId');

        if (!eventId) {
            return NextResponse.json(
                { message: 'Event ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Only admins can view all results
        const isAdmin = session.user.role === 'admin';

        if (!isAdmin) {
            // If user is not admin, they can only view results for their team
            if (!teamId) {
                // Find their team
                const userTeam = await Team.findOne({
                    members: session.user.id
                });

                if (!userTeam) {
                    return NextResponse.json(
                        { message: 'Access denied' },
                        { status: 403 }
                    );
                }

                // Only return results for their team
                const results = await JudgingResult.find({
                    event: eventId,
                    team: userTeam._id
                })
                    .populate('judge', 'name')
                    .populate('team', 'name')
                    .sort({ timestamp: -1 });

                return NextResponse.json({ results }, { status: 200 });
            } else if (teamId) {
                // Check if they're part of this team
                const isTeamMember = await Team.exists({
                    _id: teamId,
                    members: session.user.id
                });

                if (!isTeamMember) {
                    return NextResponse.json(
                        { message: 'Access denied' },
                        { status: 403 }
                    );
                }
            }
        }

        // Build query
        const query: any = { event: eventId };
        if (teamId) query.team = teamId;

        const results = await JudgingResult.find(query)
            .populate('judge', 'name')
            .populate('team', 'name')
            .sort({ timestamp: -1 });

        return NextResponse.json({ results }, { status: 200 });
    } catch (error) {
        console.error('Get results error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Submit judging result
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
        const { assignmentId, scores, comments } = body;

        if (!assignmentId || !scores) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Get the assignment
        const assignment = await JudgingAssignment.findById(assignmentId);
        if (!assignment) {
            return NextResponse.json(
                { message: 'Assignment not found' },
                { status: 404 }
            );
        }

        // Check if this assignment is already completed
        if (assignment.status === 'completed') {
            return NextResponse.json(
                { message: 'This assignment is already completed' },
                { status: 400 }
            );
        }

        // Check permissions - only the assigned judge or an admin can submit results
        const isAdmin = session.user.role === 'admin';
        const judge = await Judge.findById(assignment.judge);

        if (!judge) {
            return NextResponse.json(
                { message: 'Judge not found' },
                { status: 404 }
            );
        }

        const isJudgeUser = judge.user && judge.user.toString() === session.user.id;

        if (!isAdmin && !isJudgeUser) {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        // Calculate overall score as average of scores
        const scoreValues = Object.values(scores) as number[];
        const overallScore = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;

        // Create result
        const result = new JudgingResult({
            judge: assignment.judge,
            team: assignment.team,
            event: assignment.event,
            scores,
            overallScore,
            comments: comments || ''
        });

        await result.save();

        // Update assignment status
        assignment.status = 'completed';
        await assignment.save();

        // Update judge's current assignment
        judge.currentAssignment = null;
        await judge.save();

        // For demo day, update team score
        const event = await JudgingEvent.findById(assignment.event);
        if (event && event.type.startsWith('demo_')) {
            const team = await Team.findById(assignment.team);
            if (team) {
                // Simple ELO-like algorithm
                const k = 32; // Learning rate
                const expectedScore = 1 / (1 + Math.pow(10, (0 - team.demoScore) / 400));
                const newScore = team.demoScore + k * (overallScore / 10 - expectedScore);

                team.demoScore = newScore;
                team.demoScoreConfidence += 1;
                await team.save();
            }
        }

        return NextResponse.json(
            {
                message: 'Judging result submitted successfully',
                result
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Submit result error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}