import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import './App.css';
import axios from 'axios';
import { useEffect } from 'react';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/admin/config/email");
        const theme = res.data.ui_theme || 'dark';
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      } catch (e) {
        // Fallback to local
        const theme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', theme);
      }
    };
    fetchTheme();
  }, []);

  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
