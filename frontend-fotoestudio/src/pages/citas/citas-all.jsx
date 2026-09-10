import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';

const GestionCitas = ({ esComponenteAdmin = false }) => {
    const navigate = useNavigate();
    const [citas, setCitas] = useState([]);
    const [paquetes, setPaquetes] = useState([]);
    const [fotografos, setFotografos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [editandoId, setEditandoId] = useState(null);
    const [error, setError] = useState(null);

    // --- ESTADOS PARA TABLA Y BUSCADOR ---
    const [buscar, setBuscar] = useState('');
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const [citaSeleccionada, setCitaSeleccionada] = useState(null);

    const isAdmin = localStorage.getItem('is_staff') === 'true';
    const esFotografo = localStorage.getItem('tipo_usuario') === 'fotografo';
    const nombreUsuarioLogueado = localStorage.getItem('nombre_completo') || 'Usuario';

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues: {
            paquete: '',
            cliente: '',
            fotografo: '',
            fecha_cita: '',
            precio_total: '',
            abono: 0,
            lugar: 'Estudio Jerez',
            notas: ''
        }
    });

    const watchPrecioTotal = watch("precio_total");
    const watchPaquete = watch("paquete");
    const watchFotografo = watch("fotografo");
    const watchCliente = watch("cliente");

    const API_URL_GEN = import.meta.env.VITE_API_URL

    const API_URL = `${API_URL_GEN}/api/citas/`;
    const API_PAQUETES = `${API_URL_GEN}/api/paquetes-fotografo/`;
    const API_FOTOGRAFOS = `${API_URL_GEN}/api/fotografosds/`;
    const API_CLIENTES = `${API_URL_GEN}/api/clientesds/`;

    const getHeaders = () => {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const obtenerCitas = () => {
        const headers = getHeaders();
        let urlFiltrada = `${API_URL}?page=${pagina}`;

        if (buscar.trim() !== '') {
            urlFiltrada += `&search=${encodeURIComponent(buscar.trim())}`;
        }

        fetch(urlFiltrada, { method: 'GET', headers })
            .then(res => {
                if (res.status === 401) {
                    Swal.fire({
                        title: '¡Sesión vencida!',
                        text: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
                        icon: 'warning',
                        background: '#000000',
                        color: '#ffffff',
                        confirmButtonText: 'Ir al Login',
                        confirmButtonColor: '#dc3545',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = '/#/login';
                        }
                    });
                    return;
                }
                if (!res.ok) throw new Error("Error al cargar la agenda.");
                return res.json();
            })
            .then(data => {
                if (data && data.results && Array.isArray(data.results)) {
                    setCitas(data.results);
                    setTotalPaginas(Math.ceil(data.count / 3) || 1);
                    setError(null);
                } else if (Array.isArray(data)) {
                    setCitas(data);
                    setTotalPaginas(1);
                } else {
                    setCitas([]);
                }
            })
            .catch(err => {
                setError(err.message);
                setCitas([]);
            });
    };

    useEffect(() => {
        obtenerCitas();
    }, [pagina, buscar]);

    useEffect(() => {
        const headers = getHeaders();
        fetch(API_PAQUETES, { method: 'GET', headers })
            .then(res => res.ok ? res.json() : [])
            .then(data => setPaquetes(data.results || data));

        fetch(API_FOTOGRAFOS, { method: 'GET', headers })
            .then(res => res.ok ? res.json() : [])
            .then(data => setFotografos(data.results || data));

        fetch(API_CLIENTES, { method: 'GET', headers })
            .then(res => res.ok ? res.json() : [])
            .then(data => setClientes(data.results || data));
    }, []);

    const manejarCambioPaquete = (idSeleccionado) => {
        const paqueteEncontrado = paquetes.find(p => p.id === parseInt(idSeleccionado));
        setValue('paquete', idSeleccionado, { shouldValidate: true });
        setValue('precio_total', paqueteEncontrado ? paqueteEncontrado.precio_paquete : '', { shouldValidate: true });
    };

    const prepararEdicion = (cita) => {
        setEditandoId(cita.id);
        reset({
            paquete: cita.paquete || '',
            cliente: cita.cliente || '',
            fotografo: cita.fotografo || '',
            fecha_cita: cita.fecha_cita ? cita.fecha_cita.substring(0, 16) : '',
            precio_total: cita.precio_total || '',
            abono: cita.abono || 0,
            lugar: cita.lugar || 'Estudio Jerez',
            notas: cita.notas || ''
        });
    };

    const alEnviarFormulario = (data) => {
        const esEdicion = editandoId !== null;
        const url = esEdicion ? `${API_URL}${editandoId}/` : API_URL;
        const metodo = esEdicion ? 'PATCH' : 'POST';

        let clienteId = null;
        if (isAdmin) {
            clienteId = parseInt(data.cliente);
        } else {
            try {
                const token = localStorage.getItem('access_token');
                if (token) {
                    const payloadBase64 = token.split('.')[1];
                    const payloadDecodificado = JSON.parse(atob(payloadBase64));
                    clienteId = parseInt(payloadDecodificado.user_id);
                }
            } catch (err) {
                //console.error("No se pudo decodificar el ID desde el JWT:", err);
            }
        }

        const datosAEnviar = {
            paquete: parseInt(data.paquete),
            fecha_cita: data.fecha_cita,
            precio_total: parseFloat(data.precio_total) || 0,
            abono: parseFloat(data.abono) || 0,
            lugar: data.lugar,
            notas: data.notas,
            cliente: clienteId,
            fotografo: data.fotografo ? parseInt(data.fotografo) : null
        };

        fetch(url, {
            method: metodo,
            headers: getHeaders(),
            body: JSON.stringify(datosAEnviar)
        })
            .then(async res => {
                if (res.ok) {
                    obtenerCitas();
                    cancelarEdicion();

                    Swal.fire({
                        title: esEdicion ? '¡Cita modificada!' : '¡Cita creada!',
                        text: esEdicion ? 'Los cambios se guardaron correctamente.' : 'La cita se agendó con éxito.',
                        icon: 'success',
                        background: '#18181b',
                        color: '#f4f4f5',
                        confirmButtonColor: '#2563eb'
                    });
                } else {
                    const erroresBackend = await res.json();
                    Swal.fire({
                        title: 'Error de validación',
                        html: `<pre style="text-align: left; font-size: 0.75rem; background: #09090b; padding: 10px; border-radius: 8px; color: #f87171;">${JSON.stringify(erroresBackend, null, 2)}</pre>`,
                        icon: 'error',
                        background: '#18181b',
                        color: '#f4f4f5',
                        confirmButtonColor: '#dc2626'
                    });
                }
            })
            .catch(err => {
                //console.error("Error en operación:", err);
                Swal.fire({
                    title: 'Error',
                    text: 'Ocurrió un problema al procesar la solicitud.',
                    icon: 'error',
                    background: '#18181b',
                    color: '#f4f4f5',
                    confirmButtonColor: '#dc2626'
                });
            });
    };

    const cancelarEdicion = () => {
        setEditandoId(null);
        reset({
            paquete: '',
            cliente: '',
            fotografo: '',
            fecha_cita: '',
            precio_total: '',
            abono: 0,
            lugar: 'Estudio Jerez',
            notas: ''
        });
    };

    const eliminarCita = (id) => {
        Swal.fire({
            title: `¿Seguro que deseas eliminar la cita #${id}?`,
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#27272a',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#18181b',
            color: '#f4f4f5'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`${API_URL}${id}/`, { method: 'DELETE', headers: getHeaders() })
                    .then(res => {
                        if (res.ok) {
                            obtenerCitas();
                            Swal.fire({
                                title: 'Eliminada',
                                text: 'La cita ha sido eliminada de la base de datos.',
                                icon: 'success',
                                background: '#18181b',
                                color: '#f4f4f5',
                                confirmButtonColor: '#2563eb'
                            });
                        }
                    });
            }
        });
    };

    const cerrarSesion = () => {
        Swal.fire({
            title: '¿Seguro que deseas cerrar sesión?',
            text: "Saldrás del sistema de agenda digital.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#27272a',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar',
            background: '#18181b',
            color: '#f4f4f5'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                navigate('/login');
            }
        });
    };

    const manejarClickFila = (cita) => {
        if (esFotografo || isAdmin) {
            setCitaSeleccionada(cita);
        }
    };

    return (
        <div className={esComponenteAdmin ? "text-zinc-100" : "min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans"}>
            <div className={esComponenteAdmin ? "space-y-6" : "max-w-7xl mx-auto space-y-6"}>

                {/* HEADER PANTALLA COMPLETA */}
                {!esComponenteAdmin && (
                    <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full italic flex items-center justify-center font-black text-white text-lg">F</div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Estudio Jerez</h2>
                                <p className="text-[10px] text-blue-500 uppercase tracking-widest font-bold">Portal de Agenda Digital</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 flex items-center gap-2">
                                👤 {nombreUsuarioLogueado}
                                <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-black ${esFotografo ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                                    {esFotografo ? 'Fotógrafo' : 'Cliente'}
                                </span>
                            </div>

                            <button
                                onClick={cerrarSesion}
                                className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-red-900 text-zinc-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                                title="Cerrar Sesión"
                            >
                                🚪
                            </button>
                        </div>
                    </header>
                )}

                {esComponenteAdmin && (
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl">
                        <h3 className="text-2xl font-black text-white">📅 Agenda General de Sesiones</h3>
                        <p className="text-xs text-zinc-400 mt-1">Control ABCC del calendario operativo e ingresos por anticipos</p>
                    </div>
                )}

                {error && <div className="p-4 bg-red-900/30 border border-red-500 rounded-xl text-red-200 text-sm">⚠️ {error}</div>}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {!esFotografo && (
                        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl h-fit shadow-xl">
                            <h4 className={`text-lg font-bold mb-4 ${editandoId ? 'text-orange-400' : 'text-blue-500'}`}>
                                {editandoId ? '🔧 Modificar Reserva' : '➕ Agendar Cita'}
                            </h4>

                            <form onSubmit={handleSubmit(alEnviarFormulario)} className="space-y-4 text-sm">

                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Paquete Comercial</label>
                                    <select
                                        className={`w-full bg-zinc-950 border rounded-xl px-4 py-2.5 text-zinc-200 outline-none font-medium cursor-pointer ${errors.paquete ? 'border-red-500' : 'border-zinc-800 focus:border-blue-600'}`}
                                        value={watchPaquete}
                                        onChange={e => manejarCambioPaquete(e.target.value)}
                                    >
                                        <option value="" disabled>-- Elige un Paquete --</option>
                                        {paquetes.map(p => <option key={p.id} value={p.id}>{p.nombre} (${p.precio_paquete})</option>)}
                                    </select>
                                    <input type="hidden" {...register('paquete', { required: "Debes seleccionar un paquete comercial." })} />
                                    {errors.paquete && <p className="text-red-400 text-[11px] mt-1 font-semibold">⚠️ {errors.paquete.message}</p>}
                                </div>

                                {isAdmin && (
                                    <div>
                                        <label className="block text-xs font-bold text-blue-400 uppercase mb-1">Cliente Solicitante</label>
                                        <select
                                            className={`w-full bg-zinc-950 border rounded-xl px-4 py-2.5 text-zinc-200 outline-none font-medium cursor-pointer ${errors.cliente ? 'border-red-500' : 'border-zinc-800 focus:border-blue-600'}`}
                                            value={watchCliente || ''}
                                            onChange={e => setValue('cliente', e.target.value, { shouldValidate: true })}
                                        >
                                            <option value="" disabled>-- Selecciona un Cliente --</option>
                                            {clientes.map(c => {
                                                const nombreCompleto = `${c.first_name} ${c.last_name}`.trim();
                                                return (
                                                    <option key={c.id} value={c.id}>
                                                        {nombreCompleto ? nombreCompleto : c.username}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <input type="hidden" {...register('cliente', { required: isAdmin ? "Debes asignar un cliente a la sesión." : false })} />
                                        {errors.cliente && <p className="text-red-400 text-[11px] mt-1 font-semibold">⚠️ {errors.cliente.message}</p>}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Costo Neto ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full bg-zinc-950 border border-zinc-800/60 text-zinc-500 rounded-xl px-4 py-2.5 outline-none font-mono font-bold cursor-not-allowed"
                                            value={watchPrecioTotal}
                                            readOnly
                                        />
                                        <input type="hidden" {...register('precio_total')} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Monto Abono ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={`w-full bg-zinc-950 border rounded-xl px-4 py-2.5 text-green-400 outline-none font-mono font-bold ${errors.abono ? 'border-red-500' : 'border-zinc-800 focus:border-blue-600'}`}
                                            {...register('abono', {
                                                required: "El abono es requerido (mínimo 0)",
                                                min: { value: 0, message: "No puede ser negativo" },
                                                validate: value => parseFloat(value) <= parseFloat(watchPrecioTotal || 0) || "Supera al costo total"
                                            })}
                                        />
                                        {errors.abono && <p className="text-red-400 text-[11px] mt-1 font-semibold">⚠️ {errors.abono.message}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Fotógrafo Asignado</label>
                                    <select
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 outline-none focus:border-blue-600 font-medium cursor-pointer"
                                        value={watchFotografo || ''}
                                        onChange={e => setValue('fotografo', e.target.value)}
                                    >
                                        <option value="">-- Sin asignar (NULL) --</option>
                                        {fotografos.map(f => <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>)}
                                    </select>
                                    <input type="hidden" {...register('fotografo')} />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Fecha y Hora Programada</label>
                                    <input
                                        type="datetime-local"
                                        className={`w-full bg-zinc-950 border rounded-xl px-4 py-2.5 text-zinc-300 outline-none font-medium ${errors.fecha_cita ? 'border-red-500' : 'border-zinc-800 focus:border-blue-600'}`}
                                        {...register('fecha_cita', { required: "La fecha y hora de la sesión son requeridas." })}
                                    />
                                    {errors.fecha_cita && <p className="text-red-400 text-[11px] mt-1 font-semibold">⚠️ {errors.fecha_cita.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Ubicación / Locación</label>
                                    <input
                                        type="text"
                                        className={`w-full bg-zinc-950 border rounded-xl px-4 py-2.5 text-white outline-none font-medium ${errors.lugar ? 'border-red-500' : 'border-zinc-800 focus:border-blue-600'}`}
                                        {...register('lugar', { required: "La ubicación o estudio es requerida." })}
                                    />
                                    {errors.lugar && <p className="text-red-400 text-[11px] mt-1 font-semibold">⚠️ {errors.lugar.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Notas del Registro</label>
                                    <textarea
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-600 h-16 resize-none"
                                        {...register('notas')}
                                    ></textarea>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button type="submit" className={`flex-1 py-3 rounded-xl font-bold text-white transition-all cursor-pointer ${editandoId ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-950/20' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-950/20'}`}>
                                        {editandoId ? 'Guardar Cambios' : 'Confirmar Cita'}
                                    </button>
                                    {editandoId && <button type="button" onClick={cancelarEdicion} className="px-4 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl font-bold cursor-pointer">X</button>}
                                </div>
                            </form>
                        </div>
                    )}

                    <div className={`${esFotografo ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-4`}>

                        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl shadow-md flex items-center gap-3">
                            <span className="text-zinc-500 text-lg">🔍</span>
                            <input type="text" className="w-full outline-none text-white font-medium placeholder-zinc-500 bg-transparent text-sm"
                                placeholder="Filtrar por locación, notas, cliente o folio..." value={buscar}
                                onChange={(e) => { setBuscar(e.target.value); setPagina(1); }} />
                            {buscar && (
                                <button onClick={() => setBuscar('')} className="text-zinc-400 hover:text-white text-xs font-bold bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-lg transition">Limpiar</button>
                            )}
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-zinc-950/60 border-b border-zinc-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Información de Sesión</th>
                                        <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Finanzas</th>
                                        {!esFotografo && <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {citas.length > 0 ? (
                                        citas.map(cita => {
                                            const paqueteCita = paquetes?.find(p => p.id === cita.paquete);
                                            const fotografoCita = fotografos?.find(f => f.id === cita.fotografo);

                                            return (
                                                <tr
                                                    key={cita.id}
                                                    onClick={() => manejarClickFila(cita)}
                                                    className={`transition-colors duration-150 ${esFotografo || isAdmin ? 'hover:bg-zinc-800/60 cursor-pointer' : 'hover:bg-zinc-800/20'}`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-white text-base">{cita.cliente_nombre || `Cliente #${cita.cliente}`}</div>
                                                        <div className="text-blue-400 font-semibold text-xs mt-0.5">
                                                            Box 📦 {paqueteCita ? paqueteCita.nombre : `Paquete #${cita.paquete}`}
                                                        </div>
                                                        <div className="text-zinc-500 text-xs mt-1 font-medium">
                                                            📸 Staff: <span className="text-zinc-300">{fotografoCita ? `${fotografoCita.first_name} ${fotografoCita.last_name}` : 'No asignado'}</span>
                                                        </div>
                                                        <div className="text-zinc-500 text-xs mt-0.5 font-medium">📍 Lugar: <span className="text-zinc-400">{cita.lugar}</span></div>
                                                        <div className="text-zinc-500 text-[11px] font-mono mt-1">📅 {cita.fecha_cita ? new Date(cita.fecha_cita).toLocaleString() : 'Sin fecha'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono vertical-align-middle">
                                                        <div className="text-zinc-300 font-bold text-sm">Total: ${cita.precio_total}</div>
                                                        <div className="text-green-400 font-bold text-sm">Abono: ${cita.abono}</div>
                                                        <div className="mt-2">
                                                            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${cita.pagado ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                                {cita.pagado ? 'Liquidado' : 'Pendiente'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {!esFotografo && (
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={(e) => { e.stopPropagation(); setCitaSeleccionada(cita); }} className="p-2 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-800 transition cursor-pointer" title="Ver Ficha">👁️</button>
                                                                <button onClick={(e) => { e.stopPropagation(); prepararEdicion(cita); }} className="p-2 bg-orange-950/40 border border-orange-900 text-orange-400 rounded-xl hover:bg-orange-900/40 transition cursor-pointer" title="Editar">✏️</button>
                                                                <button onClick={(e) => { e.stopPropagation(); eliminarCita(cita.id); }} className="p-2 bg-red-950/40 border border-red-900 text-red-400 rounded-xl hover:bg-red-900/40 transition cursor-pointer" title="Eliminar">🗑️</button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={esFotografo ? "2" : "3"} className="text-center py-10 text-zinc-500 font-medium italic">
                                                No se encontraron registros de citas vigentes.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            <div className="bg-zinc-950 border-t border-zinc-800 px-6 py-4 flex items-center justify-between">
                                <span className="text-xs text-zinc-500 font-medium">
                                    Instancia <strong className="text-zinc-300">{pagina}</strong> de <strong className="text-zinc-300">{totalPaginas}</strong>
                                </span>
                                <div className="flex gap-2">
                                    <button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}
                                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">◀ Prev</button>
                                    <button disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)}
                                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">Next ▶</button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {citaSeleccionada && (
                <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-zinc-200">
                        <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-wider text-blue-500">Consulta Completa de Reserva</span>
                            <button onClick={() => setCitaSeleccionada(null)} className="text-zinc-500 hover:text-white font-bold text-sm">✕</button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="text-center">
                                <span className="text-4xl">📅</span>
                                <h4 className="text-xl font-black text-white mt-2">{citaSeleccionada.cliente_nombre || `Cliente #${citaSeleccionada.cliente}`}</h4>
                                <p className="text-xs text-zinc-500 font-mono">ID de Transacción confirmado por Django</p>
                            </div>

                            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-3 font-medium text-xs">
                                <div className="flex justify-between border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Paquete Contratado:</span>
                                    <span className="text-blue-400 font-bold">{paquetes?.find(p => p.id === citaSeleccionada.paquete)?.nombre || `Paquete #${citaSeleccionada.paquete}`}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Locación / Destino:</span>
                                    <span className="text-zinc-200">{citaSeleccionada.lugar}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Fecha y Hora:</span>
                                    <span className="text-zinc-200 font-mono">{citaSeleccionada.fecha_cita ? new Date(citaSeleccionada.fecha_cita).toLocaleString() : 'Sin fecha'}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Fotógrafo del Evento:</span>
                                    <span className="text-zinc-200">
                                        {fotografos?.find(f => f.id === citaSeleccionada.fotografo)
                                            ? `${fotografos.find(f => f.id === citaSeleccionada.fotografo).first_name} ${fotografos.find(f => f.id === citaSeleccionada.fotografo).last_name}`
                                            : 'No asignado'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-900 pb-2">
                                    <span className="text-zinc-500">Estado Financiero:</span>
                                    <span className={`font-bold uppercase ${citaSeleccionada.pagado ? 'text-green-400' : 'text-red-400'}`}>
                                        {citaSeleccionada.pagado ? 'Liquidado' : 'Pendiente de Pago'}
                                    </span>
                                </div>
                                <div className="pt-1">
                                    <span className="text-zinc-500 block mb-1">Notas del Staff:</span>
                                    <p className="text-zinc-300 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 font-sans italic text-[11px] leading-relaxed max-h-20 overflow-y-auto">
                                        {citaSeleccionada.notas || 'Sin anotaciones particulares en este registro.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionCitas;