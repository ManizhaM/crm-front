import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { FiSend, FiPaperclip, FiSearch, FiClock } from 'react-icons/fi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import './ChatsPage.css';

const ChatsPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [connection, setConnection] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const { data: chatsData, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await api.chats.getAll();
      return response.data;
    },
  });

  const chats = Array.isArray(chatsData) ? chatsData : [];

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const newConnection = new HubConnectionBuilder()
      .withUrl("https://bankcrm-1.onrender.com/chatHub", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    newConnection.on("ReceiveMessage", (text, chatId) => {
      if (selectedChat && selectedChat.id === parseInt(chatId)) {
        setMessages(prev => [...prev, { 
          text, 
          type: 1,
          timestamp: new Date().toISOString(),
          isRead: false
        }]);
        api.chats.markAsRead(chatId);
      } else {
        queryClient.invalidateQueries(['chats']);
        toast('Новое сообщение в чате #' + chatId);
      }
    });

    newConnection.on("ChatListUpdated", () => {
      queryClient.invalidateQueries(['chats']);
    });

    newConnection.start().then(() => {
      console.log('SignalR connected');
      setConnection(newConnection);
    }).catch(err => console.error('SignalR connection error:', err));

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [selectedChat, queryClient]);

  useEffect(() => {
    if (selectedChat && connection) {
      api.chats.getById(selectedChat.id).then(response => {
        setMessages(response.data);
        api.chats.markAsRead(selectedChat.id);
        queryClient.invalidateQueries(['chats']);
      });

      connection.invoke("JoinChat", selectedChat.id).catch(err => 
        console.error("Error joining chat:", err)
      );
    }
  }, [selectedChat, connection, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !connection || !selectedChat) return;

    try {
      await connection.invoke("SendMessageToChat", selectedChat.id, user.username, messageText);
      setMessages(prev => [...prev, {
        text: messageText,
        type: 0,
        timestamp: new Date().toISOString(),
        isRead: true
      }]);
      setMessageText('');
    } catch (err) {
      console.error('Send message error:', err);
      toast.error('Ошибка отправки сообщения');
    }
  };

  const filteredChats = chats?.filter(chat => 
    chat.id.toString().includes(searchQuery) || 
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chats-page">
      <div className="chats-sidebar">
        <div className="chats-sidebar-header">
          <h2>Чаты</h2>
          <div className="chats-search">
            <FiSearch />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="chats-list">
          {isLoading ? (
            <div className="chats-loading">Загрузка...</div>
          ) : filteredChats?.length === 0 ? (
            <div className="chats-empty">Чатов не найдено</div>
          ) : (
            filteredChats?.map(chat => (
              <motion.div
                key={chat.id}
                className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''} ${chat.unread ? 'unread' : ''}`}
                onClick={() => setSelectedChat(chat)}
                whileHover={{ x: 4 }}
              >
                <div className="chat-item-avatar">
                  {chat.clientName?.charAt(0) || 'C'}
                </div>
                <div className="chat-item-content">
                  <div className="chat-item-header">
                    <span className="chat-item-name">Чат #{chat.id}</span>
                    <span className="chat-item-time">
                      {chat.lastMessageTime && formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: true, locale: ru })}
                    </span>
                  </div>
                  <div className="chat-item-message">
                    {chat.lastMessage || 'Нет сообщений'}
                  </div>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="chat-item-badge">{chat.unreadCount}</div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="chats-main">
        {selectedChat ? (
          <>
            <div className="chats-header">
              <div>
                <h3>Чат #{selectedChat.id}</h3>
                <p>Клиент: {selectedChat.clientName || 'Не указан'}</p>
              </div>
            </div>

            <div className="chats-messages">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  className={`message ${msg.type === 0 ? 'outgoing' : 'incoming'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="message-content">
                    <p>{msg.text}</p>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="chats-input" onSubmit={handleSendMessage}>
              <button type="button" className="chats-attach">
                <FiPaperclip />
              </button>
              <input
                type="text"
                placeholder="Введите сообщение..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <Button type="submit" variant="primary" icon={<FiSend />} disabled={!messageText.trim()}>
                Отправить
              </Button>
            </form>
          </>
        ) : (
          <div className="chats-empty-state">
            <FiClock size={64} />
            <h3>Выберите чат</h3>
            <p>Выберите чат из списка слева, чтобы начать общение</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatsPage;
