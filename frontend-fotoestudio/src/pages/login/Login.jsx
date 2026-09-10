import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";

function Login() {
  const [captchaToken, setCaptchaToken] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL
  const [credentials, setCredentials] = useState({ username: '', password: '', captcha_token: captchaToken });
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const onChangeCaptcha = (token) => {
    setCaptchaToken(token); // Guardamos el token que nos da Google
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const response = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          captcha_token: captchaToken 
        }), 
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('tipo_usuario', data.tipo_usuario);
        localStorage.setItem('is_staff', data.is_staff);
        localStorage.setItem('nombre_completo', data.nombre_completo);

        if (data.is_staff === true) {
          navigate('/dashboard');
        } else {
          navigate('/citas');
        }

      } else {
        setError(data.detail || "Usuario o contraseña incorrectos");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo / Regreso */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 bg-blue-600 rounded-full italic flex items-center justify-center font-black text-white group-hover:bg-blue-500 transition-colors">F</div>
            <span className="text-2xl font-bold tracking-tighter uppercase">Estudio Jerez</span>
          </Link>
          <h2 className="text-zinc-400 mt-4 font-medium">Panel Administrativo</h2>
        </div>

        {/*Login */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">

          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 text-sm p-4 rounded-xl font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-zinc-300">Nombre de Usuario o Correo</label>
              <input
                type="text"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors text-white"
                placeholder="ej. elmango"
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
                disabled={cargando}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-zinc-300">Contraseña</label>
              <input
                type="password"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 transition-colors text-white"
                placeholder="••••••••"
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                disabled={cargando}
              />
            </div>

            <ReCAPTCHA
              sitekey="6Ld64vwsAAAAAFJ9wzhNuSD2CsMknmejehQQUDPD"
              onChange={onChangeCaptcha}
            />

            <button
              type="submit"
              disabled={cargando}
              className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 cursor-pointer ${cargando ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {cargando ? 'Validando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-500">
            <p>¿Olvidaste tu acceso? Contacta al administrador de Sistemas.</p>
          </div>

          <div className="mt-8 text-center text-sm text-zinc-500">
            <p>¿No tienes cuenta? <Link to="/Register" className="text-white hover:underline">Crea una.</Link></p>
          </div>
        </div>

        {/* Botón para volver */}
        <div className="text-center mt-8">
          <Link to="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            ← Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;