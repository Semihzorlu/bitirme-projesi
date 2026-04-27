/**
 * Basit Sepet Yöneticisi
 * 
 * localStorage ile sepet bilgisini saklar.
 * Tarayıcı kapansa bile sepet korunur.
 */

const STORAGE_KEY = 'akilli_eticaret_sepet';

/**
 * Sepetteki tüm ürünleri al
 */
export function sepetiAl() {
  try {
    const veri = localStorage.getItem(STORAGE_KEY);
    return veri ? JSON.parse(veri) : [];
  } catch {
    return [];
  }
}

/**
 * Sepete ürün ekle (varsa adet artırır)
 */
export function sepeteEkle(urun) {
  const sepet = sepetiAl();
  const mevcutUrun = sepet.find(u => u.id === urun.id);
  
  if (mevcutUrun) {
    mevcutUrun.adet += 1;
  } else {
    sepet.push({
      id: urun.id,
      ad: urun.ad,
      fiyat: urun.fiyat,
      resim: urun.resim,
      kategori: urun.kategori,
      adet: 1
    });
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sepet));
  window.dispatchEvent(new Event('sepet-guncellendi'));
  
  return sepet;
}

/**
 * Belirli bir ürünü sepetten kaldır
 */
export function sepettenKaldir(urunId) {
  const sepet = sepetiAl().filter(u => u.id !== urunId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sepet));
  window.dispatchEvent(new Event('sepet-guncellendi'));
  return sepet;
}

/**
 * Bir ürünün adetini değiştir (artır/azalt)
 */
export function adetGuncelle(urunId, yeniAdet) {
  const sepet = sepetiAl();
  const urun = sepet.find(u => u.id === urunId);
  
  if (!urun) return sepet;
  
  if (yeniAdet <= 0) {
    return sepettenKaldir(urunId);
  }
  
  urun.adet = yeniAdet;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sepet));
  window.dispatchEvent(new Event('sepet-guncellendi'));
  return sepet;
}

/**
 * Sepeti tamamen temizle
 */
export function sepetiTemizle() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('sepet-guncellendi'));
}

/**
 * Toplam ürün adetini al (header'daki sayaç için)
 */
export function sepetSayisi() {
  const sepet = sepetiAl();
  return sepet.reduce((toplam, u) => toplam + u.adet, 0);
}

/**
 * Sepet toplam tutarını al
 */
export function sepetToplami() {
  const sepet = sepetiAl();
  return sepet.reduce((toplam, u) => toplam + (u.fiyat * u.adet), 0);
}