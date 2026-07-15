import React from 'react';
import StatusBadge from './StatusBadge';

interface ReleaseCardProps {
    release: {
        id: number;
        title: string;
        status: 'In Progress' | 'Completed' | 'Pending';
        plannedDate: string;
    };
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({ release }) => {
    const { title, status, plannedDate } = release;
    return (
        <div className="release-card">
            <h3>{title}</h3>
            <StatusBadge status={status as 'In Progress' | 'Completed' | 'Pending'} />
            <p>Planned Release Date: {plannedDate}</p>
        </div>
    );
};

export default ReleaseCard;