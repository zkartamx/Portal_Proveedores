import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = "http://localhost:8080/api";

export default function Register() {
    const [formData, setFormData] = useState({
        name: '', contact: '', email: '', phone: '', password: '',
        confirmPassword: ''
    });
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Contraseñas no coinciden");
            return;
        }

        try {
            const payload = {
                name: formData.name,
                contact: formData.contact,
                email: formData.email,
                phone: formData.phone,
                password_hash: formData.password,
                created_at: new Date().toISOString().slice(0, 19),
                documents: "",
                active: false,
                is_reviewed: false,
                is_approved: false,
                is_audited: false
            };
            await axios.post(`${API_URL}/register`, payload);
            alert("Gracias por registrarse en nuestro portal. En breve recibirá una respuesta.");
            navigate('/login');
        } catch (err: any) {
            if (err.response?.status === 409) {
                alert(err.response.data);
            } else {
                alert("Error en el servidor. Intente más tarde.");
            }
            console.error(err);
        }
    };

    return (
        <div className="auth-container">
            <h1>Registro Proveedor</h1>
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group"><input name="name" placeholder="Empresa" onChange={handleChange} required /></div>
                <div className="form-group"><input name="contact" placeholder="Contacto" onChange={handleChange} required /></div>
                <div className="form-group"><input name="email" type="email" placeholder="Correo" onChange={handleChange} required /></div>
                <div className="form-group"><input name="phone" placeholder="Teléfono" onChange={handleChange} required /></div>
                <div className="form-group"><input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required /></div>
                <div className="form-group"><input name="confirmPassword" type="password" placeholder="Confirmar" onChange={handleChange} required /></div>
                <button type="submit">Registrar</button>
            </form>
            <Link to="/login">Volver al login</Link>
        </div>
    );
}
