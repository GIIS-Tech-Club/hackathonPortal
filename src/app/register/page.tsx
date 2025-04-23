// src/app/register/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaRocket, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setError('');
        setDebugInfo('');

        // Validate form
        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        try {
            setLoading(true);

            // Use the new API path
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            // Get the raw response text first
            const responseText = await response.text();
            setDebugInfo(`Server response (${response.status}): ${responseText}`);

            // Try to parse as JSON if possible
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 100)}...`);
            }

            // Handle non-success responses
            if (!response.ok) {
                throw new Error(data?.message || 'Registration failed. Please try again.');
            }

            // Registration successful, redirect to login
            router.push('/login?registered=true');
        } catch (error: any) {
            setError(error.message || 'Something went wrong. Please try again.');
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center">
                        <FaRocket className="text-3xl text-indigo-500 mr-2" />
                        <span className="text-2xl font-bold text-white">Hackathon Portal</span>
                    </Link>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Your Account</h2>

                    {error && (
                        <div className="bg-red-500 text-white p-3 rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    {debugInfo && (
                        <div className="bg-gray-700 text-gray-300 p-3 rounded-md mb-4 text-xs overflow-auto max-h-32">
                            <p className="font-bold mb-1">Debug Information:</p>
                            <pre>{debugInfo}</pre>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-gray-300 mb-2">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaUser className="text-gray-500" />
                                </div>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="email" className="block text-gray-300 mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaEnvelope className="text-gray-500" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="text-gray-500" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="block text-gray-300 mb-2">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="text-gray-500" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Register'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}