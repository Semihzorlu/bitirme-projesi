/**
 * Anonim oturum ID yöneticisi
 * 
 * Kullanıcı giriş yapmasa bile, davranışlarını kaydedebilmek için
 * her tarayıcıya özel bir UUID atar.
 * 
 * Tarayıcı kapansa bile (localStorage) ID korunur.
 * Aynı tarayıcıdan tekrar gelirse aynı kullanıcı olarak görülür.
 */

const STORAGE_KEY = 'akilli_eticaret_oturum_id';

/**
 * UUID v4 oluşturur (basit ve dependency-free)
 */
function uuidOlustur() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Oturum ID'sini al, yoksa oluştur ve sakla
 */
export function oturumIdAl() {
  let oturumId = localStorage.getItem(STORAGE_KEY);
  
  if (!oturumId) {
    oturumId = uuidOlustur();
    localStorage.setItem(STORAGE_KEY, oturumId);
    console.log('🆔 Yeni anonim oturum oluşturuldu:', oturumId);
  }
  
  return oturumId;
}

/**
 * Oturumu sıfırla (test için kullanılabilir)
 */
export function oturumuSifirla() {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🔄 Oturum sıfırlandı');
}