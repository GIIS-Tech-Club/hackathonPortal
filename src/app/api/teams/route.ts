// src/app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Team from '@/models/Team';
import User from '@/models/User';
import mongoose from 'mongoose';

// Create a new team
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { name, description, category, maxSize } = body;

        // Validate input
        if (!name || !description) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if team name already exists
        const existingTeam = await Team.findOne({ name });
        if (existingTeam) {
            return NextResponse.json(
                { message: 'A team with this name already exists' },
                { status: 409 }
            );
        }

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

        // Create new team with the current user as leader and first member
        const newTeam = new Team({
            name,
            description,
            category: category || 'other',
            maxSize: maxSize || 4,
            leader: session.user.id,
            members: [session.user.id],
            status: 'pending'
        });

        await newTeam.save();

        return NextResponse.json(
            {
                message: 'Team created successfully',
                team: {
                    id: newTeam._id,
                    name: newTeam.name,
                    description: newTeam.description,
                    category: newTeam.category,
                    maxSize: newTeam.maxSize,
                    status: newTeam.status,
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Team creation error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Get all teams (with optional filtering)
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

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const query: any = {};

        // Apply filters if provided
        if (status) query.status = status;
        if (category) query.category = category;

        // If user is not admin, only show approved teams or their own team
        if (session.user.role !== 'admin') {
            if (!status) {
                query.$or = [
                    { status: 'approved' },
                    { members: new mongoose.Types.ObjectId(session.user.id as string) }
                ];
            }
        }

        const teams = await Team.find(query)
            .populate('members', 'name email')
            .populate('leader', 'name email')
            .sort({ createdAt: -1 });

        return NextResponse.json(
            { teams: teams.map(team => team.toObject({ getters: true })) },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get teams error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}