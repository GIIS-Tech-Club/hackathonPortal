// src/app/judge/[code]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    FaUser, FaTrophy, FaCheck, FaThumbsUp, FaThumbsDown,
    FaEquals, FaArrowRight, FaClock, FaMapMarkerAlt,
    FaClipboard, FaInfoCircle, FaTimes
} from 'react-icons/fa';

interface Judge {
    _id: string;
    name: string;
    email: string;
    type: 'participant' | 'external';
    accessCode: string;
    event: {
        _id: string;
        name: string;
        type: string;
        status: string;
    };
    currentAssignment: {
        _id: string;
        team: {
            _id: string;
            name: string;
            tableNumber: string;
            description: string;
        };
    } | null;
}

interface Team {
    _id: string;
    name: string;
    tableNumber: string;
    description: string;
}

export default function JudgingInterface() {
    const router = useRouter();
    const params = useParams();
    const accessCode = params.code as string;

    const [loading, setLoading] = useState(true);
    const [judge, setJudge] = useState<Judge | null>(null);
    const [error, setError] = useState('');
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [previousTeam, setPreviousTeam] = useState<Team | null>(null);
    const [comparisonMode, setComparisonMode] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [voteSubmitting, setVoteSubmitting] = useState(false);
    const [skipSubmitting, setSkipSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (accessCode) {
            console.log('Access code:', accessCode);
            fetchJudgeInfo();
        }
    }, [accessCode]);

    const fetchJudgeInfo = async () => {
        try {
            setLoading(true);
            console.log('fjdsuihfd');
            const response = await fetch(`/api/judging/auth/${accessCode}`);
            console.log('Response:', response);
            const data = await response.json();
            console.log('Data:', data);
            console.log('Judge:', data.judge);
            if (response.ok) {
                // Convert the judge data to the correct type
                const judgeData = data.judge as Judge;
                console.log('Judge data:', judgeData);
                setJudge(judgeData);

                // Check if there's a current assignment
                if (data.judge.currentAssignment) {
                    console.log('Current assignment:', data.judge.currentAssignment);
                    setCurrentTeam(data.judge.currentAssignment.team);
                } else {
                    console.log('No current assignment found, fetching a new one...');
                    // No current assignment, get a new one
                    getNextTeam(data.judge);
                }
            } else {
                console.log('test');
                setError(data.message || 'Invalid access code');
            }
        } catch (err) {
            setError('Failed to authenticate judge');
            console.error(err);
        } finally {
            console.log('Judge fjduihufds');
            setLoading(false);
        }
    };

    const getNextTeam = async (judgeData?: Judge) => {
        try {
            const currentJudge = judgeData || judge;
            if (!currentJudge) {
                console.error("Judge is null, cannot get next team");
                return;
            }

            console.log('Getting next team for judge:', currentJudge._id, 'and event:', currentJudge.event._id);

            // Make the request with explicit error handling
            const response = await fetch(`/api/judging/algorithms/demoday?eventId=${currentJudge.event._id}&judgeId=${currentJudge._id}`);
            console.log('Response status:', response.status);

            // Try to parse the response even if it's an error
            const text = await response.text();
            console.log('Raw response:', text);

            let data;
            try {
                data = JSON.parse(text);
                console.log('Parsed data:', data);
            } catch (parseError) {
                console.error('Failed to parse response:', parseError);
                setError('Invalid response from server');
                return;
            }

            if (!response.ok) {
                console.error('API error:', data.message);
                setError(data.message || 'Failed to get next team');

                // Handle specific error for no teams
                if (data.message === 'No eligible teams to judge') {
                    setCurrentTeam(null);
                    setPreviousTeam(null);
                    setComparisonMode(false);
                }
                return;
            }

            // Save current team as previous for comparison
            if (currentTeam) {
                console.log('Setting previous team:', currentTeam);
                setPreviousTeam(currentTeam);
                setComparisonMode(true);
            } else {
                setComparisonMode(false);
            }

            // Set new team as current
            console.log('Setting new current team:', data.assignment?.team);
            setCurrentTeam(data.assignment?.team);

            // Update judge info
            setJudge({
                ...currentJudge,
                currentAssignment: data.assignment
            });
        } catch (err) {
            console.error('Error in getNextTeam:', err);
            setError('Failed to get next team: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const submitVote = async (winner: 'current' | 'previous' | 'equal') => {
        if (!judge || !judge.currentAssignment || !currentTeam || !previousTeam) return;

        try {
            setVoteSubmitting(true);
            setError('');
            setSuccess('');

            let winningTeamId, losingTeamId;
            let isDraw = false;

            if (winner === 'current') {
                winningTeamId = currentTeam._id;
                losingTeamId = previousTeam._id;
            } else if (winner === 'previous') {
                winningTeamId = previousTeam._id;
                losingTeamId = currentTeam._id;
            } else {
                // For equal votes, we'll record both but mark as a draw
                winningTeamId = currentTeam._id;
                losingTeamId = previousTeam._id;
                isDraw = true;
            }

            const response = await fetch('/api/judging/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    judgeId: judge._id,
                    eventId: judge.event._id,
                    winningTeamId,
                    losingTeamId,
                    isDraw,
                    assignmentId: judge.currentAssignment._id
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Vote recorded successfully');

                // Move to next team
                getNextTeam();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to submit vote');
            console.error(err);
        } finally {
            setVoteSubmitting(false);
        }
    };

    const skipCurrentTeam = async () => {
        if (!judge || !judge.currentAssignment) return;

        try {
            setSkipSubmitting(true);
            setError('');

            const response = await fetch(`/api/judging/assignments/${judge.currentAssignment._id}/skip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Move to next team
                getNextTeam();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to skip team');
            console.error(err);
        } finally {
            setSkipSubmitting(false);
        }
    };

    const copyTableNumber = (tableNumber: string) => {
        navigator.clipboard.writeText(tableNumber)
            .then(() => {
                setSuccess('Table number copied to clipboard');
                setTimeout(() => setSuccess(''), 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
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
                    <FaClock className="text-yellow-500 text-5xl mx-auto mb-4" />
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
                        <h1 className="text-xl font-bold">Demo Day Judging</h1>
                    </div>
                    <div className="flex items-center">
                        <div className="mr-4 text-right">
                            <p className="text-sm text-indigo-200">Logged in as</p>
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
                            <div className="flex items-start">
                                <div className="bg-indigo-800 p-2 rounded-full mr-3 flex-shrink-0">
                                    <FaMapMarkerAlt />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Find Projects</h3>
                                    <p className="text-gray-300">
                                        Use the table number to locate each project. Visit the project, talk to the team, and evaluate their work.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-indigo-800 p-2 rounded-full mr-3 flex-shrink-0">
                                    <FaThumbsUp />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Compare Projects</h3>
                                    <p className="text-gray-300">
                                        After visiting a project, you'll be asked to compare it with the previous project you evaluated. Choose which one is better, or mark them as equal.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-indigo-800 p-2 rounded-full mr-3 flex-shrink-0">
                                    <FaArrowRight />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Continue Judging</h3>
                                    <p className="text-gray-300">
                                        After each comparison, you'll be given a new project to evaluate. Continue this process to help determine the winners.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* No Teams to Judge */}
                {!currentTeam && !previousTeam && (
                    <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                        <FaTrophy className="text-6xl mx-auto mb-4 text-yellow-400" />
                        <h2 className="text-2xl font-bold mb-2">No More Teams to Judge</h2>
                        <p className="text-gray-300 mb-6">
                            You've completed all your judging assignments or there are no eligible teams for you to judge at this time.
                        </p>
                        <p className="text-gray-400">
                            Thank you for your participation! You can check back later or contact the event organizers if you believe this is an error.
                        </p>
                    </div>
                )}

                {/* Current Team to Judge */}
                {currentTeam && (
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {comparisonMode ? 'Current Project to Judge' : 'First Project to Judge'}
                        </h2>

                        <div className="bg-gray-700 rounded-lg p-4 mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold">{currentTeam.name}</h3>
                                <div
                                    className="flex items-center bg-blue-900 px-3 py-1 rounded-md cursor-pointer hover:bg-blue-800 transition"
                                    onClick={() => copyTableNumber(currentTeam.tableNumber)}
                                    title="Click to copy"
                                >
                                    <FaMapMarkerAlt className="mr-2 text-blue-300" />
                                    <span className="font-mono">Table {currentTeam.tableNumber}</span>
                                    <FaClipboard className="ml-2 text-blue-300" />
                                </div>
                            </div>
                            <p className="text-gray-300 mb-4">{currentTeam.description}</p>

                            <div className="flex justify-end">
                                <button
                                    onClick={skipCurrentTeam}
                                    disabled={skipSubmitting}
                                    className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {skipSubmitting ? 'Skipping...' : 'Skip This Team'}
                                </button>
                            </div>
                        </div>

                        {!comparisonMode ? (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => judge && getNextTeam(judge)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-md transition flex items-center text-lg"
                                >
                                    <FaArrowRight className="mr-2" /> Get Next Project
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Comparison Interface */}
                {comparisonMode && previousTeam && currentTeam && (
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-center">Compare Projects</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-gray-700 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold">Previous: {previousTeam.name}</h3>
                                    <div className="bg-purple-900 px-3 py-1 rounded-md">
                                        <span className="font-mono">Table {previousTeam.tableNumber}</span>
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm mb-4">{previousTeam.description}</p>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold">Current: {currentTeam.name}</h3>
                                    <div className="bg-blue-900 px-3 py-1 rounded-md">
                                        <span className="font-mono">Table {currentTeam.tableNumber}</span>
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm mb-4">{currentTeam.description}</p>
                            </div>
                        </div>

                        <p className="text-center text-gray-300 mb-4">
                            Which project do you think is better?
                        </p>

                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => submitVote('previous')}
                                disabled={voteSubmitting}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-md transition flex items-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaThumbsUp className="mr-2" /> Previous is Better
                            </button>

                            <button
                                onClick={() => submitVote('equal')}
                                disabled={voteSubmitting}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-md transition flex items-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaEquals className="mr-2" /> Equal
                            </button>

                            <button
                                onClick={() => submitVote('current')}
                                disabled={voteSubmitting}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-md transition flex items-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaThumbsUp className="mr-2" /> Current is Better
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}