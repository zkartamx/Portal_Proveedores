import React, { useEffect, useState } from 'react';
import axios from 'axios';


const API_URL = "http://localhost:8080/api";

interface Request {
    id: number;
    title: string;
    description: string;
    deadline: string;
    quantity: number;
    units: string;
    tags: string;
    status: string;
}

export default function Dashboard() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [quotingReqId, setQuotingReqId] = useState<number | null>(null);
    const [quotedRequestIds, setQuotedRequestIds] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState<'requests' | 'docs'>('requests');
    const [supplierDocs, setSupplierDocs] = useState<string>("");
    const [isReviewed, setIsReviewed] = useState<boolean>(false);
    const [savingDocs, setSavingDocs] = useState(false);

    const [quoteForm, setQuoteForm] = useState({
        price: '',
        delivery_time: '',
        attachments: 'oferta.pdf',
        photo: ''
    });

    useEffect(() => {
        fetchRequests();
        loadQuotedStatus();
        fetchSupplierProfile();
    }, []);

    const fetchSupplierProfile = async () => {
        const id = localStorage.getItem('supplier_id');
        if (id) {
            try {
                const res = await axios.get(`${API_URL}/suppliers/${id}`);
                setSupplierDocs(res.data.documents || "");
                setIsReviewed(res.data.is_reviewed);
            } catch (e) {
                console.error("Error fetching supplier profile", e);
            }
        }
    };

    const saveDocs = async () => {
        const id = localStorage.getItem('supplier_id');
        if (!id) return;
        setSavingDocs(true);
        try {
            await axios.put(`${API_URL}/suppliers/${id}/docs`, { documents: supplierDocs });
            alert("Documentación actualizada correctamente");
        } catch (e) {
            console.error(e);
            alert("Error al guardar documentación");
        } finally {
            setSavingDocs(false);
        }
    };

    const loadQuotedStatus = () => {
        const supplierId = localStorage.getItem('supplier_id');
        if (supplierId) {
            try {
                const history = JSON.parse(localStorage.getItem(`quotes_${supplierId}`) || '[]');
                setQuotedRequestIds(history);
            } catch (e) {
                console.error("Error loading quote history", e);
            }
        }
    };

    const saveQuotedStatus = (reqId: number) => {
        const supplierId = localStorage.getItem('supplier_id');
        if (supplierId) {
            const history = JSON.parse(localStorage.getItem(`quotes_${supplierId}`) || '[]');
            if (!history.includes(reqId)) {
                history.push(reqId);
                localStorage.setItem(`quotes_${supplierId}`, JSON.stringify(history));
                setQuotedRequestIds([...history]);
            }
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await axios.get(`${API_URL}/solicitudes`);
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const startQuoting = (id: number) => {
        setQuotingReqId(id);
        setQuoteForm({
            price: '',
            delivery_time: 'Inmediato',
            attachments: 'oferta.pdf',
            photo: ''
        });
    };

    const submitQuote = async (e: React.FormEvent, reqId: number) => {
        e.preventDefault();

        try {
            const storedId = localStorage.getItem('supplier_id');
            const supplierId = parseInt(storedId || '0');

            if (!storedId || !supplierId) {
                alert(`Error de sesión (ID=${storedId}). Por favor cierra sesión y vuelve a ingresar.`);
                return;
            }

            await axios.post(`${API_URL}/ofertas`, {
                supplier_id: supplierId,
                request_id: reqId,
                price: parseFloat(quoteForm.price),
                delivery_time: quoteForm.delivery_time,
                conditions: "Standard terms",
                attachments: quoteForm.attachments,
                photo: quoteForm.photo || null,
                status: "sent"
            });
            alert("Oferta enviada correctamente!");
            saveQuotedStatus(reqId); // Updates state and localStorage
            setQuotingReqId(null);
        } catch (e: any) {
            console.error(e);
            const msg = e.response?.data || e.message || "Error desconocido";
            alert(`Error enviando oferta: ${typeof msg === 'object' ? JSON.stringify(msg) : msg}`);
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h2>Panel de Oportunidades</h2>
                <nav style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('requests')}
                        style={{ background: activeTab === 'requests' ? 'var(--primary)' : 'transparent', border: 'none', color: activeTab === 'requests' ? 'white' : 'var(--text-main)', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}
                    > Oportunidades </button>
                    <button
                        onClick={() => setActiveTab('docs')}
                        style={{ background: activeTab === 'docs' ? 'var(--primary)' : 'transparent', border: 'none', color: activeTab === 'docs' ? 'white' : 'var(--text-main)', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}
                    > Mi Documentación </button>
                </nav>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {localStorage.getItem('supplier_name') && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hola, {localStorage.getItem('supplier_name')}</span>}
                    <button className="logout-btn" onClick={handleLogout}>Cerrar Sesión</button>
                </div>
            </header>

            <main className="content-main">
                {activeTab === 'requests' ? (
                    !isReviewed ? (
                        <div className="request-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '2rem auto' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                            <h3>Perfil en Revisión</h3>
                            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                Aún no tienes acceso a las ofertas. Tu perfil y documentación están siendo revisados por nuestro equipo administrativo.
                                <br /><br />
                                Te notificaremos en cuanto tu cuenta sea validada por completo.
                            </p>
                        </div>
                    ) : (
                        <div className="request-grid">
                            {requests.length === 0 ? <p className="empty-msg">No hay solicitudes activas.</p> : (
                                requests.map(req => {
                                    const isQuoted = quotedRequestIds.includes(req.id);
                                    return (
                                        <div key={req.id} className="request-card">
                                            <div className="card-header">
                                                <h3>{req.title}</h3>
                                                <span className="badge">{req.status}</span>
                                            </div>
                                            <p className="description">{req.description}</p>
                                            <div className="details">
                                                <span><strong>Cantidad:</strong> {req.quantity} {req.units}</span>
                                                <span><strong>Límite:</strong> {new Date(req.deadline).toLocaleDateString()}</span>
                                            </div>

                                            {isQuoted ? (
                                                <button className="action-btn" disabled style={{ background: '#27ae60', cursor: 'default', opacity: 0.8, marginTop: '1rem' }}>
                                                    ✅ Enviada
                                                </button>
                                            ) : quotingReqId === req.id ? (
                                                <form onSubmit={(e) => submitQuote(e, req.id)} style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                                    <h4 style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Nueva Oferta</h4>
                                                    <div style={{ display: 'grid', gap: '10px', marginBottom: '10px' }}>
                                                        <input
                                                            autoFocus
                                                            type="number"
                                                            placeholder="Precio oferta ($)"
                                                            required
                                                            value={quoteForm.price}
                                                            onChange={e => setQuoteForm({ ...quoteForm, price: e.target.value })}
                                                            style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-main)', borderRadius: '4px' }}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Tiempo de entrega (ej: 3 días)"
                                                            required
                                                            value={quoteForm.delivery_time}
                                                            onChange={e => setQuoteForm({ ...quoteForm, delivery_time: e.target.value })}
                                                            style={{ padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-main)', borderRadius: '4px' }}
                                                        />

                                                        {/* File Input */}
                                                        <div style={{ position: 'relative' }}>
                                                            <input
                                                                type="file"
                                                                accept=".pdf"
                                                                id={`file-${req.id}`}
                                                                onChange={e => {
                                                                    if (e.target.files && e.target.files[0]) {
                                                                        setQuoteForm({ ...quoteForm, attachments: e.target.files[0].name });
                                                                    }
                                                                }}
                                                                style={{ display: 'none' }}
                                                            />
                                                            <label
                                                                htmlFor={`file-${req.id}`}
                                                                style={{
                                                                    display: 'block',
                                                                    padding: '8px',
                                                                    background: 'var(--bg-input)',
                                                                    border: '1px dashed var(--text-dim)',
                                                                    color: 'var(--text-muted)',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    textAlign: 'center'
                                                                }}
                                                            >
                                                                {quoteForm.attachments && quoteForm.attachments !== 'oferta.pdf' ?
                                                                    `📄 ${quoteForm.attachments}` :
                                                                    '📎 Adjuntar PDF'
                                                                }
                                                            </label>
                                                        </div>

                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button type="submit" className="action-btn" style={{ flex: 1 }}>Confirmar</button>
                                                        <button type="button" onClick={() => setQuotingReqId(null)} style={{ background: 'transparent', border: '1px solid var(--border-input)', color: 'var(--text-dim)', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button className="action-btn" onClick={() => startQuoting(req.id)}>Cotizar</button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )
                ) : (
                    <div className="request-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h3>Gestión de Documentos</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Especifique o adjunte los documentos requeridos para su validación como proveedor.</p>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Listado de Documentos:</label>
                            <textarea
                                value={supplierDocs}
                                onChange={e => setSupplierDocs(e.target.value)}
                                placeholder="Ej: Acta Constitutiva.pdf, Constancia Fiscal.pdf..."
                                style={{ width: '100%', minHeight: '120px', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '1rem' }}
                            />
                        </div>

                        <div style={{ padding: '1rem', background: 'var(--bg-details)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <h4 style={{ marginBottom: '10px' }}>Subir Nuevo Archivo</h4>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    type="file"
                                    id="doc-upload"
                                    style={{ display: 'none' }}
                                    onChange={async e => {
                                        if (e.target.files && e.target.files[0]) {
                                            const file = e.target.files[0];
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            try {
                                                const res = await axios.post(`${API_URL}/upload`, formData);
                                                const uploadedName = res.data.filename;
                                                setSupplierDocs(prev => prev ? `${prev}, ${uploadedName}` : uploadedName);
                                                alert("Archivo subido: " + file.name);
                                            } catch (err) {
                                                alert("Error subiendo archivo");
                                            }
                                        }
                                    }}
                                />
                                <label htmlFor="doc-upload" className="action-btn" style={{ background: '#34495e', padding: '8px 20px' }}>📁 Seleccionar PDF</label>
                                <span style={{ color: '#888', fontSize: '0.85rem' }}>* Los archivos serán validados por el administrador.</span>
                            </div>
                        </div>

                        <button
                            className="action-btn"
                            onClick={saveDocs}
                            disabled={savingDocs}
                            style={{ width: '100%', background: '#2ecc71', fontWeight: 'bold' }}
                        >
                            {savingDocs ? "Guardando..." : "💾 Guardar Documentación"}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
