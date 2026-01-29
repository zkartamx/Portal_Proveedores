import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = "http://localhost:8080/api";

interface Supplier {
    id: number;
    name: string;
    email: string;
    contact: string;
    documents: string;
    active: boolean;
    created_at: string;
    is_reviewed: boolean;
    is_approved: boolean;
    is_audited: boolean;
}

interface Offer {
    id: number;
    supplier_id: number;
    request_id: number;
    price: number;
    delivery_time: string;
    attachments: string;
    status: string;
    created_at?: string; // Optional because legacy data might miss it if DB not reloaded
}

interface Request {
    id: number;
    title: string;
    description: string;
    quantity: number;
    units: string;
    deadline: string;
    status: string;
    origin_erp: string;
}

const renderDocs = (docs: string) => {
    if (!docs) return <em style={{ color: '#666' }}>Sin documentos</em>;
    return docs.split(',').map((d, i) => {
        const name = d.trim();
        if (!name) return null;
        return (
            <a
                key={i}
                href={`${API_URL}/uploads/${name}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#3498db', textDecoration: 'underline', marginRight: '8px', fontSize: '0.85rem' }}
            >
                📄 {name.length > 20 ? name.substring(0, 10) + '...' + name.substring(name.length - 5) : name}
            </a>
        );
    });
};

export default function Admin() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [approvedSuppliers, setApprovedSuppliers] = useState<Supplier[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [requests, setRequests] = useState<Request[]>([]);
    const [testing, setTesting] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [showLogs, setShowLogs] = useState(true);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev]);
        console.log(`[${time}] ${msg}`);
    };

    const [config, setConfig] = useState({
        smtp_host: '', smtp_port: 587, smtp_user: '', smtp_password: '', smtp_from: ''
    });

    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchPending();
        fetchConfig();
        fetchOffers();
        fetchRequests();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/config/email`);
            setConfig(res.data);
        } catch (e) {
            console.error(e);
        }
    }

    const saveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/admin/config/email`, config);
            alert("Configuración de correo actualizada");
        } catch (e) {
            console.error(e);
            alert("Error guardando config");
        }
    }

    const testConfig = async () => {
        setTesting(true);
        addLog(`Iniciando prueba de correo a: ${config.smtp_from}...`);
        addLog(`Configuración: Host=${config.smtp_host}, Port=${config.smtp_port}, User=${config.smtp_user}`);

        try {
            const res = await axios.post(`${API_URL}/admin/config/test`, config);
            addLog("Respuesta del servidor: " + res.status);
            addLog("Éxito: " + res.data);
            alert("Correo de prueba enviado exitosamente.");
        } catch (e: any) {
            console.error(e);
            const errMsg = e.response?.data || e.message;
            addLog("ERROR: " + errMsg);
            alert("Error enviando prueba: " + errMsg);
        } finally {
            setTesting(false);
            addLog("Prueba finalizada.");
        }
    }

    const fetchPending = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/suppliers`);
            setSuppliers(res.data);

            // Also fetch approved
            const resApproved = await axios.get(`${API_URL}/admin/suppliers/approved`);
            setApprovedSuppliers(resApproved.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchOffers = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/ofertas`);
            setOffers(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await axios.get(`${API_URL}/solicitudes`);
            setRequests(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const approve = async (id: number) => {
        try {
            await axios.put(`${API_URL}/admin/approve/${id}`);
            alert("Proveedor aprobado y notificado.");
            fetchPending();
        } catch (e) {
            console.error(e);
            alert("Error al aprobar.");
        }
    };

    const reject = async (id: number) => {
        if (!confirm("¿Estás seguro de RECHAZAR y eliminar esta solicitud?")) return;
        try {
            await axios.delete(`${API_URL}/admin/reject/${id}`);
            alert("Proveedor rechazado y eliminado.");
            fetchPending();
        } catch (e) {
            console.error(e);
            alert("Error al rechazar.");
        }
    };

    // Calculate Stats
    const stats = {
        total: suppliers.length + approvedSuppliers.length,
        pending: suppliers.length,
        active: approvedSuppliers.length
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div>
                        <div className="page-header">
                            <h1>Resumen del Sistema</h1>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>Total Proveedores</h3>
                                <p className="stat-value">{stats.total}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Sol. Pendientes</h3>
                                <p className="stat-value" style={{ color: '#f1c40f' }}>{stats.pending}</p>
                            </div>
                            <div className="stat-card">
                                <h3>Proveedores Activos</h3>
                                <p className="stat-value" style={{ color: '#2ecc71' }}>{stats.active}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'pending':
                return (
                    <div>
                        <div className="page-header">
                            <h1>Solicitudes Pendientes</h1>
                        </div>
                        {suppliers.length === 0 ? <p>No hay solicitues pendientes.</p> : (
                            <div className="request-grid">
                                {suppliers.map(s => (
                                    <div key={s.id} className="request-card">
                                        <h3>{s.name}</h3>
                                        <p>{s.contact} ({s.email})</p>
                                        <div className="details">
                                            <span><strong>Registro:</strong> {new Date(s.created_at).toLocaleDateString()}</span>
                                            <div><strong>Documentos:</strong> {renderDocs(s.documents)}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button className="action-btn" onClick={() => approve(s.id)}>Aprobar</button>
                                            <button className="action-btn" style={{ background: '#d63031' }} onClick={() => reject(s.id)}>Rechazar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'directory':
                return (
                    <div>
                        <div className="page-header">
                            <h1>Directorio de Proveedores</h1>
                        </div>
                        {approvedSuppliers.length === 0 ? <p>No hay proveedores activos.</p> : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Contacto</th>
                                        <th>Fecha Registro</th>
                                        <th>Documentos</th>
                                        <th title="Revisado">Rev.</th>
                                        <th title="Aprobado">Apro.</th>
                                        <th title="Auditado">Audi.</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approvedSuppliers.map(s => {
                                        const toggleCompliance = async (field: string, val: boolean) => {
                                            try {
                                                const payload = {
                                                    is_reviewed: field === 'rev' ? val : s.is_reviewed,
                                                    is_approved: field === 'apro' ? val : s.is_approved,
                                                    is_audited: field === 'audi' ? val : s.is_audited
                                                };
                                                await axios.put(`${API_URL}/admin/compliance/${s.id}`, payload);
                                                fetchPending(); // Refresh table
                                            } catch (e) {
                                                alert("Error actualizando cumplimiento");
                                            }
                                        };

                                        return (
                                            <tr key={s.id}>
                                                <td>#{s.id}</td>
                                                <td><strong>{s.name}</strong></td>
                                                <td>{s.email}</td>
                                                <td>{s.contact}</td>
                                                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                                                <td>{renderDocs(s.documents)}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={s.is_reviewed}
                                                        onChange={(e) => toggleCompliance('rev', e.target.checked)}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={s.is_approved}
                                                        onChange={(e) => toggleCompliance('apro', e.target.checked)}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={s.is_audited}
                                                        onChange={(e) => toggleCompliance('audi', e.target.checked)}
                                                    />
                                                </td>
                                                <td><span className="status-badge">ACTIVO</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            case 'offers':
                return (
                    <div>
                        <div className="page-header">
                            <h1>Cotizaciones Recibidas</h1>
                        </div>
                        {offers.length === 0 ? <p>No hay cotizaciones registradas.</p> : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Cotización Enviada</th>
                                        <th>Req. ID</th>
                                        <th>Prov. ID</th>
                                        <th>Precio</th>
                                        <th>Entrega</th>
                                        <th>Adjunto</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offers.map(o => (
                                        <tr key={o.id}>
                                            <td>#{o.id}</td>
                                            <td>{o.created_at ? new Date(o.created_at).toLocaleString() : '-'}</td>
                                            <td>REQ-{o.request_id}</td>
                                            <td>SUP-{o.supplier_id}</td>
                                            <td>${o.price}</td>
                                            <td>{o.delivery_time}</td>
                                            <td>{o.attachments}</td>
                                            <td>
                                                <span className={`status-badge`} style={{
                                                    background: o.status === 'ganadora' ? '#27ae60' : '#f39c12'
                                                }}>
                                                    {o.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            case 'products':
                return (
                    <div>
                        <div className="page-header">
                            <h1>Productos Ofertados (Solicitudes)</h1>
                        </div>
                        {requests.length === 0 ? <p>No hay productos activos para cotizar.</p> : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Código ERP</th>
                                        <th>Título</th>
                                        <th>Cantidad</th>
                                        <th>Deadline</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(r => (
                                        <tr key={r.id}>
                                            <td>#{r.id}</td>
                                            <td>{r.origin_erp}</td>
                                            <td><strong>{r.title}</strong></td>
                                            <td>{r.quantity} {r.units}</td>
                                            <td>{new Date(r.deadline).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge`} style={{
                                                    background: r.status === 'open' ? '#3498db' : '#2ecc71'
                                                }}>
                                                    {r.status.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                );
            case 'settings':
                return (
                    <div>
                        <div className="page-header">
                            <h1>Configuración del Sistema</h1>
                        </div>
                        <div className="auth-container" style={{ margin: '0', maxWidth: '600px' }}>
                            <h3>Servidor SMTP</h3>
                            <form onSubmit={saveConfig} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Host</label>
                                    <input value={config.smtp_host} onChange={e => setConfig({ ...config, smtp_host: e.target.value })} placeholder="smtp.gmail.com" />
                                </div>
                                <div className="form-group">
                                    <label>Port</label>
                                    <input type="number" value={config.smtp_port} onChange={e => setConfig({ ...config, smtp_port: parseInt(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>User</label>
                                    <input value={config.smtp_user} onChange={e => setConfig({ ...config, smtp_user: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input type="password" value={config.smtp_password} onChange={e => setConfig({ ...config, smtp_password: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>From Email</label>
                                    <input value={config.smtp_from} onChange={e => setConfig({ ...config, smtp_from: e.target.value })} />
                                </div>

                                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '5px' }}>
                                    <label className="switch">
                                        <input type="checkbox" checked={showLogs} onChange={e => setShowLogs(e.target.checked)} />
                                        <span className="slider"></span>
                                        <span>Mostrar Logs</span>
                                    </label>
                                </div>

                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
                                    <button type="submit" style={{ flex: 1 }}>Guardar</button>
                                    <button type="button" onClick={testConfig} disabled={testing} style={{ flex: 1, background: '#6c5ce7', opacity: testing ? 0.7 : 1 }}>
                                        {testing ? "Enviando..." : "Prueba"}
                                    </button>
                                </div>
                            </form>

                            <div style={{ marginTop: '2rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                                <h4 style={{ color: '#e74c3c' }}>Zona de Peligro</h4>
                                <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>
                                    Esta acción eliminará TODOS los proveedores, solicitudes y cotizaciones. Úselo solo para limpiar datos de prueba.
                                </p>
                                <button
                                    className="action-btn"
                                    style={{ background: '#c0392b', width: '100%' }}
                                    onClick={async () => {
                                        if (confirm("⚠️ ¿ESTÁS SEGURO? \n\nEsto borrará TODA la base de datos (Proveedores, Solicitudes, Ofertas).\n\nEsta acción NO se puede deshacer.")) {
                                            if (confirm("Confirmación final: ¿Realmente deseas eliminar todo?")) {
                                                try {
                                                    await axios.delete(`${API_URL}/admin/reset`);
                                                    alert("Base de datos limpiada correctamente.");
                                                    window.location.reload();
                                                } catch (e) {
                                                    console.error(e);
                                                    alert("Error al limpiar la base de datos.");
                                                }
                                            }
                                        }
                                    }}
                                >
                                    🗑️ Limpiar Registros (Reset DB)
                                </button>
                            </div>

                            {showLogs && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.5rem',
                                    background: '#111',
                                    border: '1px solid #333',
                                    borderRadius: '4px',
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem',
                                    color: '#0f0'
                                }}>
                                    {logs.length === 0 ? <span style={{ color: '#555' }}>Logs de actividad...</span> : logs.map((l, i) => (
                                        <div key={i}>{l}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'docs':
                return (
                    <div>
                        <div className="page-header">
                            <h1>Integración ERP (API)</h1>
                        </div>
                        <div className="request-card" style={{ maxWidth: '800px', lineHeight: '1.6' }}>
                            <h3>Documentación de Web Services</h3>
                            <p>Utilice este endpoint para sincronizar requerimientos de productos desde el ERP.</p>

                            <hr style={{ borderColor: '#444', margin: '1rem 0' }} />

                            <h4>Autenticación</h4>
                            <p>Header requerido: <code style={{ background: '#333', padding: '2px 5px', borderRadius: '4px', color: '#e67e22' }}>X-API-KEY: secret-erp-key</code></p>

                            <h4>Endpoint</h4>
                            <p><code style={{ background: '#333', padding: '2px 5px', borderRadius: '4px' }}>POST /api/erp/import</code></p>

                            <h4>Ejemplo JSON</h4>
                            <pre style={{ background: '#111', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem' }}>
                                {`[
  {
    "external_id": "REQ-1001",
    "title": "Acero Inoxidable 304",
    "description": "Láminas de calibre 18, 4x8 pies.",
    "quantity": 50,
    "units": "Piezas",
    "deadline": "2026-02-15T00:00:00"
  }
]`}
                            </pre>

                            <hr style={{ borderColor: '#444', margin: '2rem 0' }} />

                            <h4>Simulación de Pruebas</h4>
                            <p>Utilice esta herramienta para cargar automáticamente 10 productos de prueba y verificar el flujo del sistema sin nececidad de Postman.</p>

                            <button
                                className="action-btn"
                                style={{ background: '#3498db', marginTop: '10px' }}
                                onClick={async () => {
                                    if (confirm("¿Desea generar y cargar 10 productos de prueba desde el 'ERP'?")) {
                                        try {
                                            const dummyRequests = Array.from({ length: 10 }, (_, i) => ({
                                                external_id: `SIM-${Date.now()}-${i}`,
                                                title: `Producto de Prueba ${i + 1}`,
                                                description: `Descripción simulada para el producto ${i + 1}. Requerimiento urgente.`,
                                                quantity: Math.floor(Math.random() * 100) + 1,
                                                units: "Piezas",
                                                deadline: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 19),
                                                tags: "simulacion,urgente"
                                            }));

                                            const res = await axios.post(`${API_URL}/erp/import`, dummyRequests, {
                                                headers: { 'X-API-KEY': 'secret-erp-key' }
                                            });

                                            alert(`Éxito: ${res.data.message}`);
                                            fetchRequests();
                                            // Refresh stats if needed?
                                        } catch (e: any) {
                                            console.error(e);
                                            alert("Error en la simulación: " + (e.response?.data || e.message));
                                        }
                                    }
                                }}
                            >
                                📥 Simular Carga ERP (10 Productos)
                            </button>
                        </div>
                    </div>
                );
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className="admin-container">
            <aside className="sidebar">
                <h2>Admin Portal</h2>
                <nav>
                    <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        🏠 Resumen
                    </button>
                    <button className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                        ⏳ Pendientes
                        {stats.pending > 0 && <span className="badge" style={{ marginLeft: 'auto', background: '#e74c3c', color: 'white' }}>{stats.pending}</span>}
                    </button>
                    <button className={`nav-item ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}>
                        📄 Ofertas
                    </button>
                    <button className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                        📦 Productos
                    </button>
                    <button className={`nav-item ${activeTab === 'directory' ? 'active' : ''}`} onClick={() => setActiveTab('directory')}>
                        👥 Directorio
                    </button>
                    <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        ⚙️ Configuración
                    </button>
                    <button className={`nav-item ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
                        📚 Documentación
                    </button>

                    <Link to="/login" className="nav-item logout-nav">
                        🚪 Cerrar Sesión
                    </Link>
                </nav>
            </aside>

            <main className="content-area">
                {renderContent()}
            </main>
        </div>
    );
}
