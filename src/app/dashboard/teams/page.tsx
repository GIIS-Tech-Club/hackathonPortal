// src/app/dashboard/teams/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { FaUsers, FaUserPlus, FaUserMinus, FaEdit, FaTrash, FaInfoCircle } from 'react-icons/fa';

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
    inviteCode?: string;
    createdAt: string;
}

export default function TeamManagement() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState<Team[]>([]);
    const [userTeam, setUserTeam] = useState<Team | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);

    // Form states
    const [teamName, setTeamName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('other');
    const [maxSize, setMaxSize] = useState(4);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchTeams();
        }
    }, [status, router]);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/teams');
            const data = await response.json();

            if (response.ok) {
                setTeams(data.teams || []);

                // Find user's team
                const myTeam = data.teams.find((team: Team) =>
                    team.members.some(member => member._id === session?.user?.id)
                );
                setUserTeam(myTeam || null);
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

    const createTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!teamName || !description) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/api/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: teamName,
                    description,
                    category,
                    maxSize,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Team created successfully');
                setTeamName('');
                setDescription('');
                setCategory('other');
                setMaxSize(4);
                setShowCreate(false);
                fetchTeams();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to create team');
            console.error(err);
        }
    };

    const joinTeam = async (teamId: string) => {
        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/teams/${teamId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Successfully joined team');
                fetchTeams();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to join team');
            console.error(err);
        }
    };

    const leaveTeam = async () => {
        if (!userTeam) return;

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/teams/${userTeam._id}/members`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Successfully left team');
                setUserTeam(null);
                fetchTeams();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to leave team');
            console.error(err);
        }
    };

    const deleteTeam = async () => {
        if (!userTeam) return;

        if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
            return;
        }

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/teams/${userTeam._id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Team deleted successfully');
                setUserTeam(null);
                fetchTeams();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to delete team');
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
            <DashboardLayout>
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
        <DashboardLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Team Management</h1>
                    {!userTeam && (
                        <div className="flex space-x-4">
                            <button
                                onClick={() => {
                                    setShowCreate(true);
                                    setShowJoin(false);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center"
                            >
                                <FaUserPlus className="mr-2" /> Create Team
                            </button>
                            <button
                                onClick={() => {
                                    setShowJoin(true);
                                    setShowCreate(false);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center"
                            >
                                <FaUsers className="mr-2" /> Join Team
                            </button>
                        </div>
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

                {/* Create Team Form */}
                {showCreate && !userTeam && (
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Create a New Team</h2>
                        <form onSubmit={createTeam}>
                            <div className="mb-4">
                                <label htmlFor="teamName" className="block text-gray-300 mb-2">
                                    Team Name*
                                </label>
                                <input
                                    id="teamName"
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter team name"
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="description" className="block text-gray-300 mb-2">
                                    Description*
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Describe your team and project idea"
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="category" className="block text-gray-300 mb-2">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="web">Web Development</option>
                                        <option value="mobile">Mobile App</option>
                                        <option value="ai">AI/ML</option>
                                        <option value="data">Data Science</option>
                                        <option value="game">Game Development</option>
                                        <option value="iot">IoT</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="maxSize" className="block text-gray-300 mb-2">
                                        Max Team Size
                                    </label>
                                    <select
                                        id="maxSize"
                                        value={maxSize}
                                        onChange={(e) => setMaxSize(parseInt(e.target.value))}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="1">1 member</option>
                                        <option value="2">2 members</option>
                                        <option value="3">3 members</option>
                                        <option value="4">4 members</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Create Team
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Your Team Section */}
                {userTeam && (
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-semibold">Your Team</h2>
                            <div className="flex space-x-2">
                                {userTeam.leader._id === session?.user?.id && (
                                    <>
                                        <button
                                            onClick={() => router.push(`/dashboard/teams/edit/${userTeam._id}`)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-md transition"
                                            title="Edit Team"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={deleteTeam}
                                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition"
                                            title="Delete Team"
                                        >
                                            <FaTrash />
                                        </button>
                                    </>
                                )}
                                {userTeam.leader._id !== session?.user?.id && (
                                    <button
                                        onClick={leaveTeam}
                                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition flex items-center"
                                    >
                                        <FaUserMinus className="mr-2" /> Leave Team
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Team Invite Code (visible only to team leader) */}
                        {userTeam.leader._id === session?.user?.id && userTeam.inviteCode && (
                            <div className="bg-indigo-900 bg-opacity-50 p-4 rounded-md mb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-indigo-300 mb-1">Team Invite Code</h3>
                                        <p className="text-sm text-gray-300">Share this code with people you want to invite to your team</p>
                                    </div>
                                    <div className="bg-indigo-700 px-3 py-2 rounded-md font-mono font-bold text-lg">
                                        {userTeam.inviteCode}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <span className="block text-gray-400 text-sm">Team Name</span>
                                <span className="font-semibold text-lg">{userTeam.name}</span>
                            </div>
                            <div>
                                <span className="block text-gray-400 text-sm">Category</span>
                                <span>{getCategoryLabel(userTeam.category)}</span>
                            </div>
                            <div>
                                <span className="block text-gray-400 text-sm">Status</span>
                                <div className="mt-1">{getStatusBadge(userTeam.status)}</div>
                            </div>
                        </div>

                        {userTeam.rejectionReason && userTeam.status === 'rejected' && (
                            <div className="mb-4 bg-red-900 bg-opacity-30 p-4 rounded-md">
                                <h3 className="font-semibold text-red-400 mb-1">Rejection Reason:</h3>
                                <p>{userTeam.rejectionReason}</p>
                            </div>
                        )}

                        <div className="mb-4">
                            <span className="block text-gray-400 text-sm mb-1">Description</span>
                            <p className="bg-gray-700 p-3 rounded-md">{userTeam.description}</p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Team Members ({userTeam.members.length}/{userTeam.maxSize})</h3>
                            <ul className="bg-gray-700 rounded-md divide-y divide-gray-600">
                                {userTeam.members.map((member) => (
                                    <li key={member._id} className="p-3 flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">{member.name}</span>
                                            {member._id === userTeam.leader._id && (
                                                <span className="ml-2 text-xs bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded">Team Leader</span>
                                            )}
                                            <div className="text-sm text-gray-400">{member.email}</div>
                                        </div>
                                        {userTeam.leader._id === session?.user?.id && member._id !== session.user.id && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const response = await fetch(`/api/teams/${userTeam._id}/members?memberId=${member._id}`, {
                                                            method: 'DELETE',
                                                        });
                                                        if (response.ok) {
                                                            setSuccess('Member removed successfully');
                                                            fetchTeams();
                                                        } else {
                                                            const data = await response.json();
                                                            setError(data.message);
                                                        }
                                                    } catch (err) {
                                                        setError('Failed to remove member');
                                                        console.error(err);
                                                    }
                                                }}
                                                className="text-red-400 hover:text-red-300"
                                                title="Remove member"
                                            >
                                                <FaUserMinus />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {userTeam.seatLocation && (
                            <div className="mt-4">
                                <span className="block text-gray-400 text-sm">Seat Location</span>
                                <span className="font-semibold">{userTeam.seatLocation}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Join Team Section */}
                {showJoin && !userTeam && (
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Join an Existing Team</h2>
                        <p className="text-gray-400 mb-4">
                            Enter the invite code provided by your team leader to join their team.
                        </p>

                        <div className="mb-6">
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const inviteCode = (document.getElementById('inviteCode') as HTMLInputElement).value.trim().toUpperCase();

                                if (!inviteCode) {
                                    setError('Please enter an invite code');
                                    return;
                                }

                                try {
                                    setError('');
                                    setSuccess('');

                                    const response = await fetch(`/api/teams/join`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ inviteCode }),
                                    });

                                    const data = await response.json();

                                    if (response.ok) {
                                        setSuccess('Successfully joined the team');
                                        fetchTeams();
                                    } else {
                                        setError(data.message);
                                    }
                                } catch (err) {
                                    setError('Failed to join team');
                                    console.error(err);
                                }
                            }}>
                                <div className="flex items-center mb-4">
                                    <input
                                        id="inviteCode"
                                        type="text"
                                        placeholder="Enter invite code (e.g., ABC123)"
                                        className="flex-1 bg-gray-700 text-white rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md transition"
                                    >
                                        Join Team
                                    </button>
                                </div>
                                <p className="text-sm text-gray-400">
                                    Ask your team leader for the unique invite code to join their team.
                                </p>
                            </form>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setShowJoin(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Team Status Information */}
                <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Team Status Information</h2>
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="bg-yellow-100 text-yellow-800 rounded-full p-1 mr-3 flex-shrink-0 mt-0.5">
                                <FaInfoCircle />
                            </div>
                            <div>
                                <h3 className="font-medium">Pending</h3>
                                <p className="text-gray-400 text-sm">Your team has been created but is awaiting approval from the event organizers.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="bg-green-100 text-green-800 rounded-full p-1 mr-3 flex-shrink-0 mt-0.5">
                                <FaInfoCircle />
                            </div>
                            <div>
                                <h3 className="font-medium">Approved</h3>
                                <p className="text-gray-400 text-sm">Your team has been approved by the organizers and is ready to participate in the hackathon.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="bg-red-100 text-red-800 rounded-full p-1 mr-3 flex-shrink-0 mt-0.5">
                                <FaInfoCircle />
                            </div>
                            <div>
                                <h3 className="font-medium">Rejected</h3>
                                <p className="text-gray-400 text-sm">Your team has been rejected. Check the rejection reason and create a new team if needed.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}