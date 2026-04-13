import { useRef, useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, Edit3, ShieldCheck, HeartHandshake, ImagePlus, X, Camera, CheckCircle, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ProfileDetail() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'idle' | 'camera' | 'scanning' | 'success'>('idle');
  const [stats, setStats] = useState({ matches: 0, likes: 0, superLikes: 0 });
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const { count: matchesCount } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .or(`user_1.eq.${user.id},user_2.eq.${user.id}`);

        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('to_user_id', user.id);

        const { count: superLikesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('to_user_id', user.id)
          .eq('is_super_like', true);

        setStats({
          matches: matchesCount || 0,
          likes: likesCount || 0,
          superLikes: superLikesCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [user]);

  const handleGenderChange = async (gender: 'homme' | 'femme') => {
    await updateProfile({ gender });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-gallery-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        alert("Erreur lors de l'upload de l'image.");
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const imageUrl = data.publicUrl;
      
      const currentGallery = profile?.gallery_urls || [];
      if (currentGallery.length < 3) {
        await updateProfile({ gallery_urls: [...currentGallery, imageUrl] });
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProfilePicUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-profile-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        alert("Erreur lors de l'upload de l'image.");
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const imageUrl = data.publicUrl;
      
      await updateProfile({ photo_url: imageUrl });
    } catch (error) {
      console.error(error);
    } finally {
      if (profilePicInputRef.current) {
        profilePicInputRef.current.value = '';
      }
    }
  };

  const removePhoto = async (indexToRemove: number) => {
    const currentGallery = profile?.gallery_urls || [];
    const newGallery = currentGallery.filter((_, index) => index !== indexToRemove);
    await updateProfile({ gallery_urls: newGallery });
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsLocating(true);
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
          console.error("Erreur lors de la récupération de l'adresse:", error);
          alert("Impossible de déterminer votre ville.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
        alert("Veuillez autoriser l'accès à votre position pour utiliser cette fonctionnalité.");
        setIsLocating(false);
      }
    );
  };

  const startCamera = async () => {
    setVerificationStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Erreur d'accès à la caméra:", err);
      alert("Impossible d'accéder à la caméra. Veuillez vérifier vos permissions.");
      setVerificationStep('idle');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const takePhotoAndVerify = () => {
    setVerificationStep('scanning');
    stopCamera();
    
    // Simuler l'analyse faciale
    setTimeout(() => {
      setVerificationStep('success');
      setTimeout(async () => {
        try {
          await updateProfile({ is_verified: true });
        } catch (err) {
          console.error("Erreur lors de la mise à jour du statut de vérification:", err);
        }
        setShowVerificationModal(false);
        setVerificationStep('idle');
      }, 1500);
    }, 2000);
  };

  const closeVerificationModal = () => {
    stopCamera();
    setShowVerificationModal(false);
    setVerificationStep('idle');
  };

  return (
    <div className="h-full flex flex-col bg-rose-50 overflow-y-auto">
      <div className="relative pt-12 pb-8 px-6 bg-gradient-to-tr from-pink-500 to-rose-400 flex flex-col items-center">
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative mt-2 mb-4">
          <div className="w-32 h-32 rounded-full border-4 border-white/40 overflow-hidden shadow-xl bg-white">
            <img 
              src={profile?.photo_url || 'https://picsum.photos/seed/placeholder/400/400'} 
              alt="Profile" 
              className="w-full h-full object-cover object-center"
            />
          </div>
          <button 
            onClick={() => profilePicInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-pink-500 border border-rose-100 hover:bg-rose-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <input 
            type="file" 
            ref={profilePicInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleProfilePicUpload}
          />
        </div>

        <div className="text-center flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white drop-shadow-sm">
              {profile?.display_name || 'Utilisateur'}, {profile?.age || 25}
            </h1>
            {profile?.is_verified && (
              <ShieldCheck className="w-5 h-5 text-blue-100" />
            )}
          </div>
          <div className="flex items-center gap-2 text-pink-100 font-medium">
            <MapPin className="w-4 h-4" />
            <span>{profile?.location || 'Localisation inconnue'}</span>
            <button 
              onClick={getLocation}
              disabled={isLocating}
              className="ml-2 p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
              title="Mettre à jour ma position"
            >
              {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-8 text-center">
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100">
            <div className="text-2xl font-bold text-pink-500 mb-1">{stats.matches}</div>
            <div className="text-xs text-rose-400 font-medium uppercase tracking-wider">Matchs</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100">
            <div className="text-2xl font-bold text-pink-500 mb-1">{stats.likes}</div>
            <div className="text-xs text-rose-400 font-medium uppercase tracking-wider">Likes</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100">
            <div className="text-2xl font-bold text-pink-500 mb-1">{stats.superLikes}</div>
            <div className="text-xs text-rose-400 font-medium uppercase tracking-wider">Super</div>
          </div>
        </div>

        {/* Verification Banner */}
        {!profile?.is_verified && (
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-4 mb-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-sm">Profil non vérifié</h3>
                <p className="text-blue-600 text-xs">Prouvez que c'est bien vous.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowVerificationModal(true)}
              className="bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm hover:bg-blue-600 transition-colors"
            >
              Vérifier
            </button>
          </div>
        )}

        {/* Donation Banner */}
        <button 
          onClick={() => navigate('/donation')}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-3xl p-1 shadow-lg shadow-pink-200 mb-8 transform transition hover:scale-[1.02] active:scale-95"
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-[22px] p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-inner">
              <HeartHandshake className="w-6 h-6 text-pink-500" />
            </div>
            <div className="text-left text-white">
              <h3 className="font-bold text-lg leading-tight">Faites un don</h3>
              <p className="text-pink-50 text-xs mt-0.5">Soutenez LAEI et participez à son évolution !</p>
            </div>
          </div>
        </button>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 text-left mb-6">
          <h2 className="font-semibold text-rose-900 mb-3">Mon Genre</h2>
          <div className="flex gap-3">
            <button 
              onClick={() => handleGenderChange('homme')}
              className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-colors ${
                profile?.gender === 'homme' 
                  ? 'bg-pink-50 border-pink-500 text-pink-700' 
                  : 'bg-white border-rose-100 text-rose-600 hover:bg-rose-50'
              }`}
            >
              Homme
            </button>
            <button 
              onClick={() => handleGenderChange('femme')}
              className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-colors ${
                profile?.gender === 'femme' 
                  ? 'bg-pink-50 border-pink-500 text-pink-700' 
                  : 'bg-white border-rose-100 text-rose-600 hover:bg-rose-50'
              }`}
            >
              Femme
            </button>
          </div>
          <p className="text-xs text-rose-400 mt-3">
            Vous ne verrez que des profils du genre opposé.
          </p>
        </div>

        {/* Galerie Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 text-left mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-rose-900">Ma Galerie</h2>
            <span className="text-xs font-medium text-rose-400 bg-rose-50 px-2 py-1 rounded-full">
              {profile?.gallery_urls?.length || 0}/3
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((index) => {
              const photoUrl = profile?.gallery_urls?.[index];
              const isNextAvailable = (profile?.gallery_urls?.length || 0) === index;
              
              return (
                <div 
                  key={index} 
                  className={`aspect-square rounded-2xl overflow-hidden relative flex items-center justify-center transition-all ${
                    photoUrl 
                      ? 'bg-rose-100 shadow-sm' 
                      : 'bg-rose-50 border-2 border-dashed border-rose-200'
                  }`}
                >
                  {photoUrl ? (
                    <>
                      <img src={photoUrl} alt={`Galerie ${index + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removePhoto(index)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!isNextAvailable}
                      className={`w-full h-full flex items-center justify-center transition-colors ${
                        isNextAvailable 
                          ? 'text-pink-500 hover:bg-rose-100 cursor-pointer' 
                          : 'text-rose-200 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <ImagePlus className="w-6 h-6" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
          />
          <p className="text-xs text-rose-400 mt-3">
            Ajoutez jusqu'à 3 photos pour montrer votre univers.
          </p>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 text-left mb-6">
          <h2 className="font-semibold text-rose-900 mb-3">À propos de moi</h2>
          <p className="text-rose-600 text-sm leading-relaxed">
            {profile?.bio || "Je suis à la recherche de quelqu'un d'authentique pour partager de bons moments."}
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
          onClick={() => setShowLogoutModal(true)}
          className="w-full bg-white text-rose-500 font-semibold py-4 px-6 rounded-2xl shadow-sm border border-rose-100 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-center text-rose-950 mb-2">Se déconnecter ?</h3>
            <p className="text-center text-rose-600 mb-6 text-sm">
              Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
            </p>
            <div className="space-y-3">
              <button 
                onClick={signOut}
                className="w-full bg-rose-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:bg-rose-600 transition-colors"
              >
                Oui, se déconnecter
              </button>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="w-full bg-rose-100 text-rose-700 font-semibold py-3 px-6 rounded-xl hover:bg-rose-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            {verificationStep === 'idle' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-rose-950 mb-2">Vérification faciale</h3>
                <p className="text-rose-600 mb-6 text-sm">
                  Prenez un selfie rapide pour confirmer que vous correspondez à vos photos. Cela rassure vos matchs !
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={startCamera}
                    className="w-full bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:bg-blue-600 transition-colors"
                  >
                    Ouvrir la caméra
                  </button>
                  <button 
                    onClick={closeVerificationModal}
                    className="w-full bg-rose-100 text-rose-700 font-semibold py-3 px-6 rounded-xl hover:bg-rose-200 transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            )}
            {verificationStep === 'camera' && (
              <div className="text-center">
                <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden mb-4">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-4 border-blue-500/50 rounded-2xl pointer-events-none"></div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-64 border-2 border-dashed border-white/70 rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-rose-950 mb-4">Placez votre visage dans l'ovale</h3>
                <div className="space-y-3">
                  <button 
                    onClick={takePhotoAndVerify}
                    className="w-full bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Prendre la photo
                  </button>
                  <button 
                    onClick={closeVerificationModal}
                    className="w-full bg-rose-100 text-rose-700 font-semibold py-3 px-6 rounded-xl hover:bg-rose-200 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
            {verificationStep === 'scanning' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-rose-950 mb-2">Analyse en cours...</h3>
                <p className="text-rose-600 text-sm">Veuillez patienter pendant que nous vérifions votre visage.</p>
              </div>
            )}
            {verificationStep === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-rose-950 mb-2">Profil vérifié !</h3>
                <p className="text-rose-600 text-sm">Merci, votre badge de vérification est maintenant actif.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
