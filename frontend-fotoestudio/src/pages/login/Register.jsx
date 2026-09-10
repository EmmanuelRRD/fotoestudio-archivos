import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    username: '',
    correo: '',
    password: ''
  });
  const API_URL_GEN = import.meta.env.VITE_API_URL
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores({});
    setCargando(true);

    const nombreTrim = formData.nombre.trim();
    const apellidosTrim = formData.apellidos.trim();
    const usernameTrim = formData.username.trim();
    const correoTrim = formData.correo.trim();

    let erroresDetectados = {};

    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;
    if (!regexLetras.test(nombreTrim)) {
      erroresDetectados.nombre = "El nombre solo puede contener letras y espacios.";
    }

    if (!regexLetras.test(apellidosTrim)) {
      erroresDetectados.apellidos = "Los apellidos solo pueden contener letras y espacios.";
    }

    const regexAlfanumerico = /^[a-zA-Z0-9]+$/;
    if (usernameTrim.length < 8) {
      erroresDetectados.username = "El nombre de usuario debe tener al menos 8 caracteres.";
    } else if (!regexAlfanumerico.test(usernameTrim)) {
      erroresDetectados.username = "El usuario debe ser alfanumérico (letras y números sin espacios).";
    }

    const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regexCorreo.test(correoTrim)) {
      erroresDetectados.correo = "Por favor, ingresa una estructura de correo válida.";
    }

    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W_]{8,}$/;
    if (!regexPassword.test(formData.password)) {
      erroresDetectados.password = "Debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.";
    }

    if (Object.keys(erroresDetectados).length > 0) {
      setErrores(erroresDetectados);
      setCargando(false);
      return;
    }

    try {
      const response = await fetch(API_URL_GEN+'/registro/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: nombreTrim,
          last_name: apellidosTrim,
          username: usernameTrim,
          email: correoTrim,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login');
      } else {
        if (data.username) {
          setErrores({ username: "Este nombre de usuario ya está registrado en la base de datos." });
        } else if (data.email) {
          setErrores({ correo: "Este correo electrónico ya está en uso." });
        } else {
          setErrores({ general: data.detail || "Error al registrar los datos en el servidor." });
        }
      }
    } catch (err) {
      setErrores({ general: "No se pudo conectar con el servidor" });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Regreso */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-full italic flex items-center justify-center font-black text-white group-hover:bg-blue-500 transition-colors">F</div>
            <span className="text-2xl font-bold tracking-tighter uppercase">Estudio Jerez</span>
          </Link>
          <h2 className="text-zinc-400 mt-4 font-medium">Panel Administrativo</h2>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">

          {errores.general && (
            <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 text-sm p-4 rounded-xl font-medium">
              ⚠️ {errores.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-2 text-zinc-300">Nombre</label>
                <input
                  type="text"
                  className={`w-full bg-zinc-950 border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors text-white ${errores.nombre ? 'border-red-500/50' : 'border-zinc-800'}`}
                  placeholder="Juan"
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  disabled={cargando}
                />
                {errores.nombre && <p className="text-red-400 text-xs mt-1 font-medium">⚠️ {errores.nombre}</p>}
              </div>
              <div>
                <label className="block font-bold mb-2 text-zinc-300">Apellidos</label>
                <input
                  type="text"
                  className={`w-full bg-zinc-950 border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors text-white ${errores.apellidos ? 'border-red-500/50' : 'border-zinc-800'}`}
                  placeholder="Pérez"
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  required
                  disabled={cargando}
                />
                {errores.apellidos && <p className="text-red-400 text-xs mt-1 font-medium">⚠️ {errores.apellidos}</p>}
              </div>
            </div>

            <div>
              <label className="block font-bold mb-2 text-zinc-300">Nombre de Usuario</label>
              <input
                type="text"
                className={`w-full bg-zinc-950 border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors text-white font-mono ${errores.username ? 'border-red-500/50' : 'border-zinc-800'}`}
                placeholder="ej. elmango"
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={cargando}
              />
              {errores.username && <p className="text-red-400 text-xs mt-1 font-medium">⚠️ {errores.username}</p>}
            </div>

            <div>
              <label className="block font-bold mb-2 text-zinc-300">Correo Electrónico</label>
              <input
                type="text"
                className={`w-full bg-zinc-950 border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors text-white ${errores.correo ? 'border-red-500/50' : 'border-zinc-800'}`}
                placeholder="ejemplo@estudio.com"
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                required
                disabled={cargando}
              />
              {errores.correo && <p className="text-red-400 text-xs mt-1 font-medium">⚠️ {errores.correo}</p>}
            </div>

            <div>
              <label className="block font-bold mb-2 text-zinc-300">Contraseña</label>
              <input
                type="password"
                className={`w-full bg-zinc-950 border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors text-white ${errores.password ? 'border-red-500/50' : 'border-zinc-800'}`}
                placeholder="••••••••"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={cargando}
              />
              {errores.password && <p className="text-red-400 text-xs mt-1 font-medium">⚠️ {errores.password}</p>}
            </div>

            <button
              type="submit"
              disabled={cargando}
              className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 cursor-pointer mt-2 ${cargando ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {cargando ? 'Validando...' : 'Registrar Cuenta'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-500">
            <p>¿Ya tienes cuenta? <Link to="/login" className="text-white hover:underline">Inicia sesión.</Link></p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            ← Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;