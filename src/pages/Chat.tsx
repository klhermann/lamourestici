import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [chatUser, setChatUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChatData = async () => {
      if (!user || !matchId) return;
      
      try {
        setLoading(true);
        let otherUserId = matchId;
        
        // If it's an existing match ID (not starting with new-)
        if (!matchId.startsWith('new-')) {
          const { data: matchData } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single();
            
          if (matchData) {
            otherUserId = matchData.user_1 === user.id ? matchData.user_2 : matchData.user_1;
          }
        } else {
          otherUserId = matchId.replace('new-', '');
        }

        // Fetch other user's profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();
          
        if (profileData) {
          setChatUser({
            id: profileData.id,
            name: profileData.display_name,
            photo: profileData.photo_url || 'https://picsum.photos/seed/placeholder/200/200'
          });
        }

        // Fetch messages between these two users
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
          
        if (messagesData) {
          setMessages(messagesData.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id === user.id ? 'me' : msg.sender_id,
            text: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })));
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [matchId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !chatUser) return;
    
    const textToSend = inputText;
    setInputText(''); // Clear immediately for better UX
    
    try {
      // Optimistic update
      const optimisticMsg = {
        id: Date.now(),
        senderId: 'me',
        text: textToSend,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, optimisticMsg]);
      
      // Save to DB
      await supabase.from('messages').insert([{
        sender_id: user.id,
        receiver_id: chatUser.id,
        content: textToSend
      }]);
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-rose-50">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-4" />
      </div>
    );
  }

  if (!chatUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-rose-50 p-6 text-center">
        <h2 className="text-xl font-bold text-rose-900 mb-2">Discussion introuvable</h2>
        <button 
          onClick={() => navigate(-1)}
          className="bg-pink-600 text-white font-semibold py-2 px-6 rounded-xl shadow-md hover:bg-pink-700 transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-rose-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-rose-100 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-rose-400 hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate(`/user/${chatUser.id}`)}
          >
            <div className="relative">
              <img 
                src={chatUser.photo} 
                alt={chatUser.name} 
                className="w-10 h-10 rounded-full object-cover group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="font-semibold text-rose-950 group-hover:underline">{chatUser.name}</h2>
              <p className="text-xs text-rose-400">En ligne</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-rose-400">
          <button className="p-2 hover:text-rose-600 transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:text-rose-600 transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:text-rose-600 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center mb-6">
          <span className="text-xs font-medium text-rose-400 bg-rose-100/50 px-3 py-1 rounded-full">
            Aujourd'hui
          </span>
        </div>
        
        {messages.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <div 
              key={msg.id} 
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMe 
                    ? 'bg-pink-500 text-white rounded-br-sm' 
                    : 'bg-white text-rose-900 rounded-bl-sm shadow-sm border border-rose-100'
                }`}
              >
                <p className="text-[15px] leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-pink-100' : 'text-rose-400'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="bg-white p-4 border-t border-rose-100">
        <form 
          onSubmit={handleSend}
          className="flex items-center gap-2 rounded-full p-1 pr-2 border bg-rose-50 border-rose-100"
        >
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Écrivez un message..."
            className="flex-1 bg-transparent border-none py-2 px-4 text-rose-900 placeholder:text-rose-300 focus:outline-none"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-rose-300 transition-colors"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
