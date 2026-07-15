import React from 'react';

export interface Task {
    id: number;
    title: string;
    assignedTo: string;
    state: string;
    tags?: string[];
    url?: string;
}

const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    return (
        <div className="task-card">
            <a href={task.url} target="_blank" rel="noopener noreferrer" className="task-title">{task.title}</a>
            <div className="task-meta">{task.state} • {task.assignedTo}</div>
            {task.tags && task.tags.length > 0 && (
                <div className="task-tags">{task.tags.join(', ')}</div>
            )}
        </div>
    );
};

export default TaskCard;
