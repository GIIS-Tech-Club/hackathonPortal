// src/app/dashboard/admin/judging/[id]/tables/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import {
    FaArrowLeft, FaMapMarkerAlt, FaPlus, FaRandom,
    FaSave, FaSearch, FaFilter, FaTimes, FaUpload,
    FaDownload, FaCheck
} from 'react-icons/fa';

interface Team {
    _id: string;
    name: string;
    description?: string;
    members: Array<{
        _id: string;
        name: string;
        email: string;
    }>;
    leader: {
        _id: string;
        name: string;
        email: string;
    };
    maxSize: number;
    category: string;
    status: 'pending' | 'approved' | 'rejected';
    tableNumber?: string;
    tableMap?: string;
}

interface JudgingEvent {
    _id: string;
    name: string;
    type: 'demo_participants' | 'demo_judges' | 'pitching';
    status: 'setup' | 'active' | 'completed';
}

export default function TableAssignment() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState<Team[]>([]);
    const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
    const [event, setEvent] = useState<JudgingEvent | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [tableNumber, setTableNumber] = useState('');
    const [tableMap, setTableMap] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('approved');
    const [tableFilter, setTableFilter] = useState('all');
    const [bulkAssignmentMethod, setBulkAssignmentMethod] = useState('sequential');
    const [startingTable, setStartingTable] = useState('1');
    const [tablePrefix, setTablePrefix] = useState('T');
    const [confirmBulkAssign, setConfirmBulkAssign] = useState(false);
    const [bulkAssignPreview, setBulkAssignPreview] = useState<{ teamId: string; teamName: string; tableNumber: string }[]>([]);

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchEvent();
                fetchTeams();
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

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/teams');
            const data = await response.json();

            if (response.ok) {
                setTeams(data.teams || []);

                // Initially filter to approved teams
                const approved = data.teams.filter((team: Team) => team.status === 'approved');
                setFilteredTeams(approved);
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

    // Apply filters when they change
    useEffect(() => {
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

        // Apply table filter
        if (tableFilter === 'assigned') {
            results = results.filter(team => team.tableNumber);
        } else if (tableFilter === 'unassigned') {
            results = results.filter(team => !team.tableNumber);
        }

        setFilteredTeams(results);
    }, [searchTerm, statusFilter, tableFilter, teams]);

    const assignTable = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTeam) return;
        if (!tableNumber) {
            setError('Please provide a table number');
            return;
        }

        try {
            setError('');
            setSuccess('');

            const response = await fetch('/api/judging/tables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamId: selectedTeam._id,
                    tableNumber,
                    tableMap
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Table ${tableNumber} assigned to ${selectedTeam.name}`);
                setShowAssignModal(false);

                // Update local state
                setTeams(teams.map(team =>
                    team._id === selectedTeam._id
                        ? { ...team, tableNumber, tableMap: tableMap || team.tableMap }
                        : team
                ));

                setTableNumber('');
                setTableMap('');
                setSelectedTeam(null);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to assign table');
            console.error(err);
        }
    };

    const removeTableAssignment = async (teamId: string) => {
        try {
            setError('');
            setSuccess('');

            const team = teams.find(t => t._id === teamId);
            if (!team) return;

            const response = await fetch('/api/judging/tables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamId,
                    tableNumber: null,
                    tableMap: null
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Table assignment removed from ${team.name}`);

                // Update local state
                setTeams(teams.map(t =>
                    t._id === teamId
                        ? { ...t, tableNumber: undefined, tableMap: undefined }
                        : t
                ));
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to remove table assignment');
            console.error(err);
        }
    };

    const generateBulkAssignmentPreview = () => {
        const teamsToAssign = filteredTeams.filter(team => team.status === 'approved');
        const preview: { teamId: string; teamName: string; tableNumber: string }[] = [];

        if (bulkAssignmentMethod === 'sequential') {
            let tableNum = parseInt(startingTable);

            teamsToAssign.forEach(team => {
                preview.push({
                    teamId: team._id,
                    teamName: team.name,
                    tableNumber: `${tablePrefix}${tableNum}`
                });
                tableNum++;
            });
        } else if (bulkAssignmentMethod === 'random') {
            // Shuffle teams
            const shuffled = [...teamsToAssign].sort(() => 0.5 - Math.random());
            let tableNum = parseInt(startingTable);

            shuffled.forEach(team => {
                preview.push({
                    teamId: team._id,
                    teamName: team.name,
                    tableNumber: `${tablePrefix}${tableNum}`
                });
                tableNum++;
            });
        }

        setBulkAssignPreview(preview);
    };

    useEffect(() => {
        if (showBulkAssignModal) {
            generateBulkAssignmentPreview();
        }
    }, [showBulkAssignModal, bulkAssignmentMethod, startingTable, tablePrefix, filteredTeams]);

    const executeBulkAssignment = async () => {
        if (bulkAssignPreview.length === 0) return;

        try {
            setError('');
            setSuccess('');

            const assignments = bulkAssignPreview.map(preview => ({
                teamId: preview.teamId,
                tableNumber: preview.tableNumber
            }));

            const response = await fetch('/api/judging/tables', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assignments,
                    eventId
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`Bulk table assignment completed: ${data.success} teams assigned`);
                setShowBulkAssignModal(false);
                setConfirmBulkAssign(false);

                // Update local state
                const updatedTeams = [...teams];
                for (const assignment of assignments) {
                    const teamIndex = updatedTeams.findIndex(t => t._id === assignment.teamId);
                    if (teamIndex !== -1) {
                        updatedTeams[teamIndex] = {
                            ...updatedTeams[teamIndex],
                            tableNumber: assignment.tableNumber
                        };
                    }
                }
                setTeams(updatedTeams);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to execute bulk assignment');
            console.error(err);
        }
    };

    const downloadTableAssignments = () => {
        // Create CSV content
        const headers = ['Team Name', 'Table Number', 'Members', 'Category'];
        const rows = filteredTeams
            .filter(team => team.tableNumber)
            .map(team => [
                team.name,
                team.tableNumber || 'N/A',
                team.members.map(m => m.name).join(', '),
                team.category
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
        link.setAttribute('download', 'table_assignments.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                <div className="flex items-center mb-6">
                    <Link
                        href="/dashboard/admin/judging"
                        className="text-gray-400 hover:text-white mr-4"
                    >
                        <FaArrowLeft />
                    </Link>
                    <h1 className="text-2xl font-bold">Table Assignment</h1>
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
                                    value={tableFilter}
                                    onChange={(e) => setTableFilter(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">All Tables</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="unassigned">Unassigned</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowBulkAssignModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center"
                        >
                            <FaRandom className="mr-2" /> Bulk Assign Tables
                        </button>
                        <button
                            onClick={downloadTableAssignments}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center"
                            disabled={!filteredTeams.some(team => team.tableNumber)}
                        >
                            <FaDownload className="mr-2" /> Export Assignments
                        </button>
                    </div>
                </div>

                {/* Teams Table */}
                <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Team Table Assignments</h2>
                        <span className="text-gray-400">
                            {filteredTeams.filter(team => team.tableNumber).length} of {filteredTeams.length} teams assigned
                        </span>
                    </div>

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
                                        Table
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
                                            No teams found matching your filters
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTeams.map((team) => (
                                        <tr key={team._id} className={team.tableNumber ? "bg-gray-800" : "bg-gray-800/60"}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-white">{team.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-300">
                                                    {team.members.length} / {team.maxSize} members
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-300">{getCategoryLabel(team.category)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {team.status === 'approved' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Approved
                                                    </span>
                                                ) : team.status === 'rejected' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Rejected
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {team.tableNumber ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        <FaMapMarkerAlt className="mr-1" />
                                                        {team.tableNumber}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">Not assigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTeam(team);
                                                            setTableNumber(team.tableNumber || '');
                                                            setTableMap(team.tableMap || '');
                                                            setShowAssignModal(true);
                                                        }}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded"
                                                        title="Assign Table"
                                                    >
                                                        <FaMapMarkerAlt />
                                                    </button>
                                                    {team.tableNumber && (
                                                        <button
                                                            onClick={() => removeTableAssignment(team._id)}
                                                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                                                            title="Remove Table Assignment"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Assign Table Modal */}
            {showAssignModal && selectedTeam && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Assign Table to {selectedTeam.name}</h3>

                        <form onSubmit={assignTable}>
                            <div className="mb-4">
                                <label htmlFor="tableNumber" className="block text-gray-300 mb-2">
                                    Table Number*
                                </label>
                                <input
                                    id="tableNumber"
                                    type="text"
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., A1, T23, etc."
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="tableMap" className="block text-gray-300 mb-2">
                                    Map/Directions (Optional)
                                </label>
                                <textarea
                                    id="tableMap"
                                    value={tableMap}
                                    onChange={(e) => setTableMap(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Directions to find this table, e.g., 'In the main hall, near the entrance'"
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Assign Table
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Assign Modal */}
            {showBulkAssignModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Bulk Assign Tables</h3>

                        {!confirmBulkAssign ? (
                            <>
                                <div className="mb-4">
                                    <label htmlFor="bulkAssignmentMethod" className="block text-gray-300 mb-2">
                                        Assignment Method
                                    </label>
                                    <select
                                        id="bulkAssignmentMethod"
                                        value={bulkAssignmentMethod}
                                        onChange={(e) => setBulkAssignmentMethod(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="sequential">Sequential Assignment</option>
                                        <option value="random">Random Assignment</option>
                                    </select>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {bulkAssignmentMethod === 'sequential'
                                            ? 'Teams will be assigned tables in order.'
                                            : 'Teams will be randomly assigned to tables.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="tablePrefix" className="block text-gray-300 mb-2">
                                            Table Prefix
                                        </label>
                                        <input
                                            id="tablePrefix"
                                            type="text"
                                            value={tablePrefix}
                                            onChange={(e) => setTablePrefix(e.target.value)}
                                            className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g., T, Table, etc."
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="startingTable" className="block text-gray-300 mb-2">
                                            Starting Number
                                        </label>
                                        <input
                                            id="startingTable"
                                            type="number"
                                            value={startingTable}
                                            onChange={(e) => setStartingTable(e.target.value)}
                                            className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            min="1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-300 mb-2">
                                            Teams to Assign
                                        </label>
                                        <div className="bg-gray-700 rounded-md py-2 px-3 text-white">
                                            {filteredTeams.filter(team => team.status === 'approved').length} teams
                                        </div>
                                    </div>
                                </div>

                                <p className="text-yellow-500 mb-4">
                                    <FaMapMarkerAlt className="inline mr-2" />
                                    This will assign tables only to approved teams in your current filtered view.
                                </p>

                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkAssignModal(false)}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmBulkAssign(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                                        disabled={filteredTeams.filter(team => team.status === 'approved').length === 0}
                                    >
                                        Preview Assignment
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="mb-4">
                                    Review the table assignments below. This will affect {bulkAssignPreview.length} teams.
                                    Any existing table assignments for these teams will be overwritten.
                                </p>

                                <div className="bg-gray-900 rounded-md p-3 mb-4 max-h-60 overflow-y-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Team
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Table
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {bulkAssignPreview.map((preview, index) => (
                                                <tr key={index} className={index % 2 === 0 ? "bg-gray-800/30" : ""}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                                                        {preview.teamName}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white font-mono">
                                                        {preview.tableNumber}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex justify-end space-x-4 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmBulkAssign(false)}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={executeBulkAssignment}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center"
                                    >
                                        <FaSave className="mr-2" /> Confirm & Save
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}