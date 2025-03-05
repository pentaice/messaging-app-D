import { nanoid } from 'nanoid';

export const generateUserCode = () => {
  return nanoid(8).toUpperCase();
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate();
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
