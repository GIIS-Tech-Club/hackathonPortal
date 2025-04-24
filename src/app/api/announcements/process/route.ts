// src/app/api/announcements/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Team from '@/models/Team';

// Process variables in announcement text
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
        const { content } = body;

        if (!content) {
            return NextResponse.json(
                { message: 'Content is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Get user data
        const userData = {
            'user.id': session.user.id,
            'user.name': session.user.name,
            'user.email': session.user.email,
            'user.role': session.user.role
        };

        // Get team data if user is a participant
        let teamData: Record<string, any> = {};
        if (session.user.role !== 'admin') {
            const userTeam = await Team.findOne({
                members: session.user.id
            }).populate('leader', 'name email').populate('members', 'name email');

            if (userTeam) {
                teamData = {
                    'team.id': userTeam._id.toString(),
                    'team.name': userTeam.name,
                    'team.category': userTeam.category,
                    'team.location': userTeam.seatLocation || 'Not assigned',
                    'team.members': userTeam.members.map((m: any) => m.name).join(', '),
                    'team.leader': userTeam.leader.name,
                    'team.status': userTeam.status,
                    'team.memberCount': userTeam.members.length,
                    'team.maxSize': userTeam.maxSize
                };
            }
        }

        // Combine all variables
        const allVariables: Record<string, any> = { ...userData, ...teamData };

        // Process text with variables
        let processedContent = content;
        const variablePattern = /{([^}]+)}/g;

        processedContent = processedContent.replace(variablePattern, (match: string, variable: string) => {
            return allVariables[variable] !== undefined ? allVariables[variable] : match;
        });

        return NextResponse.json({
            originalContent: content,
            processedContent: processedContent,
            variables: allVariables
        }, { status: 200 });
    } catch (error) {
        console.error('Process announcement error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}