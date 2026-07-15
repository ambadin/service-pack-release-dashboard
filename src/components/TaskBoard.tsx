import React from 'react';
import TaskCard, { Task } from './TaskCard';

const groupByAssignee = (tasks: Task[]) => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => {
        const who = t.assignedTo || 'Unassigned';
        if (!map[who]) map[who] = [];
        map[who].push(t);
    });
    return map;
};

const TaskBoard: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const byAssignee = groupByAssignee(tasks);

    return (
        <div className="taskboard">
            <h2>Eleva_Serviceability — PI-28 Iteration 2 — Taskboard</h2>
            <div className="assignees">
                {Object.entries(byAssignee).map(([assignee, items]) => (
                    <div key={assignee} className="assignee-column">
                        <h3>{assignee} <span className="count">({items.length})</span></h3>
                        <div className="tasks-list">
                            {items.map(task => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskBoard;
