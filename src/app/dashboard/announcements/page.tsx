// src/app/dashboard/announcements/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import { FaBullhorn, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';

interface Announcement {
    _id: string;
    title: string;
    content: string;
    isEmergency: boolean;
    createdAt: string;
    processedContent?: string;
}

export default function Announcements() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [error, setError] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchAnnouncements();
        }
    }, [status, router]);

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

                setAnnouncements(processedAnnouncements || []);
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
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return (
            <DashboardLayout>
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
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Announcements</h1>

                {error && (
                    <div className="bg-red-500 text-white p-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                {/* Emergency Announcements (if any) */}
                {announcements.some(a => a.isEmergency) && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center text-red-400">
                            <FaExclamationTriangle className="mr-2" /> Emergency Announcements
                        </h2>
                        <div className="space-y-4">
                            {announcements
                                .filter(a => a.isEmergency)
                                .map((announcement) => (
                                    <div key={announcement._id} className="bg-red-900 bg-opacity-25 border border-red-700 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white flex-shrink-0 mr-4">
                                                <FaExclamationTriangle />
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="text-lg font-bold text-red-300">{announcement.title}</h3>
                                                <div className="mt-2 text-white whitespace-pre-wrap">
                                                    {announcement.processedContent || announcement.content}
                                                </div>
                                                <div className="mt-2 text-xs text-red-300 flex items-center">
                                                    <FaCalendarAlt className="mr-1" />
                                                    {formatDate(announcement.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Regular Announcements */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FaBullhorn className="mr-2" /> All Announcements
                    </h2>
                    {announcements.length === 0 ? (
                        <div className="bg-gray-800 rounded-lg shadow-md p-6 text-center">
                            <p className="text-gray-400">No announcements yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((announcement) => (
                                    <div key={announcement._id}
                                        className={`bg-gray-800 rounded-lg shadow-md p-4 ${announcement.isEmergency ? 'border-l-4 border-red-500' : ''}`}
                                    >
                                        <div className="flex items-start">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white flex-shrink-0 mr-4 ${announcement.isEmergency ? 'bg-red-600' : 'bg-indigo-600'}`}>
                                                {announcement.isEmergency ? <FaExclamationTriangle /> : <FaBullhorn />}
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className={`text-lg font-bold ${announcement.isEmergency ? 'text-red-400' : 'text-white'}`}>
                                                    {announcement.title}
                                                </h3>
                                                <div className="mt-2 text-white whitespace-pre-wrap">
                                                    {announcement.processedContent || announcement.content}
                                                </div>
                                                <div className="mt-2 text-xs text-gray-400 flex items-center">
                                                    <FaCalendarAlt className="mr-1" />
                                                    {formatDate(announcement.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}