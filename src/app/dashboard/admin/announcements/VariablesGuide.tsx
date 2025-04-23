// src/app/dashboard/admin/announcements/VariablesGuide.tsx
import React, { useState } from 'react';
import { FaLightbulb, FaClipboard, FaCheck, FaChevronRight, FaChevronDown } from 'react-icons/fa';

interface Variable {
    key: string;
    description: string;
    example: string;
}

// Define available variables with examples
const variablesList: Variable[] = [
    {
        key: 'user.name',
        description: 'Current user\'s name',
        example: 'John Smith'
    },
    {
        key: 'user.email',
        description: 'Current user\'s email',
        example: 'john.smith@example.com'
    },
    {
        key: 'user.role',
        description: 'User role (admin/participant)',
        example: 'participant'
    },
    {
        key: 'team.name',
        description: 'Team name',
        example: 'Coding Ninjas'
    },
    {
        key: 'team.category',
        description: 'Team category',
        example: 'Web Development'
    },
    {
        key: 'team.location',
        description: 'Team\'s assigned seat location',
        example: 'Table A-12'
    },
    {
        key: 'team.members',
        description: 'List of team members',
        example: 'John Smith, Sarah Johnson, Mike Lee'
    },
    {
        key: 'team.leader',
        description: 'Team leader name',
        example: 'Sarah Johnson'
    },
    {
        key: 'team.status',
        description: 'Team status (pending/approved/rejected)',
        example: 'approved'
    },
    {
        key: 'team.memberCount',
        description: 'Number of team members',
        example: '3'
    },
    {
        key: 'team.maxSize',
        description: 'Maximum team size',
        example: '4'
    }
];

export default function VariablesGuide() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedVariable(text);
            setTimeout(() => setCopiedVariable(null), 2000);
        });
    };

    const exampleAnnouncement = `Hello {user.name},

Your team "{team.name}" has been assigned to {team.location} for the hackathon. 

Your team currently has {team.memberCount} members out of {team.maxSize} maximum. The team leader is {team.leader}.

Please make sure all team members arrive at the assigned location at least 30 minutes before the start of the event.

Good luck!`;

    return (
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
            <div
                className="bg-gray-700 p-4 flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center">
                    <FaLightbulb className="text-yellow-400 mr-2" />
                    <h3 className="text-lg font-semibold">Announcement Variables Guide</h3>
                </div>
                {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </div>

            {isExpanded && (
                <div className="p-4">
                    <p className="text-gray-300 mb-4">
                        You can personalize your announcements by using variables enclosed in curly braces.
                        When participants view the announcement, these variables will be replaced with their actual values.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-3 border-b border-gray-700 pb-2">Available Variables</h4>
                            <div className="space-y-2">
                                {variablesList.map((variable) => (
                                    <div key={variable.key} className="flex items-center justify-between">
                                        <div className="flex-grow">
                                            <div className="font-mono text-indigo-300 text-sm">
                                                {'{' + variable.key + '}'}
                                            </div>
                                            <div className="text-sm text-gray-400">{variable.description}</div>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard('{' + variable.key + '}')}
                                            className="ml-2 p-2 text-gray-400 hover:text-white"
                                            title="Copy to clipboard"
                                        >
                                            {copiedVariable === '{' + variable.key + '}' ? (
                                                <FaCheck className="text-green-500" />
                                            ) : (
                                                <FaClipboard />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3 border-b border-gray-700 pb-2">Example Announcement</h4>
                            <div className="bg-gray-900 p-3 rounded-md">
                                <pre className="text-sm text-gray-300 whitespace-pre-wrap">{exampleAnnouncement}</pre>
                            </div>
                            <div className="mt-4">
                                <h5 className="font-semibold text-sm border-b border-gray-700 pb-1 mb-2">For a specific user, this might appear as:</h5>
                                <div className="bg-gray-900 p-3 rounded-md">
                                    <div className="text-sm text-white whitespace-pre-wrap">
                                        {exampleAnnouncement
                                            .replace('{user.name}', 'Sarah Johnson')
                                            .replace('{team.name}', 'Coding Ninjas')
                                            .replace('{team.location}', 'Table A-12')
                                            .replace('{team.memberCount}', '3')
                                            .replace('{team.maxSize}', '4')
                                            .replace('{team.leader}', 'Sarah Johnson')}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-md p-3">
                                <h5 className="font-semibold text-blue-300 mb-1">Tips for using variables</h5>
                                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                                    <li>Variables will only be replaced if they exist for the user</li>
                                    <li>If a variable doesn't exist (e.g., if a user is not in a team), the variable will remain unchanged</li>
                                    <li>Test your announcements with the preview feature before sending</li>
                                    <li>As you type { } in the content field, a dropdown will appear to help you select variables</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}