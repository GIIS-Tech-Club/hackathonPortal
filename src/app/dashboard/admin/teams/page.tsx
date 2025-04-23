// src/app/dashboard/admin/teams/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import { FaUsers, FaCheck, FaTimes, FaSearch, FaFilter, FaMapMarkerAlt } from 'react-icons/fa';

interface Team {
    _id: string;
    name: string;
    description: string;
    leader: {
        _id: string;
        name: string;
        email: string;
    };
    members: Array<{
        _id: string;
        name: string;
        email: string;
    }>;
    maxSize: number;
    category: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    seatLocation?: string;
    createdAt: string;
}

export default function AdminTeams() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState<Team[]>([]);
    const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showAssignSeatModal, setShowAssignSeatModal] = useState(false);

    // Form states
    const [rejectionReason, setRejectionReason] = useState('');
    const [seatLocation, setSeatLocation] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchTeams();
            }
        }
    }, [status, router, session]);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/teams');
            const data = await response.json();

            if (response.ok) {
                setTeams(data.teams || []);
                setFilteredTeams(data.teams || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch teams');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Apply filters when they change
        let results = teams;

        // Apply search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(team =>
                team.name.toLowerCase().includes(term) ||
                team.members.some(m => m.name.toLowerCase().includes(term))
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            results = results.filter(team => team.status === statusFilter);
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            results = results.filter(team => team.category === categoryFilter);
        }

        setFilteredTeams(results);
    }, [searchTerm, statusFilter, categoryFilter, teams]);

    const approveTeam = async () => {
        if (!selectedTeam) return;

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/teams/${selectedTeam._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'approved',
                    seatLocation: seatLocation || selectedTeam.seatLocation
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Team "${selectedTeam.name}" has been approved`);
                setShowApproveModal(false);
                setSeatLocation('');
                fetchTeams();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to approve team');
            console.error(err);
        }
    };

    const rejectTeam = async () => {
        if (!selectedTeam) return;

        if (!rejectionReason) {
            setError('Please provide a reason for rejection');
            return;
        }

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/teams/${selectedTeam._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'rejected',
                    rejectionReason
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Team "${selectedTeam.name}" has been rejected`);
                setShowRejectModal(false);
                setRejectionReason('');
                fetchTeams();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to reject team');
            console.error(err);
        }
    };

    const assignSeat = async () => {
        if (!selectedTeam) return;

        if (!seatLocation) {
            setError('Please provide a seat location');
            return;
        }

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/teams/${selectedTeam._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    seatLocation
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Seat assigned to team "${selectedTeam.name}"`);
                setShowAssignSeatModal(false);
                setSeatLocation('');
                fetchTeams();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to assign seat');
            console.error(err);
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

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p>Loading teams...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout isAdmin={true}>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Team Management</h1>

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

                {/* Filters & Search */}
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search teams by name or member"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="min-w-[140px]">
                                <div className="relative">
                                    <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            <div className="min-w-[140px]">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="web">Web Development</option>
                                    <option value="mobile">Mobile App</option>
                                    <option value="ai">AI/ML</option>
                                    <option value="data">Data Science</option>
                                    <option value="game">Game Development</option>
                                    <option value="iot">IoT</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teams List */}
                <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Team
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Members
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Seat
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {filteredTeams.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                                            No teams found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTeams.map((team) => (
                                        <tr key={team._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                                        <FaUsers />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-white">{team.name}</div>
                                                        <div className="text-sm text-gray-400">
                                                            <span className="font-medium">Leader:</span> {team.leader.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">{team.members.length}/{team.maxSize}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">{getCategoryLabel(team.category)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(team.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">
                                                    {team.seatLocation || (
                                                        <span className="text-gray-400">Not assigned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTeam(team);
                                                        setShowApproveModal(true);
                                                        setSeatLocation(team.seatLocation || '');
                                                    }}
                                                    className={`bg-green-600 hover:bg-green-700 text-white p-2 rounded ${team.status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    disabled={team.status === 'approved'}
                                                    title="Approve Team"
                                                >
                                                    <FaCheck />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedTeam(team);
                                                        setShowRejectModal(true);
                                                    }}
                                                    className={`bg-red-600 hover:bg-red-700 text-white p-2 rounded ${team.status === 'rejected' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    disabled={team.status === 'rejected'}
                                                    title="Reject Team"
                                                >
                                                    <FaTimes />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedTeam(team);
                                                        setShowAssignSeatModal(true);
                                                        setSeatLocation(team.seatLocation || '');
                                                    }}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded"
                                                    title="Assign Seat"
                                                >
                                                    <FaMapMarkerAlt />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Approve Modal */}
            {showApproveModal && selectedTeam && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Approve Team</h3>
                        <p className="mb-4">
                            Are you sure you want to approve the team "{selectedTeam.name}"?
                        </p>

                        <div className="mb-4">
                            <label htmlFor="seatLocation" className="block text-gray-300 mb-2">
                                Seat Location (Optional)
                            </label>
                            <input
                                id="seatLocation"
                                type="text"
                                value={seatLocation}
                                onChange={(e) => setSeatLocation(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Table A-12"
                            />
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setSeatLocation('');
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={approveTeam}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedTeam && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Reject Team</h3>
                        <p className="mb-4">
                            Are you sure you want to reject the team "{selectedTeam.name}"?
                        </p>

                        <div className="mb-4">
                            <label htmlFor="rejectionReason" className="block text-gray-300 mb-2">
                                Reason for Rejection*
                            </label>
                            <textarea
                                id="rejectionReason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Provide a reason for rejecting this team"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={rejectTeam}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Seat Modal */}
            {showAssignSeatModal && selectedTeam && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Assign Seat Location</h3>
                        <p className="mb-4">
                            Assign a seat location for team "{selectedTeam.name}".
                        </p>

                        <div className="mb-4">
                            <label htmlFor="seatLocationAssign" className="block text-gray-300 mb-2">
                                Seat Location*
                            </label>
                            <input
                                id="seatLocationAssign"
                                type="text"
                                value={seatLocation}
                                onChange={(e) => setSeatLocation(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Table A-12"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => {
                                    setShowAssignSeatModal(false);
                                    setSeatLocation('');
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={assignSeat}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Assign Seat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}