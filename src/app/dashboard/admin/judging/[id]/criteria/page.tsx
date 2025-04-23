// src/app/dashboard/admin/judging/[id]/criteria/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import {
    FaArrowLeft, FaPlus, FaPencilAlt, FaTrash, FaSave,
    FaTimes, FaWeight, FaStar, FaInfoCircle
} from 'react-icons/fa';

interface JudgingCriteria {
    _id: string;
    name: string;
    description: string;
    weight: number;
    minScore: number;
    maxScore: number;
    event: string;
}

interface JudgingEvent {
    _id: string;
    name: string;
    type: 'demo_participants' | 'demo_judges' | 'pitching';
    status: 'setup' | 'active' | 'completed';
}

export default function JudgingCriteriaManagement() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [criteria, setCriteria] = useState<JudgingCriteria[]>([]);
    const [event, setEvent] = useState<JudgingEvent | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCriterion, setSelectedCriterion] = useState<JudgingCriteria | null>(null);
    const [criterionName, setCriterionName] = useState('');
    const [criterionDescription, setCriterionDescription] = useState('');
    const [criterionWeight, setCriterionWeight] = useState(1);
    const [criterionMinScore, setCriterionMinScore] = useState(1);
    const [criterionMaxScore, setCriterionMaxScore] = useState(10);

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchEvent();
                fetchCriteria();
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

    const fetchCriteria = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/judging/criteria?eventId=${eventId}`);
            const data = await response.json();

            if (response.ok) {
                setCriteria(data.criteria || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch judging criteria');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addCriterion = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!criterionName || !criterionDescription) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/api/judging/criteria', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: criterionName,
                    description: criterionDescription,
                    weight: criterionWeight,
                    minScore: criterionMinScore,
                    maxScore: criterionMaxScore,
                    eventId: eventId
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Criterion "${criterionName}" added successfully`);
                setShowAddModal(false);
                resetForm();
                fetchCriteria();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to add judging criterion');
            console.error(err);
        }
    };

    const updateCriterion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCriterion) return;
        setError('');
        setSuccess('');

        if (!criterionName || !criterionDescription) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch(`/api/judging/criteria/${selectedCriterion._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: criterionName,
                    description: criterionDescription,
                    weight: criterionWeight,
                    minScore: criterionMinScore,
                    maxScore: criterionMaxScore
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Criterion "${criterionName}" updated successfully`);
                setShowEditModal(false);
                setSelectedCriterion(null);
                fetchCriteria();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to update judging criterion');
            console.error(err);
        }
    };

    const deleteCriterion = async (criterionId: string) => {
        if (!confirm('Are you sure you want to delete this judging criterion? This action cannot be undone.')) {
            return;
        }

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/judging/criteria/${criterionId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Judging criterion deleted successfully');
                fetchCriteria();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to delete judging criterion');
            console.error(err);
        }
    };

    const resetForm = () => {
        setCriterionName('');
        setCriterionDescription('');
        setCriterionWeight(1);
        setCriterionMinScore(1);
        setCriterionMaxScore(10);
    };

    const openEditModal = (criterion: JudgingCriteria) => {
        setSelectedCriterion(criterion);
        setCriterionName(criterion.name);
        setCriterionDescription(criterion.description);
        setCriterionWeight(criterion.weight);
        setCriterionMinScore(criterion.minScore);
        setCriterionMaxScore(criterion.maxScore);
        setShowEditModal(true);
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p>Loading judging criteria...</p>
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
                        href={`/dashboard/admin/judging/${eventId}`}
                        className="text-gray-400 hover:text-white mr-4"
                    >
                        <FaArrowLeft />
                    </Link>
                    <h1 className="text-2xl font-bold">Judging Criteria</h1>
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

                {/* Info about judging criteria */}
                <div className="bg-indigo-900 bg-opacity-40 border border-indigo-700 p-4 rounded-md mb-6">
                    <div className="flex items-start">
                        <FaInfoCircle className="text-indigo-400 mr-3 mt-1" />
                        <div>
                            <h2 className="text-lg font-semibold text-indigo-300 mb-1">About Judging Criteria</h2>
                            <p className="text-white">
                                Judging criteria define what aspects of projects will be evaluated. Each criterion can have a different weight to indicate its importance.
                                Judges will assign scores for each criterion within the defined range (Min to Max score).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mb-6">
                    <button
                        onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center"
                    >
                        <FaPlus className="mr-2" /> Add New Criterion
                    </button>
                </div>

                {/* Criteria List */}
                <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-700">
                        <h2 className="text-xl font-semibold">Criteria</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Configure the criteria that will be used to judge projects
                        </p>
                    </div>

                    {criteria.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <p>No judging criteria defined yet. Click the "Add New Criterion" button to create one.</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            {criteria.map((criterion) => (
                                <div key={criterion._id} className="bg-gray-700 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{criterion.name}</h3>
                                            <div className="text-sm text-gray-300 mt-1">
                                                {criterion.description}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-3 text-sm">
                                                <span className="bg-indigo-900 text-indigo-200 px-2 py-1 rounded-md flex items-center">
                                                    <FaWeight className="mr-1" /> Weight: {criterion.weight}
                                                </span>
                                                <span className="bg-indigo-900 text-indigo-200 px-2 py-1 rounded-md flex items-center">
                                                    <FaStar className="mr-1" /> Score Range: {criterion.minScore} - {criterion.maxScore}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openEditModal(criterion)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
                                                title="Edit Criterion"
                                            >
                                                <FaPencilAlt />
                                            </button>
                                            <button
                                                onClick={() => deleteCriterion(criterion._id)}
                                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md"
                                                title="Delete Criterion"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Criterion Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Add New Judging Criterion</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={addCriterion}>
                            <div className="mb-4">
                                <label htmlFor="criterionName" className="block text-gray-300 mb-2">
                                    Criterion Name*
                                </label>
                                <input
                                    id="criterionName"
                                    type="text"
                                    value={criterionName}
                                    onChange={(e) => setCriterionName(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., Technical Complexity, User Experience, etc."
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="criterionDescription" className="block text-gray-300 mb-2">
                                    Description*
                                </label>
                                <textarea
                                    id="criterionDescription"
                                    value={criterionDescription}
                                    onChange={(e) => setCriterionDescription(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Explain what aspects judges should consider for this criterion"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label htmlFor="criterionWeight" className="block text-gray-300 mb-2">
                                        Weight
                                    </label>
                                    <input
                                        id="criterionWeight"
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="0.5"
                                        value={criterionWeight}
                                        onChange={(e) => setCriterionWeight(parseFloat(e.target.value))}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="criterionMinScore" className="block text-gray-300 mb-2">
                                        Min Score
                                    </label>
                                    <input
                                        id="criterionMinScore"
                                        type="number"
                                        min="0"
                                        max={criterionMaxScore - 1}
                                        value={criterionMinScore}
                                        onChange={(e) => setCriterionMinScore(parseInt(e.target.value))}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="criterionMaxScore" className="block text-gray-300 mb-2">
                                        Max Score
                                    </label>
                                    <input
                                        id="criterionMaxScore"
                                        type="number"
                                        min={criterionMinScore + 1}
                                        max="100"
                                        value={criterionMaxScore}
                                        onChange={(e) => setCriterionMaxScore(parseInt(e.target.value))}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

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
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center"
                                >
                                    <FaPlus className="mr-2" /> Add Criterion
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Criterion Modal */}
            {showEditModal && selectedCriterion && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Edit Judging Criterion</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={updateCriterion}>
                            <div className="mb-4">
                                <label htmlFor="editCriterionName" className="block text-gray-300 mb-2">
                                    Criterion Name*
                                </label>
                                <input
                                    id="editCriterionName"
                                    type="text"
                                    value={criterionName}
                                    onChange={(e) => setCriterionName(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., Technical Complexity, User Experience, etc."
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="editCriterionDescription" className="block text-gray-300 mb-2">
                                    Description*
                                </label>
                                <textarea
                                    id="editCriterionDescription"
                                    value={criterionDescription}
                                    onChange={(e) => setCriterionDescription(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Explain what aspects judges should consider for this criterion"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label htmlFor="editCriterionWeight" className="block text-gray-300 mb-2">
                                        Weight
                                    </label>
                                    <input
                                        id="editCriterionWeight"
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="0.5"
                                        value={criterionWeight}
                                        onChange={(e) => setCriterionWeight(parseFloat(e.target.value))}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="editCriterionMinScore" className="block text-gray-300 mb-2">
                                        Min Score
                                    </label>
                                    <input
                                        id="editCriterionMinScore"
                                        type="number"
                                        min="0"
                                        max={criterionMaxScore - 1}
                                        value={criterionMinScore}
                                        onChange={(e) => setCriterionMinScore(parseInt(e.target.value))}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="editCriterionMaxScore" className="block text-gray-300 mb-2">
                                        Max Score
                                    </label>
                                    <input
                                        id="editCriterionMaxScore"
                                        type="number"
                                        min={criterionMinScore + 1}
                                        max="100"
                                        value={criterionMaxScore}
                                        onChange={(e) => setCriterionMaxScore(parseInt(e.target.value))}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
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
                </div>
            )}
        </DashboardLayout>
    );
}