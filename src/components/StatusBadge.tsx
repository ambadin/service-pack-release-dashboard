import React from 'react';

interface StatusBadgeProps {
    status: 'In Progress' | 'Completed' | 'Pending';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    let badgeClass = '';

    switch (status) {
        case 'In Progress':
            badgeClass = 'badge-in-progress';
            break;
        case 'Completed':
            badgeClass = 'badge-completed';
            break;
        case 'Pending':
            badgeClass = 'badge-pending';
            break;
        default:
            badgeClass = '';
    }

    return <span className={`status-badge ${badgeClass}`}>{status}</span>;
};

export default StatusBadge;