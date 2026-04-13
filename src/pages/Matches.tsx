import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export function Matches() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [newMatches, setNewMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Fetch matches where user is either user_1 or user_2
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .or(`user_1.eq.${user.id},user_2.eq.${user.id}`);
          
        if (matchError) throw matchError;
        
        if (!matchData || matchData.length === 0) {
          setMatches([]);
          setNewMatches([]);
          return;
        }

        // For each match, fetch the other user's profile
        const matchesWithProfiles = await Promise.all(
          matchData.map(async (match) => {
            const otherUserId = match.user_1 === user.id ? match.user_2 : match.user_1;
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', otherUserId)
              .single();
              
            return {
              ...match,
              user: profileData,
              lastMessage: 'Nouvelle conversation',
              time: 'Maintenant',
              unread: false
            };
          })
        );

        // Filter out matches where profile wasn't found
        const validMatches = matchesWithProfiles.filter(m => m.user);
        
        // For now, put all in new matches since we don't have real messages yet
        setNewMatches(validMatches);
        setMatches([]);
        
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-3xl font-bold text-rose-950 mb-6">Messages</h1>
        
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-300" />
          <input 
            type="text" 
            placeholder="Rechercher une discussion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-rose-50 border-none rounded-2xl py-3 pl-12 pr-4 text-rose-900 placeholder:text-rose-300 focus:ring-2 focus:ring-pink-200 outline-none"
          />
        </div>
        
        <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-4">
          Nouveaux Matchs
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
          </div>
        ) : newMatches.length === 0 ? (
          <p className="text-rose-500 text-sm italic mb-4">Aucun nouveau match pour le moment.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {newMatches.map(match => (
              <div 
                key={match.id}
                onClick={() => navigate(`/chat/new-${match.user.id}`)}
                className="flex flex-col items-center gap-2 min-w-[72px] cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full border-2 border-pink-500 p-0.5">
                  <img 
                    src={match.user.photo_url || 'https://picsum.photos/seed/placeholder/200/200'} 
                    alt={match.user.display_name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/user/${match.user.id}`);
                  }}
                  className="text-xs font-medium text-rose-900 truncate w-full text-center flex items-center justify-center gap-1 hover:underline"
                >
                  {match.user.display_name}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto px-6">
        <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-4">
          Messages
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <p className="text-rose-500 text-sm italic text-center py-8">Vos conversations apparaîtront ici.</p>
        ) : (
          <div className="space-y-4">
            {matches.map(match => (
            <div 
              key={match.id}
              onClick={() => navigate(`/chat/${match.id}`)}
              className="w-full flex items-center gap-4 p-2 rounded-2xl hover:bg-rose-50 transition-colors text-left cursor-pointer"
            >
              <img 
                src={match.user.photo_url} 
                alt={match.user.display_name} 
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/user/${match.user.id}`);
                    }}
                    className="font-semibold text-rose-950 truncate flex items-center gap-1.5 hover:underline"
                  >
                    {match.user.display_name}
                  </button>
                  <span className="text-xs text-rose-400 shrink-0">
                    {match.time}
                  </span>
                </div>
                <p className={`text-sm truncate ${match.unread ? 'text-rose-900 font-medium' : 'text-rose-500'}`}>
                  {match.lastMessage}
                </p>
              </div>
              {match.unread && (
                <div className="w-2.5 h-2.5 bg-pink-500 rounded-full shrink-0" />
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
