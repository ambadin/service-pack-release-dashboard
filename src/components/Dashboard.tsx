import React, { useState } from 'react';
import ServicePackPlanning from './ServicePackPlanning';
import ServicePackOverview from './ServicePackOverview';
import ServicePackXlsxView from './ServicePackXlsxView';
import QuarterlyStatus from './QuarterlyStatus';
import TaskBoard from './TaskBoard';
import { useTasks } from '../hooks/useTasks';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'sp2026' | 'plan' | 'status' | 'quarterly' | 'guideline'>('overview');
    const { tasks, loading: tasksLoading, error: tasksError } = useTasks();

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
                        className={activeTab === 'quarterly' ? 'sidebar-tab sidebar-tab--active' : 'sidebar-tab'}
                        onClick={() => setActiveTab('quarterly')}
                    >
                        Quarterly Status
                    </button>
                </div>
                <button
                    type="button"
                    className="sidebar-guideline-button"
                    onClick={() => setActiveTab('guideline')}
                >
                    SP Guideline
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
                {activeTab === 'quarterly' && <QuarterlyStatus />}
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
                            data="/api/sp-guideline-pdf"
                            type="application/pdf"
                        >
                            <p>
                                Unable to display the PDF in this view.{' '}
                                <a
                                    href="/api/sp-guideline-pdf"
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
            </main>
        </div>
        </>
    );
};

export default Dashboard;