/**
 * Sohbet Bağlamı (Chat Context)
 * Bu dosya, uygulama genelinde sohbet işlemlerini yönetmek için React Context API'sini kullanır.
 * 
 * Kullanılan teknolojiler:
 * - React Context API: Global state yönetimi için
 * - Socket.IO-client: Gerçek zamanlı mesajlaşma için
 * - AsyncStorage: Yerel depolama için
 * 
 * İşlevler:
 * - Mesaj gönderme ve alma
 * - Sohbet geçmişini yönetme
 * - Çevrimiçi kullanıcı durumlarını takip etme
 * - Konuşma başlatma ve yönetme
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import io from 'socket.io-client';

// Sunucu IP'sini ayarlayın
const SERVER_IP = '192.168.23.3'; // Yerel ağ IP'si
const SERVER_PORT = 3000;
const SERVER_URL = `http://${SERVER_IP}:${SERVER_PORT}`;

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (currentUser) {
      console.log('Register isteği gönderiliyor, currentUser:', currentUser);
      const newSocket = io(SERVER_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        query: {
          userCode: currentUser.userCode,
          deviceType: 'mobile'
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket bağlantısı kuruldu');
        setSocket(newSocket);
        
        // Bağlantı kurulduğunda kullanıcı kaydını yap
        newSocket.emit('register', {
          userCode: currentUser.userCode,
          deviceType: 'mobile'
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Socket bağlantısı kapatıldı.');
        setSocket(null);
      });

      newSocket.on('error', (error) => {
        console.error('Socket hatası:', error);
      });

      newSocket.on('registered', (userData) => {
        console.log('Kullanıcı kaydı başarılı:', userData);
        // Kayıt başarılı olduktan sonra konuşmaları getir
        newSocket.emit('getConversations');
      });

      newSocket.on('conversations', (conversations) => {
        console.log('Konuşmalar alındı:', conversations);
        if (Array.isArray(conversations)) {
          setConversations(conversations);
        } else {
          console.error('Geçersiz konuşma formatı:', conversations);
        }
      });

      // Yeni konuşma olayı
      newSocket.on('newConversation', (newConversation) => {
        console.log('Yeni konuşma alındı:', newConversation);
        if (newConversation && newConversation.id) {
          setConversations(prevConversations => {
            const conversationExists = prevConversations.some(conv => conv.id === newConversation.id);
            if (!conversationExists) {
              return [...prevConversations, newConversation];
            }
            return prevConversations;
          });
        } else {
          console.error('Geçersiz yeni konuşma formatı:', newConversation);
        }
      });

      // Konuşma güncelleme olayı
      newSocket.on('conversationUpdated', (updatedConversation) => {
        console.log('Konuşma güncellendi:', updatedConversation);
        if (updatedConversation && updatedConversation.id) {
          setConversations(prevConversations => {
            return prevConversations.map(conv => 
              conv.id === updatedConversation.id ? updatedConversation : conv
            );
          });
        } else {
          console.error('Geçersiz güncellenmiş konuşma formatı:', updatedConversation);
        }
      });

      newSocket.on('messages', (messages) => {
        console.log('Mesajlar alındı:', messages);
        if (Array.isArray(messages)) {
          setMessages(messages);
        } else if (messages && Array.isArray(messages.messages)) {
          setMessages(messages.messages);
        } else {
          console.error('Geçersiz mesaj formatı:', messages);
        }
      });

      newSocket.on('newMessage', (message) => {
        console.log('Yeni mesaj alındı:', message);
        if (message && message.id) {
          setMessages(prevMessages => {
            const messageExists = prevMessages.some(m => m.id === message.id);
            if (!messageExists) {
              const updatedMessages = [...prevMessages, message];
              console.log('Güncellenmiş mesajlar:', updatedMessages);
              return updatedMessages;
            }
            return prevMessages;
          });
        } else {
          console.error('Geçersiz mesaj formatı:', message);
        }
      });

      newSocket.on('userList', (users) => {
        console.log('Kullanıcı listesi güncellendi:', users);
        setUsers(users);
      });

      // Odaya katılma olayını dinle
      newSocket.on('joinedConversation', (data) => {
        console.log('Odaya katıldı:', data);
        if (data && data.conversationId) {
          newSocket.emit('getMessages', { conversationId: data.conversationId });
        }
      });

      // Mesajları getirme olayını dinle
      newSocket.on('getMessages', (data) => {
        console.log('Mesajlar getirildi:', data);
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else if (data && Array.isArray(data)) {
          setMessages(data);
        } else {
          console.error('Geçersiz getMessages formatı:', data);
        }
      });

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [currentUser]);

  // Konuşmaları yükle
  useEffect(() => {
    if (socket && currentUser) {
      socket.emit('getConversations');
      console.log('Konuşmalar yükleniyor...');
    }
  }, [socket, currentUser]);

  // Aktif sohbet değiştiğinde mesajları yükle
  useEffect(() => {
    if (socket && activeChat) {
      console.log('Aktif sohbet değişti, mesajlar yükleniyor:', activeChat);
      socket.emit('getMessages', { conversationId: activeChat });
    }
  }, [socket, activeChat]);

  const startConversation = async (userCode, messageMode = 'permanent') => {
    try {
      if (!socket) {
        throw new Error('Bağlantı kurulamadı');
      }

      if (!userCode) {
        throw new Error('Kullanıcı kodu gerekli');
      }

      console.log('Sohbet başlatma isteği gönderiliyor:', { userCode, messageMode });
      
      return new Promise((resolve, reject) => {
        socket.emit('startConversation', { 
          userCode: userCode.toUpperCase(), 
          messageMode 
        }, (response) => {
          console.log('Sohbet başlatma yanıtı:', response);
          if (response.error) {
            console.error('Sohbet başlatma hatası:', response.error);
            reject(new Error(response.error));
          } else {
            console.log('Sohbet başarıyla başlatıldı:', response.conversationId);
            resolve(response.conversationId);
          }
        });
      });
    } catch (error) {
      console.error('Sohbet başlatma hatası:', error);
      throw error;
    }
  };

  const sendMessage = async (conversationId, content, type = 'text') => {
    try {
      if (!socket) {
        throw new Error('Bağlantı kurulamadı');
      }

      socket.emit('sendMessage', {
        conversationId,
        content,
        type
      });
      // Mesaj gönderildikten sonra aktif sohbetin mesajlarını yeniden çek
      console.log('Mesaj gönderildi, aktif sohbet mesajları yenileniyor...');
      socket.emit('getMessages', { conversationId: activeChat });
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      throw error;
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      if (!socket) {
        throw new Error('Bağlantı kurulamadı');
      }

      socket.emit('deleteMessage', { messageId });
    } catch (error) {
      throw error;
    }
  };

  const value = {
    conversations,
    messages,
    activeChat,
    setActiveChat,
    startConversation,
    sendMessage,
    deleteMessage,
    users
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
