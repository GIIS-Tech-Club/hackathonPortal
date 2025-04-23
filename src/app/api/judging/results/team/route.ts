// src/app/api/judging/results/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import JudgingEvent from '@/models/JudgingEvent';
import JudgingResult from '@/models/JudgingResult';
import Team from '@/models/Team';

// Get results for a specific team
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

        if (!teamId) {
            return NextResponse.json(
                { message: 'Team ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if the event exists
        const event = await JudgingEvent.findById(eventId);
        if (!event) {
            return NextResponse.json(
                { message: 'Event not found' },
                { status: 404 }
            );
        }

        // Check if results are published or user is admin
        const isAdmin = session.user.role === 'admin';
        if (!isAdmin && !event.resultsPublished) {
            return NextResponse.json(
                { message: 'Results have not been published yet' },
                { status: 403 }
            );
        }

        // Check if user is part of the team (if not admin)
        if (!isAdmin) {
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

        // Get team's score
        const team = await Team.findById(teamId);
        if (!team) {
            return NextResponse.json(
                { message: 'Team not found' },
                { status: 404 }
            );
        }

        let score = 0;
        let rank = 0;
        let totalTeams = 0;

        // Different calculation based on event type
        if (event.type.startsWith('demo_')) {
            // For demo day events, use the calculated demoScore
            score = team.demoScore || 0;

            // Get all teams with scores for ranking
            const teams = await Team.find({
                demoScore: { $exists: true, $ne: null }
            }).sort({ demoScore: -1 });

            totalTeams = teams.length;

            // Find team's rank
            for (let i = 0; i < teams.length; i++) {
                if (teams[i]._id.toString() === teamId) {
                    rank = i + 1;
                    break;
                }
            }
        } else {
            // For pitching events, calculate average from results
            const results = await JudgingResult.find({
                team: teamId,
                event: eventId
            });

            if (results.length > 0) {
                // Calculate average score
                const totalScore = results.reduce((sum, result) => sum + result.overallScore, 0);
                score = totalScore / results.length;

                // Get all teams with average scores for ranking
                const teams = await Team.find().lean();
                const teamScores = [];

                for (const t of teams) {
                    const teamResults = await JudgingResult.find({
                        team: t._id,
                        event: eventId
                    });

                    if (teamResults.length > 0) {
                        const avgScore = teamResults.reduce((sum, r) => sum + r.overallScore, 0) / teamResults.length;
                        teamScores.push({ teamId: (t._id as { toString(): string }).toString(), score: avgScore });
                    }
                }

                // Sort by score descending
                teamScores.sort((a, b) => b.score - a.score);
                totalTeams = teamScores.length;

                // Find team's rank
                for (let i = 0; i < teamScores.length; i++) {
                    if (teamScores[i].teamId === teamId) {
                        rank = i + 1;
                        break;
                    }
                }
            }
        }

        // Return results
        return NextResponse.json(
            {
                results: {
                    score,
                    rank,
                    totalTeams
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get team results error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}