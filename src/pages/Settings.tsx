import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, Shield, User, MapPin, HelpCircle, 
  LogOut, Trash2, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await signOut();
  };

  const handleDeleteAccount = () => {
    // In a real app, this would call an API to delete the account
    signOut();
  };

  return (
    <div className="h-full flex flex-col bg-rose-50 overflow-y-auto relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center border-b border-rose-100 sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-rose-400 hover:text-rose-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-rose-950 ml-2">Paramètres</h1>
      </div>

      <div className="p-6 space-y-6 pb-24">
        
        {/* Section: Découverte */}
        <section>
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Découverte
          </h2>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-rose-900 font-medium">Distance maximale</span>
                <span className="text-pink-600 font-bold">{maxDistance} km</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-pink-500"
              />
            </div>
            
            <div className="pt-4 border-t border-rose-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-rose-900 font-medium">Tranche d'âge</span>
                <span className="text-pink-600 font-bold">18 - 35 ans</span>
              </div>
              <div className="flex items-center gap-4">
                <input type="number" defaultValue={18} min={18} max={99} className="w-full bg-rose-50 border-none rounded-xl py-2 px-3 text-rose-900 focus:ring-2 focus:ring-pink-200 outline-none" />
                <span className="text-rose-300">-</span>
                <input type="number" defaultValue={35} min={18} max={99} className="w-full bg-rose-50 border-none rounded-xl py-2 px-3 text-rose-900 focus:ring-2 focus:ring-pink-200 outline-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Section: Notifications */}
        <section>
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </h2>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-rose-100">
            <div className="flex items-center justify-between p-3">
              <span className="text-rose-900 font-medium ml-2">Push (Matchs & Messages)</span>
              <button 
                onClick={() => setPushNotifications(!pushNotifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${pushNotifications ? 'bg-pink-500' : 'bg-rose-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 border-t border-rose-50">
              <span className="text-rose-900 font-medium ml-2">Emails promotionnels</span>
              <button 
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${emailNotifications ? 'bg-pink-500' : 'bg-rose-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Section: Confidentialité */}
        <section>
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Confidentialité
          </h2>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-rose-100">
            <div className="flex items-center justify-between p-3">
              <div>
                <span className="text-rose-900 font-medium ml-2 block">Mode Incognito</span>
                <span className="text-rose-400 text-xs ml-2">Seuls vos matchs peuvent vous voir</span>
              </div>
              <button 
                onClick={() => setIncognitoMode(!incognitoMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${incognitoMode ? 'bg-pink-500' : 'bg-rose-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${incognitoMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Section: Compte & Assistance */}
        <section>
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
            <User className="w-4 h-4" /> Compte
          </h2>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-rose-100">
            <button className="w-full flex items-center justify-between p-3 hover:bg-rose-50 rounded-2xl transition-colors">
              <span className="text-rose-900 font-medium ml-2">Gérer mon compte</span>
              <ChevronRight className="w-5 h-5 text-rose-300" />
            </button>
            <button className="w-full flex items-center justify-between p-3 border-t border-rose-50 hover:bg-rose-50 rounded-2xl transition-colors">
              <span className="text-rose-900 font-medium ml-2">Centre d'aide</span>
              <ChevronRight className="w-5 h-5 text-rose-300" />
            </button>
          </div>
        </section>

        {/* Actions */}
        <section className="pt-4 space-y-3">
          <button 
            onClick={handleLogout}
            className="w-full bg-white text-rose-600 font-semibold py-4 px-6 rounded-2xl shadow-sm border border-rose-100 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Se déconnecter
          </button>
          
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-transparent text-red-500 font-semibold py-4 px-6 rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Supprimer mon compte
          </button>
        </section>
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
                onClick={confirmLogout}
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

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-center text-rose-950 mb-2">Supprimer le compte ?</h3>
            <p className="text-center text-rose-600 mb-6 text-sm">
              Cette action est irréversible. Toutes vos données, matchs et messages seront définitivement effacés.
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleDeleteAccount}
                className="w-full bg-red-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:bg-red-600 transition-colors"
              >
                Oui, supprimer définitivement
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="w-full bg-rose-100 text-rose-700 font-semibold py-3 px-6 rounded-xl hover:bg-rose-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
