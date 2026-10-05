import React, { useEffect, useState } from 'react';

// ── SheetJS CDN loader ────────────────────────────────────────────────────────
export const loadXLSX = (): Promise<any> => {
    const existing = (window as any).XLSX;
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
        script.onload = () => {
            const lib = (window as any).XLSX;
            lib ? resolve(lib) : reject(new Error('SheetJS failed to load.'));
        };
        script.onerror = () => reject(new Error('Could not load the spreadsheet library.'));
        document.body.appendChild(script);
    });
};

// ── Module-level cache: all tab instances share one network request ───────────
let cachedBytes: Uint8Array | null = null;
let inflightPromise: Promise<Uint8Array> | null = null;

export const getXlsxBytes = (): Promise<Uint8Array> => {
    if (cachedBytes) return Promise.resolve(cachedBytes);
    if (inflightPromise) return inflightPromise;
    inflightPromise = fetch('/api/service-pack-xlsx')
        .then((res) => {
            if (!res.ok) throw new Error(`Server returned ${res.status}. Make sure the Express server is running (npm run server).`);
            return res.json();
        })
        .then((payload: { dataBase64: string }) => {
            const binary = window.atob(payload.dataBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
            cachedBytes = bytes;
            return bytes;
        })
        .catch((err) => {
            inflightPromise = null; // allow retry on next mount
            throw err;
        });
    return inflightPromise;
};

// ── Status pill classification ────────────────────────────────────────────────
const statusClass = (value: string): string => {
    const v = String(value).trim().toLowerCase();
    if (v === 'completed' || v === 'done') return 'xlsx-cell--completed';
    if (v === 'in progress' || v === 'in-progress') return 'xlsx-cell--in-progress';
    if (v === 'blocked') return 'xlsx-cell--blocked';
    if (v === 'yet to start' || v === 'pending' || v === 'not started') return 'xlsx-cell--pending';
    return '';
};

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
    sheetName: string;
    title?: string;
}

const ServicePackXlsxView: React.FC<Props> = ({ sheetName, title }) => {
    const [rows, setRows] = useState<string[][]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        setRows([]);

        Promise.all([getXlsxBytes(), loadXLSX()])
            .then(([bytes, XLSX]) => {
                if (cancelled) return;
                const workbook = XLSX.read(bytes, { type: 'array' });
                const sheet = workbook.Sheets[sheetName];
                if (!sheet) {
                    const available = workbook.SheetNames.join(', ');
                    throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${available}`);
                }
                const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
                // Pad all rows to the same column count
                const colCount = rawRows.reduce((max, row) => Math.max(max, row.length), 0);
                const padded = rawRows.map((row) => {
                    const copy = row.slice();
                    while (copy.length < colCount) copy.push('');
                    return copy;
                });
                setRows(padded);
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message || 'Failed to load spreadsheet data.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [sheetName]);

    if (loading) {
        return <div className="xlsx-state xlsx-state--loading">Loading {title || sheetName}…</div>;
    }
    if (error) {
        return <div className="xlsx-state xlsx-state--error">{error}</div>;
    }
    if (rows.length === 0) {
        return <div className="xlsx-state xlsx-state--empty">No data found in "{sheetName}".</div>;
    }

    const [headerRow, ...bodyRows] = rows;

    return (
        <section className="xlsx-view">
            {title && <h2 className="xlsx-view__title">{title}</h2>}
            <div className="xlsx-table-wrap">
                <table className="xlsx-table">
                    <thead>
                        <tr>
                            {headerRow.map((cell, cIdx) => (
                                <th
                                    key={cIdx}
                                    className={cIdx === 0 ? 'xlsx-th xlsx-th--first' : 'xlsx-th'}
                                >
                                    {String(cell)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {bodyRows.map((row, rIdx) => (
                            <tr key={rIdx} className="xlsx-tr">
                                {row.map((cell, cIdx) => {
                                    const sc = statusClass(cell);
                                    const cls = cIdx === 0
                                        ? 'xlsx-td xlsx-td--label'
                                        : `xlsx-td${sc ? ` ${sc}` : ''}`;
                                    return (
                                        <td key={cIdx} className={cls}>
                                            {cIdx === 0
                                                ? String(cell)
                                                : <span className="xlsx-status-pill">{String(cell)}</span>
                                            }
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default ServicePackXlsxView;
