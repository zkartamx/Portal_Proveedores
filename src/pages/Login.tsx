import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = "http://localhost:8080/api";

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('supplier_id', res.data.user.id);
            localStorage.setItem('supplier_name', res.data.user.name);
            window.location.href = "/dashboard";
        } catch (err: any) {
            setError(err.response?.data || 'Invalid credentials or server error');
            console.error(err);
        }
    };

    const [config, setConfig] = useState<any>(null);

    React.useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${API_URL}/admin/config/email`);
                setConfig(res.data);
            } catch (e) {
                console.error("No se pudo cargar la configuración de imagen:", e);
            }
        };
        fetchConfig();
    }, []);

    const imageUrl = config?.login_image_url;
    const finalImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${API_URL}/uploads/${imageUrl}`) : null;

    return (
        <div className="auth-container">
            {finalImageUrl && (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <img
                        src={finalImageUrl}
                        alt="Portal Logo"
                        style={{ maxWidth: '180px', maxHeight: '100px', objectFit: 'contain' }}
                    />
                </div>
            )}
            <h1 style={{ marginTop: finalImageUrl ? '0' : '1rem' }}>Portal Proveedores</h1>
            <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Correo</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Ingresar</button>
            </form>
            {error && <p className="error-msg">{error}</p>}
            <p>
                <Link to="/register">Crear cuenta</Link>
            </p>
        </div>
    );
}
