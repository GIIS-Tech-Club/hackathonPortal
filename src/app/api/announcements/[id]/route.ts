// src/app/api/announcements/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Announcement from '@/models/Announcement';

// Get a single announcement
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

        const announcement = await Announcement.findById(params.id);

        if (!announcement) {
            return NextResponse.json(
                { message: 'Announcement not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { announcement },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get announcement error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update an announcement
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

        // Only admins can update announcements
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const announcement = await Announcement.findById(params.id);

        if (!announcement) {
            return NextResponse.json(
                { message: 'Announcement not found' },
                { status: 404 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { title, content, isEmergency } = body;

        // Update fields if provided
        if (title) announcement.title = title;
        if (content !== undefined) announcement.content = content;
        if (isEmergency !== undefined) announcement.isEmergency = isEmergency;

        await announcement.save();

        return NextResponse.json(
            {
                message: 'Announcement updated successfully',
                announcement
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update announcement error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete an announcement
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

        // Only admins can delete announcements
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const announcement = await Announcement.findById(params.id);

        if (!announcement) {
            return NextResponse.json(
                { message: 'Announcement not found' },
                { status: 404 }
            );
        }

        await Announcement.deleteOne({ _id: params.id });

        return NextResponse.json(
            { message: 'Announcement deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete announcement error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}