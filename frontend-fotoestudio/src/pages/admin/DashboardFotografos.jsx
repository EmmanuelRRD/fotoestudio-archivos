import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const DashboardFotografos = () => {
    const API_URL_GEN = import.meta.env.VITE_API_URL
    const [fotografos, setFotografos] = useState([]);
    const [fotografoSeleccionado, setFotografoSeleccionado] = useState(null);
    const [buscar, setBuscar] = useState('');
    const [error, setError] = useState(null);

    const [urlActual, setUrlActual] = useState(API_URL_GEN+'/api/fotografos/');
    const [paginas, setPaginas] = useState({ next: null, previous: null, total: 0 });
    const [paginaActual, setPaginaActual] = useState(1);

    const getHeaders = () => {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    // CONSULTA GENERAL
    const obtenerFotografos = () => {
        fetch(urlActual, { method: 'GET', headers: getHeaders() })
            .then(res => {
                if (res.status === 401) {
                    Swal.fire({
                        title: '¡Sesión vencida!',
                        text: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
                        icon: 'warning',
                        background: '#000000',       // Fondo negro
                        color: '#ffffff',            // Letras blancas 
                        confirmButtonText: 'Ir al Login',
                        confirmButtonColor: '#dc3545',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            localStorage.clear();
                            navigate('/login');
                        }
                    });

                    return;
                }
                if (!res.ok) throw new Error("Error al cargar la agenda.");
                return res.json();
            })
            .then(data => {
                const lista = data.results || data;
                if (Array.isArray(lista)) {
                    setFotografos(lista);
                }

                setPaginas({
                    next: data.next,
                    previous: data.previous,
                    total: data.count || lista.length
                });
            })
            .catch(err => setError(err.message || err));
    };

    // Disparador automático al cambiar de página o URL
    useEffect(() => {
        obtenerFotografos();
    }, [urlActual]);

    const verDetalleFotografo = (id) => {
        fetch(`${API_URL_GEN}/api/fotografos/${id}/`, { method: 'GET', headers: getHeaders() })
            .then(res => res.ok ? res.json() : Promise.reject("No se encontró el registro de este fotógrafo."))
            .then(data => setFotografoSeleccionado(data))
            .catch(err => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error en Django REST',
                    text: err,
                    background: '#09090b',         
                    color: '#f4f4f5',              
                    confirmButtonColor: '#dc2626',
                    customClass: {
                        popup: 'border border-zinc-800 rounded-2xl shadow-2xl font-sans',
                        title: 'text-red-500 font-black'
                    }
                });
            });
    };

    // Funciones de control de páginas
    const irPaginaSiguiente = () => {
        if (paginas.next) {
            setUrlActual(paginas.next);
            setPaginaActual(prev => prev + 1);
        }
    };

    const irPaginaAnterior = () => {
        if (paginas.previous) {
            setUrlActual(paginas.previous);
            setPaginaActual(prev => prev - 1);
        }
    };

    const fotografosFiltrados = fotografos.filter(f =>
        `${f.first_name || ''} ${f.last_name || ''}`.toLowerCase().includes(buscar.toLowerCase()) ||
        (f.username && f.username.toLowerCase().includes(buscar.toLowerCase())) ||
        (f.email && f.email.toLowerCase().includes(buscar.toLowerCase()))
    );

    return (
        <div className="space-y-6">

            {/* Encabezado del Módulo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 p-6 border border-zinc-800 rounded-3xl">
                <div>
                    <h3 className="text-2xl font-black text-white">📸 Plantilla de Fotógrafos</h3>
                    <p className="text-xs text-zinc-400 mt-1">Directorio de colaboradores activos (Total en DB: {paginas.total})</p>
                </div>
                <input
                    type="text"
                    placeholder="Buscar en esta página..."
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 w-full sm:w-80 font-medium"
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                />
            </div>

            {error && (
                <div className="p-4 bg-red-900/30 border border-red-500 rounded-xl text-red-200 text-sm font-semibold">
                    ⚠️ {error}
                </div>
            )}

            {/* Grid de Tarjetas de Fotógrafos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fotografosFiltrados.length > 0 ? (
                    fotografosFiltrados.map(f => (
                        <div
                            key={f.id}
                            className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-700 transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                {/* Avatar con iniciales */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-md uppercase">
                                        {(f.first_name?.[0] || '')}{(f.last_name?.[0] || '')}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                                            {f.first_name} {f.last_name}
                                        </h4>
                                        <p className="text-xs text-zinc-500 font-mono">@{f.username}</p>
                                    </div>
                                </div>

                                {/* Datos de contacto */}
                                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/80 space-y-1.5 text-xs font-medium">
                                    <div className="text-zinc-400 truncate">
                                        <span className="text-zinc-600">✉️</span> {f.email}
                                    </div>
                                    <div className="text-zinc-400">
                                        <span className="text-zinc-600">🏷️</span> Rol: <span className="text-amber-500 font-bold uppercase text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{f.tipo_usuario}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Botón de Consulta Unitaria */}
                            <div className="mt-6 pt-4 border-t border-zinc-800/60">
                                <button
                                    onClick={() => verDetalleFotografo(f.id)}
                                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <span>👁️</span> Ver Ficha del Colaborador
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-16 bg-zinc-900 border border-zinc-800 border-dashed rounded-3xl text-zinc-500 italic">
                        No se encontraron fotógrafos registrados en esta página.
                    </div>
                )}
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 px-6 py-4 rounded-2xl">
                <span className="text-xs text-zinc-400 font-medium">
                    Mostrando página <strong className="text-zinc-200 font-mono">{paginaActual}</strong> de la lista
                </span>
                <div className="flex gap-3">
                    <button
                        onClick={irPaginaAnterior}
                        disabled={!paginas.previous}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!paginas.previous ? 'bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed' : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300 cursor-pointer'}`}
                    >
                        ⬅️ Anterior
                    </button>
                    <button
                        onClick={irPaginaSiguiente}
                        disabled={!paginas.next}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!paginas.next ? 'bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed' : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300 cursor-pointer'}`}
                    >
                        Siguiente ➡️
                    </button>
                </div>
            </div>

            {/* MODAL: DETALLE UNITARIO */}
            {fotografoSeleccionado && (
                <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden text-zinc-200">

                        <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-500">Ficha Técnica de Personal</span>
                            <button
                                onClick={() => setFotografoSeleccionado(null)}
                                className="text-zinc-500 hover:text-white font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-2xl flex items-center justify-center font-black text-white text-2xl mx-auto shadow-lg uppercase">
                                    {(fotografoSeleccionado.first_name?.[0] || '')}{(fotografoSeleccionado.last_name?.[0] || '')}
                                </div>
                                <h4 className="text-xl font-black text-white">{`${fotografoSeleccionado.first_name || ''} ${fotografoSeleccionado.last_name || ''}`}</h4>
                                <p className="text-xs text-zinc-500 font-mono">ID de Empleado MySQL: #{fotografoSeleccionado.id}</p>
                            </div>

                            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-3 font-medium text-xs">
                                <div className="flex justify-between border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Username:</span>
                                    <span className="text-zinc-200 font-mono">@{fotografoSeleccionado.username}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Correo Corporativo:</span>
                                    <span className="text-zinc-200">{fotografoSeleccionado.email}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Clasificación de Puesto:</span>
                                    <span className="text-amber-400 font-bold uppercase">{fotografoSeleccionado.tipo_usuario}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-zinc-500">Estado en Servidor:</span>
                                    <span className="text-green-400 font-bold uppercase text-[10px] bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                                        Conectado vía JWT
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                            <button
                                onClick={() => setFotografoSeleccionado(null)}
                                className="w-full bg-amber-600 hover:bg-amber-500 text-zinc-950 font-black text-xs py-3 rounded-xl transition-colors tracking-wider uppercase"
                            >
                                Cerrar Ficha del Staff
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardFotografos;