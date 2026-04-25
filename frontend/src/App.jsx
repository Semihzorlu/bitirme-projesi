import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AnaSayfa from './pages/AnaSayfa';
import GorselAra from './pages/GorselAra';
import SohbetAsistani from './components/SohbetAsistani';
import UrunDetay from './pages/UrunDetay';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/">
              <h1 className="text-2xl font-bold text-indigo-600">Akıllı E-Ticaret</h1>
            </Link>
            <nav className="flex gap-6">
              <Link to="/" className="text-gray-700 hover:text-indigo-600">Ana Sayfa</Link>
              <Link to="/gorsel-ara" className="text-gray-700 hover:text-indigo-600">Görsel Ara</Link>
              <a href="#" className="text-gray-700 hover:text-indigo-600">Giriş</a>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<AnaSayfa />} />
          <Route path="/gorsel-ara" element={<GorselAra />} />
          <Route path="/urun/:id" element={<UrunDetay />} />
        </Routes>

        <footer className="bg-gray-800 text-white text-center py-6 mt-12">
          <p>© 2026 Akıllı E-Ticaret Asistanı - Bitirme Projesi</p>
        </footer>

        <SohbetAsistani />
      </div>
    </BrowserRouter>
  );
}

export default App;