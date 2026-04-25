// Backend'in adresi
const API_URL = "http://localhost:8000";

// ============ ÜRÜN FONKSİYONLARI ============

// Tüm ürünleri getir
export async function urunleriGetir() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();
    return data.urunler;
  } catch (error) {
    console.error("Ürünler alınamadı:", error);
    return [];
  }
}

// Tek ürün detayı
export async function urunDetayGetir(id) {
  try {
    const response = await fetch(`${API_URL}/products/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Ürün detayı alınamadı:", error);
    return null;
  }
}

// ============ SOHBET FONKSİYONU ============

// Chat mesajı gönder ve cevap al
// Chat mesajı gönder ve cevap + ürünleri al
// Chat mesajı gönder + konuşma geçmişi
// Chat mesajı gönder ve cevap + ürünleri al
export async function mesajGonder(metin) {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metin: metin }),
    });
    const data = await response.json();
    return {
      cevap: data.cevap || "",
      onerilen_urunler: data.onerilen_urunler || []
    };
  } catch (error) {
    console.error("Mesaj gönderilemedi:", error);
    return {
      cevap: "Üzgünüm, şu an sunucuya bağlanamıyorum. Lütfen tekrar dene.",
      onerilen_urunler: []
    };
  }
}
// ============ GÖRSEL ARAMA FONKSİYONU ============

// Fotoğraf yükle ve benzer ürünleri al
export async function gorselleAra(dosya) {
  try {
    const formData = new FormData();
    formData.append("file", dosya);
    
    const response = await fetch(`${API_URL}/visual-search`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error("Görsel arama başarısız oldu");
    }
    
    const data = await response.json();
    return data.sonuclar;
  } catch (error) {
    console.error("Görsel arama hatası:", error);
    return [];
  }
}

// ============ ÖNERİ SİSTEMİ FONKSİYONLARI ============

// Bir ürüne benzer ürünleri getir (Content-Based)
export async function benzerUrunleriGetir(urunId, limit = 6) {
  try {
    const response = await fetch(`${API_URL}/products/${urunId}/similar?limit=${limit}`);
    const data = await response.json();
    return data.benzer_urunler || [];
  } catch (error) {
    console.error("Benzer ürünler alınamadı:", error);
    return [];
  }
}
import { oturumIdAl } from './session';

// ============ ETKİLEŞİM TAKİP FONKSİYONLARI ============

/**
 * Bir ürünle olan etkileşimi backend'e kaydet
 * @param {number} urunId - Ürün ID'si
 * @param {string} etkilesimTipi - 'goruntuleme', 'tiklama', 'sepete_ekleme'
 */
export async function etkilesimKaydet(urunId, etkilesimTipi = 'goruntuleme') {
  try {
    const oturumId = oturumIdAl();
    
    await fetch(`${API_URL}/interactions/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oturum_id: oturumId,
        urun_id: urunId,
        etkilesim_tipi: etkilesimTipi
      })
    });
  } catch (error) {
    // Sessiz hata - etkileşim kaydedilemese bile kullanıcı deneyimi etkilenmesin
    console.error('Etkileşim kaydedilemedi:', error);
  }
}

/**
 * Bu ürünü inceleyenler başka neleri inceledi
 */
export async function beraberIncelenenleriGetir(urunId, limit = 6) {
  try {
    const response = await fetch(
      `${API_URL}/products/${urunId}/also-viewed?limit=${limit}`
    );
    const data = await response.json();
    return data.beraber_incelenenler || [];
  } catch (error) {
    console.error('Beraber incelenenler alınamadı:', error);
    return [];
  }
}