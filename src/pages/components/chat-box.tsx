import React, { useEffect, useState } from 'react'
import { socket } from '../../utils/socket'
import { useParams } from 'react-router-dom'
import { useUser } from '../../hooks/useUser'

interface Message {
  id?: number;
  text: string;
  username?: string;
  sender?: string;
  timestamp?: Date;
  ts?: number; // server timestamp (ms)
}

interface ChatBoxProps {
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ }) => {
  const { roomId, teamId } = useParams<{ roomId: string, teamId: string }>();
  const { user } = useUser();
  const currentUserName = user?.displayName || user?.email || 'Anon';

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  

  const handleSend = () => {
    if (!message.trim() || !roomId) return;

    const payload = { roomId, teamId, username: currentUserName, text: message };

    // emit to server (don't optimistically append to avoid duplicates — server will broadcast back)
    socket?.emit('chatMessage', payload);
    setMessage('');
  };

  // Join chat room and subscribe to events
  useEffect(() => {
    if (!roomId) return;

    const payload = { roomId, teamId, username: currentUserName };
    // join when socket is connected; also handle reconnects
    const tryJoin = () => {
      console.debug('[chat] emitting joinChat', payload);
      socket?.emit('joinChat', payload);
    };

    if (socket?.connected) tryJoin();
    socket?.on('connect', tryJoin);


    const onHistory = (data: { scope: string; roomId: string; teamId?: string; messages: any[] }) => {
      console.debug('[chat] chatHistory', data);
      // server messages: { username, text, ts }
      const mapped = (data.messages || []).map((m: any, i: number) => ({ id: i + 1, text: m.text, username: m.username, ts: m.ts || m.ts }));
      setMessages(mapped);
    };

    const onIncoming = (data: { scope: string; roomId: string; teamId?: string; message: any }) => {
      console.debug('[chat] chatMessage', data);
      const m = data.message;
      setMessages(prev => [...prev, { id: prev.length + 1, text: m.text, username: m.username, ts: m.ts || m.ts }]);
    };

    socket?.on('chatHistory', onHistory);
    socket?.on('chatMessage', onIncoming);

    return () => {
      socket?.off('connect', tryJoin);
      socket?.off('chatHistory', onHistory);
      socket?.off('chatMessage', onIncoming);
    };
  }, [roomId, teamId, currentUserName]);

  return (
    <div className="h-full flex flex-col backdrop-blur-md bg-gray-900/70 border border-gray-800 rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-800 bg-gray-900/50">
        <h3 className="text-lg font-bold text-cyan-400">Team Chat</h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-gray-900/30">
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={`flex flex-col ${msg.username === currentUserName ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.username === currentUserName
                ? 'bg-cyan-500/20 border border-cyan-500/30'
                : 'bg-gray-800/50 border border-gray-700'
            }`}>
              <p className="text-sm text-white">{msg.text}</p>
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {msg.username || msg.sender} • {new Date(msg.ts || msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatBox
