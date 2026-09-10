import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full italic flex items-center justify-center font-black text-white">F</div>
            <span className="text-xl font-bold tracking-tighter uppercase">Estudio Jerez</span>
          </div>
          
          <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
            <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
            <a href="#galeria" className="hover:text-white transition-colors">Galería</a>
            <a href="#contacto" className="hover:text-white transition-colors">Precios</a>
          </div>

          <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-500 hover:text-white transition-all cursor-pointer">
            <a href="/#/Login">Agendar cita</a>
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-blue-400 mb-6">
            FOTOGRAFÍA PROFESIONAL EN ZACATECAS
          </span>
          <h1 className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent leading-tight">
            Momentos que se <br /> vuelven eternos.
          </h1>
          <p className="text-zinc-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Capturamos la esencia de tus eventos más importantes con un enfoque cinematográfico y artístico.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <button className="bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 cursor-pointer">
              Ver Portafolio
            </button>
            <button className="border border-zinc-700 px-10 py-4 rounded-full font-bold text-lg hover:bg-zinc-900 transition-all cursor-pointer">
              Conocer más
            </button>
          </div>
        </div>
      </header>

      {/* --- SECCIÓN SERVICIOS --- */}
      <section id="servicios" className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['Bodas', 'Sesiones XV', 'Retratos'].map((servicio) => (
              <div key={servicio} className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 transition-all group">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl mb-6 group-hover:bg-blue-600 transition-colors"></div>
                <h3 className="text-2xl font-bold mb-4">{servicio}</h3>
                <p className="text-zinc-500">Sesiones personalizadas con entrega digital en alta resolución y retoque profesional.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECCIÓN GALERÍA (Grid) --- */}
      <section id="galeria" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Galería Reciente</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8,9].map((i) => (
              <div key={i} className="aspect-[3/4] bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden relative group">
                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-sm font-bold uppercase tracking-widest">Ver Foto</span>
                </div>
                {/* Aquí irán tus etiquetas <img> cuando conectes con Django */}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-zinc-900 text-center text-zinc-600 text-sm">
        <p>&copy; 2026 Estudio Jerez - Facultad de Ingeniería Sistemas</p>
      </footer>
    </div>
  );
}

export default Home;