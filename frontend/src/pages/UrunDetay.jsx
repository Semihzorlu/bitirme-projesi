import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { sepeteEkle } from '../services/sepet';
import Toast from '../components/Toast';
import {
  urunDetayGetir,
  benzerUrunleriGetir,
  beraberIncelenenleriGetir,
  etkilesimKaydet
} from '../services/api';

function UrunDetay() {
  const { id } = useParams();
  const navigate = useNavigate();


  const [urun, setUrun] = useState(null);
  const [benzerler, setBenzerler] = useState([]);
  const [beraberIncelenenler, setBeraberIncelenenler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [toast, setToast] = useState({ mesaj: '', tip: 'success' });

  useEffect(() => {
    async function veriYukle() {
      setYukleniyor(true);

      // Paralel veri çekme
      const [urunData, benzerData, beraberData] = await Promise.all([
        urunDetayGetir(id),
        benzerUrunleriGetir(id, 6),
        beraberIncelenenleriGetir(id, 6)
      ]);

      setUrun(urunData);
      setBenzerler(benzerData);
      setBeraberIncelenenler(beraberData);
      setYukleniyor(false);

      // Görüntüleme etkileşimi kaydet (collaborative filtering için)
      if (urunData && !urunData.hata) {
        etkilesimKaydet(parseInt(id), 'goruntuleme');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    veriYukle();
  }, [id]);

  // Sepete ekleme tıklama etkileşimi
  const handleSepeteEkle = () => {
    if (!urun) return;

    sepeteEkle({
      id: urun.id,
      ad: urun.ad,
      fiyat: urun.fiyat,
      resim: urun.resim,
      kategori: urun.kategori
    });
    etkilesimKaydet(parseInt(id), 'sepete_ekleme');

    setToast({
      mesaj: `✓ "${urun.ad}" sepete eklendi`,
      tip: 'success'
    });
  };

  if (yukleniyor) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Ürün yükleniyor...</p>
      </div>
    );
  }

  if (!urun || urun.hata) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 rounded-lg p-8 inline-block">
          <p className="text-red-600 font-semibold text-lg">⚠️ Ürün bulunamadı</p>
          <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (

    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Toast Bildirim */}
      <Toast
        mesaj={toast.mesaj}
        tip={toast.tip}
        onClose={() => setToast({ mesaj: '', tip: 'success' })}
      />

      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center gap-2 transition"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Geri Dön
      </button>

      {/* Ürün Detay Kartı */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">

          <div className="bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center min-h-[400px]">
            {urun.resim ? (
              <img src={urun.resim} alt={urun.ad} className="w-full h-full object-cover" />
            ) : (
              <div className="text-6xl">🛍️</div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-indigo-600 font-bold uppercase tracking-wider mb-2">
              {urun.kategori}
            </span>

            <h1 className="text-4xl font-bold text-gray-800 mb-4">{urun.ad}</h1>

            <p className="text-gray-600 leading-relaxed mb-6">{urun.aciklama}</p>

            <div className="border-t border-b border-gray-200 py-4 mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-indigo-600">{urun.fiyat} ₺</span>
                <span className="text-sm text-gray-500">KDV dahil</span>
              </div>
              {urun.stok_adedi !== undefined && (
                <p className="text-sm text-gray-600 mt-2">
                  {urun.stok_adedi > 0 ? (
                    <span className="text-green-600">✓ Stokta {urun.stok_adedi} adet</span>
                  ) : (
                    <span className="text-red-600">✗ Stokta yok</span>
                  )}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-auto">
              <button
                onClick={handleSepeteEkle}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold transition"
              >
                Sepete Ekle
              </button>
              <button className="px-4 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition">
                ❤
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benzer Ürünler (Content-Based) */}
      {benzerler.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              🎯 Benzer Ürünler
            </h2>
            <span className="text-sm text-gray-500">AI ile bulundu</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {benzerler.map((benzer) => (
              <Link
                key={benzer.id}
                to={`/urun/${benzer.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group"
              >
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {benzer.resim ? (
                    <img
                      src={benzer.resim}
                      alt={benzer.ad}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                  )}
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    %{benzer.benzerlik}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs text-indigo-600 font-semibold uppercase truncate">
                    {benzer.kategori}
                  </p>
                  <p className="font-semibold text-gray-800 text-sm truncate">{benzer.ad}</p>
                  <p className="text-indigo-600 font-bold mt-1">{benzer.fiyat} ₺</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bu Ürünü İnceleyenler Şunları da İnceledi (Collaborative) */}
      {beraberIncelenenler.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              👥 Bu Ürünü İnceleyenler Şunları da İnceledi
            </h2>
            <span className="text-sm text-gray-500">Kullanıcı verisinden</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {beraberIncelenenler.map((urun) => (
              <Link
                key={urun.id}
                to={`/urun/${urun.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group"
              >
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {urun.resim ? (
                    <img
                      src={urun.resim}
                      alt={urun.ad}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                  )}
                  <span className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    👁 {urun.ortak_kullanici}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs text-indigo-600 font-semibold uppercase truncate">
                    {urun.kategori}
                  </p>
                  <p className="font-semibold text-gray-800 text-sm truncate">{urun.ad}</p>
                  <p className="text-indigo-600 font-bold mt-1">{urun.fiyat} ₺</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Henüz veri yoksa info */}
      {beraberIncelenenler.length === 0 && (
        <div className="mb-12 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-700 text-sm">
            💡 <strong>"Bu ürünü inceleyenler"</strong> önerisi için yeterli veri yok.
            Birkaç ürünü inceledikten sonra burada öneriler görünecek.
          </p>
        </div>
      )}
    </div>
  );
}

export default UrunDetay;