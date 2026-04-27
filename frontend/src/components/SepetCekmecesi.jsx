import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  sepetiAl, 
  sepettenKaldir, 
  adetGuncelle, 
  sepetiTemizle, 
  sepetToplami 
} from '../services/sepet';

function SepetCekmecesi({ acik, onKapat }) {
  const [urunler, setUrunler] = useState([]);
  const [temizleOnay, setTemizleOnay] = useState(false);

  // Sepet güncellendiğinde state'i tazele
  useEffect(() => {
    const tazele = () => setUrunler(sepetiAl());
    tazele();
    
    window.addEventListener('sepet-guncellendi', tazele);
    return () => window.removeEventListener('sepet-guncellendi', tazele);
  }, []);

  const toplam = sepetToplami();

  const kaldir = (urunId) => {
    sepettenKaldir(urunId);
  };

  const adetArtir = (urun) => {
    adetGuncelle(urun.id, urun.adet + 1);
  };

  const adetAzalt = (urun) => {
    adetGuncelle(urun.id, urun.adet - 1);
  };

  const tumunuTemizle = () => {
    sepetiTemizle();
    setTemizleOnay(false);
  };

  if (!acik) return null;

  return (
    <>
      {/* Karartma arkaplanı */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onKapat}
      />

      {/* Çekmece */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        
        {/* Başlık */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>
            </svg>
            <h2 className="font-bold text-lg">
              Sepetim 
              {urunler.length > 0 && (
                <span className="text-sm font-normal ml-1">({urunler.length} ürün)</span>
              )}
            </h2>
          </div>
          <button
            onClick={onKapat}
            className="hover:bg-white/20 rounded-full w-9 h-9 flex items-center justify-center transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto">
          {urunler.length === 0 ? (
            // Boş sepet
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Sepetin Boş
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Henüz ürün eklemedin. Hemen alışverişe başla!
              </p>
              <button
                onClick={onKapat}
                className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition font-semibold"
              >
                Alışverişe Başla
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {urunler.map((urun) => (
                <div 
                  key={urun.id}
                  className="bg-gray-50 rounded-lg p-3 flex gap-3 hover:bg-gray-100 transition"
                >
                  {/* Resim */}
                  <Link 
                    to={`/urun/${urun.id}`}
                    onClick={onKapat}
                    className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0"
                  >
                    {urun.resim ? (
                      <img 
                        src={urun.resim} 
                        alt={urun.ad} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                    )}
                  </Link>

                  {/* Bilgi */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/urun/${urun.id}`}
                      onClick={onKapat}
                      className="block"
                    >
                      <p className="text-xs text-indigo-600 font-semibold uppercase">
                        {urun.kategori}
                      </p>
                      <h4 className="font-semibold text-gray-800 text-sm truncate">
                        {urun.ad}
                      </h4>
                    </Link>
                    
                    <div className="flex items-center justify-between mt-2">
                      {/* Adet kontrolü */}
                      <div className="flex items-center gap-1 bg-white rounded-full border border-gray-300">
                        <button
                          onClick={() => adetAzalt(urun)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-indigo-600 transition"
                        >
                          −
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">
                          {urun.adet}
                        </span>
                        <button
                          onClick={() => adetArtir(urun)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-indigo-600 transition"
                        >
                          +
                        </button>
                      </div>
                      
                      {/* Fiyat */}
                      <p className="text-indigo-600 font-bold text-sm">
                        {(urun.fiyat * urun.adet).toFixed(2)} ₺
                      </p>
                    </div>
                  </div>

                  {/* Sil butonu */}
                  <button
                    onClick={() => kaldir(urun.id)}
                    title="Kaldır"
                    className="text-gray-400 hover:text-red-500 transition self-start"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              ))}

              {/* Tümünü Temizle */}
              <button
                onClick={() => setTemizleOnay(true)}
                className="w-full text-sm text-gray-500 hover:text-red-500 py-2 transition"
              >
                Sepeti Temizle
              </button>
            </div>
          )}
        </div>

        {/* Alt Bölüm (Toplam + Ödeme) */}
        {urunler.length > 0 && (
          <div className="border-t bg-white p-4 space-y-3 flex-shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Ara Toplam:</span>
              <span className="text-gray-800 font-semibold">{toplam.toFixed(2)} ₺</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Kargo:</span>
              <span className="text-green-600 font-semibold text-sm">Ücretsiz</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-gray-800 font-bold">Toplam:</span>
              <span className="text-indigo-600 font-bold text-2xl">{toplam.toFixed(2)} ₺</span>
            </div>
            
            <button
              onClick={() => alert('Ödeme özelliği henüz aktif değil 🙂')}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Ödemeye Geç
            </button>
          </div>
        )}

        {/* Temizleme Onay Modalı (sepet için) */}
        {temizleOnay && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="bg-red-50 p-5 flex flex-col items-center border-b border-red-100">
                <div className="bg-red-100 w-14 h-14 rounded-full flex items-center justify-center mb-3">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Sepeti Temizle</h3>
              </div>
              <div className="p-5">
                <p className="text-gray-600 text-sm text-center leading-relaxed mb-5">
                  Sepetteki tüm ürünler silinecek. Emin misin?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTemizleOnay(false)}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={tumunuTemizle}
                    className="flex-1 px-4 py-2.5 text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium text-sm transition"
                  >
                    Evet, Temizle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SepetCekmecesi;