import { useEffect, useState } from 'react';
import mockTasks from '../data/tasks';
import { Task } from '../components/TaskCard';

type UseTasksResult = {
    tasks: Task[];
    loading: boolean;
    error?: string;
};

const buildAuthHeader = (pat?: string) => {
    if (!pat) return undefined;
    // Azure DevOps accepts a Basic auth with empty username and PAT as password
    const token = btoa(`:${pat}`);
    return `Basic ${token}`;
};

export function useTasks(): UseTasksResult {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await fetch('/api/tasks');
                if (!response.ok) {
                    throw new Error(`Task proxy request failed with status ${response.status}`);
                }
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setTasks(data as Task[]);
                } else {
                    setTasks(mockTasks as Task[]);
                }
            } catch (err) {
                console.error('useTasks fetch error', err);
                setError(err instanceof Error ? err.message : String(err));
                setTasks(mockTasks as Task[]);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    return { tasks, loading, error };
}

export default useTasks;
