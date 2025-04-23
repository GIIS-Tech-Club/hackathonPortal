"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import {
    FaPlus, FaEdit, FaTrash, FaPlay, FaPause, FaUsers,
    FaTrophy, FaCog, FaClock, FaChartBar, FaMapMarkerAlt
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
    createdAt: string;
}

export default function AdminJudging() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<JudgingEvent[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<JudgingEvent | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [eventName, setEventName] = useState('');
    const [eventType, setEventType] = useState<'demo_participants' | 'demo_judges' | 'pitching'>('demo_judges');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [minJudgesPerProject, setMinJudgesPerProject] = useState(2);
    const [roomCount, setRoomCount] = useState(1);

    // Set default times (now + 1 hour for start, +5 hours for end)
    useEffect(() => {
        const now = new Date();
        const start = new Date(now.getTime() + (60 * 60 * 1000)); // Now + 1 hour
        const end = new Date(now.getTime() + (5 * 60 * 60 * 1000)); // Now + 5 hours

        setStartTime(formatDateForInput(start));
        setEndTime(formatDateForInput(end));
    }, []);

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchEvents();
            }
        }
    }, [status, router, session]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/judging/events');
            const data = await response.json();

            if (response.ok) {
                setEvents(data.events || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch judging events');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!eventName || !startTime || !endTime) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const settings: any = {};

            if (eventType.startsWith('demo_')) {
                settings.minJudgesPerProject = minJudgesPerProject;
            } else if (eventType === 'pitching') {
                settings.roomCount = roomCount;
            }

            const response = await fetch('/api/judging/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: eventName,
                    type: eventType,
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                    settings
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Judging event created successfully');
                setShowCreateModal(false);
                resetForm();
                fetchEvents();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to create judging event');
            console.error(err);
        }
    };

    const deleteEvent = async () => {
        if (!selectedEvent) return;

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/judging/events/${selectedEvent._id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Event "${selectedEvent.name}" deleted successfully`);
                setShowDeleteModal(false);
                setSelectedEvent(null);
                fetchEvents();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to delete judging event');
            console.error(err);
        }
    };

    const updateEventStatus = async (eventId: string, newStatus: 'setup' | 'active' | 'completed') => {
        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/judging/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Event status updated to ${newStatus}`);
                fetchEvents();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to update event status');
            console.error(err);
        }
    };

    const resetForm = () => {
        setEventName('');
        setEventType('demo_judges');

        const now = new Date();
        const start = new Date(now.getTime() + (60 * 60 * 1000));
        const end = new Date(now.getTime() + (5 * 60 * 60 * 1000));

        setStartTime(formatDateForInput(start));
        setEndTime(formatDateForInput(end));
        setMinJudgesPerProject(2);
        setRoomCount(1);
    };

    const formatDateForInput = (date: Date) => {
        return date.toISOString().slice(0, 16);
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getEventTypeLabel = (type: string) => {
        switch (type) {
            case 'demo_participants':
                return 'Demo Day (Participants Judge)';
            case 'demo_judges':
                return 'Demo Day (Judges Judge)';
            case 'pitching':
                return 'Pitching (Judges Judge)';
            default:
                return type;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
            case 'completed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Completed</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Setup</span>;
        }
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p>Loading judging events...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout isAdmin={true}>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Judging Management</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center"
                    >
                        <FaPlus className="mr-2" /> Create Judging Event
                    </button>
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

                <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-700">
                        <h2 className="text-xl font-semibold">Judging Events</h2>
                    </div>

                    {events.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <p>No judging events created yet. Click the button above to create your first event.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Event Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Schedule
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {events.map((event) => (
                                        <tr key={event._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-white">{event.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">{getEventTypeLabel(event.type)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(event.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-300">
                                                    <div className="flex items-center mb-1">
                                                        <FaClock className="text-gray-400 mr-2" size={12} />
                                                        <span>Start: {formatDate(event.startTime)}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FaClock className="text-gray-400 mr-2" size={12} />
                                                        <span>End: {formatDate(event.endTime)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <Link
                                                        href={`/dashboard/admin/judging/${event._id}`}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded"
                                                        title="Manage Event"
                                                    >
                                                        <FaCog />
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/admin/judging/${event._id}/tables`}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded"
                                                        title="Manage Tables"
                                                    >
                                                        <FaMapMarkerAlt />
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/admin/judging/${event._id}/judges`}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                                                        title="Manage Judges"
                                                    >
                                                        <FaUsers />
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/admin/judging/${event._id}/results`}
                                                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                                                        title="View Results"
                                                    >
                                                        <FaChartBar />
                                                    </Link>
                                                    {event.status === 'setup' && (
                                                        <button
                                                            onClick={() => updateEventStatus(event._id, 'active')}
                                                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                                                            title="Start Event"
                                                        >
                                                            <FaPlay />
                                                        </button>
                                                    )}
                                                    {event.status === 'active' && (
                                                        <button
                                                            onClick={() => updateEventStatus(event._id, 'completed')}
                                                            className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded"
                                                            title="End Event"
                                                        >
                                                            <FaPause />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedEvent(event);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                                                        title="Delete Event"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Judging Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Create New Judging Event</h3>

                        <form onSubmit={createEvent}>
                            <div className="mb-4">
                                <label htmlFor="eventName" className="block text-gray-300 mb-2">
                                    Event Name*
                                </label>
                                <input
                                    id="eventName"
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., Spring Hackathon 2025 - Final Judging"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="eventType" className="block text-gray-300 mb-2">
                                    Judging Type*
                                </label>
                                <select
                                    id="eventType"
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value as any)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="demo_judges">Demo Day (Judges Judge)</option>
                                    <option value="demo_participants">Demo Day (Participants Judge)</option>
                                    <option value="pitching">Pitching (Judges Judge)</option>
                                </select>
                                <p className="text-sm text-gray-400 mt-1">
                                    {eventType === 'demo_judges' && 'Judges will evaluate projects in a 1v1 format, similar to Gavel.'}
                                    {eventType === 'demo_participants' && 'Participants will judge each other\'s projects in a 1v1 format.'}
                                    {eventType === 'pitching' && 'Teams will pitch to judges in designated rooms.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="startTime" className="block text-gray-300 mb-2">
                                        Start Time*
                                    </label>
                                    <input
                                        id="startTime"
                                        type="datetime-local"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="endTime" className="block text-gray-300 mb-2">
                                        End Time*
                                    </label>
                                    <input
                                        id="endTime"
                                        type="datetime-local"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                            </div>

                            {eventType.startsWith('demo_') && (
                                <div className="mb-4">
                                    <label htmlFor="minJudgesPerProject" className="block text-gray-300 mb-2">
                                        Minimum Judges Per Project
                                    </label>
                                    <input
                                        id="minJudgesPerProject"
                                        type="number"
                                        value={minJudgesPerProject}
                                        onChange={(e) => setMinJudgesPerProject(parseInt(e.target.value))}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        min="1"
                                        max="10"
                                    />
                                    <p className="text-sm text-gray-400 mt-1">
                                        Each project will be judged by at least this many judges.
                                    </p>
                                </div>
                            )}

                            {eventType === 'pitching' && (
                                <div className="mb-4">
                                    <label htmlFor="roomCount" className="block text-gray-300 mb-2">
                                        Number of Judging Rooms
                                    </label>
                                    <input
                                        id="roomCount"
                                        type="number"
                                        value={roomCount}
                                        onChange={(e) => setRoomCount(parseInt(e.target.value))}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        min="1"
                                        max="10"
                                    />
                                    <p className="text-sm text-gray-400 mt-1">
                                        Number of simultaneous pitching rooms.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Create Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedEvent && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Delete Judging Event</h3>
                        <p className="mb-4 text-gray-300">
                            Are you sure you want to delete the judging event "{selectedEvent.name}"? This will also delete all associated judges, criteria, assignments, and results. This action cannot be undone.
                        </p>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteEvent}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}