import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" component={DashboardPage} />
      </Switch>
    </Router>
  );
};

export default App;