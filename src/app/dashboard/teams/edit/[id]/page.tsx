// src/app/dashboard/teams/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import { FaSave, FaArrowLeft } from 'react-icons/fa';

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

export default function EditTeam() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const teamId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<Team | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [maxSize, setMaxSize] = useState(4);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchTeam();
        }
    }, [status, router, teamId]);

    const fetchTeam = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/teams/${teamId}`);
            const data = await response.json();

            if (response.ok) {
                setTeam(data.team);

                // Initialize form values
                setName(data.team.name);
                setDescription(data.team.description);
                setCategory(data.team.category);
                setMaxSize(data.team.maxSize);

                // Check if current user is the team leader
                if (session?.user?.id !== data.team.leader._id) {
                    // If not team leader, redirect to teams page
                    setError('Only team leaders can edit team information');
                    setTimeout(() => {
                        router.push('/dashboard/teams');
                    }, 3000);
                }
            } else {
                setError(data.message);
                setTimeout(() => {
                    router.push('/dashboard/teams');
                }, 3000);
            }
        } catch (err) {
            setError('Failed to fetch team details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name || !description) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch(`/api/teams/${teamId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    category,
                    maxSize,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Team updated successfully');
                // Update the team state with the new values
                setTeam(data.team);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to update team');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
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
        <DashboardLayout>
            <div className="p-6">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => router.push('/dashboard/teams')}
                        className="text-gray-400 hover:text-white mr-4"
                    >
                        <FaArrowLeft />
                    </button>
                    <h1 className="text-2xl font-bold">Edit Team</h1>
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
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-gray-300 mb-2">
                                    Team Name*
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
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
                                        disabled={team.members.length > maxSize}
                                    >
                                        <option value="1" disabled={team.members.length > 1}>1 member</option>
                                        <option value="2" disabled={team.members.length > 2}>2 members</option>
                                        <option value="3" disabled={team.members.length > 3}>3 members</option>
                                        <option value="4" disabled={team.members.length > 4}>4 members</option>
                                        <option value="5" disabled={team.members.length > 5}>5 members</option>
                                        <option value="6" disabled={team.members.length > 6}>6 members</option>
                                    </select>
                                    {team.members.length > 1 && (
                                        <p className="text-yellow-500 text-sm mt-1">
                                            You cannot reduce the max size below your current member count ({team.members.length}).
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4 mt-4">
                                <h3 className="font-semibold mb-2">Team Members ({team.members.length}/{maxSize})</h3>
                                <ul className="bg-gray-700 rounded-md mb-4">
                                    {team.members.map((member) => (
                                        <li key={member._id} className="p-3 border-b border-gray-600 last:border-b-0">
                                            <span className="font-medium">{member.name}</span>
                                            {member._id === team.leader._id && (
                                                <span className="ml-2 text-xs bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded">
                                                    Team Leader
                                                </span>
                                            )}
                                            <div className="text-sm text-gray-400">{member.email}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="border-t border-gray-700 pt-4 mt-4">
                                <h3 className="font-semibold mb-2">Team Status</h3>
                                <div className="bg-gray-700 p-3 rounded-md mb-4">
                                    {team.status === 'pending' && (
                                        <div className="flex items-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                                                Pending
                                            </span>
                                            <span className="text-gray-400">
                                                Your team is awaiting approval from the event organizers.
                                            </span>
                                        </div>
                                    )}
                                    {team.status === 'approved' && (
                                        <div className="flex items-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                                Approved
                                            </span>
                                            <span className="text-gray-400">
                                                Your team has been approved to participate in the hackathon.
                                            </span>
                                        </div>
                                    )}
                                    {team.status === 'rejected' && (
                                        <div>
                                            <div className="flex items-center mb-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
                                                    Rejected
                                                </span>
                                                <span className="text-gray-400">
                                                    Your team registration has been rejected.
                                                </span>
                                            </div>
                                            {team.rejectionReason && (
                                                <div className="mt-2 text-red-400">
                                                    <span className="font-medium">Reason:</span> {team.rejectionReason}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => router.push('/dashboard/teams')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center"
                                >
                                    <FaSave className="mr-2" /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}