// src/app/dashboard/components/AnnouncementsSection.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaBullhorn, FaExclamationTriangle, FaCalendarAlt, FaChevronRight } from 'react-icons/fa';

interface Announcement {
    _id: string;
    title: string;
    content: string;
    isEmergency: boolean;
    createdAt: string;
    processedContent?: string;
}

export default function AnnouncementsSection() {
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/announcements');
            const data = await response.json();

            if (response.ok) {
                // Process each announcement to replace variables
                const processedAnnouncements = await Promise.all(
                    data.announcements.map(async (announcement: Announcement) => {
                        const processResponse = await fetch('/api/announcements/process', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                content: announcement.content
                            }),
                        });

                        if (processResponse.ok) {
                            const processData = await processResponse.json();
                            return {
                                ...announcement,
                                processedContent: processData.processedContent
                            };
                        }
                        return announcement;
                    })
                );

                // Sort by createdAt (newest first) and take the latest 3
                const latestAnnouncements = processedAnnouncements
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 3);

                setAnnouncements(latestAnnouncements || []);
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();

        // If the announcement is from today, show time
        if (date.toDateString() === now.toDateString()) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        // If the announcement is from yesterday, show 'Yesterday'
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }

        // Otherwise, show the date
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Announcements</h2>
                </div>
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading announcements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Announcements</h2>
                <Link
                    href="/dashboard/announcements"
                    className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center"
                >
                    View All <FaChevronRight className="ml-1" size={10} />
                </Link>
            </div>

            {error && (
                <div className="bg-red-500 bg-opacity-25 text-white p-3 rounded-md mb-4">
                    {error}
                </div>
            )}

            {announcements.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                    <p>No announcements yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Emergency announcements first */}
                    {announcements
                        .filter(a => a.isEmergency)
                        .map((announcement) => (
                            <div key={announcement._id}
                                className="bg-red-900 bg-opacity-25 border border-red-700 rounded-lg p-3"
                            >
                                <div className="flex items-start">
                                    <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white flex-shrink-0 mr-3">
                                        <FaExclamationTriangle size={14} />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-md font-bold text-red-300">{announcement.title}</h3>
                                            <span className="text-xs text-red-300 flex items-center ml-2">
                                                <FaCalendarAlt className="mr-1" size={10} />
                                                {formatDate(announcement.createdAt)}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-white text-sm line-clamp-2">
                                            {announcement.processedContent || announcement.content}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                    {/* Regular announcements */}
                    {announcements
                        .filter(a => !a.isEmergency)
                        .map((announcement) => (
                            <div key={announcement._id}
                                className="bg-gray-700 rounded-lg p-3"
                            >
                                <div className="flex items-start">
                                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mr-3">
                                        <FaBullhorn size={14} />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-md font-bold text-white">{announcement.title}</h3>
                                            <span className="text-xs text-gray-400 flex items-center ml-2">
                                                <FaCalendarAlt className="mr-1" size={10} />
                                                {formatDate(announcement.createdAt)}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-gray-300 text-sm line-clamp-2">
                                            {announcement.processedContent || announcement.content}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}