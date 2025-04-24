// src/app/api/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Announcement from '@/models/Announcement';

// Get all announcements
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

        // Parse URL parameters
        const searchParams = request.nextUrl.searchParams;
        const isEmergency = searchParams.get('emergency');
        const query: any = {};

        // Filter by emergency status if provided
        if (isEmergency) {
            query.isEmergency = isEmergency === 'true';
        }

        const announcements = await Announcement.find(query)
            .sort({ createdAt: -1 });

        return NextResponse.json(
            { announcements },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get announcements error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a new announcement
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can create announcements
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { title, content, isEmergency } = body;

        // Validate input
        if (!title || !content) {
            return NextResponse.json(
                { message: 'Title and content are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Create new announcement
        const newAnnouncement = new Announcement({
            title,
            content,
            isEmergency: isEmergency || false
        });

        await newAnnouncement.save();

        return NextResponse.json(
            {
                message: 'Announcement created successfully',
                announcement: newAnnouncement
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create announcement error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}