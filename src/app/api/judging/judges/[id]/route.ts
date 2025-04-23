import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import Judge from '@/models/Judge';
import User from '@/models/User';
import JudgingEvent from '@/models/JudgingEvent';
import JudgingAssignment from '@/models/JudgingAssignment';
import JudgingResult from '@/models/JudgingResult';
import { emailHelper } from '@/lib/emailHelper';

// Get a single judge
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params; // Extract id from params

    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const judge = await Judge.findById(id)
            .populate('user', 'name email')
            .populate('event');

        if (!judge) {
            return NextResponse.json(
                { message: 'Judge not found' },
                { status: 404 }
            );
        }

        // Check permissions
        const isAdmin = session.user.role === 'admin';
        const isOwnProfile = judge.user && judge.user._id.toString() === session.user.id;

        if (!isAdmin && !isOwnProfile) {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        return NextResponse.json({ judge }, { status: 200 });
    } catch (error) {
        console.error('Get judge error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update a judge
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params; // Extract id from params

    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const isAdmin = session.user.role === 'admin';
        if (!isAdmin) {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const judge = await Judge.findById(id);
        if (!judge) {
            return NextResponse.json(
                { message: 'Judge not found' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { name, email, type, assignedRoom, resendInvitation } = body;

        // Update fields
        if (name) judge.name = name;
        if (email) judge.email = email.toLowerCase();
        if (type) judge.type = type;

        // Update assignedRoom (allow null/empty to remove room assignment)
        if (assignedRoom !== undefined) {
            judge.assignedRoom = assignedRoom || null;
        }

        await judge.save();

        // Resend invitation email if requested
        if (resendInvitation) {
            const event = await JudgingEvent.findById(judge.event);
            if (event) {
                try {
                    await emailHelper.sendJudgeInvitation(
                        {
                            name: judge.name,
                            email: judge.email,
                            accessCode: judge.accessCode,
                            assignedRoom: judge.assignedRoom
                        },
                        {
                            _id: event._id.toString(),
                            name: event.name,
                            type: event.type,
                            startTime: event.startTime,
                            endTime: event.endTime
                        }
                    );
                } catch (emailError) {
                    console.error('Failed to resend judge invitation email:', emailError);
                }
            }
        }

        return NextResponse.json(
            {
                message: 'Judge updated successfully',
                judge
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

// Delete a judge
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params; // Extract id from params

    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const isAdmin = session.user.role === 'admin';
        if (!isAdmin) {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        const judge = await Judge.findById(id);
        if (!judge) {
            return NextResponse.json(
                { message: 'Judge not found' },
                { status: 404 }
            );
        }

        // If the judge is linked to a user, update the user
        if (judge.user) {
            await User.findByIdAndUpdate(judge.user, {
                isJudge: false,
                judgeProfile: null
            });
        }

        // Delete related assignments and results
        await JudgingAssignment.deleteMany({ judge: id });
        await JudgingResult.deleteMany({ judge: id });

        // Delete the judge
        await Judge.deleteOne({ _id: id });

        return NextResponse.json(
            { message: 'Judge deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete judge error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
