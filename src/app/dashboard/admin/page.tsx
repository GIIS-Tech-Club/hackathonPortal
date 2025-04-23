// src/app/dashboard/admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import { FaUsers, FaUserPlus, FaBullhorn, FaQrcode, FaCheckCircle, FaTimesCircle, FaPlus } from 'react-icons/fa';

interface TeamMember {
    _id: string;
    name: string;
    email: string;
}

interface TeamData {
    _id: string;
    name: string;
    members: TeamMember[];
    leader: TeamMember;
    status: 'pending' | 'approved' | 'rejected';
    description: string;
    maxSize: number;
    category: string;
    seatLocation?: string;
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalParticipants: 0,
        totalTeams: 0,
        pendingTeams: 0,
        approvedTeams: 0,
        rejectedTeams: 0,
        announcements: 0
    });

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchStats();
            }
        }
    }, [status, router, session]);

    const fetchStats = async () => {
        try {
            // Fetch teams to get team stats
            const teamsResponse = await fetch('/api/teams');
            const teamsData = await teamsResponse.json();

            // Fetch announcements count
            const announcementsResponse = await fetch('/api/announcements');
            const announcementsData = await announcementsResponse.json();

            if (teamsResponse.ok) {
                const teams: TeamData[] = teamsData.teams || [];

                // Calculate unique participants across all teams
                const uniqueParticipantIds = new Set();
                teams.forEach(team => {
                    team.members.forEach(member => {
                        uniqueParticipantIds.add(member._id);
                    });
                });

                setStats({
                    totalParticipants: uniqueParticipantIds.size,
                    totalTeams: teams.length,
                    pendingTeams: teams.filter(team => team.status === 'pending').length,
                    approvedTeams: teams.filter(team => team.status === 'approved').length,
                    rejectedTeams: teams.filter(team => team.status === 'rejected').length,
                    announcements: announcementsResponse.ok ? announcementsData.announcements.length : 0
                });
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout isAdmin={true}>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 mb-1">Total Participants</p>
                                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                            </div>
                            <FaUsers className="text-3xl text-indigo-500" />
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 mb-1">Total Teams</p>
                                <p className="text-2xl font-bold">{stats.totalTeams}</p>
                            </div>
                            <FaUserPlus className="text-3xl text-indigo-500" />
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 mb-1">Announcements</p>
                                <p className="text-2xl font-bold">{stats.announcements}</p>
                            </div>
                            <FaBullhorn className="text-3xl text-indigo-500" />
                        </div>
                    </div>
                </div>

                {/* Team Status */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-semibold mb-4">Team Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-400 mb-1">Pending</p>
                                    <p className="text-2xl font-bold">{stats.pendingTeams}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <FaUsers className="text-yellow-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-700 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-400 mb-1">Approved</p>
                                    <p className="text-2xl font-bold">{stats.approvedTeams}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <FaCheckCircle className="text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-700 p-4 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-400 mb-1">Rejected</p>
                                    <p className="text-2xl font-bold">{stats.rejectedTeams}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <FaTimesCircle className="text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Manage Teams</h2>
                        <div className="space-y-4">
                            <Link
                                href="/dashboard/admin/teams"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center justify-center"
                            >
                                <FaUsers className="mr-2" /> View & Manage Teams
                            </Link>

                            {stats.pendingTeams > 0 && (
                                <Link
                                    href="/dashboard/admin/teams?status=pending"
                                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition flex items-center justify-center"
                                >
                                    <FaUsers className="mr-2" /> Pending Approvals ({stats.pendingTeams})
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Announcements</h2>
                        <div className="space-y-4">
                            <Link
                                href="/dashboard/admin/announcements"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center justify-center"
                            >
                                <FaBullhorn className="mr-2" /> Manage Announcements
                            </Link>
                            <Link
                                href="/dashboard/admin/announcements?create=regular"
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center justify-center"
                            >
                                <FaPlus className="mr-2" /> Create Announcement
                            </Link>
                            <Link
                                href="/dashboard/admin/announcements?create=emergency"
                                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition flex items-center justify-center"
                            >
                                <FaBullhorn className="mr-2" /> Emergency Announcement
                            </Link>
                        </div>
                    </div>
                </div>

                {/* QR Code Registration */}
                <div className="bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">QR Code Registration</h2>
                    <div className="p-8 text-center">
                        <p className="text-gray-400 mb-4">Generate QR codes for physical check-in at the event.</p>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition">
                            <FaQrcode className="inline-block mr-2" /> Generate QR Codes
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}