// src/app/dashboard/admin/judging/[id]/results/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import {
    FaArrowLeft, FaTrophy, FaMedal, FaRegStar, FaStar,
    FaDownload, FaSearch, FaSort, FaChartBar,
    FaExclamationTriangle, FaLock, FaUnlock, FaUserFriends,
    FaList, FaTh, FaMapMarkerAlt, FaTimes
} from 'react-icons/fa';

interface JudgingEvent {
    _id: string;
    name: string;
    type: 'demo_participants' | 'demo_judges' | 'pitching';
    status: 'setup' | 'active' | 'completed';
}

interface Team {
    _id: string;
    name: string;
    description?: string;
    category: string;
    tableNumber?: string;
    score: number;
    confidence: number;
    timesJudged: number;
}

interface JudgingResult {
    _id: string;
    team: {
        _id: string;
        name: string;
    };
    judge: {
        _id: string;
        name: string;
        type: string;
    };
    scores: Record<string, number>;
    overallScore: number;
    comments: string;
    timestamp: string;
}

interface JudgingCriteria {
    _id: string;
    name: string;
    description: string;
    weight: number;
    minScore: number;
    maxScore: number;
}

export default function JudgingResults() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<JudgingEvent | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [results, setResults] = useState<JudgingResult[]>([]);
    const [criteria, setCriteria] = useState<JudgingCriteria[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<'score' | 'name' | 'timesJudged'>('score');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [resultsPublished, setResultsPublished] = useState(false);

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
                fetchResults();
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
                setResultsPublished(data.event.resultsPublished || false);
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
            const response = await fetch(`/api/judging/results/teams?eventId=${eventId}`);
            const data = await response.json();

            if (response.ok) {
                setTeams(data.teams || []);
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

    const fetchResults = async () => {
        try {
            const response = await fetch(`/api/judging/results?eventId=${eventId}`);
            const data = await response.json();

            if (response.ok) {
                setResults(data.results || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch judging results');
            console.error(err);
        }
    };

    const fetchCriteria = async () => {
        try {
            const response = await fetch(`/api/judging/criteria?eventId=${eventId}`);
            const data = await response.json();

            if (response.ok) {
                setCriteria(data.criteria || []);
            } else {
                console.error('Failed to fetch criteria:', data.message);
            }
        } catch (err) {
            console.error('Error fetching criteria:', err);
        }
    };

    const toggleResultsPublished = async () => {
        try {
            setError('');
            setSuccess('');

            const newState = !resultsPublished;

            const response = await fetch(`/api/judging/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resultsPublished: newState
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setResultsPublished(newState);
                setSuccess(`Results are now ${newState ? 'published' : 'hidden'} to team members`);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to update publishing status');
            console.error(err);
        }
    };

    const downloadResults = () => {
        // Create CSV content
        const headers = ['Team Name', 'Category', 'Table Number', 'Score', 'Times Judged'];
        const rows = teams
            .filter(team => {
                if (searchTerm === '') return true;
                return team.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => {
                if (sortField === 'score') {
                    return sortDirection === 'desc' ? b.score - a.score : a.score - b.score;
                } else if (sortField === 'name') {
                    return sortDirection === 'desc'
                        ? b.name.localeCompare(a.name)
                        : a.name.localeCompare(b.name);
                } else {
                    return sortDirection === 'desc'
                        ? b.timesJudged - a.timesJudged
                        : a.timesJudged - b.timesJudged;
                }
            })
            .map(team => [
                team.name,
                team.category,
                team.tableNumber || 'N/A',
                team.score.toFixed(2),
                team.timesJudged.toString()
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
        link.setAttribute('download', `${event?.name.replace(/\s+/g, '_')}_results.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSort = (field: 'score' | 'name' | 'timesJudged') => {
        if (sortField === field) {
            // Toggle direction if same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new field and default to descending for score, ascending for name
            setSortField(field);
            setSortDirection(field === 'name' ? 'asc' : 'desc');
        }
    };

    const filteredAndSortedTeams = () => {
        return teams
            .filter(team => {
                if (searchTerm === '') return true;
                return team.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => {
                if (sortField === 'score') {
                    return sortDirection === 'desc' ? b.score - a.score : a.score - b.score;
                } else if (sortField === 'name') {
                    return sortDirection === 'desc'
                        ? b.name.localeCompare(a.name)
                        : a.name.localeCompare(b.name);
                } else {
                    return sortDirection === 'desc'
                        ? b.timesJudged - a.timesJudged
                        : a.timesJudged - b.timesJudged;
                }
            });
    };

    const teamResults = (teamId: string) => {
        return results.filter(result => result.team._id === teamId);
    };

    const getTeamById = (teamId: string) => {
        return teams.find(team => team._id === teamId);
    };

    const getLabelForCategory = (category: string) => {
        const categories: Record<string, string> = {
            web: 'Web Development',
            mobile: 'Mobile App',
            ai: 'AI/ML',
            data: 'Data Science',
            game: 'Game Development',
            iot: 'IoT',
            other: 'Other'
        };
        return categories[category] || category;
    };

    const renderStars = (score: number, outOf: number = 10) => {
        const normalizedScore = (score / outOf) * 5; // Convert to 5-star scale
        const fullStars = Math.floor(normalizedScore);
        const halfStar = normalizedScore - fullStars >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        return (
            <div className="flex">
                {[...Array(fullStars)].map((_, i) => (
                    <FaStar key={`full-${i}`} className="text-yellow-400" />
                ))}
                {halfStar && <FaRegStar className="text-yellow-400" />}
                {[...Array(emptyStars)].map((_, i) => (
                    <FaRegStar key={`empty-${i}`} className="text-gray-500" />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p>Loading results...</p>
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
                    <h1 className="text-2xl font-bold">Judging Results</h1>
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

                {/* Event Status Warning */}
                {event?.status !== 'completed' && (
                    <div className="bg-yellow-900 bg-opacity-50 text-yellow-200 p-4 rounded-md mb-6 flex items-start">
                        <FaExclamationTriangle className="text-yellow-400 mr-3 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold">Judging Still in Progress</h3>
                            <p>
                                This event is still {event?.status === 'setup' ? 'in setup' : 'active'}. Results shown here are preliminary and may change as more judging occurs.
                            </p>
                        </div>
                    </div>
                )}

                {/* Controls & Filters */}
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search teams by name"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => handleSort('score')}
                                className={`px-4 py-2 rounded-md transition flex items-center ${sortField === 'score'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-700 text-gray-300'
                                    }`}
                            >
                                <FaSort className="mr-2" />
                                Score {sortField === 'score' && (sortDirection === 'desc' ? '↓' : '↑')}
                            </button>

                            <button
                                onClick={() => handleSort('name')}
                                className={`px-4 py-2 rounded-md transition flex items-center ${sortField === 'name'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-700 text-gray-300'
                                    }`}
                            >
                                <FaSort className="mr-2" />
                                Name {sortField === 'name' && (sortDirection === 'desc' ? '↓' : '↑')}
                            </button>

                            <button
                                onClick={() => handleSort('timesJudged')}
                                className={`px-4 py-2 rounded-md transition flex items-center ${sortField === 'timesJudged'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-700 text-gray-300'
                                    }`}
                            >
                                <FaSort className="mr-2" />
                                Judges {sortField === 'timesJudged' && (sortDirection === 'desc' ? '↓' : '↑')}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={downloadResults}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center"
                        >
                            <FaDownload className="mr-2" /> Export Results
                        </button>

                        <button
                            onClick={toggleResultsPublished}
                            className={`${resultsPublished
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                                } text-white px-4 py-2 rounded-md transition flex items-center`}
                        >
                            {resultsPublished ? (
                                <>
                                    <FaLock className="mr-2" /> Hide Results from Teams
                                </>
                            ) : (
                                <>
                                    <FaUnlock className="mr-2" /> Publish Results to Teams
                                </>
                            )}
                        </button>

                        <div className="flex ml-auto bg-gray-700 rounded-md overflow-hidden">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-gray-600' : ''}`}
                                title="List View"
                            >
                                <FaList />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-gray-600' : ''}`}
                                title="Grid View"
                            >
                                <FaTh />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Display */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Teams List */}
                    <div className={viewMode === 'list' ? 'lg:col-span-3' : 'lg:col-span-2'}>
                        {viewMode === 'list' ? (
                            <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead className="bg-gray-900">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Rank
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Team
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Score
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Times Judged
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Table
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Details
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                                        {filteredAndSortedTeams().length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                                                    No teams found matching your search
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAndSortedTeams().map((team, index) => (
                                                <tr
                                                    key={team._id}
                                                    className={`${selectedTeam === team._id ? 'bg-indigo-900 bg-opacity-30' : ''
                                                        } hover:bg-gray-700 cursor-pointer transition`}
                                                    onClick={() => setSelectedTeam(selectedTeam === team._id ? null : team._id)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-center">
                                                            {index === 0 && (
                                                                <FaTrophy className="text-2xl text-yellow-400 mx-auto" title="1st Place" />
                                                            )}
                                                            {index === 1 && (
                                                                <FaMedal className="text-2xl text-gray-400 mx-auto" title="2nd Place" />
                                                            )}
                                                            {index === 2 && (
                                                                <FaMedal className="text-2xl text-yellow-700 mx-auto" title="3rd Place" />
                                                            )}
                                                            {index > 2 && (
                                                                <span className="text-gray-400 text-sm">{index + 1}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-white">{team.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-300">{getLabelForCategory(team.category)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span className="text-lg font-semibold text-white mr-2">
                                                                {team.score.toFixed(1)}
                                                            </span>
                                                            <div className="text-sm text-gray-500">/10</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FaUserFriends className="text-gray-500 mr-2" />
                                                            <span className="text-white">{team.timesJudged}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {team.tableNumber ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                <FaMapMarkerAlt className="mr-1" />
                                                                {team.tableNumber}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTeam(selectedTeam === team._id ? null : team._id);
                                                            }}
                                                            className="text-indigo-400 hover:text-indigo-300"
                                                        >
                                                            <FaChartBar />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredAndSortedTeams().length === 0 ? (
                                    <div className="md:col-span-2 xl:col-span-3 text-center text-gray-400 p-8 bg-gray-800 rounded-lg">
                                        No teams found matching your search
                                    </div>
                                ) : (
                                    filteredAndSortedTeams().map((team, index) => (
                                        <div
                                            key={team._id}
                                            className={`${selectedTeam === team._id ? 'ring-2 ring-indigo-500' : ''
                                                } bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:bg-gray-700 transition`}
                                            onClick={() => setSelectedTeam(selectedTeam === team._id ? null : team._id)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold">{team.name}</h3>
                                                {index < 3 && (
                                                    <div className="flex flex-shrink-0">
                                                        {index === 0 && <FaTrophy className="text-yellow-400" title="1st Place" />}
                                                        {index === 1 && <FaMedal className="text-gray-400" title="2nd Place" />}
                                                        {index === 2 && <FaMedal className="text-yellow-700" title="3rd Place" />}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center mb-3">
                                                <div className="text-xs bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded">
                                                    {getLabelForCategory(team.category)}
                                                </div>
                                                {team.tableNumber && (
                                                    <div className="ml-2 text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded flex items-center">
                                                        <FaMapMarkerAlt className="mr-1" />
                                                        {team.tableNumber}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="text-xs text-gray-400 mb-1">Score</div>
                                                    <div className="flex items-center">
                                                        <span className="text-xl font-bold text-white mr-1">
                                                            {team.score.toFixed(1)}
                                                        </span>
                                                        <span className="text-xs text-gray-400">/10</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-400 mb-1">Times Judged</div>
                                                    <div className="flex items-center justify-center">
                                                        <FaUserFriends className="text-gray-500 mr-1" />
                                                        <span className="text-white">{team.timesJudged}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTeam(selectedTeam === team._id ? null : team._id);
                                                    }}
                                                    className="bg-indigo-900 hover:bg-indigo-800 text-white p-2 rounded-full"
                                                >
                                                    <FaChartBar />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Team Detail Panel (Grid view only) */}
                    {viewMode === 'grid' && selectedTeam && (
                        <div className="lg:col-span-1">
                            <div className="bg-gray-800 rounded-lg shadow-md p-6 sticky top-6">
                                {selectedTeam && (
                                    <>
                                        <div className="flex justify-between items-start mb-4">
                                            <h2 className="text-xl font-semibold">{getTeamById(selectedTeam)?.name}</h2>
                                            <button
                                                onClick={() => setSelectedTeam(null)}
                                                className="text-gray-400 hover:text-white"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-gray-700 p-3 rounded-md">
                                                <div className="text-sm text-gray-400 mb-1">Score</div>
                                                <div className="flex items-center">
                                                    <span className="text-2xl font-bold text-white mr-2">
                                                        {getTeamById(selectedTeam)?.score.toFixed(1)}
                                                    </span>
                                                    <span className="text-sm text-gray-400">/10</span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-700 p-3 rounded-md">
                                                <div className="text-sm text-gray-400 mb-1">Times Judged</div>
                                                <div className="flex items-center">
                                                    <FaUserFriends className="text-gray-500 mr-2" />
                                                    <span className="text-2xl font-bold text-white">
                                                        {getTeamById(selectedTeam)?.timesJudged}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h3 className="font-semibold mb-2">Judging History</h3>

                                            {teamResults(selectedTeam).length === 0 ? (
                                                <div className="bg-gray-700 p-3 rounded-md text-gray-400 text-center">
                                                    No judging results available
                                                </div>
                                            ) : (
                                                <div className="bg-gray-700 p-3 rounded-md max-h-96 overflow-y-auto">
                                                    <div className="space-y-4">
                                                        {teamResults(selectedTeam).map((result) => (
                                                            <div key={result._id} className="bg-gray-800 p-3 rounded-md">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <div className="font-medium">{result.judge.name}</div>
                                                                        <div className="text-xs text-gray-400">
                                                                            {result.judge.type === 'external' ? 'External Judge' : 'Participant Judge'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-xs font-semibold">
                                                                        {result.overallScore.toFixed(1)}/10
                                                                    </div>
                                                                </div>

                                                                {Object.keys(result.scores).length > 0 && (
                                                                    <div className="mt-2 space-y-2">
                                                                        {Object.entries(result.scores).map(([criterionId, score]) => {
                                                                            const criterion = criteria.find(c => c._id === criterionId);
                                                                            return criterion ? (
                                                                                <div key={criterionId} className="flex justify-between items-center text-sm">
                                                                                    <span className="text-gray-400">{criterion.name}</span>
                                                                                    <span>{score}/{criterion.maxScore}</span>
                                                                                </div>
                                                                            ) : null;
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {result.comments && (
                                                                    <div className="mt-2 pt-2 border-t border-gray-700">
                                                                        <div className="text-xs text-gray-400 mb-1">Comments:</div>
                                                                        <p className="text-sm text-gray-300">{result.comments}</p>
                                                                    </div>
                                                                )}

                                                                <div className="mt-2 text-xs text-gray-500">
                                                                    {new Date(result.timestamp).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {!selectedTeam && (
                                    <div className="text-center text-gray-400 p-6">
                                        <FaChartBar className="text-5xl mx-auto mb-4 text-gray-600" />
                                        <p>Select a team to see detailed results</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Team Detail Modal (List view only) */}
                {viewMode === 'list' && selectedTeam && (
                    <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold">{getTeamById(selectedTeam)?.name} Details</h2>
                                <button
                                    onClick={() => setSelectedTeam(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-700 p-4 rounded-md">
                                    <div className="text-sm text-gray-400 mb-1">Overall Score</div>
                                    <div className="flex items-center">
                                        <span className="text-3xl font-bold text-white mr-2">
                                            {getTeamById(selectedTeam)?.score.toFixed(1)}
                                        </span>
                                        <span className="text-sm text-gray-400">/10</span>
                                    </div>
                                </div>

                                <div className="bg-gray-700 p-4 rounded-md">
                                    <div className="text-sm text-gray-400 mb-1">Category</div>
                                    <div className="text-lg">
                                        {getLabelForCategory(getTeamById(selectedTeam)?.category || '')}
                                    </div>
                                </div>

                                <div className="bg-gray-700 p-4 rounded-md">
                                    <div className="text-sm text-gray-400 mb-1">Times Judged</div>
                                    <div className="flex items-center">
                                        <FaUserFriends className="text-gray-500 mr-2" />
                                        <span className="text-3xl font-bold text-white">
                                            {getTeamById(selectedTeam)?.timesJudged}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <h3 className="font-semibold mb-3">Individual Judging Results</h3>

                            {teamResults(selectedTeam).length === 0 ? (
                                <div className="bg-gray-700 p-6 rounded-md text-gray-400 text-center">
                                    No judging results available for this team
                                </div>
                            ) : (
                                <div className="bg-gray-700 p-4 rounded-md">
                                    <div className="overflow-y-auto max-h-96">
                                        <table className="min-w-full divide-y divide-gray-600">
                                            <thead className="bg-gray-800">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Judge</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-600">
                                                {teamResults(selectedTeam).map((result) => (
                                                    <tr key={result._id} className="hover:bg-gray-800">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="font-medium">{result.judge.name}</div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-sm">
                                                                {result.judge.type === 'external' ? 'External Judge' : 'Participant Judge'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-sm font-semibold bg-gray-800 px-2 py-1 rounded inline-block">
                                                                {result.overallScore.toFixed(1)}/10
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                                                            {new Date(result.timestamp).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}