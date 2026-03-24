import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import CandidateProfile from './pages/CandidateProfile';
import EmployerDashboard from './pages/EmployerDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import QueryConsole from './pages/QueryConsole';
import GraphExplorer from './pages/GraphExplorer';

const PrivateRoute = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem('gh_user') || 'null');
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={
          <PrivateRoute><CandidateProfile /></PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute role="employer"><EmployerDashboard /></PrivateRoute>
        } />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/console" element={<QueryConsole />} />
        <Route path="/admin/explorer" element={<GraphExplorer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
