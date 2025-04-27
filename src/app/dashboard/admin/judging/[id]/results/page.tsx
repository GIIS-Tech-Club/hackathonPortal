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
    resultsPublished: boolean;
}

interface TeamResult {
    team: {
        _id: string;
        name: string;
        tableNumber?: string;
    };
    score: number;
    rank: number;
    timesJudged: number;
    confidence: number;
    totalTeams: number;
    category?: string;
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
    const [teamResults, setTeamResults] = useState<TeamResult[]>([]);
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

            if (response.ok && data.results) {
                // Format the data according to our interface
                const formattedResults: TeamResult[] = data.results.map((result: any) => ({
                    team: result.team,
                    score: result.score,
                    rank: result.rank,
                    timesJudged: result.timesJudged,
                    confidence: result.confidence,
                    totalTeams: result.totalTeams,
                    category: result.category || 'other' // Default to 'other' if category is missing
                }));

                setTeamResults(formattedResults);
            } else {
                setError(data.message || 'Failed to fetch teams');
            }
        } catch (err) {
            setError('Failed to fetch teams');
            console.error(err);
        } finally {
            setLoading(false);
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
        const headers = ['Rank', 'Team Name', 'Table Number', 'Score', 'Times Judged'];
        const rows = filteredAndSortedTeams()
            .map(result => [
                result.rank.toString(),
                result.team.name,
                result.team.tableNumber || 'N/A',
                result.score.toFixed(2),
                result.timesJudged.toString()
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
        return teamResults
            .filter(result => {
                if (searchTerm === '') return true;
                return result.team.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => {
                if (sortField === 'score') {
                    return sortDirection === 'desc' ? b.score - a.score : a.score - b.score;
                } else if (sortField === 'name') {
                    return sortDirection === 'desc'
                        ? b.team.name.localeCompare(a.team.name)
                        : a.team.name.localeCompare(b.team.name);
                } else {
                    return sortDirection === 'desc'
                        ? b.timesJudged - a.timesJudged
                        : a.timesJudged - b.timesJudged;
                }
            });
    };

    const getTeamById = (teamId: string) => {
        return teamResults.find(result => result.team._id === teamId);
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
                                                <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                                                    No teams found matching your search
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAndSortedTeams().map((result) => (
                                                <tr
                                                    key={result.team._id}
                                                    className={`${selectedTeam === result.team._id ? 'bg-indigo-900 bg-opacity-30' : ''
                                                        } hover:bg-gray-700 cursor-pointer transition`}
                                                    onClick={() => setSelectedTeam(selectedTeam === result.team._id ? null : result.team._id)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-center">
                                                            {result.rank === 1 && (
                                                                <FaTrophy className="text-2xl text-yellow-400 mx-auto" title="1st Place" />
                                                            )}
                                                            {result.rank === 2 && (
                                                                <FaMedal className="text-2xl text-gray-400 mx-auto" title="2nd Place" />
                                                            )}
                                                            {result.rank === 3 && (
                                                                <FaMedal className="text-2xl text-yellow-700 mx-auto" title="3rd Place" />
                                                            )}
                                                            {result.rank > 3 && (
                                                                <span className="text-gray-400 text-sm">{result.rank}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-white">{result.team.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span className="text-lg font-semibold text-white mr-2">
                                                                {result.score.toFixed(1)}
                                                            </span>
                                                            <div className="text-sm text-gray-500">/10</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FaUserFriends className="text-gray-500 mr-2" />
                                                            <span className="text-white">{result.timesJudged}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {result.team.tableNumber ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                <FaMapMarkerAlt className="mr-1" />
                                                                {result.team.tableNumber}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTeam(selectedTeam === result.team._id ? null : result.team._id);
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
                                    filteredAndSortedTeams().map((result) => (
                                        <div
                                            key={result.team._id}
                                            className={`${selectedTeam === result.team._id ? 'ring-2 ring-indigo-500' : ''
                                                } bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:bg-gray-700 transition`}
                                            onClick={() => setSelectedTeam(selectedTeam === result.team._id ? null : result.team._id)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold">{result.team.name}</h3>
                                                <div className="flex flex-shrink-0">
                                                    {result.rank === 1 && <FaTrophy className="text-yellow-400" title="1st Place" />}
                                                    {result.rank === 2 && <FaMedal className="text-gray-400" title="2nd Place" />}
                                                    {result.rank === 3 && <FaMedal className="text-yellow-700" title="3rd Place" />}
                                                    {result.rank > 3 && (
                                                        <span className="text-xs bg-gray-700 px-2 py-1 rounded">#{result.rank}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center mb-3">
                                                {result.team.tableNumber && (
                                                    <div className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded flex items-center">
                                                        <FaMapMarkerAlt className="mr-1" />
                                                        {result.team.tableNumber}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="text-xs text-gray-400 mb-1">Score</div>
                                                    <div className="flex items-center">
                                                        <span className="text-xl font-bold text-white mr-1">
                                                            {result.score.toFixed(1)}
                                                        </span>
                                                        <span className="text-xs text-gray-400">/10</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-400 mb-1">Times Judged</div>
                                                    <div className="flex items-center justify-center">
                                                        <FaUserFriends className="text-gray-500 mr-1" />
                                                        <span className="text-white">{result.timesJudged}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTeam(selectedTeam === result.team._id ? null : result.team._id);
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
                                            <h2 className="text-xl font-semibold">{getTeamById(selectedTeam)?.team.name}</h2>
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
                                                <div className="text-sm text-gray-400 mb-1">Rank</div>
                                                <div className="flex items-center">
                                                    {getTeamById(selectedTeam)?.rank === 1 && <FaTrophy className="text-yellow-400 mr-2" />}
                                                    {getTeamById(selectedTeam)?.rank === 2 && <FaMedal className="text-gray-400 mr-2" />}
                                                    {getTeamById(selectedTeam)?.rank === 3 && <FaMedal className="text-yellow-700 mr-2" />}
                                                    <span className="text-2xl font-bold text-white">
                                                        #{getTeamById(selectedTeam)?.rank}
                                                    </span>
                                                    <span className="text-sm text-gray-400 ml-1">
                                                        of {getTeamById(selectedTeam)?.totalTeams}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-gray-700 p-3 rounded-md">
                                                <div className="text-sm text-gray-400 mb-1">Times Judged</div>
                                                <div className="flex items-center">
                                                    <FaUserFriends className="text-gray-500 mr-2" />
                                                    <span className="text-2xl font-bold text-white">
                                                        {getTeamById(selectedTeam)?.timesJudged}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-700 p-3 rounded-md">
                                                <div className="text-sm text-gray-400 mb-1">Table Number</div>
                                                <div className="flex items-center">
                                                    {getTeamById(selectedTeam)?.team.tableNumber ? (
                                                        <>
                                                            <FaMapMarkerAlt className="text-blue-400 mr-2" />
                                                            <span className="text-xl font-bold text-white">
                                                                {getTeamById(selectedTeam)?.team.tableNumber}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">Not assigned</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <div className="text-sm text-gray-400 mb-2">Rating</div>
                                            <div className="flex items-center">
                                                {renderStars(getTeamById(selectedTeam)?.score || 0)}
                                            </div>
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
                                <h2 className="text-xl font-semibold">{getTeamById(selectedTeam)?.team.name} Details</h2>
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
                                    <div className="mt-2">
                                        {renderStars(getTeamById(selectedTeam)?.score || 0)}
                                    </div>
                                </div>

                                <div className="bg-gray-700 p-4 rounded-md">
                                    <div className="text-sm text-gray-400 mb-1">Rank</div>
                                    <div className="flex items-center">
                                        {getTeamById(selectedTeam)?.rank === 1 && <FaTrophy className="text-yellow-400 mr-2 text-xl" />}
                                        {getTeamById(selectedTeam)?.rank === 2 && <FaMedal className="text-gray-400 mr-2 text-xl" />}
                                        {getTeamById(selectedTeam)?.rank === 3 && <FaMedal className="text-yellow-700 mr-2 text-xl" />}
                                        <span className="text-3xl font-bold text-white">
                                            #{getTeamById(selectedTeam)?.rank}
                                        </span>
                                        <span className="text-sm text-gray-400 ml-1">
                                            of {getTeamById(selectedTeam)?.totalTeams}
                                        </span>
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

                            <div className="bg-gray-700 p-4 rounded-md mb-4">
                                <div className="text-sm text-gray-400 mb-1">Table Number</div>
                                <div className="flex items-center">
                                    {getTeamById(selectedTeam)?.team.tableNumber ? (
                                        <>
                                            <FaMapMarkerAlt className="text-blue-400 mr-2" />
                                            <span className="text-xl font-bold text-white">
                                                {getTeamById(selectedTeam)?.team.tableNumber}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-gray-400">Not assigned</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={() => setSelectedTeam(null)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}