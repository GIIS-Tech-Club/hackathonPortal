// src/app/api/teams/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Team from '@/models/Team';
import User from '@/models/User';
import mongoose from 'mongoose';

// Get a single team
export async function GET(
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

        const team = await Team.findById(params.id)
            .populate('members', 'name email')
            .populate('leader', 'name email');

        if (!team) {
            return NextResponse.json(
                { message: 'Team not found' },
                { status: 404 }
            );
        }

        // If user is not admin and team is not approved, check if user is a member
        if (session.user.role !== 'admin' && team.status !== 'approved') {
            const isMember = team.members.some(
                (member: any) => member._id.toString() === session.user.id
            );

            if (!isMember) {
                return NextResponse.json(
                    { message: 'Access denied' },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json({ team: team.toObject({ getters: true }) }, { status: 200 });
    } catch (error) {
        console.error('Get team error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update team (for admins or team leader)
export async function PUT(
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

        const team = await Team.findById(params.id);
        if (!team) {
            return NextResponse.json(
                { message: 'Team not found' },
                { status: 404 }
            );
        }

        // Only team leader or admin can update
        const isLeader = team.leader.toString() === session.user.id;
        const isAdmin = session.user.role === 'admin';

        if (!isLeader && !isAdmin) {
            return NextResponse.json(
                { message: 'You do not have permission to update this team' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Admin-only fields
        if (isAdmin) {
            if (body.status) team.status = body.status;
            if (body.rejectionReason) team.rejectionReason = body.rejectionReason;
            if (body.seatLocation) team.seatLocation = body.seatLocation;
        }

        // Fields that can be updated by team leader
        if (isLeader) {
            if (body.name) team.name = body.name;
            if (body.description) team.description = body.description;
            if (body.category) team.category = body.category;
            if (body.maxSize && team.members.length <= body.maxSize) {
                team.maxSize = body.maxSize;
            }
        }

        await team.save();

        return NextResponse.json(
            {
                message: 'Team updated successfully',
                team: team.toObject({ getters: true })
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update team error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete team (admin or team leader only)
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

        await dbConnect();

        const team = await Team.findById(params.id);
        if (!team) {
            return NextResponse.json(
                { message: 'Team not found' },
                { status: 404 }
            );
        }

        // Only team leader or admin can delete
        const isLeader = team.leader.toString() === session.user.id;
        const isAdmin = session.user.role === 'admin';

        if (!isLeader && !isAdmin) {
            return NextResponse.json(
                { message: 'You do not have permission to delete this team' },
                { status: 403 }
            );
        }

        await Team.deleteOne({ _id: params.id });

        return NextResponse.json(
            { message: 'Team deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete team error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}