import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { urunAra } from '../services/api';

function AramaSonuclari() {
  const [searchParams] = useSearchParams();
  const aramaMetni = searchParams.get('q') || '';
  
  const [sonuclar, setSonuclar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    async function aramaYap() {
      if (!aramaMetni.trim()) {
        setSonuclar([]);
        setYukleniyor(false);
        return;
      }
      
      setYukleniyor(true);
      const sonuc = await urunAra(aramaMetni, 20);
      setSonuclar(sonuc.sonuclar);
      setYukleniyor(false);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    aramaYap();
  }, [aramaMetni]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Başlık */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Arama Sonuçları
        </h1>
        <p className="text-gray-600">
          <span className="text-indigo-600 font-semibold">"{aramaMetni}"</span> için sonuçlar
          {!yukleniyor && (
            <span className="ml-2 text-sm text-gray-500">
              ({sonuclar.length} ürün)
            </span>
          )}
        </p>
      </div>

      {/* Yükleniyor */}
      {yukleniyor && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Yapay zeka aranıyor...</p>
        </div>
      )}

      {/* Boş Sonuç */}
      {!yukleniyor && sonuclar.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-700 font-semibold text-lg">
            "{aramaMetni}" için sonuç bulunamadı
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Farklı kelimeler dener misin? Veya AI Asistanına detaylı sor.
          </p>
          <Link 
            to="/" 
            className="inline-block mt-6 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      )}

      {/* Sonuçlar */}
      {!yukleniyor && sonuclar.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sonuclar.map((urun) => (
            <Link
              key={urun.id}
              to={`/urun/${urun.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group"
            >
              <div className="overflow-hidden aspect-square">
                {urun.resim ? (
                  <img 
                    src={urun.resim} 
                    alt={urun.ad} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-100">🛍️</div>
                )}
              </div>
              <div className="p-4">
                <span className="text-xs text-indigo-600 font-semibold uppercase">
                  {urun.kategori}
                </span>
                <h4 className="font-semibold text-base text-gray-800 mt-1 truncate">
                  {urun.ad}
                </h4>
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                  {urun.aciklama}
                </p>
                <p className="text-indigo-600 font-bold text-xl mt-2">
                  {urun.fiyat} ₺
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bilgi notu */}
      {!yukleniyor && sonuclar.length > 0 && (
        <div className="mt-12 bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-center">
          <p className="text-sm text-indigo-700">
            💡 Daha detaylı bir öneri için sağ alttaki <strong>AI Asistan</strong>'a sor!
          </p>
        </div>
      )}
    </div>
  );
}

export default AramaSonuclari;