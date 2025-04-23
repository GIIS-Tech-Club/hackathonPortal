import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Judge from '@/models/Judge';
import JudgingEvent from '@/models/JudgingEvent';

// Authenticate judge by access code
export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const { code } = await params; // Extract code from params
        console.log('Code:', code);

        const accessCode = code; // Use the code directly

        if (!accessCode) {
            return NextResponse.json(
                { message: 'Access code is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find judge by access code
        const judge = await Judge.findOne({ accessCode })
            .populate({
                path: 'event',
                select: 'name type status startTime endTime'
            })
            .populate({
                path: 'currentAssignment',
                populate: {
                    path: 'team',
                    select: 'name tableNumber description'
                }
            });

        if (!judge) {
            return NextResponse.json(
                { message: 'Invalid access code' },
                { status: 404 }
            );
        }

        // Check if the event exists and is active
        if (!judge.event) {
            return NextResponse.json(
                { message: 'Judging event not found' },
                { status: 404 }
            );
        }


        return NextResponse.json(
            {
                message: 'Judge authenticated successfully',
                judge: {
                    _id: judge._id,
                    name: judge.name,
                    email: judge.email,
                    type: judge.type,
                    accessCode: judge.accessCode,
                    assignedRoom: judge.assignedRoom,
                    event: judge.event,
                    currentAssignment: judge.currentAssignment
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Judge authentication error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update judge's status or current assignment
export async function PUT(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const accessCode = params.code;

        if (!accessCode) {
            return NextResponse.json(
                { message: 'Access code is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find judge by access code
        const judge = await Judge.findOne({ accessCode });

        if (!judge) {
            return NextResponse.json(
                { message: 'Invalid access code' },
                { status: 404 }
            );
        }

        const body = await request.json();

        // Only allow updating specific fields
        if (body.currentAssignment !== undefined) {
            judge.currentAssignment = body.currentAssignment;
        }

        await judge.save();

        return NextResponse.json(
            {
                message: 'Judge updated successfully',
                judge: {
                    _id: judge._id,
                    name: judge.name,
                    email: judge.email,
                    type: judge.type,
                    accessCode: judge.accessCode,
                    assignedRoom: judge.assignedRoom,
                    currentAssignment: judge.currentAssignment
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update judge error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}