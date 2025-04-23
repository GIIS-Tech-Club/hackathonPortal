// src/app/dashboard/profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import {
    FaUser, FaEnvelope, FaCalendarAlt, FaUsers,
    FaUserEdit, FaExternalLinkAlt
} from 'react-icons/fa';

interface TeamMember {
    _id: string;
    name: string;
    email: string;
}

interface Team {
    _id: string;
    name: string;
    members: TeamMember[];
    leader: TeamMember;
    maxSize: number;
    category: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    seatLocation?: string;
}

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    registrationDate: string;
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userTeam, setUserTeam] = useState<Team | null>(null);
    const [error, setError] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchUserProfile();
            fetchUserTeam();
        }
    }, [status, router, session]);

    const fetchUserProfile = async () => {
        // In a real application, you would fetch this from an API
        // For now, we'll use session data
        if (session?.user) {
            setProfile({
                id: session.user.id || '',
                name: session.user.name || '',
                email: session.user.email || '',
                role: session.user.role || 'participant',
                registrationDate: new Date().toISOString() // Mock date, would come from API
            });
        }
    };

    const fetchUserTeam = async () => {
        try {
            const response = await fetch('/api/teams');
            const data = await response.json();

            if (response.ok) {
                // Find user's team
                const myTeam = data.teams.find((team: Team) =>
                    team.members.some(member => member._id === session?.user?.id)
                );
                setUserTeam(myTeam || null);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching team data:', error);
            setError('Failed to fetch team information');
            setLoading(false);
        }
    };

    const getCategoryLabel = (cat: string) => {
        const categories: Record<string, string> = {
            web: 'Web Development',
            mobile: 'Mobile App',
            ai: 'AI/ML',
            data: 'Data Science',
            game: 'Game Development',
            iot: 'IoT',
            other: 'Other'
        };
        return categories[cat] || 'Other';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
            case 'rejected':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
        }
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p>Loading profile...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">My Profile</h1>

                {error && (
                    <div className="bg-red-500 text-white p-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Information */}
                    <div className="col-span-1">
                        <div className="bg-gray-800 rounded-lg shadow-md p-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-semibold mb-4">
                                    {profile?.name?.charAt(0) || '?'}
                                </div>
                                <h2 className="text-xl font-semibold">{profile?.name}</h2>
                                <span className="mt-1 px-3 py-1 bg-indigo-900 text-indigo-200 rounded-full text-xs">
                                    {profile?.role === 'admin' ? 'Administrator' : 'Participant'}
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <FaEnvelope className="text-gray-400 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-400">Email</p>
                                        <p>{profile?.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <FaCalendarAlt className="text-gray-400 mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-400">Registered</p>
                                        <p>{profile?.registrationDate ? formatDate(profile.registrationDate) : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link
                                    href="/dashboard/profile/edit"
                                    className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition text-center"
                                >
                                    <FaUserEdit className="inline-block mr-2" /> Edit Profile
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Team Information */}
                    <div className="col-span-2">
                        <div className="bg-gray-800 rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">Team Information</h2>
                                <Link
                                    href="/dashboard/teams"
                                    className="text-indigo-400 hover:text-indigo-300 flex items-center text-sm"
                                >
                                    Manage Team <FaExternalLinkAlt className="ml-1" size={12} />
                                </Link>
                            </div>

                            {userTeam ? (
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-medium text-white">{userTeam.name}</h3>
                                            <p className="text-sm text-gray-400">
                                                {getCategoryLabel(userTeam.category)}
                                            </p>
                                        </div>
                                        <div>
                                            {getStatusBadge(userTeam.status)}
                                        </div>
                                    </div>

                                    {userTeam.rejectionReason && userTeam.status === 'rejected' && (
                                        <div className="mb-4 bg-red-900 bg-opacity-30 p-4 rounded-md">
                                            <h3 className="font-semibold text-red-400 mb-1">Rejection Reason:</h3>
                                            <p>{userTeam.rejectionReason}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <span className="block text-gray-400 text-sm">Team Leader</span>
                                            <span className="font-medium">{userTeam.leader.name}</span>
                                        </div>

                                        <div>
                                            <span className="block text-gray-400 text-sm">Team Size</span>
                                            <span>{userTeam.members.length}/{userTeam.maxSize} members</span>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <span className="block text-gray-400 text-sm mb-1">Seat Location</span>
                                        <span className="font-medium">
                                            {userTeam.seatLocation || 'Not assigned yet'}
                                        </span>
                                    </div>

                                    <h3 className="font-semibold mb-2">Team Members</h3>
                                    <ul className="bg-gray-700 rounded-md divide-y divide-gray-600">
                                        {userTeam.members.map((member) => (
                                            <li key={member._id} className="p-3 flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold mr-3">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-medium">{member.name}</span>
                                                    {member._id === userTeam.leader._id && (
                                                        <span className="ml-2 text-xs bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded">
                                                            Team Leader
                                                        </span>
                                                    )}
                                                    <div className="text-sm text-gray-400">{member.email}</div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-gray-500 mx-auto mb-4">
                                        <FaUsers size={36} />
                                    </div>
                                    <p className="text-gray-400 mb-4">You are not part of a team yet.</p>
                                    <Link
                                        href="/dashboard/teams"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition inline-block"
                                    >
                                        Create or Join a Team
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}