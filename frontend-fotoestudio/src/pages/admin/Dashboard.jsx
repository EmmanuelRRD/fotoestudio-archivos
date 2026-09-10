import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Citas from '../citas/citas-all';
import DashboardProductos from './DashboardProductos';
import DashboardFotografos from './DashboardFotografos';
import DashboardPaquetes from './DashboardPaquetes';
import DashboardUsuarios from './DashboardUsuarios';
import Swal from 'sweetalert2';

function Dashboard() {
    const navigate = useNavigate();
    const [pestanaActiva, setPestanaActiva] = useState('inicio');
    const nombreAdmin = localStorage.getItem('nombre_completo') || 'Administrador';
    const API_URL_GEN = import.meta.env.VITE_API_URL
    //API_URL_GEN,

    // --- 📊 ESTADOS DE MÉTRICAS OPERATIVAS ---
    const [metricas, setMetricas] = useState({
        insumosBajos: 0,
        totalClientes: 0,
        totalFotografos: 0,
        totalPaquetes: 0
    });
    const [cargandoMetricas, setCargandoMetricas] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const obtenerMetricasSistema = async () => {
        if (pestanaActiva !== 'inicio') return;
        setCargandoMetricas(true);
        try {
            // 1. INVENTARIO / STOCK BAJO
            const resProductos = await fetch(API_URL_GEN+'/api/productos/', { method: 'GET', headers: getHeaders() });
            let criticos = 0;
            if (resProductos.ok) {
                const dataProd = await resProductos.json();
                const listaProductos = dataProd.results || dataProd;
                criticos = listaProductos.filter(p => parseInt(p.stock) <= 10).length;
            }

            // 2. TOTAL DE CLIENTES (Ajustado a tu endpoint real con paginación)
            const resUsuarios = await fetch(API_URL_GEN+'/api/usuarios/?page=1&tipo_usuario=cliente', { method: 'GET', headers: getHeaders() });
            let clientes = 0;

            if (resUsuarios.status === 401) {
                Swal.fire({
                    title: '¡Sesión vencida!',
                    text: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
                    icon: 'warning',
                    background: '#000000',       // Fondo negro
                    color: '#ffffff',            // Letras blancas 
                    confirmButtonText: 'Ir al Login',
                    confirmButtonColor: '#dc3545', // Rojo (estilo Bootstrap danger)
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

            if (resUsuarios.ok) {
                const dataUser = await resUsuarios.json();
                clientes = dataUser.count !== undefined ? dataUser.count : (dataUser.length || 0);
            }

            // 3. STAFF DE FOTÓGRAFOS
            const resFotografos = await fetch(API_URL_GEN+'/api/fotografos/', { method: 'GET', headers: getHeaders() });
            let fotografos = 0;
            if (resFotografos.ok) {
                const dataFoto = await resFotografos.json();
                fotografos = dataFoto.count !== undefined ? dataFoto.count : dataFoto.length;
            }

            // 4. PAQUETES FOTOGRÁFICOS
            const resPaquetes = await fetch(API_URL_GEN+'/api/paquetes-fotografo/?page=1', { method: 'GET', headers: getHeaders() });
            let paquetes = 0;
            if (resPaquetes.ok) {
                const dataPaq = await resPaquetes.json();
                paquetes = dataPaq.count !== undefined ? dataPaq.count : dataPaq.length;
            }

            // Guardamos todo el estado unificado
            setMetricas({
                insumosBajos: criticos,
                totalClientes: clientes,
                totalFotografos: fotografos,
                totalPaquetes: paquetes
            });

        } catch (error) {
            //console.error("Error al recopilar el estado de los catálogos:", error);
        } finally {
            setCargandoMetricas(false);
        }
    };

    useEffect(() => {
        obtenerMetricasSistema();
    }, [pestanaActiva]);

    // --- 🚪 REEMPLAZO CON SWEETALERT2 ESTILO DARK MODE ---
    const cerrarSesion = () => {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: "Estás a punto de salir del panel de administración.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626', // rojo (red-600)
            cancelButtonColor: '#27272a',  // gris oscuro (zinc-800)
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar',
            background: '#09090b',         // Combina con tu bg-zinc-950
            color: '#f4f4f5',              // text-zinc-100
            customClass: {
                popup: 'border border-zinc-800 rounded-2xl shadow-2xl'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                navigate('/login');
            }
        });
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col md:flex-row">

            {/* BARRA LATERAL (Sidebar) */}
            <aside className="w-full md:w-64 bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col p-6 shrink-0">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-full italic flex items-center justify-center font-black text-white text-lg">F</div>
                    <div>
                        <span className="text-xl font-black tracking-tight block uppercase">Estudio Jerez</span>
                        <span className="text-[10px] text-blue-500 uppercase tracking-widest font-bold">Panel de Control</span>
                    </div>
                </div>

                <nav className="space-y-2 flex-1">
                    <button
                        onClick={() => setPestanaActiva('inicio')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'inicio' ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                    >
                        <span>📊</span> Métricas Generales
                    </button>

                    <button
                        onClick={() => setPestanaActiva('productos')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'productos' ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                    >
                        <span>📦</span> Inventario
                    </button>

                    <button
                        onClick={() => setPestanaActiva('fotografos')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'fotografos' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                    >
                        <span>📸</span> Fotografos
                    </button>

                    <button
                        onClick={() => setPestanaActiva('paquetes')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'paquetes' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                    >
                        <span>🏷️</span> Paquetes de Estudio
                    </button>

                    <button
                        onClick={() => setPestanaActiva('usuarios')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'usuarios' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                    >
                        <span>👥</span> Control de Usuarios
                    </button>

                    <button
                        onClick={() => setPestanaActiva('citasAdmin')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'citasAdmin' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                    >
                        <span>📅</span> Citas de la Sucursal
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-zinc-800 flex items-center justify-between gap-2">
                    <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{nombreAdmin}</p>
                        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Root Admin</p>
                    </div>
                    <button
                        onClick={cerrarSesion}
                        className="p-2.5 bg-zinc-800 hover:bg-red-950/40 border border-zinc-700 hover:border-red-900 text-zinc-400 hover:text-red-400 rounded-xl transition-colors text-sm"
                        title="Cerrar sesión"
                    >
                        🚪
                    </button>
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">

                {/* 1. SECCIÓN: INICIO (Métricas Estructuradas por Catálogos) */}
                {pestanaActiva === 'inicio' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tight">Bienvenido de vuelta, {nombreAdmin.split(' ')[0]}</h2>
                                <p className="text-sm text-zinc-400 mt-1">Este es el resumen actual de tus catálogos en la base de datos.</p>
                            </div>
                            {cargandoMetricas && (
                                <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl animate-pulse">
                                    Sincronizando BD...
                                </span>
                            )}
                        </div>

                        {/* DISEÑO DE LAS NUEVAS 4 TARJETAS SOLICITADAS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                            {/* 1. Insumos con Stock Bajo */}
                            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl">📦</span>
                                    <span className={`text-[10px] px-2 py-0.5 border rounded font-black uppercase font-mono ${metricas.insumosBajos > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                        {metricas.insumosBajos > 0 ? 'Reabastecer' : 'Ok'}
                                    </span>
                                </div>
                                <p className={`text-2xl font-mono font-black mt-4 ${metricas.insumosBajos > 0 ? 'text-red-400' : 'text-white'}`}>
                                    {metricas.insumosBajos} {metricas.insumosBajos === 1 ? 'Insumo crítico' : 'Insumos críticos'}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1 font-medium">Productos con stock menor a 10</p>
                            </div>

                            {/* 2. Total de Clientes */}
                            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl">👥</span>
                                    <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 border border-purple-500/20 rounded font-black uppercase font-mono">Clientes</span>
                                </div>
                                <p className="text-2xl font-mono font-black text-white mt-4">
                                    {metricas.totalClientes} {metricas.totalClientes === 1 ? 'Registrado' : 'Registrados'}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1 font-medium">Usuarios tipo cliente en el sistema</p>
                            </div>

                            {/* 3. Total de Fotógrafos */}
                            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl">📸</span>
                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 border border-blue-500/20 rounded font-black uppercase font-mono">Staff</span>
                                </div>
                                <p className="text-2xl font-mono font-black text-white mt-4">
                                    {metricas.totalFotografos} {metricas.totalFotografos === 1 ? 'Fotógrafo' : 'Fotógrafos'}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1 font-medium">Elementos activos en la plantilla</p>
                            </div>

                            {/* 4. Total de Paquetes */}
                            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl">🏷️</span>
                                    <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 border border-orange-500/20 rounded font-black uppercase font-mono">Oferta</span>
                                </div>
                                <p className="text-2xl font-mono font-black text-white mt-4">
                                    {metricas.totalPaquetes} {metricas.totalPaquetes === 1 ? 'Paquete' : 'Paquetes'}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1 font-medium">Catálogo de servicios disponibles</p>
                            </div>

                        </div>

                    </div>
                )}

                {/* Secciones del dash */}
                {pestanaActiva === 'productos' && <DashboardProductos />}
                {pestanaActiva === 'fotografos' && <DashboardFotografos />}
                {pestanaActiva === 'paquetes' && <DashboardPaquetes />}
                {pestanaActiva === 'usuarios' && <DashboardUsuarios />}
                {pestanaActiva === 'citasAdmin' && <Citas esComponenteAdmin={true} />}

            </main>
        </div>
    );
}

export default Dashboard;