// src/app/api/judging/vote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import JudgingEvent from '@/models/JudgingEvent';
import Judge from '@/models/Judge';
import Team from '@/models/Team';
import JudgingAssignment from '@/models/JudgingAssignment';
import JudgingVote from '@/models/JudgingVote';
import mongoose from 'mongoose';

// Record a vote for team comparison
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
        const { judgeId, eventId, winningTeamId, losingTeamId, isDraw, assignmentId } = body;

        // Validate required fields
        if (!judgeId || !eventId || !winningTeamId || !losingTeamId || !assignmentId) {
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

        // Check if teams exist
        const winningTeam = await Team.findById(winningTeamId);
        const losingTeam = await Team.findById(losingTeamId);

        if (!winningTeam || !losingTeam) {
            return NextResponse.json(
                { message: 'One or more teams not found' },
                { status: 404 }
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

        // Check permissions - only the assigned judge or an admin can submit votes
        const isAdmin = session.user.role === 'admin';
        const isJudgeUser = judge.user && judge.user.toString() === session.user.id;
        const isExternalJudge = judge.type === 'external' && judge.accessCode;

        if (!isAdmin && !isJudgeUser && !isExternalJudge) {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        // Check if the assignment exists and is valid
        const assignment = await JudgingAssignment.findById(assignmentId);
        if (!assignment) {
            return NextResponse.json(
                { message: 'Assignment not found' },
                { status: 404 }
            );
        }

        if (assignment.judge.toString() !== judgeId) {
            return NextResponse.json(
                { message: 'This assignment does not belong to this judge' },
                { status: 403 }
            );
        }

        if (assignment.status === 'completed') {
            return NextResponse.json(
                { message: 'This assignment has already been completed' },
                { status: 400 }
            );
        }

        // For demo day judging, update the ELO-like scores of the teams
        if (event.type.startsWith('demo_')) {
            // Get current scores or initialize if not present
            const winningScore = winningTeam.demoScore || 0;
            const losingScore = losingTeam.demoScore || 0;
            const winningConfidence = winningTeam.demoScoreConfidence || 0;
            const losingConfidence = losingTeam.demoScoreConfidence || 0;

            // Constants for the ELO calculation
            const K = 32; // Learning rate factor
            const SCALE = 400; // Scale factor

            if (isDraw) {
                // For a draw, both teams move toward the middle
                const expectedWinningScore = 1 / (1 + Math.pow(10, (losingScore - winningScore) / SCALE));
                const expectedLosingScore = 1 / (1 + Math.pow(10, (winningScore - losingScore) / SCALE));

                const newWinningScore = winningScore + K * (0.5 - expectedWinningScore);
                const newLosingScore = losingScore + K * (0.5 - expectedLosingScore);

                winningTeam.demoScore = newWinningScore;
                losingTeam.demoScore = newLosingScore;
            } else {
                // For a win/loss, update normally
                const expectedWinnerScore = 1 / (1 + Math.pow(10, (losingScore - winningScore) / SCALE));
                const expectedLoserScore = 1 / (1 + Math.pow(10, (winningScore - losingScore) / SCALE));

                const newWinningScore = winningScore + K * (1 - expectedWinnerScore);
                const newLosingScore = losingScore + K * (0 - expectedLoserScore);

                winningTeam.demoScore = newWinningScore;
                losingTeam.demoScore = newLosingScore;
            }

            // Increase confidence in scores
            winningTeam.demoScoreConfidence = winningConfidence + 1;
            losingTeam.demoScoreConfidence = losingConfidence + 1;

            // Save the updated teams
            await winningTeam.save();
            await losingTeam.save();
        }

        // Create a record of the vote
        const vote = new JudgingVote({
            judge: judgeId,
            event: eventId,
            winningTeam: winningTeamId,
            losingTeam: losingTeamId,
            isDraw,
            assignment: assignmentId
        });

        await vote.save();

        // Mark the assignment as completed
        assignment.status = 'completed';
        await assignment.save();

        // Clear the judge's current assignment
        judge.currentAssignment = null;
        await judge.save();

        return NextResponse.json(
            {
                message: 'Vote recorded successfully',
                winner: isDraw ? 'draw' : 'winning team',
                winnerScore: winningTeam.demoScore,
                loserScore: losingTeam.demoScore
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Vote submission error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}