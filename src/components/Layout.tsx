import { useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, User as UserIcon, Compass, HeartHandshake } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

// Fonction pour jouer un son de notification (bip doux)
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Note D5
    osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.1); // Note A5
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.error("Erreur lors de la lecture du son:", e);
  }
};

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const locationRequested = useRef(false);
  
  const hideFloatingDonation = location.pathname === '/profile' || location.pathname === '/donation' || location.pathname === '/settings';

  // Demander la permission pour les notifications et écouter les nouveaux messages
  useEffect(() => {
    if (!user) return;

    // Demander la permission pour les notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Écouter les nouveaux messages en temps réel
    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Ne pas notifier si on est déjà sur la page de chat avec cette personne
          if (location.pathname.includes(`/chat/${newMessage.match_id}`)) return;

          // Jouer le son
          playNotificationSound();

          // Afficher la notification push
          if ('Notification' in window && Notification.permission === 'granted') {
            // Récupérer le nom de l'expéditeur
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', newMessage.sender_id)
              .single();

            const senderName = senderProfile?.display_name || 'Nouveau message';
            
            const notification = new Notification(senderName, {
              body: newMessage.content,
              icon: '/favicon.ico', // Assurez-vous d'avoir une icône
              badge: '/favicon.ico'
            });

            notification.onclick = () => {
              window.focus();
              navigate(`/chat/${newMessage.match_id}`);
              notification.close();
            };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, location.pathname, navigate]);

  // Localisation automatique à l'ouverture
  useEffect(() => {
    if (!user || locationRequested.current) return;
    
    const updateLocation = () => {
      if (!navigator.geolocation) return;

      locationRequested.current = true;
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            
            const city = data.address.city || data.address.town || data.address.village || '';
            const country = data.address.country || '';
            const locationString = [city, country].filter(Boolean).join(', ');
            
            if (locationString) {
              await updateProfile({ location: locationString });
            }
          } catch (error) {
            console.error("Erreur lors de la localisation automatique:", error);
          }
        },
        (error) => {
          console.error("Géolocalisation refusée ou erreur:", error);
        },
        { timeout: 10000 } // Ne pas bloquer indéfiniment
      );
    };

    updateLocation();
  }, [user, updateProfile]);

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-rose-50 overflow-hidden relative shadow-2xl sm:rounded-3xl sm:h-[850px] sm:my-8 border border-rose-100">
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
      
      {!hideFloatingDonation && (
        <button
          onClick={() => navigate('/donation')}
          className="absolute bottom-32 right-6 w-14 h-14 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-full flex items-center justify-center shadow-lg shadow-pink-300 text-white hover:scale-105 active:scale-95 transition-transform z-50"
          aria-label="Faire un don"
        >
          <HeartHandshake className="w-7 h-7" />
        </button>
      )}

      <nav className="bg-white border-t border-rose-100 px-6 py-4 flex justify-between items-center z-50 rounded-b-3xl">
        <NavLink 
          to="/" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-colors",
            isActive ? "text-pink-600" : "text-rose-300 hover:text-pink-400"
          )}
        >
          <Compass className="w-6 h-6" />
          <span className="text-[10px] font-medium">Découvrir</span>
        </NavLink>
        
        <NavLink 
          to="/likes" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-colors",
            isActive ? "text-pink-600" : "text-rose-300 hover:text-pink-400"
          )}
        >
          <Heart className="w-6 h-6" />
          <span className="text-[10px] font-medium">Likes</span>
        </NavLink>
        
        <NavLink 
          to="/messages" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-colors",
            isActive ? "text-pink-600" : "text-rose-300 hover:text-pink-400"
          )}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium">Messages</span>
        </NavLink>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 transition-colors",
            isActive ? "text-pink-600" : "text-rose-300 hover:text-pink-400"
          )}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profil</span>
        </NavLink>
      </nav>
    </div>
  );
}
