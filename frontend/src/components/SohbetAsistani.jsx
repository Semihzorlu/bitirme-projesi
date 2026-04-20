import { useState, useRef, useEffect } from 'react';
import { mesajGonder as apiMesajGonder } from '../services/api';

function SohbetAsistani() {
  const [acik, setAcik] = useState(false);
  const [mesajlar, setMesajlar] = useState([
    { id: 1, kimden: 'bot', metin: 'Merhaba! Ben senin alışveriş asistanınım. Sana nasıl yardımcı olabilirim? 😊' }
  ]);
  const [girdi, setGirdi] = useState('');
  const [yaziyor, setYaziyor] = useState(false);
  const sonMesajRef = useRef(null);

  // Yeni mesaj geldiğinde otomatik aşağı kaydır
  useEffect(() => {
    sonMesajRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mesajlar, yaziyor]);

  // Mesaj gönderme (Backend'e bağlı)
  const mesajGonder = async () => {
    if (!girdi.trim()) return;

    // Kullanıcının mesajını ekle
    const yeniKullaniciMesaji = {
      id: Date.now(),
      kimden: 'kullanici',
      metin: girdi
    };
    setMesajlar(prev => [...prev, yeniKullaniciMesaji]);
    const gonderilecekMetin = girdi;
    setGirdi('');
    setYaziyor(true);

    // Backend'e istek at ve cevabı al
    const botCevabi = await apiMesajGonder(gonderilecekMetin);

    setMesajlar(prev => [...prev, {
      id: Date.now() + 1,
      kimden: 'bot',
      metin: botCevabi
    }]);
    setYaziyor(false);
  };

  // Enter tuşuyla gönderme
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      mesajGonder();
    }
  };

  return (
    <>
      {/* Açılır Kapanır Buton */}
      {!acik && (
        <button
          onClick={() => setAcik(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white w-16 h-16 rounded-full shadow-2xl hover:bg-indigo-700 transition flex items-center justify-center text-3xl z-50"
        >
          💬
        </button>
      )}

      {/* Chat Penceresi */}
      {acik && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Başlık */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">AI Asistan</h3>
              <p className="text-xs text-indigo-100">✨ Yapay zekâ destekli</p>
            </div>
            <button
              onClick={() => setAcik(false)}
              className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-xl"
            >
              ×
            </button>
          </div>

          {/* Mesajlar Alanı */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {mesajlar.map((mesaj) => (
              <div
                key={mesaj.id}
                className={`flex ${mesaj.kimden === 'kullanici' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    mesaj.kimden === 'kullanici'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow'
                  }`}
                >
                  {mesaj.metin}
                </div>
              </div>
            ))}

            {/* "Yazıyor..." göstergesi */}
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

          {/* Giriş Alanı */}
          <div className="p-3 border-t bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={girdi}
                onChange={(e) => setGirdi(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mesajını yaz..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-indigo-600"
              />
              <button
                onClick={mesajGonder}
                disabled={!girdi.trim()}
                className="bg-indigo-600 text-white w-10 h-10 rounded-full hover:bg-indigo-700 disabled:bg-gray-300 flex items-center justify-center"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SohbetAsistani;