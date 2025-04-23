// src/app/dashboard/components/EmergencyBanner.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaExclamationTriangle, FaBullhorn, FaTimes } from 'react-icons/fa';

interface Announcement {
    _id: string;
    title: string;
    content: string;
    isEmergency: boolean;
    createdAt: string;
    processedContent?: string;
}

export default function EmergencyBanner() {
    const [emergencyAnnouncements, setEmergencyAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // Fetch emergency announcements
        const fetchEmergencyAnnouncements = async () => {
            try {
                const response = await fetch('/api/announcements?emergency=true');
                const data = await response.json();

                if (response.ok) {
                    // Process announcement content
                    const processedAnnouncements = await Promise.all(
                        data.announcements.filter((a: Announcement) => a.isEmergency).map(async (announcement: Announcement) => {
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

                    // Get dismissed announcements from local storage
                    const storedDismissed = localStorage.getItem('dismissedAnnouncements');
                    const dismissedAnnouncements = storedDismissed ? JSON.parse(storedDismissed) : {};

                    // Filter out dismissed announcements
                    const activeBanners = processedAnnouncements.filter(
                        (a: Announcement) => !dismissedAnnouncements[a._id]
                    );

                    setDismissed(dismissedAnnouncements);
                    setEmergencyAnnouncements(activeBanners);
                }
            } catch (error) {
                console.error('Error fetching emergency announcements:', error);
            }
        };

        fetchEmergencyAnnouncements();

        // Set up rotation interval if there are multiple emergency announcements
        const rotationInterval = setInterval(() => {
            setCurrentIndex(prevIndex => {
                if (emergencyAnnouncements.length <= 1) return 0;
                return (prevIndex + 1) % emergencyAnnouncements.length;
            });
        }, 8000); // Rotate every 8 seconds

        return () => clearInterval(rotationInterval);
    }, []);

    // Update current index when announcements array length changes
    useEffect(() => {
        if (currentIndex >= emergencyAnnouncements.length && emergencyAnnouncements.length > 0) {
            setCurrentIndex(0);
        }
    }, [emergencyAnnouncements.length, currentIndex]);

    const dismissAnnouncement = (id: string) => {
        const updatedDismissed = { ...dismissed, [id]: true };
        setDismissed(updatedDismissed);
        localStorage.setItem('dismissedAnnouncements', JSON.stringify(updatedDismissed));

        // Remove the announcement from the displayed list
        setEmergencyAnnouncements(prev => prev.filter(a => a._id !== id));
    };

    if (emergencyAnnouncements.length === 0) {
        return null;
    }

    const currentAnnouncement = emergencyAnnouncements[currentIndex];

    return (
        <div className="bg-red-900 border-b border-red-700 px-4 py-3 relative">
            <div className="container mx-auto flex items-center">
                <div className="flex-shrink-0 bg-red-700 rounded-full p-2 mr-3">
                    <FaExclamationTriangle className="text-white" />
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-red-200">
                        EMERGENCY: {currentAnnouncement.title}
                    </h4>
                    <p className="text-white text-sm">
                        {currentAnnouncement.processedContent || currentAnnouncement.content}
                    </p>
                </div>
                <div className="flex-shrink-0 flex items-center">
                    <Link href="/dashboard/announcements" className="text-red-200 hover:text-white mr-4 text-sm flex items-center">
                        <FaBullhorn className="mr-1" /> Details
                    </Link>
                    <button
                        onClick={() => dismissAnnouncement(currentAnnouncement._id)}
                        className="text-red-200 hover:text-white"
                        title="Dismiss"
                    >
                        <FaTimes />
                    </button>
                </div>
            </div>
            {emergencyAnnouncements.length > 1 && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                    <div className="flex space-x-1">
                        {emergencyAnnouncements.map((_, index) => (
                            <span
                                key={index}
                                className={`h-1.5 rounded-full ${index === currentIndex ? 'w-4 bg-red-300' : 'w-1.5 bg-red-700'}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}