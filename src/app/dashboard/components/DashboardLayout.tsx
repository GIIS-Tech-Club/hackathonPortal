// src/app/dashboard/components/DashboardLayout.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
    FaRocket, FaHome, FaUsers, FaBullhorn, FaCog, FaSignOutAlt,
    FaBars, FaTimes, FaUserPlus, FaUser, FaMapMarkerAlt, FaTrophy
} from 'react-icons/fa';

interface DashboardLayoutProps {
    children: React.ReactNode;
    isAdmin?: boolean;
}

interface Announcement {
    _id: string;
    title: string;
    content: string;
    isEmergency: boolean;
    createdAt: string;
}

export default function DashboardLayout({ children, isAdmin = false }: DashboardLayoutProps) {
    const { data: session } = useSession();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const [hasEmergencyAnnouncement, setHasEmergencyAnnouncement] = useState(false);

    useEffect(() => {
        // Check if there are any emergency announcements
        const checkEmergencyAnnouncements = async () => {
            try {
                const response = await fetch('/api/announcements');
                if (response.ok) {
                    const data = await response.json();
                    const hasEmergency = data.announcements?.some((a: Announcement) => a.isEmergency) || false;
                    setHasEmergencyAnnouncement(hasEmergency);
                }
            } catch (error) {
                console.error('Error checking emergency announcements:', error);
            }
        };

        checkEmergencyAnnouncements();
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Check if the current path matches the link path
    const isActivePath = (path: string) => {
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* Mobile Header */}
            <div className="md:hidden bg-gray-800 p-4 flex justify-between items-center">
                <div className="flex items-center">
                    <FaRocket className="text-2xl text-indigo-500 mr-2" />
                    <span className="font-bold">Hackathon Portal</span>
                </div>
                <button
                    onClick={toggleSidebar}
                    className="text-white p-2 rounded-md focus:outline-none"
                >
                    {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside
                    className={`bg-gray-800 w-64 flex-shrink-0 fixed md:static inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        } md:translate-x-0 transition-transform duration-200 ease-in-out z-10 md:z-0 h-full overflow-y-auto`}
                >
                    {/* Logo */}
                    <div className="p-4 border-b border-gray-700">
                        <Link href="/" className="flex items-center">
                            <FaRocket className="text-2xl text-indigo-500 mr-2" />
                            <span className="font-bold">Hackathon Portal</span>
                        </Link>
                    </div>

                    {/* User info */}
                    <div className="p-4 border-b border-gray-700">
                        <Link href="/dashboard/profile" className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                                {session?.user?.name?.charAt(0) || '?'}
                            </div>
                            <div className="ml-3">
                                <p className="font-medium">{session?.user?.name}</p>
                                <p className="text-sm text-gray-400">{isAdmin ? 'Admin' : 'Participant'}</p>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4">
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href={isAdmin ? "/dashboard/admin" : "/dashboard"}
                                    className={`flex items-center text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition ${isActivePath(isAdmin ? "/dashboard/admin" : "/dashboard") && !(isAdmin && pathname.includes("/teams")) ? "bg-gray-700 text-white" : ""
                                        }`}
                                >
                                    <FaHome className="mr-3" />
                                    Dashboard
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href={isAdmin ? "/dashboard/admin/teams" : "/dashboard/teams"}
                                    className={`flex items-center text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition ${pathname.includes("/teams") ? "bg-gray-700 text-white" : ""
                                        }`}
                                >
                                    <FaUsers className="mr-3" />
                                    {isAdmin ? 'Manage Teams' : 'My Team'}
                                </Link>
                            </li>

                            {/* Add Judging Management Link for admins */}
                            {isAdmin && (
                                <li>
                                    <Link
                                        href="/dashboard/admin/judging"
                                        className={`flex items-center text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition ${pathname.includes("/judging") ? "bg-gray-700 text-white" : ""
                                            }`}
                                    >
                                        <FaTrophy className="mr-3" />
                                        Judging Management
                                    </Link>
                                </li>
                            )}

                            {!isAdmin && (
                                <li>
                                    <Link
                                        href="/dashboard/teams"
                                        className={`flex items-center text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition ${pathname === "/dashboard/teams" ? "bg-gray-700 text-white" : ""
                                            }`}
                                    >
                                        <FaUserPlus className="mr-3" />
                                        Join/Create Team
                                    </Link>
                                </li>
                            )}

                            <li>
                                <Link
                                    href={isAdmin ? "/dashboard/admin/announcements" : "/dashboard/announcements"}
                                    className={`flex items-center text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition ${pathname.includes("/announcements") ? "bg-gray-700 text-white" : ""
                                        }`}
                                >
                                    <div className="relative mr-3">
                                        <FaBullhorn />
                                        {hasEmergencyAnnouncement && (
                                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
                                        )}
                                    </div>
                                    {isAdmin ? 'Manage Announcements' : 'Announcements'}
                                    <div className="ml-auto flex items-center space-x-1">
                                        {hasEmergencyAnnouncement && (
                                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">!</span>
                                        )}
                                    </div>
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href="/dashboard/profile"
                                    className={`flex items-center text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition ${pathname.includes("/profile") ? "bg-gray-700 text-white" : ""
                                        }`}
                                >
                                    <FaUser className="mr-3" />
                                    My Profile
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href="#"
                                    className="flex items-center text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition"
                                >
                                    <FaCog className="mr-3" />
                                    Settings
                                </Link>
                            </li>

                            <li>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="w-full flex items-center text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-md transition"
                                >
                                    <FaSignOutAlt className="mr-3" />
                                    Sign Out
                                </button>
                            </li>
                        </ul>
                    </nav>
                </aside>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}