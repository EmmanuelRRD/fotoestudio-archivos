import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const DashboardPaquetes = () => {
    const [paquetes, setPaquetes] = useState([]);
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [error, setError] = useState(null);
    const [buscar, setBuscar] = useState('');

    // --- PAGINACIÓN ---
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);
    const [tieneSiguiente, setTieneSiguiente] = useState(false);
    const [tieneAnterior, setTieneAnterior] = useState(false);

    const [editandoId, setEditandoId] = useState(null);
    const [paqueteSeleccionado, setPaqueteSeleccionado] = useState(null);
    const [detallesModal, setDetallesModal] = useState([]);

    // Contenido de la tabla intermedia
    const [contenidoInsumos, setContenidoInsumos] = useState([]);
    const [tempProducto, setTempProducto] = useState({ producto_id: '', cantidad: 1 });

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
        defaultValues: {
            nombre: '',
            precio_paquete: '',
            descripcion: ''
        }
    });
    const API_URL_GEN = import.meta.env.VITE_API_URL


    // --- ENDPOINTS ---
    const API_PAQUETES = `${API_URL_GEN}/api/paquetes-fotografo/`;
    const API_PRODUCTOS = `${API_URL_GEN}/api/productos/`;
    const API_DETALLES = `${API_URL_GEN}/api/detalles-paquete/`;

    const getHeaders = () => {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const obtenerProductosDisponibles = () => {
        fetch(API_PRODUCTOS, { method: 'GET', headers: getHeaders() })
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
                            localStorage.clear();
                            window.location.href = '/login';
                        }
                    });
                    return;
                }
                if (!res.ok) throw new Error("Error al cargar la agenda.");
                return res.json();
            })
            .then(data => setProductosDisponibles(data.results || data))
            .catch(() => 
            Swal.fire({
                icon: 'error',
                title: '',
                text: 'Error al cargar productos base.',
                background: '#09090b',
                color: '#f4f4f5',
                confirmButtonColor: '#dc2626',
                customClass: { popup: 'border border-zinc-800 rounded-2xl' }
            })
        );
    };

const obtenerPaquetes = () => {
    const params = new URLSearchParams({
        page: paginaActual,
        ...(buscar.trim() && { search: buscar.trim() })
    });

    fetch(`${API_PAQUETES}?${params.toString()}`, { method: 'GET', headers: getHeaders() })
        .then(res => res.ok ? res.json() : Promise.reject(new Error("Error al conectar")))
        .then(data => {
            if (data.results && Array.isArray(data.results)) {
                setPaquetes(data.results);
                setTotalRegistros(data.count);
                setTieneSiguiente(data.next !== null);
                setTieneAnterior(data.previous !== null);
            } else {
                setPaquetes(data);
                setTotalRegistros(data.length);
                setTieneSiguiente(false);
                setTieneAnterior(false);
            }
        })
        .catch(err => setError(err.message));
};

useEffect(() => {
    obtenerPaquetes();
    obtenerProductosDisponibles();
}, [paginaActual]);

const ejecutarBusqueda = (e) => {
    if (e) e.preventDefault();
    setPaginaActual(1);
    obtenerPaquetes();
};

const verDetalleUnitario = (paquete) => {
    setPaqueteSeleccionado(paquete);
    setDetallesModal([]);

    fetch(`${API_DETALLES}?paquete_id=${paquete.id}`, { method: 'GET', headers: getHeaders() })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => setDetallesModal(data.results || data))
        .catch(() => {
            Swal.fire({
                icon: 'error',
                title: 'Fallo de Sincronización',
                text: 'No se pudieron recuperar los insumos asociados a este paquete en Django.',
                background: '#09090b',
                color: '#f4f4f5',
                confirmButtonColor: '#dc2626',
                customClass: { popup: 'border border-zinc-800 rounded-2xl' }
            });
        });
};

