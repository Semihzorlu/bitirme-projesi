import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import AnaSayfa from './pages/AnaSayfa';
import GorselAra from './pages/GorselAra';
import UrunDetay from './pages/UrunDetay';
import AramaSonuclari from './pages/AramaSonuclari';
import SohbetAsistani from './components/SohbetAsistani';
import SepetCekmecesi from './components/SepetCekmecesi';
import { sepetSayisi } from './services/sepet';

function Header({ onSepetAc }) {
  const navigate = useNavigate();
  const [headerInput, setHeaderInput] = useState('');
  const [sepetAdet, setSepetAdet] = useState(0);

  useEffect(() => {
    const sayaciTazele = () => setSepetAdet(sepetSayisi());
    sayaciTazele();
    
    window.addEventListener('sepet-guncellendi', sayaciTazele);
    return () => window.removeEventListener('sepet-guncellendi', sayaciTazele);
  }, []);

  const aramaYap = (e) => {
    e.preventDefault();
    if (!headerInput.trim()) return;
    navigate(`/arama?q=${encodeURIComponent(headerInput.trim())}`);
    setHeaderInput('');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="text-2xl font-bold text-indigo-600 flex-shrink-0">
            Akıllı E-Ticaret
          </Link>

          <form 
            onSubmit={aramaYap}
            className="hidden md:flex flex-1 max-w-md"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={headerInput}
                onChange={(e) => setHeaderInput(e.target.value)}
                placeholder="🔍 AI ile ara: 'kışlık mont', 'pamuklu tişört'..."
                className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-indigo-600 transition"
              />
              <button 
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition flex items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
              </button>
            </div>
          </form>

          <div className="flex items-center gap-4 flex-shrink-0">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 transition hidden sm:inline">
              Ana Sayfa
            </Link>
            <Link to="/gorsel-ara" className="text-gray-600 hover:text-indigo-600 transition hidden sm:inline">
              Görsel Ara
            </Link>
            
            {/* Sepet İkonu - Tıklanınca çekmeceyi açar */}
            <button 
              onClick={onSepetAc}
              className="relative text-gray-600 hover:text-indigo-600 transition p-2"
              title="Sepetim"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
              </svg>
              {sepetAdet > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                  {sepetAdet}
                </span>
              )}
            </button>

            <button className="text-gray-600 hover:text-indigo-600 transition">
              Giriş
            </button>
          </div>
        </div>

        <form onSubmit={aramaYap} className="md:hidden mt-3">
          <div className="relative">
            <input
              type="text"
              value={headerInput}
              onChange={(e) => setHeaderInput(e.target.value)}
              placeholder="🔍 AI ile ara..."
              className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-indigo-600 text-sm"
            />
            <button 
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-600 text-white rounded-full"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
            </button>
          </div>
        </form>
      </nav>
    </header>
  );
}


function App() {
  const [sepetAcik, setSepetAcik] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header onSepetAc={() => setSepetAcik(true)} />

        <main>
          <Routes>
            <Route path="/" element={<AnaSayfa />} />
            <Route path="/gorsel-ara" element={<GorselAra />} />
            <Route path="/urun/:id" element={<UrunDetay />} />
            <Route path="/arama" element={<AramaSonuclari />} />
          </Routes>
        </main>

        <footer className="bg-white border-t mt-12 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
            <p className="font-semibold text-indigo-600">Akıllı E-Ticaret</p>
            <p className="text-sm mt-1">CLIP + Gemini + pgvector ile güçlendirilmiştir</p>
            <p className="text-xs mt-3 text-gray-400">© 2026 Bitirme Projesi</p>
          </div>
        </footer>

        <SohbetAsistani />
        
        {/* Sepet Çekmecesi (sağdan açılır) */}
        <SepetCekmecesi 
          acik={sepetAcik} 
          onKapat={() => setSepetAcik(false)} 
        />
      </div>
    </BrowserRouter>
  );
}

export default App;