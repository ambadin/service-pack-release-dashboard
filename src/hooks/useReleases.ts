import { useEffect, useState } from 'react';
import { releases as initialReleases, Release } from '../data/releases';

const useReleases = () => {
    const [releases, setReleases] = useState<Release[]>(initialReleases);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReleases = async () => {
            try {
                const response = await fetch('/api/releases');
                if (!response.ok) {
                    throw new Error('Failed to fetch releases');
                }
                const data: Release[] = await response.json();
                setReleases(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
                setReleases(initialReleases);
            } finally {
                setLoading(false);
            }
        };

        fetchReleases();
    }, []);

    const updateRelease = (id: number, updatedRelease: Partial<Release>) => {
        setReleases((prevReleases) =>
            prevReleases.map((release) =>
                release.id === id ? { ...release, ...updatedRelease } : release
            )
        );
    };

    return { releases, loading, error, updateRelease };
};

export default useReleases;