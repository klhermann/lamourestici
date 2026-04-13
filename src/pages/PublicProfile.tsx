import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        // Add mock distance since we don't have geolocation
        setProfile({
          ...data,
          distance: Math.floor(Math.random() * 20) + 1 + ' km'
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-rose-50">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-4" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-rose-50 p-6 text-center">
        <h2 className="text-2xl font-bold text-rose-900 mb-2">Profil introuvable</h2>
        <p className="text-rose-600 mb-6">Cet utilisateur n'existe pas ou a supprimé son compte.</p>
        <button 
          onClick={() => navigate(-1)}
          className="bg-pink-600 text-white font-semibold py-3 px-6 rounded-2xl shadow-md hover:bg-pink-700 transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-rose-50 overflow-y-auto">
      <div className="relative pt-12 pb-8 px-6 bg-gradient-to-tr from-pink-500 to-rose-400 flex flex-col items-center">
        <div className="absolute top-4 left-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative mt-2 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-white/40 overflow-hidden shadow-xl bg-white">
            <img 
              src={profile.photo_url} 
              alt={profile.display_name} 
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        <div className="text-center flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white drop-shadow-sm">
              {profile.display_name}, {profile.age}
            </h1>
            <ShieldCheck className="w-5 h-5 text-blue-100" />
          </div>
          <div className="flex items-center gap-1 text-pink-100 font-medium">
            <MapPin className="w-4 h-4" />
            <span>À {profile.distance} de vous</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-8 text-center">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 text-left mb-6">
          <h2 className="font-semibold text-rose-900 mb-3">À propos</h2>
          <p className="text-rose-600 text-sm leading-relaxed">
            {profile.bio}
          </p>
          
          <h2 className="font-semibold text-rose-900 mt-6 mb-3">Centres d'intérêt</h2>
          <div className="flex flex-wrap gap-2">
            {['Voyage', 'Musique', 'Cuisine', 'Sport'].map(interest => (
              <span key={interest} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-xs font-medium border border-rose-100">
                {interest}
              </span>
            ))}
          </div>
        </div>
        
        <button 
          onClick={() => navigate(`/chat/${profile.id}`)}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white font-semibold py-4 px-6 rounded-2xl shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Envoyer un message
        </button>
      </div>
    </div>
  );
}
