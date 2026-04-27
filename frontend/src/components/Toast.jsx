import { useEffect } from 'react';

/**
 * Toast Bildirim Bileşeni
 * Ekranın sağ üstünde otomatik kapanan bildirim gösterir.
 */
function Toast({ mesaj, tip = 'success', onClose, sure = 3000 }) {
  useEffect(() => {
    if (mesaj) {
      const timer = setTimeout(() => {
        onClose();
      }, sure);
      return () => clearTimeout(timer);
    }
  }, [mesaj, sure, onClose]);

  if (!mesaj) return null;

  const renkler = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'bg-green-500',
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'bg-red-500',
      text: 'text-red-800'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-500',
      text: 'text-blue-800'
    }
  };

  const stil = renkler[tip] || renkler.success;

  return (
    <div className="fixed top-20 right-6 z-[60] animate-slide-in">
      <div className={`${stil.bg} ${stil.border} border rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[280px] max-w-md`}>
        {/* İkon */}
        <div className={`${stil.icon} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}>
          {tip === 'success' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {tip === 'error' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          )}
          {tip === 'info' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          )}
        </div>
        
        {/* Mesaj */}
        <p className={`${stil.text} font-medium text-sm flex-1`}>{mesaj}</p>
        
        {/* Kapat */}
        <button
          onClick={onClose}
          className={`${stil.text} hover:opacity-70 transition`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Toast;