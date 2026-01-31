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
    // 1. Aplicar tema guardado localmente de inmediato para evitar parpadeos
    const cachedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', cachedTheme);

    const fetchTheme = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/admin/config/email");
        if (res.data && res.data.ui_theme) {
          const theme = res.data.ui_theme;
          document.body.setAttribute('data-theme', theme);
          localStorage.setItem('theme', theme);
        }
      } catch (e) {
        console.warn("No se pudo sincronizar el tema global, usando cache.");
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
