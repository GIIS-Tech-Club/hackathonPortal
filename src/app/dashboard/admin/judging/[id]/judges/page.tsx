// src/app/dashboard/admin/judging/[id]/judges/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import {
    FaArrowLeft, FaUserPlus, FaTrash, FaUserCog,
    FaSearch, FaEnvelope, FaExclamationTriangle,
    FaCheck, FaQrcode, FaDownload
} from 'react-icons/fa';

interface Judge {
    _id: string;
    name: string;
    email: string;
    type: 'participant' | 'external';
    accessCode: string;
    assignedRoom?: string;
    user?: {
        _id: string;
        name: string;
        email: string;
    };
    currentAssignment?: string;
}

interface JudgingEvent {
    _id: string;
    name: string;
    type: 'demo_participants' | 'demo_judges' | 'pitching';
    status: 'setup' | 'active' | 'completed';
}

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export default function JudgesManagement() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [judges, setJudges] = useState<Judge[]>([]);
    const [event, setEvent] = useState<JudgingEvent | null>(null);
    const [filteredJudges, setFilteredJudges] = useState<Judge[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    // Form states
    const [judgeName, setJudgeName] = useState('');
    const [judgeEmail, setJudgeEmail] = useState('');
    const [judgeType, setJudgeType] = useState<'participant' | 'external'>('external');
    const [assignedRoom, setAssignedRoom] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [showEmailForm, setShowEmailForm] = useState(false);

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchEvent();
                fetchJudges();
                fetchUsers();
            }
        }
    }, [status, router, session, eventId]);

    const fetchEvent = async () => {
        try {
            const response = await fetch(`/api/judging/events/${eventId}`);
            const data = await response.json();

            if (response.ok) {
                setEvent(data.event);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch judging event');
            console.error(err);
        }
    };

    const fetchJudges = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/judging/judges?eventId=${eventId}`);
            const data = await response.json();

            if (response.ok) {
                setJudges(data.judges || []);
                setFilteredJudges(data.judges || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch judges');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();

            if (response.ok) {
                setUsers(data.users || []);
            } else {
                console.error('Failed to fetch users:', data.message);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    // Apply filters when they change
    useEffect(() => {
        let results = [...judges];

        // Apply search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(judge =>
                judge.name.toLowerCase().includes(term) ||
                judge.email.toLowerCase().includes(term)
            );
        }

        // Apply type filter
        if (typeFilter !== 'all') {
            results = results.filter(judge => judge.type === typeFilter);
        }

        setFilteredJudges(results);
    }, [searchTerm, typeFilter, judges]);

    const addJudge = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if ((!judgeName || !judgeEmail) && !selectedUser) {
            setError('Please provide judge information or select a user');
            return;
        }

        try {
            let payload: any = {
                eventId
            };

            if (selectedUser) {
                // Use selected user
                const user = users.find(u => u._id === selectedUser);
                if (!user) {
                    setError('Selected user not found');
                    return;
                }

                payload = {
                    ...payload,
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    type: judgeType
                };
            } else {
                // Create new judge
                payload = {
                    ...payload,
                    name: judgeName,
                    email: judgeEmail,
                    type: judgeType
                };
            }

            // If pitching type and assigned room
            if (event?.type === 'pitching' && assignedRoom) {
                payload.assignedRoom = assignedRoom;
            }

            const response = await fetch('/api/judging/judges', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Judge ${data.judge.name} added successfully`);
                setShowAddModal(false);
                resetForm();
                fetchJudges();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to add judge');
            console.error(err);
        }
    };

    const deleteJudge = async () => {
        if (!selectedJudge) return;

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/judging/judges/${selectedJudge._id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Judge ${selectedJudge.name} removed successfully`);
                setShowDeleteModal(false);
                setSelectedJudge(null);
                fetchJudges();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to delete judge');
            console.error(err);
        }
    };

    const resetForm = () => {
        setJudgeName('');
        setJudgeEmail('');
        setJudgeType('external');
        setAssignedRoom('');
        setSelectedUser('');
        setShowEmailForm(false);
    };

    const downloadJudgeCodes = () => {
        // Create CSV content
        const headers = ['Judge Name', 'Email', 'Access Code', 'Type', 'Assigned Room'];
        const rows = filteredJudges.map(judge => [
            judge.name,
            judge.email,
            judge.accessCode,
            judge.type === 'external' ? 'External Judge' : 'Participant Judge',
            judge.assignedRoom || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create downloadable file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${event?.name.replace(/\s+/g, '_')}_judge_codes.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p>Loading judges...</p>
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
                    <h1 className="text-2xl font-bold">Judges Management</h1>
                    {event && (
                        <span className="ml-4 px-3 py-1 bg-indigo-900 text-indigo-200 rounded-full text-sm">
                            {event.name}
                        </span>
                    )}
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

                {/* Filters & Actions */}
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search judges by name or email"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="min-w-[140px]">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Judges</option>
                                <option value="external">External Judges</option>
                                <option value="participant">Participant Judges</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center"
                        >
                            <FaUserPlus className="mr-2" /> Add Judge
                        </button>
                        <button
                            onClick={downloadJudgeCodes}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center"
                            disabled={judges.length === 0}
                        >
                            <FaDownload className="mr-2" /> Export Judge Codes
                        </button>
                        <Link
                            href={`/dashboard/admin/judging/${eventId}/judges/qrcodes`}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition flex items-center"
                        >
                            <FaQrcode className="mr-2" /> Print QR Codes
                        </Link>
                    </div>
                </div>

                {/* Judges Table */}
                <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Judges</h2>
                        <span className="text-gray-400">
                            {filteredJudges.length} judges
                        </span>
                    </div>

                    {filteredJudges.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No judges found. Add your first judge by clicking the "Add Judge" button above.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-900">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Judge
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Access Code
                                        </th>
                                        {event?.type === 'pitching' && (
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Room
                                            </th>
                                        )}
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {filteredJudges.map((judge) => (
                                        <tr key={judge._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-white">
                                                    {judge.name}
                                                    {judge.user && (
                                                        <span className="ml-2 text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded">
                                                            User
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-300">
                                                    <FaEnvelope className="inline mr-2 text-gray-500" />
                                                    {judge.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {judge.type === 'external' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        External
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Participant
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-mono bg-gray-700 px-2 py-1 rounded">
                                                    {judge.accessCode}
                                                </div>
                                            </td>
                                            {event?.type === 'pitching' && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-300">
                                                        {judge.assignedRoom || 'Not assigned'}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <Link
                                                        href={`/dashboard/admin/judging/${eventId}/judges/${judge._id}`}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded"
                                                        title="Edit Judge"
                                                    >
                                                        <FaUserCog />
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedJudge(judge);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                                                        title="Remove Judge"
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

            {/* Add Judge Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Add New Judge</h3>

                        <form onSubmit={addJudge}>
                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">
                                    Judge Source
                                </label>
                                <div className="flex space-x-4">
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 px-4 rounded-md ${!showEmailForm
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-700 text-gray-300'
                                            }`}
                                        onClick={() => setShowEmailForm(false)}
                                    >
                                        Existing User
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 px-4 rounded-md ${showEmailForm
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-700 text-gray-300'
                                            }`}
                                        onClick={() => setShowEmailForm(true)}
                                    >
                                        New Judge
                                    </button>
                                </div>
                            </div>

                            {showEmailForm ? (
                                <>
                                    <div className="mb-4">
                                        <label htmlFor="judgeName" className="block text-gray-300 mb-2">
                                            Judge Name*
                                        </label>
                                        <input
                                            id="judgeName"
                                            type="text"
                                            value={judgeName}
                                            onChange={(e) => setJudgeName(e.target.value)}
                                            className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Full Name"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="judgeEmail" className="block text-gray-300 mb-2">
                                            Judge Email*
                                        </label>
                                        <input
                                            id="judgeEmail"
                                            type="email"
                                            value={judgeEmail}
                                            onChange={(e) => setJudgeEmail(e.target.value)}
                                            className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="email@example.com"
                                            required
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="mb-4">
                                    <label htmlFor="selectedUser" className="block text-gray-300 mb-2">
                                        Select User*
                                    </label>
                                    <select
                                        id="selectedUser"
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">-- Select User --</option>
                                        {users.map(user => (
                                            <option key={user._id} value={user._id}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Select an existing user to add as a judge
                                    </p>
                                </div>
                            )}

                            <div className="mb-4">
                                <label htmlFor="judgeType" className="block text-gray-300 mb-2">
                                    Judge Type*
                                </label>
                                <select
                                    id="judgeType"
                                    value={judgeType}
                                    onChange={(e) => setJudgeType(e.target.value as 'participant' | 'external')}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="external">External Judge</option>
                                    <option value="participant">Participant Judge</option>
                                </select>
                                <p className="text-sm text-gray-400 mt-1">
                                    {judgeType === 'external'
                                        ? 'External judges are non-participating judges who evaluate projects'
                                        : 'Participant judges are team members who judge other teams'}
                                </p>
                            </div>

                            {event?.type === 'pitching' && (
                                <div className="mb-4">
                                    <label htmlFor="assignedRoom" className="block text-gray-300 mb-2">
                                        Assigned Room
                                    </label>
                                    <input
                                        id="assignedRoom"
                                        type="text"
                                        value={assignedRoom}
                                        onChange={(e) => setAssignedRoom(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g., Room A, Auditorium, etc."
                                    />
                                </div>
                            )}

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Add Judge
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedJudge && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Remove Judge</h3>
                        <p className="mb-4 text-gray-300">
                            Are you sure you want to remove the judge "{selectedJudge.name}"? This will delete all their judging assignments and results.
                        </p>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteJudge}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}