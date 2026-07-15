import React from 'react';
import Dashboard from '../components/Dashboard';

const DashboardPage: React.FC = () => {
    return (
        <div className="dashboard-page">
            <h1>Service Pack Release Dashboard</h1>
            <Dashboard />
        </div>
    );
};

export default DashboardPage;