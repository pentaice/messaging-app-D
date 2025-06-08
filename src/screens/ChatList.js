import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';

const ChatList = ({ navigation }) => {
  const { conversations, setActiveChat } = useContext(ChatContext);
  const { currentUser } = useContext(AuthContext);

  const filteredConversations = conversations.filter(conv => {
    const participants = conv.participants || [];
    return participants.includes(currentUser?.userCode);
  });

  const renderItem = ({ item }) => {
    const otherUser = item.participants.find(id => id !== currentUser.userCode);
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          setActiveChat(item.id);
          navigation.navigate('Chat', { conversationId: item.id });
        }}
      >
        <View style={styles.chatInfo}>
          <Text style={styles.userName}>{item.userName || 'Kullanıcı'}</Text>
          <Text style={styles.lastMessage}>{item.lastMessage}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredConversations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz hiç sohbetiniz yok</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chatInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ChatList; 