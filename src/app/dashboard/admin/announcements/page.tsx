// src/app/dashboard/admin/announcements/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import VariablesGuide from './VariablesGuide';
import {
    FaBullhorn, FaPlus, FaEdit, FaTrash, FaExclamationTriangle,
    FaEye, FaInfoCircle, FaLightbulb, FaCheck
} from 'react-icons/fa';

interface Announcement {
    _id: string;
    title: string;
    content: string;
    isEmergency: boolean;
    createdAt: string;
}

const variablesList = [
    { key: 'user.name', description: 'Current user\'s name' },
    { key: 'user.email', description: 'Current user\'s email' },
    { key: 'user.role', description: 'User role (admin/participant)' },
    { key: 'team.name', description: 'Team name' },
    { key: 'team.category', description: 'Team category' },
    { key: 'team.location', description: 'Team\'s assigned seat location' },
    { key: 'team.members', description: 'List of team members' },
    { key: 'team.leader', description: 'Team leader name' },
    { key: 'team.status', description: 'Team status (pending/approved/rejected)' },
    { key: 'team.memberCount', description: 'Number of team members' },
    { key: 'team.maxSize', description: 'Maximum team size' }
];

export default function AdminAnnouncements() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isEmergency, setIsEmergency] = useState(false);
    const [previewContent, setPreviewContent] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Variable suggestion state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionFilter, setSuggestionFilter] = useState('');
    const [caretPosition, setCaretPosition] = useState({ top: 0, left: 0 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [filteredSuggestions, setFilteredSuggestions] = useState(variablesList);

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchAnnouncements();

                // Check URL parameters for quick actions
                const searchParams = new URLSearchParams(window.location.search);
                const createParam = searchParams.get('create');

                if (createParam === 'regular') {
                    setShowAddModal(true);
                    setIsEmergency(false);
                } else if (createParam === 'emergency') {
                    setShowAddModal(true);
                    setIsEmergency(true);
                }

                // Clean up the URL after processing
                if (createParam) {
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, '', newUrl);
                }
            }
        }
    }, [status, router, session]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/announcements');
            const data = await response.json();

            if (response.ok) {
                setAnnouncements(data.announcements || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch announcements');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!title || !content) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    isEmergency
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Announcement created successfully');
                setTitle('');
                setContent('');
                setIsEmergency(false);
                setShowAddModal(false);
                fetchAnnouncements();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to create announcement');
            console.error(err);
        }
    };

    const updateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedAnnouncement || !title || !content) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch(`/api/announcements/${selectedAnnouncement._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    isEmergency
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Announcement updated successfully');
                setShowEditModal(false);
                fetchAnnouncements();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to update announcement');
            console.error(err);
        }
    };

    const deleteAnnouncement = async () => {
        if (!selectedAnnouncement) return;

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/announcements/${selectedAnnouncement._id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Announcement deleted successfully');
                setShowDeleteModal(false);
                fetchAnnouncements();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to delete announcement');
            console.error(err);
        }
    };

    const previewAnnouncement = async () => {
        try {
            setError('');
            const response = await fetch('/api/announcements/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: selectedAnnouncement?.content || content
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setPreviewContent(data.processedContent);
                setShowPreviewModal(true);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to preview announcement');
            console.error(err);
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

    // Variable suggestion methods
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);

        // Check if we're typing a variable
        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = newContent.substring(0, cursorPos);
        const match = textBeforeCursor.match(/{([^}]*)$/);

        if (match) {
            // We have an open brace, show suggestions
            const partialVar = match[1];
            setSuggestionFilter(partialVar);
            setFilteredSuggestions(variablesList.filter(v =>
                v.key.toLowerCase().includes(partialVar.toLowerCase())
            ));
            setShowSuggestions(true);

            // Calculate position for dropdown
            if (textareaRef.current) {
                // Create a dummy element to measure text width
                const dummy = document.createElement('div');
                dummy.style.position = 'absolute';
                dummy.style.visibility = 'hidden';
                dummy.style.whiteSpace = 'pre-wrap';
                dummy.style.font = window.getComputedStyle(textareaRef.current).font;
                dummy.style.width = window.getComputedStyle(textareaRef.current).width;
                dummy.innerHTML = textBeforeCursor.replace(/\n/g, '<br>');
                document.body.appendChild(dummy);

                // Get the client rect of the textarea
                const textareaRect = textareaRef.current.getBoundingClientRect();

                // Calculate the width of text before cursor and the height considering line breaks
                const textWidth = dummy.offsetWidth;
                const textHeight = dummy.offsetHeight;

                document.body.removeChild(dummy);

                // Calculate approximate position
                // This is a simplification and may need adjustment based on exact behavior
                const lineHeight = parseInt(window.getComputedStyle(textareaRef.current).lineHeight);
                const lineCount = (textBeforeCursor.match(/\n/g) || []).length;

                const left = textWidth % textareaRef.current.clientWidth;
                const top = (lineCount + 1) * lineHeight;

                setCaretPosition({
                    left: left + textareaRef.current.offsetLeft,
                    top: top + textareaRef.current.offsetTop
                });
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions) {
            if (e.key === 'Escape') {
                setShowSuggestions(false);
                e.preventDefault();
            }
        }
    };

    const insertVariable = (variable: string) => {
        if (textareaRef.current) {
            const cursorPos = textareaRef.current.selectionStart;
            const textBeforeCursor = content.substring(0, cursorPos);
            const textAfterCursor = content.substring(cursorPos);

            // Find the partial variable we're replacing
            const match = textBeforeCursor.match(/{([^}]*)$/);

            if (match) {
                const matchStart = textBeforeCursor.lastIndexOf('{');
                const newContent = content.substring(0, matchStart) +
                    '{' + variable + '}' +
                    textAfterCursor;

                setContent(newContent);

                // Set cursor position after the inserted variable
                const newCursorPos = matchStart + variable.length + 2; // +2 for { and }
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.focus();
                        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                    }
                }, 0);
            }

            setShowSuggestions(false);
        }
    };

    const openEditModal = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setTitle(announcement.title);
        setContent(announcement.content);
        setIsEmergency(announcement.isEmergency);
        setShowEditModal(true);
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p>Loading announcements...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout isAdmin={true}>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Announcement Management</h1>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center"
                    >
                        <FaPlus className="mr-2" /> Create Announcement
                    </button>
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

                {/* Variables Guide */}
                <VariablesGuide />

                {/* Announcements List */}
                <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Announcement
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Created At
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {announcements.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                                            No announcements created yet. Create one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    announcements.map((announcement) => (
                                        <tr key={announcement._id}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                                        <FaBullhorn />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-white">{announcement.title}</div>
                                                        <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                                                            {announcement.content.substring(0, 100)}
                                                            {announcement.content.length > 100 ? '...' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {announcement.isEmergency ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <FaExclamationTriangle className="mr-1" /> Emergency
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        <FaInfoCircle className="mr-1" /> Regular
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {formatDate(announcement.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAnnouncement(announcement);
                                                        previewAnnouncement();
                                                    }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                                                    title="Preview Announcement"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(announcement)}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded"
                                                    title="Edit Announcement"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedAnnouncement(announcement);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                                                    title="Delete Announcement"
                                                >
                                                    <FaTrash />
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

            {/* Add Announcement Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Create New Announcement</h3>

                        <form onSubmit={addAnnouncement}>
                            <div className="mb-4">
                                <label htmlFor="title" className="block text-gray-300 mb-2">
                                    Title*
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Announcement Title"
                                    required
                                />
                            </div>

                            <div className="mb-4 relative">
                                <label htmlFor="content" className="block text-gray-300 mb-2">
                                    Content*
                                </label>
                                <textarea
                                    ref={textareaRef}
                                    id="content"
                                    value={content}
                                    onChange={handleTextareaChange}
                                    onKeyDown={handleTextareaKeyDown}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Announcement content... Use {variable.name} syntax for dynamic content"
                                    rows={5}
                                    required
                                />

                                {/* Variable suggestions dropdown */}
                                {showSuggestions && filteredSuggestions.length > 0 && (
                                    <div
                                        className="absolute bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto w-64"
                                        style={{
                                            top: `${caretPosition.top + 20}px`,
                                            left: `${caretPosition.left}px`,
                                        }}
                                    >
                                        <ul>
                                            {filteredSuggestions.map((suggestion, index) => (
                                                <li
                                                    key={index}
                                                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                                                    onClick={() => insertVariable(suggestion.key)}
                                                >
                                                    <span className="font-mono text-sm text-indigo-300">{suggestion.key}</span>
                                                    <span className="text-xs text-gray-400">{suggestion.description}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center">
                                    <input
                                        id="isEmergency"
                                        type="checkbox"
                                        checked={isEmergency}
                                        onChange={(e) => setIsEmergency(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded"
                                    />
                                    <label htmlFor="isEmergency" className="ml-2 block text-gray-300">
                                        Mark as Emergency Announcement
                                    </label>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">
                                    Emergency announcements will be highlighted and displayed prominently to all users.
                                </p>
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setTitle('');
                                        setContent('');
                                        setIsEmergency(false);
                                    }}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={previewAnnouncement}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition flex items-center"
                                >
                                    <FaEye className="mr-2" /> Preview
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Create Announcement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Announcement Modal */}
            {showEditModal && selectedAnnouncement && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Edit Announcement</h3>

                        <form onSubmit={updateAnnouncement}>
                            <div className="mb-4">
                                <label htmlFor="editTitle" className="block text-gray-300 mb-2">
                                    Title*
                                </label>
                                <input
                                    id="editTitle"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Announcement Title"
                                    required
                                />
                            </div>

                            <div className="mb-4 relative">
                                <label htmlFor="editContent" className="block text-gray-300 mb-2">
                                    Content*
                                </label>
                                <textarea
                                    ref={textareaRef}
                                    id="editContent"
                                    value={content}
                                    onChange={handleTextareaChange}
                                    onKeyDown={handleTextareaKeyDown}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Announcement content... Use {variable.name} syntax for dynamic content"
                                    rows={5}
                                    required
                                />

                                {/* Variable suggestions dropdown */}
                                {showSuggestions && filteredSuggestions.length > 0 && (
                                    <div
                                        className="absolute bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto w-64"
                                        style={{
                                            top: `${caretPosition.top + 20}px`,
                                            left: `${caretPosition.left}px`,
                                        }}
                                    >
                                        <ul>
                                            {filteredSuggestions.map((suggestion, index) => (
                                                <li
                                                    key={index}
                                                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                                                    onClick={() => insertVariable(suggestion.key)}
                                                >
                                                    <span className="font-mono text-sm text-indigo-300">{suggestion.key}</span>
                                                    <span className="text-xs text-gray-400">{suggestion.description}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center">
                                    <input
                                        id="editIsEmergency"
                                        type="checkbox"
                                        checked={isEmergency}
                                        onChange={(e) => setIsEmergency(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded"
                                    />
                                    <label htmlFor="editIsEmergency" className="ml-2 block text-gray-300">
                                        Mark as Emergency Announcement
                                    </label>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">
                                    Emergency announcements will be highlighted and displayed prominently to all users.
                                </p>
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                    }}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={previewAnnouncement}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition flex items-center"
                                >
                                    <FaEye className="mr-2" /> Preview
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Announcement Modal */}
            {showDeleteModal && selectedAnnouncement && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Delete Announcement</h3>
                        <p className="mb-4">
                            Are you sure you want to delete the announcement "{selectedAnnouncement.title}"? This action cannot be undone.
                        </p>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteAnnouncement}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Announcement Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
                        <h3 className="text-xl font-bold mb-2">Announcement Preview</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            This is how the announcement will appear to participants with variables replaced.
                        </p>

                        <div className="bg-gray-700 p-4 rounded-md mb-6">
                            {selectedAnnouncement && (
                                <div className="mb-2">
                                    <h4 className={`text-lg font-bold ${selectedAnnouncement.isEmergency ? 'text-red-400' : 'text-white'}`}>
                                        {selectedAnnouncement.isEmergency && <FaExclamationTriangle className="inline mr-2 text-red-400" />}
                                        {selectedAnnouncement.title}
                                    </h4>
                                </div>
                            )}
                            <div className="text-white whitespace-pre-wrap">
                                {previewContent}
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}