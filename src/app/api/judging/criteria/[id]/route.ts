import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import JudgingCriteria from '@/models/JudgingCriteria';

// Get a single criterion
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

        const criterion = await JudgingCriteria.findById(params.id);

        if (!criterion) {
            return NextResponse.json(
                { message: 'Criterion not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { criterion },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get criterion error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update a criterion
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

        // Only admins can update criteria
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const criterion = await JudgingCriteria.findById(params.id);

        if (!criterion) {
            return NextResponse.json(
                { message: 'Criterion not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { name, description, weight, minScore, maxScore } = body;

        // Update fields if provided
        if (name) criterion.name = name;
        if (description) criterion.description = description;
        if (weight !== undefined) criterion.weight = weight;
        if (minScore !== undefined) criterion.minScore = minScore;
        if (maxScore !== undefined) criterion.maxScore = maxScore;

        // Validate score range
        if (criterion.minScore >= criterion.maxScore) {
            return NextResponse.json(
                { message: 'Min score must be less than max score' },
                { status: 400 }
            );
        }

        await criterion.save();

        return NextResponse.json(
            {
                message: 'Criterion updated successfully',
                criterion
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update criterion error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete a criterion
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

        // Only admins can delete criteria
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const criterion = await JudgingCriteria.findById(params.id);

        if (!criterion) {
            return NextResponse.json(
                { message: 'Criterion not found' },
                { status: 404 }
            );
        }

        await JudgingCriteria.deleteOne({ _id: params.id });

        return NextResponse.json(
            { message: 'Criterion deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete criterion error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}