const onSubmitPaquete = async (dataForm) => {
    if (contenidoInsumos.length === 0) {
        return Swal.fire({
            icon: 'warning',
            title: 'Contenido Vacío',
            text: 'Debes agregar al menos un insumo al contenido del paquete.',
            background: '#09090b',
            color: '#f4f4f5',
            confirmButtonColor: '#2563eb',
            customClass: { popup: 'border border-zinc-800 rounded-2xl' }
        });
    }

    const esEdicion = editandoId !== null;
    const urlPaquete = esEdicion ? `${API_PAQUETES}${editandoId}/` : API_PAQUETES;
    const metodoPaquete = esEdicion ? 'PUT' : 'POST';

    const payloadPaquete = {
        nombre: dataForm.nombre.trim(),
        descripcion: dataForm.descripcion.trim(),
        precio_paquete: parseFloat(dataForm.precio_paquete) || 0
    };

    try {
        Swal.fire({
            title: 'Procesando Transacción...',
            text: 'Guardando paquete',
            background: '#09090b',
            color: '#f4f4f5',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'border border-zinc-800 rounded-2xl' }
        });

        const resPaquete = await fetch(urlPaquete, {
            method: metodoPaquete,
            headers: getHeaders(),
            body: JSON.stringify(payloadPaquete)
        });

        if (!resPaquete.ok) throw new Error("Error al procesar el paquete base en Django.");
        const paqueteGuardado = await resPaquete.json();
        const paqueteId = esEdicion ? editandoId : paqueteGuardado.id;

        if (esEdicion) {
            const resInsumosViejos = await fetch(`${API_DETALLES}?paquete_id=${paqueteId}`, { method: 'GET', headers: getHeaders() });
            const insumosViejos = await resInsumosViejos.json();
            const listaViejos = insumosViejos.results || insumosViejos;

            await Promise.all(listaViejos.map(item =>
                fetch(`${API_DETALLES}${item.id}/`, { method: 'DELETE', headers: getHeaders() })
            ));
        }

        const promesasInsumos = contenidoInsumos.map(item => {
            const payloadInsumo = {
                paquete: paqueteId,
                producto_id: item.producto_id,
                cantidad: item.cantidad
            };

            return fetch(API_DETALLES, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payloadInsumo)
            });
        });

        await Promise.all(promesasInsumos);

        Swal.fire({
            icon: 'success',
            title: esEdicion ? '¡Paquete Actualizado!' : '¡Paquete Creado!',
            text: esEdicion ? 'Los cambios e insumos fueron actualizados con éxito.' : 'El paquete se guardó correcta.',
            background: '#09090b',
            color: '#f4f4f5',
            confirmButtonColor: esEdicion ? '#f97316' : '#2563eb',
            customClass: { popup: 'border border-zinc-800 rounded-2xl' }
        });

        cancelarEdicion();
        obtenerPaquetes();

    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Error de Transmisión',
            text: 'Fallo en el flujo de guardado: ' + err.message,
            background: '#09090b',
            color: '#f4f4f5',
            confirmButtonColor: '#dc2626',
            customClass: { popup: 'border border-zinc-800 rounded-2xl' }
        });
    }
};

