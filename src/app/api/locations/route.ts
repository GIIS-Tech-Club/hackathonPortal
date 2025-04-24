// src/app/api/locations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Location from '@/models/Location';

// Get all locations
export async function GET(request: NextRequest) {
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

        const locations = await Location.find().sort({ createdAt: -1 });

        return NextResponse.json(
            { locations },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get locations error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a new location
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can create locations
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { name, capacity, description, allocationPercentage } = body;

        // Validate input
        if (!name || !capacity) {
            return NextResponse.json(
                { message: 'Name and capacity are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if location with this name already exists
        const existingLocation = await Location.findOne({ name });
        if (existingLocation) {
            return NextResponse.json(
                { message: 'A location with this name already exists' },
                { status: 409 }
            );
        }

        // Create new location
        const newLocation = new Location({
            name,
            capacity,
            description,
            allocationPercentage: allocationPercentage || 0
        });

        await newLocation.save();

        return NextResponse.json(
            {
                message: 'Location created successfully',
                location: newLocation
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create location error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}