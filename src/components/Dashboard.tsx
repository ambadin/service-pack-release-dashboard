import React, { useState } from 'react';
import ServicePackPlanning from './ServicePackPlanning';
import ServicePackOverview from './ServicePackOverview';
import ServicePackXlsxView from './ServicePackXlsxView';
import WindchillModal from './WindchillModal';
import TaskBoard from './TaskBoard';
import { useTasks } from '../hooks/useTasks';
import './Dashboard.css';

// Load SheetJS (xlsx) from CDN so no local install is required.
const loadXLSX = (): Promise<any> => {
    const existing = (window as any).XLSX;
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
        script.onload = () => {
            const lib = (window as any).XLSX;
            lib ? resolve(lib) : reject(new Error('SheetJS failed to load.'));
        };
        script.onerror = () => reject(new Error('Could not load the spreadsheet viewer library.'));
        document.body.appendChild(script);
    });
};

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'sp2026' | 'plan' | 'status' | 'q1' | 'q2' | 'q3' | 'q4' | 'document' | 'guideline'>('overview');
    const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
    const [docSheets, setDocSheets] = useState<{ name: string; rows: string[][] }[]>([]);
    const [docName, setDocName] = useState<string>('');
    const [docError, setDocError] = useState<string>('');
    const [docLoading, setDocLoading] = useState<boolean>(false);
    const [activeSheet, setActiveSheet] = useState<number>(0);
    const [showWindchillModal, setShowWindchillModal] = useState<boolean>(false);

    const renderWorkbook = async (bytes: Uint8Array, fileName: string) => {
        const XLSX = await loadXLSX();
        const workbook = XLSX.read(bytes, { type: 'array' });
        const allowedSheets = ['Win10 1607', 'Win10 1809', 'Win10 2021'];
        const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();
        const allowedNormalized = allowedSheets.map(normalize);
        const sheets = workbook.SheetNames
            .filter((name: string) => allowedNormalized.includes(normalize(name)))
            .map((name: string) => {
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' }) as string[][];
                const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
                const padded = rows.map((row) => {
                    const copy = row.slice();
                    while (copy.length < colCount) copy.push('');
                    return copy;
                });
                return { name, rows: padded };
            });
        setDocSheets(sheets);
        setDocName(fileName.replace(/\.(xlsx|xls|csv)$/i, ''));
    };

    const base64ToBytes = (base64: string): Uint8Array => {
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return bytes;
    };

    const showProductList = async () => {
        setActiveTab('document');
        setActiveSheet(0);
        setDocSheets([]);
        setDocError('');
        setDocLoading(true);
        try {
            // Try silently with .env credentials (POST body empty → server falls back to .env)
            const wcRes = await fetch('/api/windchill-product-list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            if (wcRes.status === 200) {
                const payload = await wcRes.json();
                await renderWorkbook(base64ToBytes(payload.dataBase64), payload.fileName);
                setDocLoading(false);
                return;
            }
            // 400 = no .env credentials → show the sign-in modal
            setDocLoading(false);
            setShowWindchillModal(true);
        } catch {
            // Network error (server not running etc.)
            setDocLoading(false);
            setShowWindchillModal(true);
        }
    };

    const connectWindchill = async (username: string, password: string): Promise<void> => {
        setDocSheets([]);
        setDocError('');
        const res = await fetch('/api/windchill-product-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            // Throw so the modal can catch and display the error
            throw new Error(data.error || `Request failed with status ${res.status}`);
        }
        await renderWorkbook(base64ToBytes(data.dataBase64), data.fileName);
        setShowWindchillModal(false);
    };

    return (
        <>
        <div className="dashboard dashboard--with-sidebar">
            <aside className="dashboard-sidebar">
                <div className="sidebar-tabs">
                    <button
                        type="button"
                        className={activeTab === 'overview' ? 'sidebar-tab sidebar-tab--active' : 'sidebar-tab'}
                        onClick={() => setActiveTab('overview')}
                    >
                        SP Strategy
                    </button>
                    <button
                        type="button"
                        className={activeTab === 'sp2026' ? 'sidebar-tab sidebar-tab--active' : 'sidebar-tab'}
                        onClick={() => setActiveTab('sp2026')}
                    >
                        SP 2026 plan
                    </button>
                    <button
                        type="button"
                        className={activeTab === 'q1' ? 'sidebar-tab sidebar-tab--active' : 'sidebar-tab'}
                        onClick={() => setActiveTab('q1')}
                    >
                        Q1-Status
                    </button>
                    <button
                        type="button"
                        className={activeTab === 'q2' ? 'sidebar-tab sidebar-tab--active' : 'sidebar-tab'}
                        onClick={() => setActiveTab('q2')}
                    >
                        Q2-Status
                    </button>
                    <button
                        type="button"
                        className={activeTab === 'q3' ? 'sidebar-tab sidebar-tab--active' : 'sidebar-tab'}
                        onClick={() => setActiveTab('q3')}
                    >
                        Q3-Status
                    </button>
                    <button
                        type="button"
                        className={activeTab === 'q4' ? 'sidebar-tab sidebar-tab--active' : 'sidebar-tab'}
                        onClick={() => setActiveTab('q4')}
                    >
                        Q4-Status
                    </button>
                </div>
                <button
                    type="button"
                    className="sidebar-guideline-button"
                    onClick={() => setActiveTab('guideline')}
                >
                    SP Guideline
                </button>
                <button
                    type="button"
                    className="sidebar-guideline-button"
                    onClick={showProductList}
                >
                    Product list
                </button>
            </aside>
            <main className="dashboard-main">
                {activeTab === 'overview' && <ServicePackOverview />}
                {activeTab === 'plan' && (
                    <div className="planning-dashboard">
                        <ServicePackPlanning />
                    </div>
                )}
                {activeTab === 'sp2026' && <ServicePackXlsxView sheetName="service-pack-planning" title="SP 2026 Plan" />}
                {activeTab === 'q1' && <ServicePackXlsxView sheetName="SP Plan - Q1" title="Q1 Status" />}
                {activeTab === 'q2' && <ServicePackXlsxView sheetName="SP Plan - Q2" title="Q2 Status" />}
                {activeTab === 'q3' && <ServicePackXlsxView sheetName="SP Plan - Q3" title="Q3 Status" />}
                {activeTab === 'q4' && <ServicePackXlsxView sheetName="SP Plan Q4" title="Q4 Status" />}
                {activeTab === 'status' && (
                    <div className="status-dashboard">
                        {tasksLoading && <div>Loading status...</div>}
                        {tasksError && <div className="error">Status load error: {tasksError}</div>}
                        {!tasksLoading && !tasksError && <TaskBoard tasks={tasks} />}
                    </div>
                )}
                {activeTab === 'guideline' && (
                    <div className="document-viewer">
                        <h2>SP Guideline</h2>
                        <object
                            className="guideline-frame"
                            data="/2009001390%20Service%20Pack%20Guideline_en.pdf"
                            type="application/pdf"
                        >
                            <p>
                                Unable to display the PDF in this view.{' '}
                                <a
                                    href="/2009001390%20Service%20Pack%20Guideline_en.pdf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open the SP Guideline in a new tab
                                </a>
                                .
                            </p>
                        </object>
                    </div>
                )}
                {activeTab === 'document' && (
                    <div className="document-viewer">
                        <h2>{docName || 'Document'}</h2>
                        {docLoading && <div>Loading document...</div>}
                        {docError && <div className="error">{docError}</div>}
                        {!docLoading && !docError && docSheets.length === 0 && (
                            <p>Select the downloaded file to view it here.</p>
                        )}
                        {!docLoading && !docError && docSheets.length > 0 && (
                            <>
                                <div className="document-tabs">
                                    {docSheets.map((sheet, idx) => (
                                        <button
                                            key={sheet.name}
                                            type="button"
                                            className={idx === activeSheet ? 'document-tab document-tab--active' : 'document-tab'}
                                            onClick={() => setActiveSheet(idx)}
                                        >
                                            {sheet.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="document-table-wrap">
                                    <table className="document-table">
                                        <tbody>
                                            {(docSheets[activeSheet]?.rows || []).map((row, rIdx) => (
                                                <tr key={rIdx}>
                                                    {row.map((cell, cIdx) => (
                                                        <td key={cIdx}>{String(cell)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
        {showWindchillModal && (
            <WindchillModal
                onClose={() => setShowWindchillModal(false)}
                onConnect={connectWindchill}
            />
        )}
        </>
    );
};

export default Dashboard;