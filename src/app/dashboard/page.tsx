"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from './components/DashboardLayout';
import {
    FaUsers, FaBullhorn, FaMapMarkerAlt, FaUserPlus,
    FaTrophy, FaStar, FaClipboard, FaCheck, FaExternalLinkAlt
} from 'react-icons/fa';

interface Team {
    _id: string;
    name: string;
    members: Array<{
        _id: string;
        name: string;
        email: string;
    }>;
    maxSize: number;
    category: string;
    status: 'pending' | 'approved' | 'rejected';
    seatLocation?: string;
    tableNumber?: string;
    tableMap?: string;
}

interface JudgingEvent {
    _id: string;
    name: string;
    type: string;
    status: string;
    startTime: string;
    endTime: string;
    resultsPublished: boolean;
}

interface JudgingResult {
    score: number;
    rank: number;
    totalTeams: number;
}

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userTeam, setUserTeam] = useState<Team | null>(null);
    const [tableNumber, setTableNumber] = useState<string | null>(null);
    const [tableMap, setTableMap] = useState<string | null>(null);
    const [announcements, setAnnouncements] = useState([]);
    const [activeEvent, setActiveEvent] = useState<JudgingEvent | null>(null);
    const [judgingResults, setJudgingResults] = useState<JudgingResult | null>(null);
    const [success, setSuccess] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            // If user is an admin, redirect to admin dashboard
            if (session?.user?.role === 'admin') {
                router.push('/dashboard/admin');
            } else {
                fetchUserTeam();
                fetchActiveEvent();
            }
        }
    }, [status, router, session]);

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

                // Check for table assignment
                if (myTeam?.tableNumber) {
                    setTableNumber(myTeam.tableNumber);
                    setTableMap(myTeam.tableMap || null);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching team data:', error);
            setLoading(false);
        }
    };

    const fetchActiveEvent = async () => {
        try {
            const response = await fetch('/api/judging/events/active');
            const data = await response.json();

            if (response.ok && data.event) {
                setActiveEvent(data.event);

                // If there's an active event and results are published, fetch team's results
                if (data.event.resultsPublished) {
                    fetchJudgingResults(data.event._id);
                }
            }
        } catch (error) {
            console.error('Error fetching active event:', error);
        }
    };

    const fetchJudgingResults = async (eventId: string) => {
        if (!userTeam) return;

        try {
            const response = await fetch(`/api/judging/results/team?eventId=${eventId}&teamId=${userTeam._id}`);
            const data = await response.json();

            if (response.ok && data.results) {
                setJudgingResults(data.results);
            }
        } catch (error) {
            console.error('Error fetching judging results:', error);
        }
    };

    const copyTableNumber = () => {
        if (!tableNumber) return;

        navigator.clipboard.writeText(tableNumber)
            .then(() => {
                setSuccess('Table number copied to clipboard');
                setTimeout(() => setSuccess(''), 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
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
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Welcome, {session?.user?.name}</h1>

                {success && (
                    <div className="bg-green-500 text-white p-3 rounded-md mb-4">
                        {success}
                    </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 mb-1">Your Team</p>
                                <p className="text-2xl font-bold">
                                    {userTeam ? userTeam.name : 'Not Assigned'}
                                </p>
                            </div>
                            <FaUsers className="text-3xl text-indigo-500" />
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 mb-1">Table Assignment</p>
                                {tableNumber ? (
                                    <div className="flex items-center">
                                        <p className="text-2xl font-bold mr-2">
                                            {tableNumber}
                                        </p>
                                        <button
                                            onClick={copyTableNumber}
                                            className="text-indigo-500 hover:text-indigo-400 transition"
                                            title="Copy to clipboard"
                                        >
                                            <FaClipboard />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-2xl font-bold text-gray-500">
                                        Pending
                                    </p>
                                )}
                            </div>
                            <FaMapMarkerAlt className="text-3xl text-indigo-500" />
                        </div>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 mb-1">Announcements</p>
                                <p className="text-2xl font-bold">{announcements.length || 0}</p>
                            </div>
                            <FaBullhorn className="text-3xl text-indigo-500" />
                        </div>
                    </div>
                </div>

                {/* Judging Results Section (if available) */}
                {activeEvent && judgingResults && (
                    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Judging Results</h2>
                            <span className="bg-indigo-900 text-indigo-200 px-3 py-1 rounded-md text-sm">
                                {activeEvent.name}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-700 p-4 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Your Score</div>
                                <div className="flex items-center">
                                    <span className="text-3xl font-bold text-white mr-2">
                                        {judgingResults.score.toFixed(1)}
                                    </span>
                                    <span className="text-sm text-gray-400">/10</span>
                                </div>
                                <div className="flex mt-2">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar
                                            key={i}
                                            className={`${i < Math.round(judgingResults.score / 2)
                                                ? 'text-yellow-500'
                                                : 'text-gray-600'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-700 p-4 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Ranking</div>
                                <div className="flex items-center">
                                    <FaTrophy className="text-yellow-500 mr-2 text-2xl" />
                                    <span className="text-3xl font-bold text-white">
                                        {judgingResults.rank}
                                    </span>
                                    <span className="text-sm text-gray-400 ml-1">
                                        of {judgingResults.totalTeams}
                                    </span>
                                </div>
                                {judgingResults.rank <= 3 && (
                                    <div className="mt-2 text-yellow-500 font-semibold">
                                        Congratulations on your top-3 finish!
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-700 p-4 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Full Results</div>
                                <p className="mb-2">
                                    View detailed results and judging feedback
                                </p>
                                <Link
                                    href={`/dashboard/results/${activeEvent._id}`}
                                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition text-sm"
                                >
                                    View Details <FaExternalLinkAlt className="ml-2" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table Information (if assigned) */}
                {tableNumber && (
                    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4">Table Assignment</h2>

                        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 rounded-lg mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="text-sm text-indigo-200 mb-1">Your Table Number</div>
                                    <div className="flex items-center">
                                        <span className="text-4xl font-bold text-white mr-3">
                                            {tableNumber}
                                        </span>
                                        <button
                                            onClick={copyTableNumber}
                                            className="bg-indigo-700 hover:bg-indigo-600 p-2 rounded text-white transition"
                                            title="Copy to clipboard"
                                        >
                                            <FaClipboard />
                                        </button>
                                    </div>
                                </div>

                                {activeEvent && (
                                    <div>
                                        <div className="text-sm text-indigo-200 mb-1">Event Schedule</div>
                                        <div className="text-white">
                                            <div className="flex items-center mb-1">
                                                <FaCheck className="text-green-400 mr-2" />
                                                Start: {new Date(activeEvent.startTime).toLocaleString()}
                                            </div>
                                            <div className="flex items-center">
                                                <FaCheck className="text-green-400 mr-2" />
                                                End: {new Date(activeEvent.endTime).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {tableMap && (
                            <div className="bg-gray-700 p-4 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Location Details</div>
                                <p className="text-white">{tableMap}</p>
                            </div>
                        )}

                        <div className="mt-4 text-gray-400">
                            <p>
                                Make sure to set up your project at your assigned table before the demo period begins.
                                Judges will visit your table to evaluate your project.
                            </p>
                        </div>
                    </div>
                )}

                {/* Team Section */}
                <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Your Team</h2>

                    {userTeam ? (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-lg font-medium text-white">{userTeam.name}</h3>
                                    <p className="text-sm text-gray-400">
                                        {userTeam.members.length}/{userTeam.maxSize} Members
                                    </p>
                                </div>
                                <div>
                                    {userTeam.status === 'pending' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Pending Approval
                                        </span>
                                    )}
                                    {userTeam.status === 'approved' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Approved
                                        </span>
                                    )}
                                    {userTeam.status === 'rejected' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Rejected
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Link href="/dashboard/teams" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition inline-block">
                                Manage Team
                            </Link>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-gray-400 mb-4">You are not part of a team yet.</p>
                            <Link href="/dashboard/teams" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center justify-center max-w-xs mx-auto">
                                <FaUserPlus className="mr-2" /> Create or Join a Team
                            </Link>
                        </div>
                    )}
                </div>

                {/* Announcements */}
                <div className="bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Announcements</h2>
                    <div className="p-8 text-center text-gray-400">
                        <p>No announcements yet.</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}