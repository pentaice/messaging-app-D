import React, { createContext, useState, useEffect, useContext } from 'react';
import { db, storage } from '../services/firebase';
import { AuthContext } from './AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  // Konuşmaları dinle
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(conversationsData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Aktif sohbetin mesajlarını dinle
  useEffect(() => {
    if (!activeChat) return;

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', activeChat),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [activeChat]);

  const startConversation = async (userCode, messageMode = 'permanent') => {
    try {
      if (!currentUser) {
        throw new Error('Oturum açmanız gerekiyor');
      }

      // Kullanıcıyı kodu ile bul
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userCode', '==', userCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const targetUser = querySnapshot.docs[0].data();
      
      // Test için kendisiyle sohbet başlatma engelini kaldırdık
      // if (targetUser.uid === currentUser.uid) {
      //   throw new Error('Kendinizle sohbet başlatamazsınız');
      // }
      
      // Konuşma zaten var mı kontrol et
      const conversationsRef = collection(db, 'conversations');
      const conversationQuery = query(
        conversationsRef,
        where('participants', '==', [currentUser.uid, targetUser.uid].sort())
      );
      
      const existingConversation = await getDocs(conversationQuery);
      
      if (!existingConversation.empty) {
        return existingConversation.docs[0].id;
      }

      // Yeni konuşma oluştur
      const newConversation = await addDoc(conversationsRef, {
        participants: [currentUser.uid, targetUser.uid].sort(),
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        messageMode,
        lastMessage: 'Yeni bir sohbet başlatıldı',
        userName: targetUser.userName || targetUser.userCode,
        userId: targetUser.uid,
        userCode: targetUser.userCode
      });

      return newConversation.id;
    } catch (error) {
      console.error('Sohbet başlatma hatası:', error);
      throw error;
    }
  };

  const sendMessage = async (conversationId, content, type = 'text', file = null) => {
    try {
      if (!currentUser) {
        throw new Error('Oturum açmanız gerekiyor');
      }

      let fileUrl = null;
      
      if (file) {
        const storageRef = ref(storage, `messages/${conversationId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
      }

      const messageData = {
        conversationId,
        senderId: currentUser.uid,
        content,
        type,
        fileUrl,
        timestamp: serverTimestamp(),
        read: false
      };

      const messageRef = await addDoc(collection(db, 'messages'), messageData);
      
      // Konuşmayı güncelle
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: content,
        lastMessageTime: serverTimestamp()
      });

      return messageRef.id;
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      throw error;
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
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
    deleteMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
