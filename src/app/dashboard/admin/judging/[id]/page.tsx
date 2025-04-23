// src/app/dashboard/admin/judging/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import {
    FaArrowLeft, FaUsers, FaMapMarkerAlt, FaEdit,
    FaPlay, FaPause, FaClock, FaListAlt, FaTrophy,
    FaChartBar, FaBullhorn, FaCheck, FaTimes
} from 'react-icons/fa';

interface JudgingEvent {
    _id: string;
    name: string;
    type: 'demo_participants' | 'demo_judges' | 'pitching';
    status: 'setup' | 'active' | 'completed';
    startTime: string;
    endTime: string;
    settings: {
        minJudgesPerProject?: number;
        roomCount?: number;
        criteriaWeights?: Record<string, number>;
    };
}

interface Judge {
    _id: string;
    name: string;
    email: string;
    type: 'participant' | 'external';
    accessCode: string;
    assignedRoom?: string;
}

interface JudgingCriteria {
    _id: string;
    name: string;
    description: string;
    weight: number;
    minScore: number;
    maxScore: number;
}

export default function EventDetails() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<JudgingEvent | null>(null);
    const [judges, setJudges] = useState<Judge[]>([]);
    const [criteria, setCriteria] = useState<JudgingCriteria[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activating, setActivating] = useState(false);
    const [completing, setCompleting] = useState(false);

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchEventDetails();
            }
        }
    }, [status, router, session, eventId]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/judging/events/${eventId}`);
            const data = await response.json();

            if (response.ok) {
                setEvent(data.event);
                setJudges(data.judges || []);
                setCriteria(data.criteria || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch event details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const activateEvent = async () => {
        if (!event) return;

        try {
            setActivating(true);
            setError('');
            setSuccess('');

            const response = await fetch(`/api/judging/events/${event._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'active'
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Event "${event.name}" is now active`);
                fetchEventDetails();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to activate event');
            console.error(err);
        } finally {
            setActivating(false);
        }
    };

    const completeEvent = async () => {
        if (!event) return;

        try {
            setCompleting(true);
            setError('');
            setSuccess('');

            const response = await fetch(`/api/judging/events/${event._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'completed'
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Event "${event.name}" has been completed`);
                fetchEventDetails();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to complete event');
            console.error(err);
        } finally {
            setCompleting(false);
        }
    };

    const notifyJudges = async () => {
        if (!event) return;

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/judging/events/${event._id}/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    updateStatus: event.status === 'setup'
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Notifications sent to judges. ${data.results.success} of ${data.results.total} emails were sent successfully.`);
                if (data.statusUpdated) {
                    fetchEventDetails();
                }
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to send notifications');
            console.error(err);
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p>Loading event details...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout isAdmin={true}>
            <div className="p-6">
                <div className="flex items-center mb-6">
                    <Link
                        href="/dashboard/admin/judging"
                        className="text-gray-400 hover:text-white mr-4"
                    >
                        <FaArrowLeft />
                    </Link>
                    <h1 className="text-2xl font-bold">
                        {event?.name || 'Event Details'}
                    </h1>
                </div>

                {error && (
                    <div className="bg-red-500 text-white p-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500 text-white p-3 rounded-md mb-4">
                        {success}
                    </div>
                )}

                {event && (
                    <>
                        {/* Event Status & Actions */}
                        <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                            <div className="flex flex-wrap justify-between items-center">
                                <div className="flex items-center mb-4 md:mb-0">
                                    <div className="mr-4">
                                        <span className="block text-sm text-gray-400">Status</span>
                                        <div className="mt-1">
                                            {event.status === 'setup' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Setup
                                                </span>
                                            )}
                                            {event.status === 'active' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            )}
                                            {event.status === 'completed' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Completed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-sm text-gray-400">Type</span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
                                            {event.type === 'demo_participants' && 'Demo Day (Participants)'}
                                            {event.type === 'demo_judges' && 'Demo Day (Judges)'}
                                            {event.type === 'pitching' && 'Pitching Event'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-x-2">
                                    {event.status === 'setup' && (
                                        <button
                                            onClick={activateEvent}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center disabled:opacity-50"
                                            disabled={activating}
                                        >
                                            <FaPlay className="mr-2" />
                                            {activating ? 'Activating...' : 'Start Event'}
                                        </button>
                                    )}
                                    {event.status === 'active' && (
                                        <button
                                            onClick={completeEvent}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition flex items-center disabled:opacity-50"
                                            disabled={completing}
                                        >
                                            <FaPause className="mr-2" />
                                            {completing ? 'Completing...' : 'End Event'}
                                        </button>
                                    )}
                                    <button
                                        onClick={notifyJudges}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition flex items-center"
                                    >
                                        <FaBullhorn className="mr-2" /> Notify Judges
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Event Details */}
                        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <span className="block text-gray-400 text-sm">Name</span>
                                        <span className="text-xl font-medium">{event.name}</span>
                                    </div>

                                    <div className="mb-4">
                                        <span className="block text-gray-400 text-sm">Schedule</span>
                                        <div className="space-y-1">
                                            <div className="flex items-center">
                                                <FaClock className="text-indigo-400 mr-2" />
                                                <span>Start: {formatDateTime(event.startTime)}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <FaClock className="text-indigo-400 mr-2" />
                                                <span>End: {formatDateTime(event.endTime)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-4">
                                        <span className="block text-gray-400 text-sm">Settings</span>
                                        <div className="space-y-1 mt-1">
                                            {event.type.startsWith('demo_') && (
                                                <div className="flex items-center">
                                                    <FaUsers className="text-indigo-400 mr-2" />
                                                    <span>Min Judges Per Project: {event.settings.minJudgesPerProject || 3}</span>
                                                </div>
                                            )}
                                            {event.type === 'pitching' && (
                                                <div className="flex items-center">
                                                    <FaMapMarkerAlt className="text-indigo-400 mr-2" />
                                                    <span>Room Count: {event.settings.roomCount || 1}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Link
                                            href={`/dashboard/admin/judging/${event._id}/edit`}
                                            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mr-4"
                                        >
                                            <FaEdit className="mr-1" /> Edit Event
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Management Links */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <Link
                                href={`/dashboard/admin/judging/${event._id}/judges`}
                                className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition flex flex-col items-center justify-center text-center"
                            >
                                <FaUsers className="text-3xl text-indigo-500 mb-2" />
                                <h3 className="font-semibold">Manage Judges</h3>
                                <p className="text-sm text-gray-400 mt-1">{judges.length} judges assigned</p>
                            </Link>

                            <Link
                                href={`/dashboard/admin/judging/${event._id}/criteria`}
                                className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition flex flex-col items-center justify-center text-center"
                            >
                                <FaListAlt className="text-3xl text-indigo-500 mb-2" />
                                <h3 className="font-semibold">Manage Criteria</h3>
                                <p className="text-sm text-gray-400 mt-1">{criteria.length} criteria defined</p>
                            </Link>

                            <Link
                                href={`/dashboard/admin/judging/${event._id}/tables`}
                                className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition flex flex-col items-center justify-center text-center"
                            >
                                <FaMapMarkerAlt className="text-3xl text-indigo-500 mb-2" />
                                <h3 className="font-semibold">Manage Tables</h3>
                                <p className="text-sm text-gray-400 mt-1">Assign tables to teams</p>
                            </Link>

                            <Link
                                href={`/dashboard/admin/judging/${event._id}/results`}
                                className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition flex flex-col items-center justify-center text-center"
                            >
                                <FaChartBar className="text-3xl text-indigo-500 mb-2" />
                                <h3 className="font-semibold">View Results</h3>
                                <p className="text-sm text-gray-400 mt-1">See judging results</p>
                            </Link>
                        </div>

                        {/* Current Status */}
                        <div className="bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4">Current Status</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-700 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2 flex items-center">
                                        <FaUsers className="mr-2 text-indigo-400" /> Judges
                                    </h3>
                                    <p className="text-2xl font-bold">{judges.length}</p>
                                    <div className="mt-2 text-sm text-gray-300">
                                        <div>External: {judges.filter(j => j.type === 'external').length}</div>
                                        <div>Participants: {judges.filter(j => j.type === 'participant').length}</div>
                                    </div>
                                </div>

                                <div className="bg-gray-700 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2 flex items-center">
                                        <FaListAlt className="mr-2 text-indigo-400" /> Criteria
                                    </h3>
                                    <p className="text-2xl font-bold">{criteria.length}</p>
                                    {criteria.length === 0 ? (
                                        <div className="mt-2 text-sm text-red-400">
                                            <Link href={`/dashboard/admin/judging/${event._id}/criteria`} className="flex items-center">
                                                <FaTimes className="mr-1" /> No criteria defined
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-sm text-green-400">
                                            <FaCheck className="inline mr-1" /> Criteria defined
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-700 p-4 rounded-lg">
                                    <h3 className="font-semibold mb-2 flex items-center">
                                        <FaTrophy className="mr-2 text-indigo-400" /> Judging Progress
                                    </h3>
                                    <p className="text-2xl font-bold">
                                        {event.status === 'setup' && 'Not Started'}
                                        {event.status === 'active' && 'In Progress'}
                                        {event.status === 'completed' && 'Completed'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}