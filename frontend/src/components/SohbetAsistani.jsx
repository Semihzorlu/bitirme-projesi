import { useState, useRef, useEffect } from 'react';
import { mesajGonder as apiMesajGonder } from '../services/api';

const HOSGELDIN_MESAJI = {
  id: 1,
  kimden: 'bot',
  metin: 'Merhaba! Ben senin alışveriş asistanınım. Sana nasıl yardımcı olabilirim? 😊',
  urunler: []
};


function SohbetAsistani() {
  const [acik, setAcik] = useState(false);
  const [mesajlar, setMesajlar] = useState([HOSGELDIN_MESAJI]);
  const [girdi, setGirdi] = useState('');
  const [yaziyor, setYaziyor] = useState(false);
  const [temizleOnayGoster, setTemizleOnayGoster] = useState(false);
  const sonMesajRef = useRef(null);

  useEffect(() => {
    sonMesajRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mesajlar, yaziyor]);

  const mesajGonder = async () => {
    if (!girdi.trim()) return;

    const yeniKullaniciMesaji = {
      id: Date.now(),
      kimden: 'kullanici',
      metin: girdi,
      urunler: []
    };
    setMesajlar(prev => [...prev, yeniKullaniciMesaji]);
    const gonderilecekMetin = girdi;
    setGirdi('');
    setYaziyor(true);

    const sonuc = await apiMesajGonder(gonderilecekMetin);

    setMesajlar(prev => [...prev, {
      id: Date.now() + 1,
      kimden: 'bot',
      metin: sonuc.cevap || sonuc,
      urunler: sonuc.onerilen_urunler || []
    }]);
    setYaziyor(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      mesajGonder();
    }
  };

  const temizleOnayAc = () => setTemizleOnayGoster(true);
  
  const sohbetiTemizle = () => {
    setMesajlar([HOSGELDIN_MESAJI]);
    setTemizleOnayGoster(false);
  };

  const temizlemeButonuPasif = mesajlar.length <= 1;

  return (
    <>
      {!acik && (
        <button
          onClick={() => setAcik(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white w-16 h-16 rounded-full shadow-2xl hover:bg-indigo-700 transition flex items-center justify-center text-3xl z-50"
        >
          💬
        </button>
      )}

      {acik && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
          
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex justify-between items-center flex-shrink-0">
            <div>
              <h3 className="font-bold text-lg">AI Asistan</h3>
              <p className="text-xs text-indigo-100">✨ Gemini + CLIP ile çalışır</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={temizleOnayAc}
                disabled={temizlemeButonuPasif}
                title="Sohbeti temizle"
                className={`text-white rounded-full w-9 h-9 flex items-center justify-center transition ${
                  temizlemeButonuPasif 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:bg-white/20 cursor-pointer'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
              <button
                onClick={() => setAcik(false)}
                title="Kapat"
                className="text-white hover:bg-white/20 rounded-full w-9 h-9 flex items-center justify-center transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {mesajlar.map((mesaj) => (
              <div key={mesaj.id}>
                <div className={`flex ${mesaj.kimden === 'kullanici' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      mesaj.kimden === 'kullanici'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none shadow'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{mesaj.metin}</div>
                  </div>
                </div>

                {mesaj.urunler && mesaj.urunler.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {mesaj.urunler.map((urun) => (
                      <div key={urun.id} className="bg-white rounded-lg shadow border border-gray-200 p-2 flex gap-3 hover:shadow-md transition">
                        <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                          {urun.resim ? (
                            <img src={urun.resim} alt={urun.ad} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-indigo-600 font-semibold uppercase">{urun.kategori}</p>
                          <p className="font-semibold text-gray-800 text-sm truncate">{urun.ad}</p>
                          <p className="text-indigo-600 font-bold">{urun.fiyat} ₺</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {yaziyor && (
              <div className="flex justify-start">
                <div className="bg-white shadow rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={sonMesajRef}></div>
          </div>

          <div className="p-3 border-t bg-white flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={girdi}
                onChange={(e) => setGirdi(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mesajını yaz..."
                disabled={yaziyor}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-indigo-600 disabled:bg-gray-50"
              />
              <button
                onClick={mesajGonder}
                disabled={!girdi.trim() || yaziyor}
                className="bg-indigo-600 text-white w-10 h-10 rounded-full hover:bg-indigo-700 disabled:bg-gray-300 flex items-center justify-center transition"
              >
                ➤
              </button>
            </div>
          </div>

          {temizleOnayGoster && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="bg-red-50 p-5 flex flex-col items-center border-b border-red-100">
                  <div className="bg-red-100 w-14 h-14 rounded-full flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Sohbeti Temizle</h3>
                </div>
                
                <div className="p-5">
                  <p className="text-gray-600 text-sm text-center leading-relaxed mb-5">
                    Tüm mesaj geçmişiniz silinecek ve sohbet sıfırlanacak. Bu işlem geri alınamaz.
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTemizleOnayGoster(false)}
                      className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={sohbetiTemizle}
                      className="flex-1 px-4 py-2.5 text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium text-sm transition shadow-sm hover:shadow"
                    >
                      Evet, Temizle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default SohbetAsistani;