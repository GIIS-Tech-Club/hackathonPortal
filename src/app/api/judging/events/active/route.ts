// src/app/api/judging/events/active/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import JudgingEvent from '@/models/JudgingEvent';

// Get the currently active judging event
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Find the most recently started active event
        const event = await JudgingEvent.findOne({
            status: 'active',
            startTime: { $lte: new Date() }, // Started in the past
            endTime: { $gte: new Date() }    // Ends in the future
        }).sort({ startTime: -1 });

        // If no currently active event, try to find the most recent one
        if (!event) {
            const mostRecentEvent = await JudgingEvent.findOne({})
                .sort({ startTime: -1 })
                .limit(1);

            if (mostRecentEvent) {
                return NextResponse.json(
                    {
                        message: 'No active event found, returning most recent event',
                        event: mostRecentEvent
                    },
                    { status: 200 }
                );
            } else {
                return NextResponse.json(
                    { message: 'No judging events found' },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json({ event }, { status: 200 });
    } catch (error) {
        console.error('Get active event error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}