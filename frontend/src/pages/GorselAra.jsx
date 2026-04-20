import { useState } from 'react';

function GorselAra() {
  const [yuklenenResim, setYuklenenResim] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuclar, setSonuclar] = useState([]);

  // Kullanıcı fotoğraf seçtiğinde çalışır
  const handleResimSec = (event) => {
    const dosya = event.target.files[0];
    if (dosya) {
      const resimUrl = URL.createObjectURL(dosya);
      setYuklenenResim(resimUrl);
      setSonuclar([]); // Eski sonuçları temizle
    }
  };

  // "Benzerleri Bul" butonuna tıklandığında çalışır
  const handleArama = () => {
    if (!yuklenenResim) return;
    
    setYukleniyor(true);
    
    // Şimdilik sahte sonuç dönüyoruz (Backend bağlanınca gerçek olacak)
    setTimeout(() => {
      setSonuclar([
        { id: 1, ad: "Benzer Ürün 1", fiyat: 799, benzerlik: 94, resim: "https://placehold.co/300x400/333/fff?text=Benzer+1" },
        { id: 2, ad: "Benzer Ürün 2", fiyat: 649, benzerlik: 89, resim: "https://placehold.co/300x400/555/fff?text=Benzer+2" },
        { id: 3, ad: "Benzer Ürün 3", fiyat: 899, benzerlik: 85, resim: "https://placehold.co/300x400/777/fff?text=Benzer+3" },
        { id: 4, ad: "Benzer Ürün 4", fiyat: 579, benzerlik: 81, resim: "https://placehold.co/300x400/999/fff?text=Benzer+4" },
      ]);
      setYukleniyor(false);
    }, 1500); // 1.5 saniye bekle (gerçek AI işlemi gibi)
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold text-gray-800 mb-2">Görsel ile Ara</h2>
      <p className="text-gray-600 mb-8">Beğendiğin bir kıyafetin fotoğrafını yükle, yapay zekâ sana benzer ürünleri bulsun.</p>

      {/* Yükleme Alanı */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        {!yuklenenResim ? (
          <label className="block border-4 border-dashed border-indigo-300 rounded-lg p-12 text-center cursor-pointer hover:border-indigo-600 hover:bg-indigo-50 transition">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-lg text-gray-700 font-semibold mb-2">Fotoğraf Yüklemek için Tıkla</p>
            <p className="text-sm text-gray-500">JPG, PNG — Maksimum 5 MB</p>
            <input
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
                {yukleniyor ? "Aranıyor..." : "🔍 Benzerleri Bul"}
              </button>
              <button
                onClick={() => { setYuklenenResim(null); setSonuclar([]); }}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Değiştir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sonuçlar */}
      {sonuclar.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🎯 En Benzer Ürünler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sonuclar.map((urun) => (
              <div key={urun.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="relative">
                  <img src={urun.resim} alt={urun.ad} className="w-full h-64 object-cover" />
                  <span className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    %{urun.benzerlik}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-lg text-gray-800">{urun.ad}</h4>
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