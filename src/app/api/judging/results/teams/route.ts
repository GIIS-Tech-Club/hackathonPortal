// src/app/api/judging/results/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import JudgingEvent from '@/models/JudgingEvent';
import JudgingResult from '@/models/JudgingResult';
import Team from '@/models/Team';

// Get results for all teams in an event
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

        const teamResults = [];

        // Different calculation based on event type
        if (event.type.startsWith('demo_')) {
            // For demo day events, use the calculated demoScore
            const teams = await Team.find({
                demoScore: { $exists: true, $ne: null }
            }).sort({ demoScore: -1 });

            // Calculate rankings and format results
            for (let i = 0; i < teams.length; i++) {
                const team = teams[i];
                teamResults.push({
                    team: {
                        _id: team._id,
                        name: team.name,
                        tableNumber: team.tableNumber || 'N/A'
                    },
                    score: team.demoScore || 0,
                    rank: i + 1,
                    totalTeams: teams.length,
                    timesJudged: team.timesJudged || 0,
                    confidence: team.demoScoreConfidence || 0
                });
            }
        } else {
            // For pitching events, calculate average from results
            const teams = await Team.find({ status: 'approved' }).lean();
            const teamScores = [];

            for (const team of teams) {
                const results = await JudgingResult.find({
                    team: team._id,
                    event: eventId
                });

                if (results.length > 0) {
                    // Calculate average score
                    const totalScore = results.reduce((sum, result) => sum + result.overallScore, 0);
                    const avgScore = totalScore / results.length;

                    teamScores.push({
                        team: {
                            _id: team._id,
                            name: team.name,
                            tableNumber: team.tableNumber || 'N/A'
                        },
                        score: avgScore,
                        timesJudged: results.length,
                        confidence: results.length, // In pitching events, confidence = number of ratings
                        rank: 0, // Will be updated after sorting
                        totalTeams: 0 // Will be updated after determining total
                    });
                }
            }

            // Sort by score descending
            teamScores.sort((a, b) => b.score - a.score);
            const totalTeams = teamScores.length;

            // Add rank and total to each team's results
            for (let i = 0; i < teamScores.length; i++) {
                teamScores[i].rank = i + 1;
                teamScores[i].totalTeams = totalTeams;
                teamResults.push(teamScores[i]);
            }
        }

        return NextResponse.json(
            { results: teamResults },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get teams results error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}