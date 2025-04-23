// src/app/dashboard/admin/teams/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import {
    FaArrowLeft, FaCheck, FaTimes, FaMapMarkerAlt,
    FaUserMinus, FaUsers, FaEnvelope, FaCalendarAlt
} from 'react-icons/fa';

interface TeamMember {
    _id: string;
    name: string;
    email: string;
}

interface Team {
    _id: string;
    name: string;
    description: string;
    leader: TeamMember;
    members: TeamMember[];
    maxSize: number;
    category: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    seatLocation?: string;
    createdAt: string;
}

export default function AdminTeamDetail() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const teamId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<Team | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showAssignSeatModal, setShowAssignSeatModal] = useState(false);

    // Form states
    const [rejectionReason, setRejectionReason] = useState('');
    const [seatLocation, setSeatLocation] = useState('');
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
                fetchTeam();
            }
        }
    }, [status, router, session, teamId]);

    const fetchTeam = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/teams/${teamId}`);
            const data = await response.json();

            if (response.ok) {
                setTeam(data.team);
                if (data.team.seatLocation) {
                    setSeatLocation(data.team.seatLocation);
                }
            } else {
                setError(data.message);
                setTimeout(() => {
                    router.push('/dashboard/admin/teams');
                }, 3000);
            }
        } catch (err) {
            console.error('Error fetching team:', err);
            setError('Failed to fetch team details');
        } finally {
            setLoading(false);
        }
    };

    const approveTeam = async () => {
        if (!team) return;

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/teams/${team._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'approved',
                    seatLocation: seatLocation || team.seatLocation
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Team "${team.name}" has been approved`);
                setShowApproveModal(false);
                fetchTeam();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to approve team');
            console.error(err);
        }
    };

    const rejectTeam = async () => {
        if (!team) return;

        if (!rejectionReason) {
            setError('Please provide a reason for rejection');
            return;
        }

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/teams/${team._id}`, {
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
                setSuccess(`Team "${team.name}" has been rejected`);
                setShowRejectModal(false);
                setRejectionReason('');
                fetchTeam();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to reject team');
            console.error(err);
        }
    };

    const assignSeat = async () => {
        if (!team) return;

        if (!seatLocation) {
            setError('Please provide a seat location');
            return;
        }

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/teams/${team._id}`, {
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
                setSuccess(`Seat assigned to team "${team.name}"`);
                setShowAssignSeatModal(false);
                fetchTeam();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to assign seat');
            console.error(err);
        }
    };

    const removeMember = async (memberId: string) => {
        if (!team) return;

        if (!confirm('Are you sure you want to remove this member from the team?')) {
            return;
        }

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/teams/${team._id}/members?memberId=${memberId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Member removed successfully`);
                fetchTeam();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to remove member');
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

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p>Loading team details...</p>
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
                        href="/dashboard/admin/teams"
                        className="text-gray-400 hover:text-white mr-4"
                    >
                        <FaArrowLeft />
                    </Link>
                    <h1 className="text-2xl font-bold">Team Details</h1>
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

                {team && (
                    <>
                        {/* Team Actions */}
                        <div className="bg-gray-800 rounded-lg shadow-md p-4 mb-6">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setShowApproveModal(true)}
                                    className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center ${team.status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={team.status === 'approved'}
                                >
                                    <FaCheck className="mr-2" /> Approve Team
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition flex items-center ${team.status === 'rejected' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={team.status === 'rejected'}
                                >
                                    <FaTimes className="mr-2" /> Reject Team
                                </button>
                                <button
                                    onClick={() => setShowAssignSeatModal(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center"
                                >
                                    <FaMapMarkerAlt className="mr-2" /> {team.seatLocation ? 'Change Seat' : 'Assign Seat'}
                                </button>
                            </div>
                        </div>

                        {/* Team Overview */}
                        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-xl font-semibold mb-4">Team Overview</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <span className="block text-gray-400 text-sm">Team Name</span>
                                        <span className="text-xl font-semibold">{team.name}</span>
                                    </div>

                                    <div className="mb-4">
                                        <span className="block text-gray-400 text-sm">Status</span>
                                        <div className="mt-1">
                                            {getStatusBadge(team.status)}
                                            {team.status === 'rejected' && team.rejectionReason && (
                                                <div className="mt-2 text-red-400 text-sm">
                                                    <p><strong>Reason:</strong> {team.rejectionReason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <span className="block text-gray-400 text-sm">Category</span>
                                        <span>{getCategoryLabel(team.category)}</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-4">
                                        <span className="block text-gray-400 text-sm">Team Size</span>
                                        <span>{team.members.length}/{team.maxSize} members</span>
                                    </div>

                                    <div className="mb-4">
                                        <span className="block text-gray-400 text-sm">Seat Location</span>
                                        <span>{team.seatLocation || 'Not assigned'}</span>
                                    </div>

                                    <div className="mb-4">
                                        <span className="block text-gray-400 text-sm">Created</span>
                                        <div className="flex items-center">
                                            <FaCalendarAlt className="text-gray-400 mr-2" />
                                            <span>{formatDate(team.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <span className="block text-gray-400 text-sm mb-2">Description</span>
                                <div className="bg-gray-700 p-4 rounded-md">
                                    {team.description}
                                </div>
                            </div>
                        </div>

                        {/* Team Members */}
                        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
                            <div className="p-6 pb-4">
                                <h2 className="text-xl font-semibold mb-2">Team Members</h2>
                                <p className="text-gray-400 text-sm mb-4">
                                    Manage team members and their roles.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-900">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Member
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {team.members.map((member) => (
                                            <tr key={member._id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                                            {member.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-white">
                                                                {member.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-gray-300">
                                                        <FaEnvelope className="mr-2 text-gray-400" />
                                                        {member.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {member._id === team.leader._id ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                            Team Leader
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            Member
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => removeMember(member._id)}
                                                        className="text-red-400 hover:text-red-300"
                                                        title="Remove member"
                                                        disabled={member._id === team.leader._id && team.members.length > 1}
                                                    >
                                                        <FaUserMinus />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Approve Modal */}
            {showApproveModal && team && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Approve Team</h3>
                        <p className="mb-4">
                            Are you sure you want to approve the team "{team.name}"?
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
                                onClick={() => setShowApproveModal(false)}
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
            {showRejectModal && team && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Reject Team</h3>
                        <p className="mb-4">
                            Are you sure you want to reject the team "{team.name}"?
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
                                onClick={() => setShowRejectModal(false)}
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
            {showAssignSeatModal && team && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Assign Seat Location</h3>
                        <p className="mb-4">
                            Assign a seat location for team "{team.name}".
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
                                onClick={() => setShowAssignSeatModal(false)}
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