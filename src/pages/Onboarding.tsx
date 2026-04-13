import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Heart, ChevronRight, User, MapPin, Sparkles, Camera, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Onboarding() {
  const { updateProfile, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'homme' | 'femme' | ''>('');
  const [preference, setPreference] = useState<'homme' | 'femme' | ''>('');
  const [mode, setMode] = useState<'serious' | 'fun' | ''>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const INTEREST_OPTIONS = [
    'Voyage', 'Musique', 'Cuisine', 'Sport', 'Cinéma', 
    'Lecture', 'Art', 'Jeux vidéo', 'Danse', 'Photographie',
    'Mode', 'Nature'
  ];

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPhotoUrl(objectUrl);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    }
  };

  const completeOnboarding = async () => {
    setIsUploading(true);
    let finalPhotoUrl = photoUrl;

    try {
      if (photoFile && user) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, photoFile);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          // Don't block onboarding if image upload fails, just use empty string
          finalPhotoUrl = '';
        } else {
          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
          finalPhotoUrl = data.publicUrl;
        }
      }

      await updateProfile({
        display_name: name,
        age: Number(age),
        gender: gender || 'homme',
        mode: mode || 'serious',
        interests: interests,
        onboarding_completed: true,
        photo_url: finalPhotoUrl
      });
      navigate('/');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      alert(`Une erreur est survenue: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return name.trim().length > 2 && age !== '' && Number(age) >= 18;
      case 2: return gender !== '' && preference !== '';
      case 3: return mode !== '';
      case 4: return interests.length >= 3;
      case 5: return photoUrl !== '';
      default: return false;
    }
  };

  return (
    <div className="h-[100dvh] max-w-md mx-auto bg-white flex flex-col relative sm:rounded-3xl sm:h-[850px] sm:my-8 border border-rose-100 overflow-hidden shadow-2xl">
      
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-rose-100">
        <div 
          className="h-full bg-pink-500 transition-all duration-300 ease-out"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 text-pink-500">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-rose-950 mb-2">Faisons connaissance</h1>
            <p className="text-rose-500 mb-8">Comment devons-nous vous appeler ?</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-rose-900 mb-2">Prénom</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre prénom"
                  className="w-full bg-rose-50 border-none rounded-2xl py-4 px-4 text-rose-900 placeholder:text-rose-300 focus:ring-2 focus:ring-pink-200 outline-none text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-rose-900 mb-2">Âge</label>
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Votre âge (min. 18)"
                  min="18"
                  max="99"
                  className="w-full bg-rose-50 border-none rounded-2xl py-4 px-4 text-rose-900 placeholder:text-rose-300 focus:ring-2 focus:ring-pink-200 outline-none text-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Gender & Preference */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 text-pink-500">
              <Heart className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-rose-950 mb-2">Vos préférences</h1>
            <p className="text-rose-500 mb-8">Afin de vous proposer les meilleurs profils.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-rose-900 mb-3">Je suis...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setGender('homme')}
                    className={`py-4 px-4 rounded-2xl border-2 font-medium transition-colors ${gender === 'homme' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-rose-100 bg-white text-rose-600 hover:bg-rose-50'}`}
                  >
                    Un homme
                  </button>
                  <button 
                    onClick={() => setGender('femme')}
                    className={`py-4 px-4 rounded-2xl border-2 font-medium transition-colors ${gender === 'femme' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-rose-100 bg-white text-rose-600 hover:bg-rose-50'}`}
                  >
                    Une femme
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-rose-900 mb-3">Je recherche...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPreference('femme')}
                    className={`py-4 px-4 rounded-2xl border-2 font-medium transition-colors ${preference === 'femme' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-rose-100 bg-white text-rose-600 hover:bg-rose-50'}`}
                  >
                    Des femmes
                  </button>
                  <button 
                    onClick={() => setPreference('homme')}
                    className={`py-4 px-4 rounded-2xl border-2 font-medium transition-colors ${preference === 'homme' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-rose-100 bg-white text-rose-600 hover:bg-rose-50'}`}
                  >
                    Des hommes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Intent */}
        {step === 3 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 text-pink-500">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-rose-950 mb-2">Que recherchez-vous ?</h1>
            <p className="text-rose-500 mb-8">Soyez honnête, cela nous aide à trouver les bonnes personnes.</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => setMode('serious')}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-colors ${mode === 'serious' ? 'border-pink-500 bg-pink-50' : 'border-rose-100 bg-white hover:bg-rose-50'}`}
              >
                <h3 className={`font-bold text-lg mb-1 ${mode === 'serious' ? 'text-pink-700' : 'text-rose-900'}`}>Relation sérieuse</h3>
                <p className={mode === 'serious' ? 'text-pink-600/80' : 'text-rose-500'}>Je cherche l'amour, le vrai.</p>
              </button>
              
              <button 
                onClick={() => setMode('fun')}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-colors ${mode === 'fun' ? 'border-pink-500 bg-pink-50' : 'border-rose-100 bg-white hover:bg-rose-50'}`}
              >
                <h3 className={`font-bold text-lg mb-1 ${mode === 'fun' ? 'text-pink-700' : 'text-rose-900'}`}>On verra bien</h3>
                <p className={mode === 'fun' ? 'text-pink-600/80' : 'text-rose-500'}>Rencontres sympas, sans prise de tête.</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Interests */}
        {step === 4 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 text-pink-500">
              <MapPin className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-rose-950 mb-2">Vos passions</h1>
            <p className="text-rose-500 mb-8">Sélectionnez au moins 3 centres d'intérêt.</p>
            
            <div className="flex flex-wrap gap-3">
              {INTEREST_OPTIONS.map(interest => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${
                      isSelected 
                        ? 'border-pink-500 bg-pink-500 text-white shadow-md shadow-pink-200' 
                        : 'border-rose-100 bg-white text-rose-600 hover:border-pink-200 hover:bg-rose-50'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Profile Photo */}
        {step === 5 && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 text-pink-500">
              <Camera className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-rose-950 mb-2">Votre plus beau sourire</h1>
            <p className="text-rose-500 mb-8">Une photo de profil est obligatoire pour commencer.</p>
            
            <div className="flex-1 flex flex-col items-center justify-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-48 h-48 rounded-full border-4 overflow-hidden relative cursor-pointer group ${
                  photoUrl ? 'border-pink-500 shadow-xl' : 'border-dashed border-rose-300 bg-rose-50 hover:bg-rose-100'
                }`}
              >
                {photoUrl ? (
                  <>
                    <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-rose-400">
                    <Camera className="w-10 h-10 mb-2" />
                    <span className="text-sm font-medium">Ajouter une photo</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-auto pt-8 pb-4">
          <button
            onClick={handleNext}
            disabled={!isStepValid() || isUploading}
            className="w-full bg-pink-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-md hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:bg-rose-300 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                {step === 5 ? 'Terminer' : 'Continuer'}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
