// src/app/api/locations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Location from '@/models/Location';

// Get a single location
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

        // Only admins can access locations
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const location = await Location.findById(params.id);

        if (!location) {
            return NextResponse.json(
                { message: 'Location not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { location },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get location error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update a location
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

        // Only admins can update locations
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const location = await Location.findById(params.id);

        if (!location) {
            return NextResponse.json(
                { message: 'Location not found' },
                { status: 404 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { name, capacity, description, allocationPercentage } = body;

        // Update fields if provided
        if (name) location.name = name;
        if (capacity !== undefined) location.capacity = capacity;
        if (description !== undefined) location.description = description;
        if (allocationPercentage !== undefined) location.allocationPercentage = allocationPercentage;

        await location.save();

        return NextResponse.json(
            {
                message: 'Location updated successfully',
                location
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update location error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete a location
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

        // Only admins can delete locations
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const location = await Location.findById(params.id);

        if (!location) {
            return NextResponse.json(
                { message: 'Location not found' },
                { status: 404 }
            );
        }

        await Location.deleteOne({ _id: params.id });

        return NextResponse.json(
            { message: 'Location deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete location error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}