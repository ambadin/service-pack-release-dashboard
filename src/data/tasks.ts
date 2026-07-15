import { Task } from '../components/TaskCard';

const mockTasks: Task[] = [
    { id: 101, title: 'Investigate crash on startup', assignedTo: 'Alice Johnson', state: 'In Progress', tags: ['bug','high-priority'], url: '#' },
    { id: 102, title: 'Add telemetry for feature X', assignedTo: 'Bob Smith', state: 'To Do', tags: ['enhancement'], url: '#' },
    { id: 103, title: 'Refactor authentication module', assignedTo: 'Charlie Doe', state: 'In Progress', tags: ['refactor'], url: '#' },
    { id: 104, title: 'Write unit tests for Y', assignedTo: 'Alice Johnson', state: 'To Do', url: '#' },
    { id: 105, title: 'Update release notes', assignedTo: 'Unassigned', state: 'To Do', url: '#' },
];

export default mockTasks;
