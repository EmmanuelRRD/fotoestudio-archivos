import { Routes, Route, Navigate } from 'react-router-dom'; // <-- Agregamos Navigate aquí
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Login from './pages/login/Login';
import Register from './pages/login/Register';
import Dashboard from './pages/admin/Dashboard'; // Tu panel principal de Admin
import Citas from './pages/citas/citas-all';    // Tu componente ABCC de citas que armamos

// ==========================================
// 🧭 COMPONENTE CENTRAL DE REDIRECCIÓN 
// ==========================================
const CentroRedireccion = () => {
  const token = localStorage.getItem('access_token');
  const isAdmin = localStorage.getItem('is_staff') === 'true';

  // Si no hay sesión iniciada, va para el login
  if (!token) return <Navigate to="/login" replace />;

  // Semáforo inteligente de rutas en minúsculas:
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />; // El Admin va a la ruta protegida del Dashboard
  } else {
    return <Navigate to="/citas" replace />;     // Clientes y fotógrafos van a la ruta de citas
  }
};

// ==========================================
// 🛡️ GUARDIÁN DE SEGURIDAD (Rutas Protegidas)
// ==========================================
const RutaProtegida = ({ children, rolRequerido }) => {
  const token = localStorage.getItem('access_token');
  const isAdmin = localStorage.getItem('is_staff') === 'true';

  if (!token) return <Navigate to="/login" replace />;

  // Si la ruta es exclusiva de Admin y el usuario no lo es, lo saca al login
  if (rolRequerido === 'admin' && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* 1. Rutas Públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 2. La Estación Central (Filtra a dónde va cada quién tras el Login) */}
      <Route path="/redireccionar" element={<CentroRedireccion />} />

      {/* 3. Rutas Protegidas (Nadie entra a menos que tenga Token válido) */}
      <Route
        path="/dashboard"
        element={
          <RutaProtegida rolRequerido="admin">
            <Dashboard /> {/* El Administrador entra a su Dashboard central */}
          </RutaProtegida>
        }
      />

      <Route
        path="/citas"
        element={
          <RutaProtegida>
            <Citas /> {/* Clientes y fotógrafos ven las citas (React adaptará la vista por su rol) */}
          </RutaProtegida>
        }
      />

      {/* 4. Ruta por defecto para URLs que no existen (Va al final de ley) */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;