const eliminarPaquete = (id, nombre) => {
    Swal.fire({
        title: '¿Confirmar Eliminación?',
        html: `¿Seguro que deseas eliminar permanentemente el paquete:<br><strong class="text-red-400">${nombre}</strong>?<br>Esta acción limpiará los registros intermedios relacionados.`,
        icon: 'warning',
        showCancelButton: true,
        background: '#09090b',
        color: '#f4f4f5',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#27272a',
        confirmButtonText: 'Sí, eliminar de la BD',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'border border-zinc-800 rounded-2xl' }
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${API_PAQUETES}${id}/`, { method: 'DELETE', headers: getHeaders() })
                .then(res => {
                    if (res.ok) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Eliminado',
                            text: 'Paquete removido correctamente del servidor.',
                            background: '#09090b',
                            color: '#f4f4f5',
                            confirmButtonColor: '#2563eb',
                            customClass: { popup: 'border border-zinc-800 rounded-2xl' }
                        });

                        if (paquetes.length === 1 && paginaActual > 1) {
                            setPaginaActual(prev => prev - 1);
                        } else {
                            obtenerPaquetes();
                        }
                    }
                })
                .catch(() => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo procesar la orden de borrado.',
                        background: '#09090b',
                        color: '#f4f4f5',
                        confirmButtonColor: '#dc2626',
                        customClass: { popup: 'border border-zinc-800 rounded-2xl' }
                    });
                });
        }
    });
};

//----------------------------------------------------------------------------- Altas
const agregarInsumoAlFormulario = () => {
    const idSeleccionado = parseInt(tempProducto.producto_id);
    const cantidadSeleccionada = parseInt(tempProducto.cantidad);

    if (!idSeleccionado || isNaN(idSeleccionado)) {
        return Swal.fire({
            icon: 'info',
            title: 'Selección Inválida',
            text: 'Por favor, escoge un producto base de la lista desplegable.',
            background: '#09090b',
            color: '#f4f4f5',
            confirmButtonColor: '#2563eb',
            customClass: { popup: 'border border-zinc-800 rounded-2xl' }
        });
    }
    if (cantidadSeleccionada <= 0 || isNaN(cantidadSeleccionada)) {
        return Swal.fire({
            icon: 'info',
            title: 'Cantidad Inválida',
            text: 'La cantidad asignada al insumo debe ser mayor a 0.',
            background: '#09090b',
            color: '#f4f4f5',
            confirmButtonColor: '#2563eb',
            customClass: { popup: 'border border-zinc-800 rounded-2xl' }
        });
    }

    const existe = contenidoInsumos.some(item => parseInt(item.producto_id) === idSeleccionado);
    if (existe) {
        return Swal.fire({
            icon: 'warning',
            title: 'Insumo Duplicado',
            text: 'Este producto ya fue agregado al paquete actual. Si deseas cambiar su cantidad, remuévelo e ingrésalo de nuevo.',
            background: '#09090b',
            color: '#f4f4f5',
            confirmButtonColor: '#2563eb',
            customClass: { popup: 'border border-zinc-800 rounded-2xl' }
        });
    }

    const productoBase = productosDisponibles.find(p => p.id === idSeleccionado);

    setContenidoInsumos([...contenidoInsumos, {
        producto_id: idSeleccionado,
        cantidad: cantidadSeleccionada,
        producto_info: productoBase
    }]);
    setTempProducto({ producto_id: '', cantidad: 1 });
};

const removerInsumoDelFormulario = (index) => {
    const nuevoContenido = [...contenidoInsumos];
    nuevoContenido.splice(index, 1);
    setContenidoInsumos(nuevoContenido);
};

const prepararEdicion = (p) => {
    setEditandoId(p.id);

    // Cargamos los datos del paquete base en react-hook-form
    setValue('nombre', p.nombre);
    setValue('precio_paquete', p.precio_paquete);
    setValue('descripcion', p.descripcion);

    fetch(`${API_DETALLES}?paquete_id=${p.id}`, { method: 'GET', headers: getHeaders() })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
            const elementosIntermedios = data.results || data;
            const contenidoNormalizado = elementosIntermedios.map(item => ({
                producto_id: item.producto_info?.id || item.producto,
                cantidad: item.cantidad,
                producto_info: item.producto_info
            }));

            setContenidoInsumos(contenidoNormalizado);
        })
        .catch(() => {
            Swal.fire({
                icon: 'error',
                title: 'Error de Mapeo',
                text: 'Ocurrió un error al leer los componentes intermedios del paquete.',
                background: '#09090b',
                color: '#f4f4f5',
                confirmButtonColor: '#dc2626',
                customClass: { popup: 'border border-zinc-800 rounded-2xl' }
            });
            cancelarEdicion();
        });
};

const cancelarEdicion = () => {
    setEditandoId(null);
    reset({ nombre: '', precio_paquete: '', descripcion: '' });
    setContenidoInsumos([]);
    setTempProducto({ producto_id: '', cantidad: 1 });
};

return (
    <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-900 p-6 border border-zinc-800 rounded-3xl">
            <div>
                <h3 className="text-2xl font-black text-white">📦 Catálogo de Paquetes</h3>
                <p className="text-xs text-zinc-400 mt-1">Gestión por endpoint de tabla intermedia integrada (Total en DB: {totalRegistros})</p>
            </div>
            <form onSubmit={ejecutarBusqueda} className="flex bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-blue-600 w-full lg:w-72">
                <input type="text" placeholder="Buscar paquete..." className="bg-transparent px-4 py-3 text-sm text-white focus:outline-none w-full font-medium" value={buscar} onChange={e => setBuscar(e.target.value)} />
                <button type="submit" className="px-3 text-zinc-400 hover:text-white cursor-pointer">🔍</button>
            </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulario Izquierdo */}
            <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl h-fit">
                <h4 className={`text-lg font-bold mb-4 ${editandoId ? 'text-orange-400' : 'text-blue-500'}`}>{editandoId ? '🔧 Modificar Oferta' : '➕ Crear Paquete'}</h4>
                <form onSubmit={handleSubmit(onSubmitPaquete)} className="space-y-4 text-sm">

                    {/* INPUT NOMBRE */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Nombre Comercial</label>
                        <input
                            type="text"
                            className={`w-full bg-zinc-950 border ${errors.nombre ? 'border-red-500' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-zinc-700`}
                            {...register('nombre', {
                                required: 'El nombre es obligatorio',
                                pattern: {
                                    value: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s()[\]]+$/,
                                    message: 'Solo alfanuméricos y caracteres ( ), [ ]'
                                }
                            })}
                        />
                        {errors.nombre && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.nombre.message}</p>}
                    </div>

                    {/* INPUT PRECIO */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Precio de Venta ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            className={`w-full bg-zinc-950 border ${errors.precio_paquete ? 'border-red-500' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-green-400 font-mono focus:outline-none focus:border-zinc-700`}
                            {...register('precio_paquete', {
                                required: 'El precio es obligatorio',
                                min: {
                                    value: 0,
                                    message: 'El precio no puede ser negativo'
                                }
                            })}
                        />
                        {errors.precio_paquete && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.precio_paquete.message}</p>}
                    </div>

                    {/* INPUT DESCRIPCIÓN */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Descripción</label>
                        <textarea
                            className={`w-full bg-zinc-950 border ${errors.descripcion ? 'border-red-500' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-white h-20 resize-none focus:outline-none focus:border-zinc-700`}
                            {...register('descripcion', {
                                required: 'La descripción es obligatoria',
                                pattern: {
                                    value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,]+$/,
                                    message: 'Solo letras, espacios, comas y puntos'
                                }
                            })}
                        ></textarea>
                        {errors.descripcion && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.descripcion.message}</p>}
                    </div>

                    {/* Agregar productos (Intermedia) */}
                    <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-2xl space-y-3">
                        <label className="block text-xs font-black text-blue-400 uppercase">📦 Componentes (Intermedia)</label>
                        <div className="flex gap-2">
                            <select className="flex-1 bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2 text-xs focus:outline-none" value={tempProducto.producto_id} onChange={e => setTempProducto({ ...tempProducto, producto_id: e.target.value })}>
                                <option value="">-- Elegir Insumo --</option>
                                {productosDisponibles.map(prod => (
                                    <option key={prod.id} value={prod.id}>{prod.nombre} ({prod.medida})</option>
                                ))}
                            </select>
                            <input type="number" min="1" className="w-16 bg-zinc-900 border border-zinc-800 text-white text-center rounded-xl text-xs font-bold focus:outline-none" value={tempProducto.cantidad} onChange={e => setTempProducto({ ...tempProducto, cantidad: e.target.value })} />
                            <button type="button" onClick={agregarInsumoAlFormulario} className="px-3 bg-zinc-800 hover:bg-blue-600 text-white rounded-xl cursor-pointer transition-colors">＋</button>
                        </div>

                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {contenidoInsumos.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-zinc-900 px-3 py-1.5 border border-zinc-800 rounded-xl text-xs">
                                    <span className="text-zinc-300 truncate max-w-[180px]">{item.producto_info?.nombre || `ID: ${item.producto_id}`}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-400 font-mono font-bold">x{item.cantidad}</span>
                                        <button type="button" onClick={() => removerInsumoDelFormulario(idx)} className="text-red-400 font-bold hover:text-red-300 cursor-pointer">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button type="submit" className={`flex-1 py-3 rounded-xl font-bold text-white cursor-pointer transition-all ${editandoId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{editandoId ? 'Guardar Cambios' : 'Confirmar Alta'}</button>
                        {editandoId && <button type="button" onClick={cancelarEdicion} className="px-4 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 cursor-pointer">X</button>}
                    </div>
                </form>
            </div>

            {/* Tabla Derecha */}
            <div className="lg:col-span-7 space-y-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-zinc-950/60 border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Servicio / Paquete</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Costo</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {paquetes.length > 0 ? (
                                paquetes.map(p => (
                                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{p.nombre}</div>
                                            <div className="text-zinc-400 text-xs truncate max-w-xs mt-0.5">“{p.descripcion}”</div>
                                        </td>
                                        <td className="px-6 py-4 text-green-400 font-mono font-bold">${p.precio_paquete}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => verDetalleUnitario(p)} className="p-2 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">👁️</button>
                                                <button onClick={() => prepararEdicion(p)} className="p-2 bg-orange-950/40 border border-orange-900 text-orange-400 rounded-xl cursor-pointer hover:bg-orange-900/60 transition-colors">✏️</button>
                                                <button onClick={() => eliminarPaquete(p.id, p.nombre)} className="p-2 bg-red-950/40 border border-red-900 text-red-400 rounded-xl cursor-pointer hover:bg-red-900/60 transition-colors">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="3" className="text-center py-10 text-zinc-500 italic">No hay paquetes en esta página.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* NAVEGACIÓN DE PAGINACIÓN */}
                <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 px-6 py-4 rounded-2xl">
                    <span className="text-xs text-zinc-400 font-medium">
                        Página <strong className="text-zinc-200 font-mono">{paginaActual}</strong> del catálogo
                    </span>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                            disabled={!tieneAnterior}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!tieneAnterior ? 'bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed' : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300 cursor-pointer'}`}
                        >
                            ⬅️ Anterior
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaginaActual(prev => prev + 1)}
                            disabled={!tieneSiguiente}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!tieneSiguiente ? 'bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed' : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300 cursor-pointer'}`}
                        >
                            Siguiente ➡️
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* MODAL DETALLE UNITARIO */}
        {paqueteSeleccionado && (
            <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-zinc-200 animate-fadeIn">
                    <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-wider text-blue-500">Detalles de Insumos</span>
                        <button onClick={() => setPaqueteSeleccionado(null)} className="font-bold text-zinc-500 hover:text-white transition-colors">✕</button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="text-center">
                            <h4 className="text-2xl font-black text-white">{paqueteSeleccionado.nombre}</h4>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {detallesModal.length > 0 ? (
                                detallesModal.map((item, index) => (
                                    <div key={index} className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex justify-between items-center text-xs">
                                        <div>
                                            <p className="font-bold text-white">{item.producto_info?.nombre || "Insumo"}</p>
                                            <p className="text-zinc-500 text-[11px] mt-0.5">Medida: {item.producto_info?.medida || "N/A"}</p>
                                        </div>
                                        <span className="bg-zinc-900 border border-zinc-800 text-blue-400 px-2.5 py-1 rounded-lg font-mono font-bold">Cant: {item.cantidad}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-4 text-xs text-zinc-500 italic">Cargando componentes de la tabla intermedia...</p>
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                        <button onClick={() => setPaqueteSeleccionado(null)} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl transition-colors cursor-pointer">Cerrar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
);
};

export default DashboardPaquetes;