import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { urunleriGetir } from '../services/api';

function AnaSayfa() {
  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Sayfa açıldığında backend'den ürünleri çek
  useEffect(() => {
    async function verileriGetir() {
      const veri = await urunleriGetir();
      setUrunler(veri);
      setYukleniyor(false);
    }
    verileriGetir();
  }, []);

  return (
    <div>
      {/* Hero Bölümü */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-4">Yapay Zekâ ile Alışveriş</h2>
          <p className="text-xl mb-8">Bir fotoğraf yükle, benzer ürünleri saniyeler içinde bul.</p>
          <Link to="/gorsel-ara">
            <button className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100">
              Görselle Ara
            </button>
          </Link>
        </div>
      </section>

      {/* Ürün Listesi */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h3 className="text-3xl font-bold mb-8 text-gray-800">Öne Çıkan Ürünler</h3>

        {yukleniyor ? (
          // Yükleniyor durumu
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Ürünler yükleniyor...</p>
          </div>
        ) : urunler.length === 0 ? (
          // Ürün bulunamadı durumu (backend kapalıysa)
          <div className="text-center py-20 bg-red-50 rounded-lg">
            <p className="text-red-600 font-semibold">⚠️ Backend'e bağlanılamadı.</p>
            <p className="text-gray-600 mt-2">Backend sunucusunun çalıştığından emin ol (uvicorn main:app --reload)</p>
          </div>
        ) : (
          // Ürün kartları
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {urunler.map((urun) => (
              <Link
                key={urun.id}
                to={`/urun/${urun.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group"
              >
                <div className="overflow-hidden">
                  <img
                    src={urun.resim}
                    alt={urun.ad}
                    className="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-4">
                  <span className="text-xs text-indigo-600 font-semibold uppercase">{urun.kategori}</span>
                  <h4 className="font-semibold text-lg text-gray-800 mt-1">{urun.ad}</h4>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{urun.aciklama}</p>
                  <p className="text-indigo-600 font-bold text-xl mt-2">{urun.fiyat} ₺</p>
                  <button
                    onClick={(e) => {
                      e.preventDefault(); // Linke tıklamayı durdur
                      // İleride sepete ekleme buraya gelecek
                    }}
                    className="mt-3 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                  >
                    Sepete Ekle
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AnaSayfa;