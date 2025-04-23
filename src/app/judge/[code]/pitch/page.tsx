"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    FaUser, FaTrophy, FaSave, FaStar, FaStarHalfAlt,
    FaRegStar, FaInfoCircle, FaTimes, FaClipboard,
    FaCheck, FaHistory, FaSignOutAlt, FaFolderOpen,
    FaMapMarkerAlt
} from 'react-icons/fa';

interface Judge {
    _id: string;
    name: string;
    email: string;
    type: 'participant' | 'external';
    accessCode: string;
    assignedRoom?: string;
    event: {
        _id: string;
        name: string;
        type: string;
        status: string;
    };
}

interface Team {
    _id: string;
    name: string;
    tableNumber?: string;
    description?: string;
    members: Array<{
        _id: string;
        name: string;
        email: string;
    }>;
    maxSize: number;
    category: string;
    status: 'pending' | 'approved' | 'rejected';
    seatLocation?: string;
}

interface JudgingCriteria {
    _id: string;
    name: string;
    description: string;
    weight: number;
    minScore: number;
    maxScore: number;
}

interface JudgingResult {
    _id: string;
    team: {
        _id: string;
        name: string;
    };
    scores: Record<string, number>;
    overallScore: number;
    comments: string;
    timestamp: string;
}

export default function PitchingJudgeInterface() {
    const router = useRouter();
    const params = useParams();
    const accessCode = params.code as string;

    const [loading, setLoading] = useState(true);
    const [judge, setJudge] = useState<Judge | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [criteria, setCriteria] = useState<JudgingCriteria[]>([]);
    const [results, setResults] = useState<JudgingResult[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    // Form states
    const [teamCode, setTeamCode] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (accessCode) {
            fetchJudgeInfo();
        }
    }, [accessCode]);

    const fetchJudgeInfo = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/judging/auth/${accessCode}`);
            const data = await response.json();

            if (response.ok) {
                setJudge(data.judge);
                fetchCriteria(data.judge.event._id);
                fetchTeams();
                fetchPreviousResults(data.judge._id, data.judge.event._id);
            } else {
                setError(data.message || 'Invalid access code');
            }
        } catch (err) {
            setError('Failed to authenticate judge');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCriteria = async (eventId: string) => {
        try {
            const response = await fetch(`/api/judging/criteria?eventId=${eventId}`);
            const data = await response.json();

            if (response.ok) {
                setCriteria(data.criteria || []);

                // Initialize scores
                const initialScores: Record<string, number> = {};
                data.criteria.forEach((criterion: JudgingCriteria) => {
                    initialScores[criterion._id] = Math.floor((criterion.minScore + criterion.maxScore) / 2);
                });
                setScores(initialScores);
            } else {
                console.error('Failed to fetch criteria:', data.message);
            }
        } catch (err) {
            console.error('Error fetching criteria:', err);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await fetch('/api/teams');
            const data = await response.json();

            if (response.ok) {
                // Filter to approved teams only
                const approvedTeams = data.teams.filter((team: Team) => team.status === 'approved');
                setTeams(approvedTeams || []);
            } else {
                console.error('Failed to fetch teams:', data.message);
            }
        } catch (err) {
            console.error('Error fetching teams:', err);
        }
    };

    const fetchPreviousResults = async (judgeId: string, eventId: string) => {
        try {
            const response = await fetch(`/api/judging/results?judgeId=${judgeId}&eventId=${eventId}`);
            const data = await response.json();

            if (response.ok) {
                setResults(data.results || []);
            } else {
                console.error('Failed to fetch results:', data.message);
            }
        } catch (err) {
            console.error('Error fetching results:', err);
        }
    };

    const findTeamByCode = () => {
        // Try matching by table number first
        let team = teams.find(t =>
            t.tableNumber && t.tableNumber.toLowerCase() === teamCode.toLowerCase()
        );

        // If not found, try partial name match
        if (!team) {
            team = teams.find(t =>
                t.name.toLowerCase().includes(teamCode.toLowerCase())
            );
        }

        if (team) {
            setSelectedTeam(team);
            setTeamCode('');

            // Check if we already judged this team
            const previousResult = results.find(r => r.team._id === team?._id);
            if (previousResult) {
                setScores(previousResult.scores);
                setComments(previousResult.comments);
                setSuccess('This team has already been judged. You can modify your scores if needed.');
            } else {
                // Reset form for new team
                const initialScores: Record<string, number> = {};
                criteria.forEach(criterion => {
                    initialScores[criterion._id] = Math.floor((criterion.minScore + criterion.maxScore) / 2);
                });
                setScores(initialScores);
                setComments('');
            }
        } else {
            setError('No team found with that code or name');
        }
    };

    const handleScoreChange = (criterionId: string, newScore: number) => {
        // Find the criterion to check min/max values
        const criterion = criteria.find(c => c._id === criterionId);
        if (!criterion) return;

        // Ensure score is within valid range
        if (newScore < criterion.minScore) newScore = criterion.minScore;
        if (newScore > criterion.maxScore) newScore = criterion.maxScore;

        setScores(prev => ({
            ...prev,
            [criterionId]: newScore
        }));
    };

    const submitScores = async () => {
        if (!judge || !selectedTeam) return;

        try {
            setSubmitting(true);
            setError('');
            setSuccess('');

            // Check if all criteria have scores
            const hasAllScores = criteria.every(criterion =>
                scores[criterion._id] !== undefined
            );

            if (!hasAllScores) {
                setError('Please provide scores for all criteria');
                return;
            }

            // Calculate overall score (weighted average)
            const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
            const weightedSum = criteria.reduce((sum, criterion) => {
                const score = scores[criterion._id] || 0;
                return sum + (score * criterion.weight);
            }, 0);

            const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

            // Create a new assignment for this judging session
            const assignmentResponse = await fetch('/api/judging/assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    judgeId: judge._id,
                    teamId: selectedTeam._id,
                    eventId: judge.event._id
                }),
            });

            if (!assignmentResponse.ok) {
                const data = await assignmentResponse.json();
                throw new Error(data.message || 'Failed to create assignment');
            }

            const assignmentData = await assignmentResponse.json();

            // Submit the results
            const resultResponse = await fetch('/api/judging/results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assignmentId: assignmentData.assignment._id,
                    scores,
                    comments,
                }),
            });

            const resultData = await resultResponse.json();

            if (resultResponse.ok) {
                setSuccess(`Scores for ${selectedTeam.name} submitted successfully`);

                // Update results list with the new submission
                fetchPreviousResults(judge._id, judge.event._id);

                // Clear form
                setSelectedTeam(null);
            } else {
                setError(resultData.message);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to submit scores');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStarRating = (criterionId: string, minScore: number, maxScore: number) => {
        const currentScore = scores[criterionId] || minScore;
        const totalStars = maxScore - minScore + 1;
        const stars = [];

        for (let i = minScore; i <= maxScore; i++) {
            const isFilled = i <= currentScore;
            stars.push(
                <button
                    key={i}
                    onClick={() => handleScoreChange(criterionId, i)}
                    className={`text-xl focus:outline-none ${isFilled ? 'text-yellow-400' : 'text-gray-500'}`}
                >
                    {isFilled ? <FaStar /> : <FaRegStar />}
                </button>
            );
        }

        return (
            <div className="flex space-x-1">
                {stars}
                <span className="ml-2 text-white">{currentScore}/{maxScore}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p>Loading judging interface...</p>
                </div>
            </div>
        );
    }

    if (error === 'Invalid access code' || !judge) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                    <FaTimes className="text-red-500 text-5xl mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">Invalid Access Code</h1>
                    <p className="text-gray-300 mb-6">
                        The judging access code you provided is invalid or has expired.
                    </p>
                    <p className="text-gray-400 text-sm">
                        Please check your code and try again, or contact an event organizer for assistance.
                    </p>
                </div>
            </div>
        );
    }

    if (judge.event.status !== 'active') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                    <FaTimes className="text-yellow-500 text-5xl mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">Judging Not Active</h1>
                    <p className="text-gray-300 mb-6">
                        The judging event {judge.event.name} is currently not active.
                    </p>
                    <p className="text-gray-400 text-sm">
                        {judge.event.status === 'setup'
                            ? 'Judging has not started yet. Please check back later.'
                            : 'Judging has been completed. Thank you for your participation!'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-indigo-900 shadow-lg">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <FaTrophy className="text-2xl mr-2 text-yellow-400" />
                        <h1 className="text-xl font-bold">Pitch Judging</h1>
                    </div>
                    <div className="flex items-center">
                        <div className="mr-4 text-right">
                            <p className="text-sm text-indigo-200">
                                {judge.assignedRoom ? `Room: ${judge.assignedRoom}` : ''}
                            </p>
                            <p className="font-semibold flex items-center">
                                <FaUser className="mr-1" /> {judge.name}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowInstructions(!showInstructions)}
                            className="bg-indigo-700 hover:bg-indigo-600 p-2 rounded-full"
                            title="Instructions"
                        >
                            <FaInfoCircle />
                        </button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6">
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

                {/* Instructions Panel */}
                {showInstructions && (
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-semibold">Judging Instructions</h2>
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-300">
                                Welcome to the pitch judging interface! Here's how to judge teams:
                            </p>

                            <ol className="list-decimal ml-6 space-y-2 text-gray-300">
                                <li>Enter the team's name or table number in the search box</li>
                                <li>Rate the team on each of the criteria using the star rating system</li>
                                <li>Add any comments or feedback for the team (optional)</li>
                                <li>Submit your scores</li>
                                <li>You can view your judging history by clicking the "View History" button</li>
                            </ol>

                            {judge.assignedRoom && (
                                <div className="bg-indigo-900 bg-opacity-50 p-3 rounded-md">
                                    <p><strong>Your Assigned Room:</strong> {judge.assignedRoom}</p>
                                    <p className="text-sm text-gray-400">
                                        Please only judge teams that present in your assigned room.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Team Selection Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 rounded-lg shadow-lg p-6 h-full">
                            <h2 className="text-xl font-semibold mb-4">Team Selection</h2>

                            <div className="mb-4">
                                <label htmlFor="teamCode" className="block text-gray-300 mb-2">
                                    Enter Team Name or Table Number
                                </label>
                                <div className="flex">
                                    <input
                                        id="teamCode"
                                        type="text"
                                        value={teamCode}
                                        onChange={(e) => setTeamCode(e.target.value)}
                                        className="flex-1 bg-gray-700 text-white rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g., T1 or Team Name"
                                    />
                                    <button
                                        onClick={findTeamByCode}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-r-md transition"
                                    >
                                        Find
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-md transition flex items-center justify-center"
                                >
                                    <FaHistory className="mr-2" />
                                    {showHistory ? 'Hide History' : `View History (${results.length})`}
                                </button>
                            </div>

                            {showHistory && (
                                <div className="bg-gray-700 rounded-md p-3 mt-4 max-h-80 overflow-y-auto">
                                    <h3 className="font-semibold mb-2">Your Judging History</h3>

                                    {results.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No teams judged yet</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {results.map((result) => (
                                                <div key={result._id} className="bg-gray-800 p-2 rounded">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium">{result.team.name}</span>
                                                        <span className="bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded text-xs">
                                                            {result.overallScore.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(result.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scoring Panel */}
                    <div className="lg:col-span-2">
                        {selectedTeam ? (
                            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-semibold">
                                        Judging: {selectedTeam.name}
                                    </h2>
                                    {selectedTeam.tableNumber && (
                                        <div className="bg-blue-900 px-3 py-1 rounded-md flex items-center">
                                            <FaMapMarkerAlt className="mr-2" />
                                            <span>Table {selectedTeam.tableNumber}</span>
                                        </div>
                                    )}
                                </div>

                                {selectedTeam.description && (
                                    <div className="mb-6 bg-gray-700 p-3 rounded-md">
                                        <p className="text-gray-300 text-sm">{selectedTeam.description}</p>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3 text-indigo-300">Scoring Criteria</h3>

                                    {criteria.length === 0 ? (
                                        <div className="bg-yellow-900 bg-opacity-30 text-yellow-200 p-3 rounded-md">
                                            No judging criteria have been set up for this event.
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {criteria.map((criterion) => (
                                                <div key={criterion._id} className="bg-gray-700 p-4 rounded-md">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-semibold">{criterion.name}</h4>
                                                            <p className="text-sm text-gray-400">{criterion.description}</p>
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Weight: {criterion.weight}x
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center mt-2">
                                                        {renderStarRating(criterion._id, criterion.minScore, criterion.maxScore)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="comments" className="block text-gray-300 mb-2">
                                        Comments (Optional)
                                    </label>
                                    <textarea
                                        id="comments"
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Additional feedback or comments"
                                        rows={4}
                                    />
                                </div>

                                <div className="flex justify-end space-x-4">
                                    <button
                                        onClick={() => setSelectedTeam(null)}
                                        className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitScores}
                                        disabled={submitting || criteria.length === 0}
                                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-md transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <>Submitting...</>
                                        ) : (
                                            <>
                                                <FaSave className="mr-2" /> Submit Scores
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center h-full flex flex-col justify-center">
                                <FaFolderOpen className="text-6xl mx-auto mb-4 text-gray-600" />
                                <h2 className="text-xl font-bold mb-2">No Team Selected</h2>
                                <p className="text-gray-400 mb-6">
                                    Enter a team name or table number in the search box to start judging.
                                </p>
                                {judge.assignedRoom && (
                                    <div className="mt-2 bg-indigo-900 bg-opacity-50 p-3 rounded-md inline-block mx-auto">
                                        <p><strong>Your Assigned Room:</strong> {judge.assignedRoom}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}