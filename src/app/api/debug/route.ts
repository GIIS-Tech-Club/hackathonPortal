// src/app/api/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: 'Debug API is working' });
}

export async function POST(request: NextRequest) {
    try {
        // Try to parse the request body
        const body = await request.json();

        // Return the body back to confirm parsing works
        return NextResponse.json({
            message: 'Debug POST API is working',
            receivedData: body
        });
    } catch (error) {
        console.error('Debug API error:', error);
        return NextResponse.json({
            message: 'Error parsing request body',
            error: (error as Error).message
        }, { status: 400 });
    }
}