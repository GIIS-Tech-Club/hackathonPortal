// src/app/api/teams/[id]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Team from '@/models/Team';
import User from '@/models/User';
import mongoose from 'mongoose';

// Join a team
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
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

        // Find the team to join
        const team = await Team.findById(params.id);
        if (!team) {
            return NextResponse.json(
                { message: 'Team not found' },
                { status: 404 }
            );
        }

        // Check if team is full
        if (team.members.length >= team.maxSize) {
            return NextResponse.json(
                { message: 'Team is already full' },
                { status: 400 }
            );
        }

        // Add user to team
        team.members.push(new mongoose.Types.ObjectId(session.user.id as string));
        await team.save();

        return NextResponse.json(
            { message: 'Successfully joined team' },
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

// Remove a member from team (can be called by the member themselves to leave, or by team leader to remove)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const memberId = searchParams.get('memberId') || session.user.id;

        await dbConnect();

        const team = await Team.findById(params.id);
        if (!team) {
            return NextResponse.json(
                { message: 'Team not found' },
                { status: 404 }
            );
        }

        // Check if user is removing themselves or has permission to remove
        const isSelf = memberId === session.user.id;
        const isLeader = team.leader.toString() === session.user.id;
        const isAdmin = session.user.role === 'admin';

        if (!isSelf && !isLeader && !isAdmin) {
            return NextResponse.json(
                { message: 'You do not have permission to remove this member' },
                { status: 403 }
            );
        }

        // Cannot remove team leader unless you're an admin
        if (memberId === team.leader.toString() && !isAdmin) {
            return NextResponse.json(
                { message: 'Team leader cannot leave the team. Transfer leadership first or delete the team.' },
                { status: 400 }
            );
        }

        // Remove member from team
        team.members = team.members.filter(
            (id: mongoose.Types.ObjectId) => id.toString() !== memberId
        );

        // If no members left, delete the team
        if (team.members.length === 0) {
            await Team.deleteOne({ _id: params.id });
            return NextResponse.json(
                { message: 'Member removed and team deleted (no members left)' },
                { status: 200 }
            );
        }

        // If leader is leaving, assign new leader
        if (memberId === team.leader.toString()) {
            team.leader = team.members[0];
        }

        await team.save();

        return NextResponse.json(
            { message: isSelf ? 'Successfully left team' : 'Member removed successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Remove team member error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}