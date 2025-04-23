// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return NextResponse.json(
                { message: 'Invalid request body' },
                { status: 400 }
            );
        }

        const { name, email, password } = body;

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { message: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Connect to database
        try {
            await dbConnect();
        } catch (error) {
            console.error('Database connection error:', error);
            return NextResponse.json(
                { message: 'Database connection failed' },
                { status: 500 }
            );
        }

        // Check if user already exists
        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return NextResponse.json(
                    { message: 'User with this email already exists' },
                    { status: 409 }
                );
            }
        } catch (error) {
            console.error('User lookup error:', error);
            return NextResponse.json(
                { message: 'Error checking existing user' },
                { status: 500 }
            );
        }

        // Hash password
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (error) {
            console.error('Password hashing error:', error);
            return NextResponse.json(
                { message: 'Error processing password' },
                { status: 500 }
            );
        }

        // Create new user
        try {
            const newUser = new User({
                name,
                email,
                password: hashedPassword,
                role: 'participant', // Default role
            });

            await newUser.save();

            // Return success but don't include password
            return NextResponse.json(
                {
                    message: 'User registered successfully',
                    user: {
                        id: newUser._id.toString(),
                        name: newUser.name,
                        email: newUser.email,
                        role: newUser.role,
                    },
                },
                { status: 201 }
            );
        } catch (error) {
            console.error('User creation error:', error);

            // Check for duplicate key error
            if (error instanceof mongoose.Error.ValidationError) {
                return NextResponse.json(
                    { message: 'Validation error: ' + error.message },
                    { status: 400 }
                );
            }

            if ((error as any).code === 11000) {
                return NextResponse.json(
                    { message: 'User with this email already exists' },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { message: 'Error creating user' },
                { status: 500 }
            );
        }
    } catch (error) {
        // Catch-all error handler
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}