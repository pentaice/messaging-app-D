/**
 * Kimlik Doğrulama Bağlamı (Auth Context)
 * Bu dosya, uygulama genelinde kimlik doğrulama ve kullanıcı oturum yönetimini sağlar.
 * 
 * Kullanılan teknolojiler:
 * - React Context API: Global state yönetimi için
 * - JWT: Token tabanlı kimlik doğrulama için
 * - AsyncStorage: Kullanıcı oturum bilgilerini saklamak için
 * 
 * İşlevler:
 * - Kullanıcı girişi ve kaydı
 * - Oturum durumu yönetimi
 * - Token yönetimi
 * - Güvenli çıkış işlemi
 */

import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sunucu IP'sini ayarlayın
const SERVER_IP = '192.168.23.3'; // Yerel ağ IP'si
const SERVER_PORT = 3000;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Kayıtlı kullanıcı bilgilerini kontrol et
    const checkStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setCurrentUser(userData);
          // Kayıtlı kullanıcı varsa socket bağlantısını kur
          const newSocket = io(`http://${SERVER_IP}:${SERVER_PORT}`, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            withCredentials: true,
            forceNew: true,
            timeout: 10000,
            autoConnect: true,
            path: '/socket.io/'
          });

          newSocket.on('connect', () => {
            console.log('Socket bağlantısı kuruldu');
            // Kayıtlı kullanıcı için register isteği gönder
            newSocket.emit('register', {
              userCode: userData.userCode,
              deviceType: userData.deviceType || 'mobile'
            });
          });

          newSocket.on('registered', (updatedUserData) => {
            console.log('Kullanıcı kaydı başarılı:', updatedUserData);
            setCurrentUser(updatedUserData);
            AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
            setSocket(newSocket);
          });

          newSocket.on('error', (error) => {
            console.error('Socket hatası:', error);
            logout();
          });

          newSocket.on('disconnect', () => {
            console.log('Socket bağlantısı kesildi');
          });

          setSocket(newSocket);
        }
      } catch (error) {
        console.error('Kullanıcı bilgileri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  const login = async (userCode) => {
    try {
      // Socket bağlantısını kur
      const newSocket = io(`http://${SERVER_IP}:${SERVER_PORT}`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        withCredentials: true,
        forceNew: true,
        timeout: 10000,
        autoConnect: true,
        path: '/socket.io/'
      });

      newSocket.on('connect', () => {
        console.log('Socket bağlantısı kuruldu');
        // Kullanıcı kaydı - userCode ile birlikte gönder
        console.log('Register isteği gönderiliyor, userCode:', userCode);
        newSocket.emit('register', {
          userCode: userCode.toUpperCase(), // Kullanıcı kodunu büyük harf yap
          deviceType: 'mobile' // Veya uygun cihaz tipi
        });
      });

      newSocket.on('registered', (userData) => {
        // Server'dan gelen tam kullanıcı objesi (id dahil) kaydediliyor
        console.log('Kullanıcı kaydı başarılı:', userData);
        setCurrentUser(userData);
        AsyncStorage.setItem('user', JSON.stringify(userData));
        setSocket(newSocket);
      });

      newSocket.on('error', (error) => {
        console.error('Socket hatası:', error);
        // Bağlantı hatasında kullanıcıyı null yap ve storage'ı temizle
        logout(); // Hata durumunda çıkış yap
        // throw new Error(error.message); // Hatayı fırlatma ki uygulama çökmesin
      });

      // Bağlantı koptuğunda da logout yap
      newSocket.on('disconnect', () => {
        console.log('Socket bağlantısı kesildi');
        // logout(); // İsteğe bağlı: bağlantı kopunca otomatik çıkış yap
      });

    } catch (error) {
      console.error('Giriş hatası:', error);
      throw error;
    }
  };

  const signup = async (userCode) => {
    try {
      // Normal kayıt için Socket bağlantısını kur
      const newSocket = io(`http://${SERVER_IP}:${SERVER_PORT}`);

      newSocket.on('connect', () => {
        console.log('Socket bağlantısı kuruldu (Kayıt)');
        console.log('Register isteği gönderiliyor, userCode:', userCode);
        newSocket.emit('register', {
          userCode: userCode.toUpperCase(), // Kullanıcı kodunu büyük harf yap
          deviceType: 'mobile'
        });
      });

      newSocket.on('registered', (userData) => {
        console.log('Kullanıcı kaydı başarılı:', userData);
        setCurrentUser(userData);
        AsyncStorage.setItem('user', JSON.stringify(userData));
        setSocket(newSocket);
      });

      newSocket.on('error', (error) => {
        console.error('Socket hatası (Kayıt):', error);
        logout();
      });

      newSocket.on('disconnect', () => {
        console.log('Socket bağlantısı kesildi (Kayıt)');
      });

    } catch (error) {
      console.error('Kayıt hatası:', error);
      throw error;
    }
  };

  const anonymousLogin = async () => {
    try {
      // Anonim giriş için Socket bağlantısını kur
      const newSocket = io(`http://${SERVER_IP}:${SERVER_PORT}`);

      newSocket.on('connect', () => {
        console.log('Socket bağlantısı kuruldu (Anonim)');
        console.log('Anonim register isteği gönderiliyor...');
        // Backend'e userCode göndermeden register isteği gönder
        newSocket.emit('register', { deviceType: 'mobile' });
      });

      newSocket.on('registered', (userData) => {
        console.log('Anonim kullanıcı kaydı başarılı:', userData);
        // Backend'den gelen geçici userCode/id kaydedilir
        setCurrentUser(userData);
        AsyncStorage.setItem('user', JSON.stringify(userData));
        setSocket(newSocket);
      });

      newSocket.on('error', (error) => {
        console.error('Socket hatası (Anonim):', error);
        logout();
      });

      newSocket.on('disconnect', () => {
        console.log('Socket bağlantısı kesildi (Anonim)');
      });

    } catch (error) {
      console.error('Anonim giriş hatası:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (socket) {
        socket.close();
      }
      await AsyncStorage.removeItem('user');
      setCurrentUser(null);
      setSocket(null);
    } catch (error) {
      console.error('Çıkış hatası:', error);
      throw error;
    }
  };

  const updateUserProfile = async (data) => {
    try {
      if (!socket) {
        throw new Error('Bağlantı kurulamadı');
      }

      const updatedUser = { ...currentUser, ...data };
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      socket.emit('updateProfile', data);
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    login,
    signup,
    anonymousLogin,
    logout,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
