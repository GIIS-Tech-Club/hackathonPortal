// src/app/api/teams/assign-locations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Team from '@/models/Team';
import Location from '@/models/Location';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Only admins can assign locations
        if (session.user.role !== 'admin') {
            return NextResponse.json(
                { message: 'Access denied' },
                { status: 403 }
            );
        }

        await dbConnect();

        // Get all approved teams without a seat location
        const teamsToAssign = await Team.find({
            status: 'approved',
            $or: [
                { seatLocation: { $exists: false } },
                { seatLocation: null },
                { seatLocation: "" }
            ]
        });

        // Get all locations with their allocation percentages
        const locations = await Location.find();

        if (locations.length === 0) {
            return NextResponse.json(
                { message: 'No locations available for assignment' },
                { status: 400 }
            );
        }

        if (teamsToAssign.length === 0) {
            return NextResponse.json(
                { message: 'No teams available for assignment' },
                { status: 400 }
            );
        }

        // Calculate total percentage to make sure it adds up to 100%
        const totalPercentage = locations.reduce((sum, loc) => sum + loc.allocationPercentage, 0);

        // If total is not 100%, normalize the percentages
        const factor = totalPercentage > 0 ? 100 / totalPercentage : 1;

        // Create an array of location slots based on percentages
        const locationSlots: string[] = [];

        locations.forEach(location => {
            // Calculate normalized percentage
            const normalizedPercentage = location.allocationPercentage * factor;

            // Calculate how many teams should go to this location
            const teamsCount = Math.round((normalizedPercentage / 100) * teamsToAssign.length);

            // Add this location to slots the appropriate number of times
            for (let i = 0; i < teamsCount; i++) {
                locationSlots.push(location.name);
            }
        });

        // If we don't have enough slots (due to rounding), add more from the first location
        while (locationSlots.length < teamsToAssign.length) {
            locationSlots.push(locations[0].name);
        }

        // If we have too many slots, remove some
        if (locationSlots.length > teamsToAssign.length) {
            locationSlots.splice(teamsToAssign.length);
        }

        // Shuffle the location slots array
        for (let i = locationSlots.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [locationSlots[i], locationSlots[j]] = [locationSlots[j], locationSlots[i]];
        }

        // Assign teams to locations
        const updatePromises = teamsToAssign.map(async (team, index) => {
            team.seatLocation = locationSlots[index];
            return team.save();
        });

        await Promise.all(updatePromises);

        return NextResponse.json(
            {
                message: `Successfully assigned ${teamsToAssign.length} teams to locations`,
                assignmentCounts: locationSlots.reduce((acc: Record<string, number>, loc) => {
                    acc[loc] = (acc[loc] || 0) + 1;
                    return acc;
                }, {})
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Assign locations error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}