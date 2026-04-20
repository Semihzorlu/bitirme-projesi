import { Link } from 'react-router-dom';

function AnaSayfa() {
  const urunler = [
    { id: 1, ad: "Deri Mont", fiyat: 1299, resim: "https://placehold.co/300x400/222/fff?text=Mont" },
    { id: 2, ad: "Kışlık Bot", fiyat: 899, resim: "https://placehold.co/300x400/444/fff?text=Bot" },
    { id: 3, ad: "Kazak", fiyat: 449, resim: "https://placehold.co/300x400/666/fff?text=Kazak" },
    { id: 4, ad: "Pantolon", fiyat: 599, resim: "https://placehold.co/300x400/888/fff?text=Pantolon" },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {urunler.map((urun) => (
            <div key={urun.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
              <img src={urun.resim} alt={urun.ad} className="w-full h-64 object-cover" />
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
      </section>
    </div>
  );
}

export default AnaSayfa;