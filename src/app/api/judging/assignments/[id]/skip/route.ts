// src/app/api/judging/assignments/[id]/skip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import JudgingAssignment from '@/models/JudgingAssignment';
import Judge from '@/models/Judge';

// Skip a judging assignment
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const assignmentId = params.id;

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Find the assignment
        const assignment = await JudgingAssignment.findById(assignmentId);
        if (!assignment) {
            return NextResponse.json(
                { message: 'Assignment not found' },
                { status: 404 }
            );
        }

        // Check permissions - only the assigned judge or an admin can skip it
        const judge = await Judge.findById(assignment.judge);
        if (!judge) {
            return NextResponse.json(
                { message: 'Judge not found' },
                { status: 404 }
            );
        }

        const isAdmin = session.user.role === 'admin';
        const isJudgeUser = judge.user && judge.user.toString() === session.user.id;
        const isExternalJudge = judge.type === 'external' && judge.accessCode;

        if (!isAdmin && !isJudgeUser && !isExternalJudge) {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        // Update assignment status to 'skipped'
        assignment.status = 'skipped';
        await assignment.save();

        // Clear the judge's current assignment
        judge.currentAssignment = null;
        await judge.save();

        return NextResponse.json(
            { message: 'Assignment skipped successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Skip assignment error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}