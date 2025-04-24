// src/app/login/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaRocket, FaEnvelope, FaLock } from 'react-icons/fa';

// Create a separate component that uses useSearchParams
function LoginWithParams() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const router = useRouter();
    const { status } = useSession();

    // Move the useSearchParams to a client component that's wrapped in Suspense
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    // useEffect for checking searchParams
    useEffect(() => {
        // Get the search params from URL manually
        const urlParams = new URLSearchParams(window.location.search);
        const registered = urlParams.get('registered');

        if (registered === 'true') {
            setRegistrationSuccess(true);
            setSuccess('Registration successful! Please log in with your credentials.');
        }
    }, []);

    useEffect(() => {
        // Check if user is already logged in
        if (status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError(result.error || 'Invalid email or password');
            } else {
                // Wait a moment to ensure session is updated
                setTimeout(() => {
                    router.push('/dashboard');
                }, 100);
            }
        } catch (error: any) {
            setError('Something went wrong. Please try again.');
            console.error('Login error:', error);
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
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Login to Your Account</h2>

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

                    <form onSubmit={handleSubmit}>
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

                        <div className="mb-6">
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main page component with Suspense
export default function Login() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <LoginWithParams />
        </Suspense>
    );
}