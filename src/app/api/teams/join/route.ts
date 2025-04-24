// src/app/api/teams/join/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Team from '@/models/Team';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body to get invite code
        const body = await request.json();
        const { inviteCode } = body;

        if (!inviteCode) {
            return NextResponse.json(
                { message: 'Invite code is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user is already in a team
        const userInTeam = await Team.findOne({
            members: new mongoose.Types.ObjectId(session.user.id as string)
        });

        if (userInTeam) {
            return NextResponse.json(
                { message: 'You are already a member of a team' },
                { status: 400 }
            );
        }

        // Find the team with the invite code
        const team = await Team.findOne({ inviteCode: inviteCode.toUpperCase() });

        if (!team) {
            return NextResponse.json(
                { message: 'Invalid invite code. Please check the code and try again.' },
                { status: 404 }
            );
        }

        // Check if team is full
        if (team.members.length >= team.maxSize) {
            return NextResponse.json(
                { message: 'This team is already full' },
                { status: 400 }
            );
        }

        // Add user to team
        team.members.push(new mongoose.Types.ObjectId(session.user.id as string));
        await team.save();

        return NextResponse.json(
            {
                message: 'Successfully joined team',
                team: {
                    id: team._id,
                    name: team.name
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Join team error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}