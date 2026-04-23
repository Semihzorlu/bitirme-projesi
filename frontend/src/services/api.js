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
export async function mesajGonder(metin) {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metin: metin }),
    });
    const data = await response.json();
    return data.cevap;
  } catch (error) {
    console.error("Mesaj gönderilemedi:", error);
    return "Üzgünüm, şu an sunucuya bağlanamıyorum. Lütfen tekrar dene.";
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