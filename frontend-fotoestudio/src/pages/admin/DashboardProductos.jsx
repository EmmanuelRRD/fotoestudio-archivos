import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const DashboardProductos = () => {
    const API_URL_GEN = import.meta.env.VITE_API_URL
    const [productos, setProductos] = useState([]);
    const [error, setError] = useState(null);
    const [buscar, setBuscar] = useState('');

    
    const [paginaActual, setPaginaActual] = useState(1);
    const [tieneSiguiente, setTieneSiguiente] = useState(false);
    const [tieneAnterior, setTieneAnterior] = useState(false);
    const [totalRegistros, setTotalRegistros] = useState(0);

    // --- ESTADOS PARA EL ABCC ---
    const [editandoId, setEditandoId] = useState(null);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [formulario, setFormulario] = useState({
        nombre: '',
        medida: '',
        precio: '',
        stock: 0
    });

    const API_PRODUCTOS = `${API_URL_GEN}/api/productos/`;

    const swalConfig = {
        background: '#18181b',
        color: '#f4f4f5',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#27272a',
        customClass: {
            popup: 'border border-zinc-800 rounded-3xl',
            confirmButton: 'rounded-xl font-bold px-5 py-2.5 text-sm',
            cancelButton: 'rounded-xl font-bold px-5 py-2.5 text-sm border border-zinc-700 text-zinc-300'
        }
    };

    const getHeaders = () => {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const obtenerProductos = (pagina = 1, terminoBusqueda = buscar) => {
        const queryBuscar = terminoBusqueda.trim();
        const url = `${API_PRODUCTOS}?page=${pagina}&search=${encodeURIComponent(queryBuscar)}`;

        fetch(url, { method: 'GET', headers: getHeaders() })
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
                            if (typeof navigate !== 'undefined') navigate('/login');
                        }
                    });
                    return;
                }
                if (!res.ok) throw new Error("Error al cargar el inventario.");
                return res.json();
            })
            .then(data => {
                if (data && data.results && Array.isArray(data.results)) {
                    setProductos(data.results);
                    setTotalRegistros(data.count);
                    setTieneSiguiente(!!data.next);
                    setTieneAnterior(!!data.previous);
                    setPaginaActual(pagina);
                } else if (Array.isArray(data)) {
                    setProductos(data);
                    setTotalRegistros(data.length || 0);
                }
            })
            .catch(err => setError(err.message));
    };

    useEffect(() => {
        obtenerProductos(paginaActual);
    }, [paginaActual]);

    const manejarBusqueda = (e) => {
        const valor = e.target.value;
        setBuscar(valor);
        setPaginaActual(1);
        obtenerProductos(1, valor);
    };

    const manejarCambioFormulario = (e) => {
        const { name, value } = e.target;

        if (name === 'nombre') {
            const alfanumerico = value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\-_ ]/g, '');
            setFormulario({ ...formulario, [name]: alfanumerico });
        } else {
            setFormulario({ ...formulario, [name]: value });
        }
    };

    const verDetalleUnitario = (id) => {
        fetch(`${API_PRODUCTOS}${id}/`, { method: 'GET', headers: getHeaders() })
            .then(res => res.ok ? res.json() : Promise.reject("No se encontró el producto."))
            .then(data => setProductoSeleccionado(data))
            .catch(err => {
                Swal.fire({ ...swalConfig, icon: 'error', title: 'Error de Consulta', text: err });
            });
    };

    //--------------------------------------------------------------------------------- Validaciones
    const manejarEnvio = (e) => {
        e.preventDefault();

        const nombreTrim = formulario.nombre.trim();
        const precioNum = parseFloat(formulario.precio);
        const stockNum = parseInt(formulario.stock);

        const regexAlfanumerico = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\-_ ]+$/;
        if (!nombreTrim || !regexAlfanumerico.test(nombreTrim)) {
            Swal.fire({
                ...swalConfig,
                icon: 'error',
                title: 'Nombre inválido',
                text: 'El nombre puede contener letras, números, espacios y guiones.'
            });
            return;
        }

        // 2. Precio no negativo
        if (isNaN(precioNum) || precioNum < 0) {
            Swal.fire({ ...swalConfig, icon: 'error', title: 'Precio inválido', text: 'El precio no puede ser negativo.' });
            return;
        }

        // 3. Stock no negativo
        if (isNaN(stockNum) || stockNum < 0) {
            Swal.fire({ ...swalConfig, icon: 'error', title: 'Stock inválido', text: 'El stock físico no puede ser negativo.' });
            return;
        }

        const esEdicion = editandoId !== null;
        const url = esEdicion ? `${API_PRODUCTOS}${editandoId}/` : API_PRODUCTOS;
        const metodo = esEdicion ? 'PATCH' : 'POST';

        const datosAEnviar = {
            nombre: nombreTrim,
            medida: formulario.medida,
            precio: precioNum,
            stock: stockNum
        };

        fetch(url, {
            method: metodo,
            headers: getHeaders(),
            body: JSON.stringify(datosAEnviar)
        })
            .then(async res => {
                if (res.ok) {
                    obtenerProductos(paginaActual);
                    cancelarEdicion();
                    Swal.fire({
                        ...swalConfig,
                        icon: 'success',
                        title: esEdicion ? '¡Actualizado!' : '¡Registrado!',
                        text: esEdicion ? 'El producto ha sido modificado.' : 'El producto se dio de alta correctamente.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    const err = await res.json();
                    Swal.fire({
                        ...swalConfig,
                        icon: 'error',
                        title: 'Error en Validación',
                        html: `<pre class="text-left text-xs bg-zinc-950 p-3 rounded-xl overflow-x-auto text-red-400">${JSON.stringify(err, null, 2)}</pre>`
                    });
                }
            });
    };

    const eliminarProducto = (id, nombre) => {
        Swal.fire({
            ...swalConfig,
            icon: 'warning',
            title: '¿Estás seguro?',
            text: `Vas a eliminar permanentemente: ${nombre}`,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`${API_PRODUCTOS}${id}/`, { method: 'DELETE', headers: getHeaders() })
                    .then(res => {
                        if (res.ok) {
                            const nuevaPagina = (productos.length === 1 && paginaActual > 1) ? paginaActual - 1 : paginaActual;
                            obtenerProductos(nuevaPagina);
                            Swal.fire({ ...swalConfig, icon: 'success', title: 'Eliminado', text: 'Artículo removido.', timer: 1500, showConfirmButton: false });
                        }
                    });
            }
        });
    };

    const prepararEdicion = (p) => {
        setEditandoId(p.id);
        setFormulario({ nombre: p.nombre, medida: p.medida, precio: p.precio, stock: p.stock });
    };

    const cancelarEdicion = () => {
        setEditandoId(null);
        setFormulario({ nombre: '', medida: '', precio: '', stock: 0 });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-900 p-6 border border-zinc-800 rounded-3xl">
                <div>
                    <h3 className="text-2xl font-black text-white">📦 Almacén e Inventario General</h3>
                    <p className="text-xs text-zinc-400 mt-1">Módulo exclusivo de altas, bajas y cambios de insumos físicos</p>
                </div>
                <input
                    type="text"
                    placeholder="Buscar por descripción o medida en el servidor..."
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600 w-full lg:w-72"
                    value={buscar}
                    onChange={manejarBusqueda}
                />
            </div>

            {error && <div className="p-4 bg-red-950/40 border border-red-900 text-red-400 rounded-xl text-sm">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* FORMULARIO */}
                <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl h-fit">
                    <h4 className={`text-lg font-bold mb-4 ${editandoId ? 'text-orange-400' : 'text-blue-500'}`}>
                        {editandoId ? '🔧 Modificar Insumo' : '➕ Registrar Producto'}
                    </h4>
                    <form onSubmit={manejarEnvio} className="space-y-4 text-sm">
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Nombre del Insumo</label>
                            <input 
                                type="text" 
                                name="nombre"
                                required 
                                placeholder="ej. Marco Rústico M-102" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-600"
                                value={formulario.nombre} 
                                onChange={manejarCambioFormulario} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Dimensión / Medida</label>
                            <select
                                required
                                name="medida"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-200 outline-none focus:border-blue-600 font-medium cursor-pointer"
                                value={formulario.medida}
                                onChange={manejarCambioFormulario}
                            >
                                <option value="" disabled>-- Selecciona una medida --</option>
                                <option value="8x10 pulg">8x10 pulgadas</option>
                                <option value="11x14 pulg">11x14 pulgadas</option>
                                <option value="16x20 pulg">16x20 pulgadas</option>
                                <option value="20x24 pulg">20x24 pulgadas</option>
                                <option value="34x40 pulg">34x40 pulgadas</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Precio ($)</label>
                                <input 
                                    type="number" 
                                    name="precio"
                                    step="0.01" 
                                    min="0"
                                    required 
                                    placeholder="0.00" 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-600 font-mono"
                                    value={formulario.precio} 
                                    onChange={manejarCambioFormulario} 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Stock Físico</label>
                                <input 
                                    type="number" 
                                    name="stock"
                                    min="0"
                                    required 
                                    placeholder="0" 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-600"
                                    value={formulario.stock} 
                                    onChange={manejarCambioFormulario} 
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="submit" className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${editandoId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-500'}`}>
                                {editandoId ? 'Guardar' : 'Dar de Alta'}
                            </button>
                            {editandoId && <button type="button" onClick={cancelarEdicion} className="px-4 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl font-bold hover:bg-zinc-700 transition">X</button>}
                        </div>
                    </form>
                </div>

                {/* TABLA */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-zinc-950/60 border-b border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Descripción del Artículo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Costo e Inventario</th>
                                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {productos.length > 0 ? (
                                    productos.map(p => (
                                        <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white text-base">{p.nombre}</div>
                                                <div className="text-zinc-400 text-xs mt-0.5">📏 Medida: <span className="font-semibold text-zinc-300">{p.medida}</span></div>
                                            </td>
                                            <td className="px-6 py-4 font-mono">
                                                <div className="text-green-400 font-bold text-base">${p.precio}</div>
                                                <div className={`text-xs mt-0.5 ${p.stock <= 10 ? 'text-orange-400 font-bold' : 'text-zinc-500'}`}>
                                                    📦 Stock: {p.stock} u.
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => verDetalleUnitario(p.id)} className="p-2 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-800 transition" title="Consulta Unitaria">👁️</button>
                                                    <button onClick={() => prepararEdicion(p)} className="p-2 bg-orange-950/40 border border-orange-900 text-orange-400 rounded-xl hover:bg-orange-900/40 transition" title="Editar">✏️</button>
                                                    <button onClick={() => eliminarProducto(p.id, p.nombre)} className="p-2 bg-red-950/40 border border-red-900 text-red-400 rounded-xl hover:bg-red-900/40 transition" title="Eliminar">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center py-10 text-zinc-500 font-medium italic">No hay registros cargados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINACIÓN */}
                    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 px-6 py-4 rounded-2xl text-sm">
                        <span className="text-zinc-400 font-medium">
                            Total: <strong className="text-zinc-200">{totalRegistros}</strong> insumos
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPaginaActual(p => p - 1)}
                                disabled={!tieneAnterior}
                                className={`px-4 py-2 rounded-xl font-bold border transition ${tieneAnterior ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                            >
                                ◀ Anterior
                            </button>
                            <span className="flex items-center px-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono font-bold text-blue-500">
                                {paginaActual}
                            </span>
                            <button
                                onClick={() => setPaginaActual(p => p + 1)}
                                disabled={!tieneSiguiente}
                                className={`px-4 py-2 rounded-xl font-bold border transition ${tieneSiguiente ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                            >
                                Siguiente ▶
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DETALLE */}
            {productoSeleccionado && (
                <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden text-zinc-200">
                        <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-wider text-blue-500">Consulta Unitaria SQL</span>
                            <button onClick={() => setProductoSeleccionado(null)} className="text-zinc-500 hover:text-white font-bold">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-center">
                                <span className="text-4xl">📦</span>
                                <h4 className="text-xl font-black text-white mt-2">{productoSeleccionado.nombre}</h4>
                                <p className="text-xs text-zinc-400 mt-1">ID de registro confirmado por DRF</p>
                            </div>
                            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-2 font-medium text-sm">
                                <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Medida:</span><span className="text-zinc-300">{productoSeleccionado.medida}</span></div>
                                <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Precio Unitario:</span><span className="text-green-400 font-mono font-bold">${productoSeleccionado.precio}</span></div>
                                <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Existencia Física:</span><span className={`${productoSeleccionado.stock <= 10 ? 'text-orange-400 font-bold' : 'text-zinc-300'}`}>{productoSeleccionado.stock} unidades</span></div>
                                <div className="flex justify-between pt-1"><span className="text-zinc-500">Responsable:</span><span className="text-blue-400">@{productoSeleccionado.creado_por || 'admin'}</span></div>
                            </div>
                        </div>
                        <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                            <button onClick={() => setProductoSeleccionado(null)} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
                                Cerrar Ficha Técnica
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardProductos;