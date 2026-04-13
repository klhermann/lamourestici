import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export function Likes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Fetch likes where this user is the target
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('*')
          .eq('to_user_id', user.id);
          
        if (likesError) throw likesError;
        
        if (!likesData || likesData.length === 0) {
          setLikes([]);
          return;
        }

        // Fetch profiles for those who liked
        const likesWithProfiles = await Promise.all(
          likesData.map(async (like) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', like.from_user_id)
              .single();
              
            return {
              ...like,
              user: profileData
            };
          })
        );

        // Filter out likes where profile wasn't found
        setLikes(likesWithProfiles.filter(l => l.user));
        
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [user]);

  return (
    <div className="h-full flex flex-col bg-rose-50 px-6 pt-8 pb-4 overflow-y-auto">
      <h1 className="text-3xl font-bold text-rose-950 mb-2">Likes</h1>
      <p className="text-rose-500 mb-4">Découvrez qui a craqué pour vous.</p>
      
      {/* Donation Banner */}
      <button 
        onClick={() => navigate('/donation')}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-2xl p-1 shadow-md mb-6 transform transition hover:scale-[1.02] active:scale-95"
      >
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-inner">
            <Heart className="w-5 h-5 text-pink-500" fill="currentColor" />
          </div>
          <div className="text-left text-white">
            <h3 className="font-bold text-sm leading-tight">Soutenez l'application</h3>
            <p className="text-pink-50 text-xs mt-0.5">Faites un don pour nous aider à grandir !</p>
          </div>
        </div>
      </button>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      ) : likes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-rose-100">
            <Heart className="w-8 h-8 text-rose-300" />
          </div>
          <p className="text-rose-500 font-medium">Vous n'avez pas encore de likes.</p>
          <p className="text-rose-400 text-sm mt-2">Continuez à swiper pour faire des rencontres !</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {likes.map((like) => (
            <div 
              key={like.id} 
              onClick={() => navigate(`/user/${like.user.id}`)}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-rose-100 group cursor-pointer"
            >
              <img src={like.user.photo_url || 'https://picsum.photos/seed/placeholder/200/200'} alt={like.user.display_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <h3 className="text-white font-bold text-lg">{like.user.display_name}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
