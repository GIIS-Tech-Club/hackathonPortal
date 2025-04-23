// src/app/dashboard/admin/locations/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/components/DashboardLayout';
import {
    FaMapMarkerAlt, FaPlus, FaEdit, FaTrash,
    FaRandom, FaCheck, FaExclamationTriangle
} from 'react-icons/fa';

interface Location {
    _id: string;
    name: string;
    capacity: number;
    description?: string;
    allocationPercentage: number;
    createdAt: string;
}

export default function AdminLocations() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState('');
    const [description, setDescription] = useState('');
    const [allocationPercentage, setAllocationPercentage] = useState('0');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [totalPercentage, setTotalPercentage] = useState(0);

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            if (session?.user?.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchLocations();
            }
        }
    }, [status, router, session]);

    // Calculate total percentage whenever locations change
    useEffect(() => {
        const total = locations.reduce((sum, loc) => sum + loc.allocationPercentage, 0);
        setTotalPercentage(total);
    }, [locations]);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/locations');
            const data = await response.json();

            if (response.ok) {
                setLocations(data.locations || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch locations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name || !capacity) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    capacity: parseInt(capacity),
                    description,
                    allocationPercentage: parseFloat(allocationPercentage)
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Location added successfully');
                setName('');
                setCapacity('');
                setDescription('');
                setAllocationPercentage('0');
                setShowAddModal(false);
                fetchLocations();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to add location');
            console.error(err);
        }
    };

    const updateLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedLocation || !name || !capacity) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch(`/api/locations/${selectedLocation._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    capacity: parseInt(capacity),
                    description,
                    allocationPercentage: parseFloat(allocationPercentage)
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Location updated successfully');
                setShowEditModal(false);
                fetchLocations();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to update location');
            console.error(err);
        }
    };

    const deleteLocation = async () => {
        if (!selectedLocation) return;

        try {
            setError('');
            setSuccess('');

            const response = await fetch(`/api/locations/${selectedLocation._id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Location deleted successfully');
                setShowDeleteModal(false);
                fetchLocations();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to delete location');
            console.error(err);
        }
    };

    const assignTeams = async () => {
        try {
            setError('');
            setSuccess('');

            // Check if total percentage is reasonably close to 100%
            if (Math.abs(totalPercentage - 100) > 5) {
                if (!confirm("The total allocation percentage is not 100%. This may result in uneven distribution. Do you want to continue?")) {
                    return;
                }
            }

            const response = await fetch('/api/teams/assign-locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message);
                setShowAssignModal(false);

                // Format the assignment counts for display
                const countsText = Object.entries(data.assignmentCounts)
                    .map(([location, count]) => `${location}: ${count} team(s)`)
                    .join(', ');

                setSuccess(`${data.message}. Assignment: ${countsText}`);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to assign teams to locations');
            console.error(err);
        }
    };

    const openEditModal = (location: Location) => {
        setSelectedLocation(location);
        setName(location.name);
        setCapacity(location.capacity.toString());
        setDescription(location.description || '');
        setAllocationPercentage(location.allocationPercentage.toString());
        setShowEditModal(true);
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return (
            <DashboardLayout isAdmin={true}>
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p>Loading locations...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout isAdmin={true}>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Location Management</h1>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition flex items-center"
                        >
                            <FaPlus className="mr-2" /> Add Location
                        </button>

                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center"
                            disabled={locations.length === 0}
                        >
                            <FaRandom className="mr-2" /> Assign Teams
                        </button>
                    </div>
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

                {/* Allocation Percentage Summary */}
                <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
                    <h2 className="text-lg font-semibold mb-2 flex items-center">
                        <FaMapMarkerAlt className="mr-2" /> Location Allocation
                        {Math.abs(totalPercentage - 100) > 1 && (
                            <span className="ml-2 text-yellow-500 flex items-center text-sm">
                                <FaExclamationTriangle className="mr-1" /> Total not 100%
                            </span>
                        )}
                        {Math.abs(totalPercentage - 100) <= 1 && (
                            <span className="ml-2 text-green-500 flex items-center text-sm">
                                <FaCheck className="mr-1" /> Total: 100%
                            </span>
                        )}
                    </h2>
                    <div className="bg-gray-700 rounded-lg overflow-hidden">
                        <div className="relative h-6">
                            {locations.map((location, index) => {
                                // Calculate the width and left position of each segment
                                const cumulativePercentage = locations
                                    .slice(0, index)
                                    .reduce((sum, loc) => sum + loc.allocationPercentage, 0);

                                const width = `${location.allocationPercentage}%`;
                                const left = `${cumulativePercentage}%`;

                                // Generate random but consistent color based on location name
                                const hash = location.name.split('').reduce((hash, char) => char.charCodeAt(0) + ((hash << 5) - hash), 0);
                                const hue = Math.abs(hash % 360);
                                const backgroundColor = `hsl(${hue}, 70%, 50%)`;

                                return (
                                    <div
                                        key={location._id}
                                        className="absolute top-0 bottom-0 flex items-center justify-center text-xs text-white font-bold"
                                        style={{
                                            width,
                                            left,
                                            backgroundColor,
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title={`${location.name}: ${location.allocationPercentage}%`}
                                    >
                                        {location.allocationPercentage >= 5 ? `${location.allocationPercentage}%` : ''}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-400">
                        Total allocation: <span className={totalPercentage === 100 ? "text-green-400" : "text-yellow-400"}>
                            {totalPercentage}%
                        </span>
                        {totalPercentage !== 100 && (
                            <span> (should be 100% for balanced allocation)</span>
                        )}
                    </div>
                </div>

                {/* Locations Table */}
                <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Capacity
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Allocation %
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Added On
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {locations.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                                            No locations added yet. Add some locations to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    locations.map((location) => (
                                        <tr key={location._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                                        <FaMapMarkerAlt />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-white">{location.name}</div>
                                                        <div className="text-sm text-gray-400">
                                                            {location.description || 'No description'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">{location.capacity}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">{location.allocationPercentage}%</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">{formatDate(location.createdAt)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => openEditModal(location)}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded"
                                                    title="Edit Location"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedLocation(location);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                                                    title="Delete Location"
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

            {/* Add Location Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Add New Location</h3>

                        <form onSubmit={addLocation}>
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-gray-300 mb-2">
                                    Location Name*
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., Library"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="capacity" className="block text-gray-300 mb-2">
                                    Capacity*
                                </label>
                                <input
                                    id="capacity"
                                    type="number"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., 20"
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="description" className="block text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Optional description of this location"
                                    rows={3}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="allocationPercentage" className="block text-gray-300 mb-2">
                                    Allocation Percentage
                                </label>
                                <div className="flex items-center">
                                    <input
                                        id="allocationPercentage"
                                        type="number"
                                        value={allocationPercentage}
                                        onChange={(e) => setAllocationPercentage(e.target.value)}
                                        className="flex-1 bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g., 25"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                    />
                                    <span className="ml-2 text-white">%</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">
                                    Percentage of teams to be allocated to this location during random assignment
                                </p>
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Add Location
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Location Modal */}
            {showEditModal && selectedLocation && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Edit Location</h3>

                        <form onSubmit={updateLocation}>
                            <div className="mb-4">
                                <label htmlFor="editName" className="block text-gray-300 mb-2">
                                    Location Name*
                                </label>
                                <input
                                    id="editName"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., Library"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="editCapacity" className="block text-gray-300 mb-2">
                                    Capacity*
                                </label>
                                <input
                                    id="editCapacity"
                                    type="number"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., 20"
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="editDescription" className="block text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="editDescription"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Optional description of this location"
                                    rows={3}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="editAllocationPercentage" className="block text-gray-300 mb-2">
                                    Allocation Percentage
                                </label>
                                <div className="flex items-center">
                                    <input
                                        id="editAllocationPercentage"
                                        type="number"
                                        value={allocationPercentage}
                                        onChange={(e) => setAllocationPercentage(e.target.value)}
                                        className="flex-1 bg-gray-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g., 25"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                    />
                                    <span className="ml-2 text-white">%</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">
                                    Percentage of teams to be allocated to this location during random assignment
                                </p>
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                                >
                                    Cancel
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

            {/* Delete Location Modal */}
            {showDeleteModal && selectedLocation && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Delete Location</h3>
                        <p className="mb-4">
                            Are you sure you want to delete the location "{selectedLocation.name}"? This action cannot be undone.
                        </p>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteLocation}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Teams Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Randomly Assign Teams to Locations</h3>

                        {locations.length === 0 ? (
                            <p className="mb-4 text-yellow-400">
                                You need to add at least one location before you can assign teams.
                            </p>
                        ) : (
                            <>
                                <p className="mb-4">
                                    This will randomly assign all approved teams without a seat location to the defined locations based on their allocation percentages.
                                </p>

                                {Math.abs(totalPercentage - 100) > 5 && (
                                    <div className="bg-yellow-800 bg-opacity-25 text-yellow-300 p-3 rounded-md mb-4 flex items-start">
                                        <FaExclamationTriangle className="flex-shrink-0 mt-1 mr-2" />
                                        <div>
                                            <p className="font-semibold">Warning: Allocation total is not 100%</p>
                                            <p className="text-sm">
                                                The total allocation percentage across all locations is {totalPercentage}%. For balanced assignment, this should be 100%. You can adjust the percentages in the location settings.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-700 p-4 rounded-md mb-4">
                                    <h4 className="font-semibold mb-2">Allocation Summary</h4>
                                    <ul className="space-y-2">
                                        {locations.map(location => (
                                            <li key={location._id} className="flex justify-between">
                                                <span>{location.name}</span>
                                                <span>{location.allocationPercentage}%</span>
                                            </li>
                                        ))}
                                        <li className="flex justify-between font-semibold border-t border-gray-600 pt-2">
                                            <span>Total</span>
                                            <span className={totalPercentage === 100 ? "text-green-400" : "text-yellow-400"}>
                                                {totalPercentage}%
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={assignTeams}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center"
                                disabled={locations.length === 0}
                            >
                                <FaRandom className="mr-2" /> Assign Teams
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}