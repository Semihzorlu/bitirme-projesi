import { useState, useRef } from 'react';
import { gorselleAra } from '../services/api';

function GorselAra() {
  const [yuklenenResim, setYuklenenResim] = useState(null);
  const [yuklenenDosya, setYuklenenDosya] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuclar, setSonuclar] = useState([]);
  const [hata, setHata] = useState('');
  const inputRef = useRef(null);

  const handleResimSec = (event) => {
    const dosya = event.target.files[0];
    if (dosya) {
      if (dosya.size > 5 * 1024 * 1024) {
        setHata('Dosya boyutu 5 MB\'dan büyük olamaz');
        return;
      }
      
      const resimUrl = URL.createObjectURL(dosya);
      setYuklenenResim(resimUrl);
      setYuklenenDosya(dosya);
      setSonuclar([]);
      setHata('');
    }
  };

  const handleArama = async () => {
    if (!yuklenenDosya) return;
    
    setYukleniyor(true);
    setHata('');
    
    // Gerçek AI'ye istek at
    const benzerUrunler = await gorselleAra(yuklenenDosya);
    
    if (benzerUrunler.length === 0) {
      setHata('Benzer ürün bulunamadı veya bağlantı hatası oluştu');
    } else {
      setSonuclar(benzerUrunler);
    }
    
    setYukleniyor(false);
  };

  const handleSifirla = () => {
    setYuklenenResim(null);
    setYuklenenDosya(null);
    setSonuclar([]);
    setHata('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold text-gray-800 mb-2">Görsel ile Ara</h2>
      <p className="text-gray-600 mb-2">Beğendiğin bir kıyafetin fotoğrafını yükle, yapay zekâ sana benzer ürünleri bulsun.</p>
      <p className="text-sm text-indigo-600 mb-8">🤖 OpenAI CLIP + pgvector ile çalışır</p>

      {/* Yükleme Alanı */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        {!yuklenenResim ? (
          <label className="block border-4 border-dashed border-indigo-300 rounded-lg p-12 text-center cursor-pointer hover:border-indigo-600 hover:bg-indigo-50 transition">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-lg text-gray-700 font-semibold mb-2">Fotoğraf Yüklemek için Tıkla</p>
            <p className="text-sm text-gray-500">JPG, PNG — Maksimum 5 MB</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleResimSec}
              className="hidden"
            />
          </label>
        ) : (
          <div className="text-center">
            <img
              src={yuklenenResim}
              alt="Yüklenen"
              className="max-h-96 mx-auto rounded-lg shadow-lg mb-4"
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleArama}
                disabled={yukleniyor}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {yukleniyor ? "🤖 AI analiz ediyor..." : "🔍 Benzerleri Bul"}
              </button>
              <button
                onClick={handleSifirla}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Değiştir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hata Mesajı */}
      {hata && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          ⚠️ {hata}
        </div>
      )}

      {/* Sonuçlar */}
      {sonuclar.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🎯 En Benzer Ürünler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sonuclar.map((urun) => (
              <div key={urun.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="relative">
                  <img
                    src={urun.resim || 'https://placehold.co/300x400/eee/333?text=Resim+Yok'}
                    alt={urun.ad}
                    className="w-full h-64 object-cover"
                  />
                  <span className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    %{urun.benzerlik}
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-xs text-indigo-600 font-semibold uppercase">{urun.kategori}</span>
                  <h4 className="font-semibold text-lg text-gray-800 mt-1">{urun.ad}</h4>
                  <p className="text-indigo-600 font-bold text-xl mt-2">{urun.fiyat} ₺</p>
                  <button className="mt-3 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                    Sepete Ekle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GorselAra;