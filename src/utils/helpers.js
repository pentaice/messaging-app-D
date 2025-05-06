// Yardımcı fonksiyonlar
export const generateUserCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  // Web için timestamp kontrolü
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    // Web'de timestamp farklı formatta geliyor
    date = new Date(timestamp.seconds * 1000);
  } else {
    return '';
  }
  
  const now = new Date();
  const diff = now - date;
  
  // Bugün içindeyse saat göster
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Son 7 gün içindeyse gün adı göster
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long'
    });
  }
  
  // Diğer durumlar için tarih göster
  return date.toLocaleDateString('tr-TR');
};

export const getFileType = (file) => {
  if (!file) return null;
  
  const type = file.type.split('/')[0];
  return ['image', 'video', 'audio'].includes(type) ? type : 'document';
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
