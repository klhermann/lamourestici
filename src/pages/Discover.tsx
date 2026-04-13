import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { X, Heart, Star, MapPin, User as UserIcon, SlidersHorizontal, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Discover() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [maxDistance, setMaxDistance] = useState(10); // Default 10km

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!profile?.gender || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userGender = profile.gender?.toLowerCase().trim() || '';
        const targetGender = userGender.includes('femme') ? 'homme' : 'femme';
        
        // Fetch ALL profiles except self to see what Supabase is actually returning
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(100);
          
        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        // Filter by gender in JS
        const genderFilteredProfiles = (data || []).filter(p => {
          const pGender = p.gender?.toLowerCase().trim() || '';
          return pGender.includes(targetGender);
        });

        // Fetch user's past interactions (likes and passes)
        const { data: likesData } = await supabase
          .from('likes')
          .select('to_user_id')
          .eq('from_user_id', user.id);
          
        // Safely fetch passes without using .catch() which might fail on Supabase promises
        const { data: passesData, error: passesError } = await supabase
          .from('passes')
          .select('to_user_id')
          .eq('from_user_id', user.id);

        if (passesError) {
          console.warn("Note: Table 'passes' might not exist yet.", passesError);
        }

        const interactedIds = new Set([
          ...(likesData || []).map(l => l.to_user_id),
          ...(passesData || []).map(p => p.to_user_id)
        ]);

        // Filter out profiles the user has already interacted with
        const newProfiles = genderFilteredProfiles.filter(p => !interactedIds.has(p.id));
        
        // Add a mock distance for now since we don't have geolocation
        const profilesWithDistance = newProfiles.map(p => ({
          ...p,
          distance: Math.floor(Math.random() * 20) + 1 + ' km'
        }));
        
        setProfiles(profilesWithDistance);
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [profile?.gender, user]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) {
      handleSwipe('like');
    } else if (info.offset.x < -100) {
      handleSwipe('pass');
    }
  };

  const handleSwipe = async (type: 'like' | 'pass' | 'superlike') => {
    if (currentIndex >= profiles.length) return;
    
    const currentProfile = profiles[currentIndex];
    setCurrentIndex(prev => prev + 1);

    if (user) {
      if (type === 'pass') {
        try {
          await supabase.from('passes').insert([{
            from_user_id: user.id,
            to_user_id: currentProfile.id
          }]);
        } catch (e) {
          console.error('Failed to save pass', e);
        }
      } else if (type === 'like' || type === 'superlike') {
        try {
          // Save like to DB
          await supabase.from('likes').insert([{
            from_user_id: user.id,
            to_user_id: currentProfile.id,
            is_super_like: type === 'superlike'
          }]);
          
          // Check if it's a match (did they like us?)
          const { data: mutualLike } = await supabase
            .from('likes')
            .select('*')
            .eq('from_user_id', currentProfile.id)
            .eq('to_user_id', user.id)
            .single();
            
          if (mutualLike) {
            setMatchedUser(currentProfile);
            setShowMatch(true);
            
            // Create match
            const [user1, user2] = [user.id, currentProfile.id].sort();
            await supabase.from('matches').insert([{
              user_1: user1,
              user_2: user2,
              is_super_match: type === 'superlike' || mutualLike.is_super_like
            }]);
          }
        } catch (e) {
          console.error('Failed to save like/match', e);
        }
      }
    }
  };

  const handleMessageMatch = () => {
    setShowMatch(false);
    if (matchedUser) {
      navigate(`/chat/new-${matchedUser.id}`);
    } else {
      navigate('/messages');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-rose-50">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-4" />
        <p className="text-rose-600 font-medium">Recherche de profils...</p>
      </div>
    );
  }

  if (!profile?.gender) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-rose-50">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-rose-100">
          <UserIcon className="w-10 h-10 text-rose-300" />
        </div>
        <h2 className="text-2xl font-bold text-rose-900 mb-2">Configuration requise</h2>
        <p className="text-rose-600 mb-8">Veuillez définir votre genre dans votre profil pour découvrir des personnes.</p>
        <button 
          onClick={() => navigate('/profile')}
          className="bg-pink-600 text-white font-semibold py-3 px-6 rounded-2xl shadow-md hover:bg-pink-700 transition-colors"
        >
          Aller au profil
        </button>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center relative bg-rose-50">
        {/* Filter Button */}
        <div className="absolute top-6 right-6 z-30">
          <button 
            onClick={() => setShowFilters(true)}
            className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-md text-rose-500 hover:bg-white transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-rose-300" />
        </div>
        <h2 className="text-2xl font-bold text-rose-900 mb-2">Plus de profils</h2>
        <p className="text-rose-600 mb-6">Revenez plus tard ou élargissez votre zone de recherche pour découvrir de nouvelles personnes.</p>
        <button 
          onClick={() => setShowFilters(true)}
          className="bg-white text-pink-600 border border-pink-200 font-semibold py-3 px-6 rounded-2xl shadow-sm hover:bg-pink-50 transition-colors"
        >
          Modifier les filtres
        </button>

        {/* Filter Modal */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
              onClick={() => setShowFilters(false)}
            >
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full bg-white rounded-t-3xl p-6 pb-12"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-rose-950">Filtres</h3>
                  <button onClick={() => setShowFilters(false)} className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6 text-left">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-semibold text-rose-900">Distance maximale</label>
                      <span className="text-pink-600 font-bold">{maxDistance} km</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                      className="w-full h-2 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                    <div className="flex justify-between text-xs text-rose-400 mt-2">
                      <span>1 km</span>
                      <span>100 km</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="w-full bg-pink-600 text-white font-bold py-4 rounded-2xl shadow-md hover:bg-pink-700 transition-colors mt-4"
                  >
                    Appliquer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-rose-50 overflow-hidden">
      {/* Filter Button */}
      <div className="absolute top-6 right-6 z-30">
        <button 
          onClick={() => setShowFilters(true)}
          className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-md text-rose-500 hover:bg-white transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute inset-0 p-4 pb-24 flex items-center justify-center">
        <AnimatePresence>
          {profiles.map((profile, index) => {
            if (index < currentIndex) return null;
            if (index > currentIndex + 1) return null;

            const isTop = index === currentIndex;

            return (
              <motion.div
                key={profile.id}
                className="absolute inset-4 bottom-24 bg-white rounded-3xl shadow-xl overflow-hidden border border-rose-100"
                style={{
                  x: isTop ? x : 0,
                  rotate: isTop ? rotate : 0,
                  opacity: isTop ? opacity : 1,
                  scale: isTop ? 1 : 0.95,
                  zIndex: isTop ? 10 : 0,
                }}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={isTop ? handleDragEnd : undefined}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: isTop ? 1 : 0.95, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="relative w-full h-full">
                  <img 
                    src={profile.photo_url} 
                    alt={profile.display_name}
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable="false"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex items-end gap-3 mb-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/user/${profile.id}`);
                        }}
                        className="text-3xl font-bold flex items-center gap-2 hover:underline text-left"
                      >
                        {profile.display_name}
                      </button>
                      <span className="text-2xl font-light">{profile.age}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-white/80 mb-3 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>À {profile.distance} de vous</span>
                    </div>
                    
                    <p className="text-white/90 line-clamp-2">{profile.bio}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 z-20">
        <button 
          onClick={() => handleSwipe('pass')}
          className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg text-rose-500 hover:bg-rose-50 transition-transform active:scale-95"
        >
          <X className="w-6 h-6" strokeWidth={3} />
        </button>
        
        <button 
          onClick={() => handleSwipe('superlike')}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-blue-500 hover:bg-blue-50 transition-transform active:scale-95"
        >
          <Star className="w-5 h-5" strokeWidth={3} />
        </button>
        
        <button 
          onClick={() => handleSwipe('like')}
          className="w-14 h-14 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-full flex items-center justify-center shadow-lg shadow-pink-200 text-white hover:opacity-90 transition-transform active:scale-95"
        >
          <Heart className="w-6 h-6" fill="currentColor" />
        </button>
      </div>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowFilters(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full bg-white rounded-t-3xl p-6 pb-12"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-rose-950">Filtres</h3>
                <button onClick={() => setShowFilters(false)} className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="font-semibold text-rose-900">Distance maximale</label>
                    <span className="text-pink-600 font-bold">{maxDistance} km</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                    className="w-full h-2 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-rose-400 mt-2">
                    <span>1 km</span>
                    <span>100 km</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full bg-pink-600 text-white font-bold py-4 rounded-2xl shadow-md hover:bg-pink-700 transition-colors mt-4"
                >
                  Appliquer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Overlay */}
      <AnimatePresence>
        {showMatch && matchedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.h2 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-4xl font-bold text-pink-400 mb-8 font-serif italic"
            >
              C'est un Match !
            </motion.h2>
            
            <div className="flex items-center justify-center gap-4 mb-12">
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-24 h-24 rounded-full border-4 border-pink-500 overflow-hidden"
              >
                <img src={profile?.photo_url || 'https://picsum.photos/seed/placeholder/400/400'} alt="You" className="w-full h-full object-cover" />
              </motion.div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 }}
                className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center z-10 -mx-8 shadow-lg"
              >
                <Heart className="w-5 h-5 text-white" fill="currentColor" />
              </motion.div>
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-24 h-24 rounded-full border-4 border-pink-500 overflow-hidden"
              >
                <img src={matchedUser.photo_url} alt={matchedUser.display_name} className="w-full h-full object-cover" />
              </motion.div>
            </div>
            
            <p className="text-white text-lg mb-8">
              Vous et {matchedUser.display_name} vous plaisez mutuellement.
            </p>
            
            <div className="w-full space-y-4">
              <button 
                onClick={handleMessageMatch}
                className="w-full bg-pink-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:bg-pink-700 transition-colors"
              >
                Envoyer un message
              </button>
              <button 
                onClick={() => setShowMatch(false)}
                className="w-full bg-transparent text-white/80 font-semibold py-4 px-6 rounded-2xl hover:bg-white/10 transition-colors"
              >
                Continuer à swiper
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
