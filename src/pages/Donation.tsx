import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartHandshake, Server, Code, Coffee, Copy, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Donation() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('+237687041443');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDonationValidation = async () => {
    const currentCount = profile?.donation_count || 0;
    await updateProfile({ 
      has_donated: true,
      donation_count: currentCount + 1
    });
    navigate(-1); // Go back after donation
  };

  return (
    <div className="h-full flex flex-col bg-rose-50 overflow-y-auto">
      <div className="bg-white px-4 py-3 flex items-center border-b border-rose-100 sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-rose-400 hover:text-rose-600 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-rose-950 ml-2">Faire un don</h1>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-pink-200 rotate-12 mx-auto mt-4 shrink-0">
          <HeartHandshake className="w-10 h-10 text-white -rotate-12" />
        </div>

        <h2 className="text-2xl font-bold text-rose-950 text-center mb-4">
          Soutenez LAEI ❤️
        </h2>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 mb-6 space-y-4 text-rose-700 leading-relaxed">
          <p>
            Notre mission est de vous offrir la meilleure expérience de rencontre, <strong className="text-pink-600">100% gratuitement</strong>. Pas d'abonnements cachés, pas de fonctionnalités bloquées.
          </p>
          <p>
            Cependant, maintenir cette plateforme a un coût. Vos dons nous aident directement à :
          </p>
          
          <ul className="space-y-4 mt-6">
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Payer les frais d'hébergement et de serveurs</span>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                <Code className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Financer le développement de nouvelles fonctionnalités</span>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Soutenir l'équipe technique indépendante</span>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Maintenir l'application 100% gratuite pour tous</span>
            </li>
          </ul>
        </div>

        <div className="mt-auto pt-2">
          <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 text-center mb-4 shadow-sm">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md transform -rotate-3">
              <span className="text-white font-black text-xl tracking-tighter">OM</span>
            </div>
            <h3 className="text-lg font-bold text-orange-950 mb-2">Dépôt Orange Money</h3>
            <p className="text-orange-800 text-sm mb-4">
              Pour faire un don, veuillez effectuer un dépôt via Orange Money au numéro ci-dessous :
            </p>
            
            <div className="bg-white py-3 px-4 rounded-2xl border border-orange-200 flex flex-col gap-2 mb-4 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-orange-900 tracking-wide">+237 6 87 04 14 43</span>
                <button 
                  onClick={handleCopyNumber}
                  className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium text-sm px-3 py-2 bg-orange-100 hover:bg-orange-200 rounded-xl transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
              <div className="text-left border-t border-orange-100 pt-2">
                <span className="text-xs text-orange-500 uppercase tracking-wider font-semibold">Nom du compte</span>
                <p className="text-sm font-medium text-orange-900">kouengoua Lana Hermann Yvon</p>
              </div>
            </div>
            
            <p className="text-xs text-orange-600 font-medium">
              Chaque contribution compte. Merci pour votre générosité ! ❤️
            </p>
          </div>
          
          <button 
            onClick={handleDonationValidation}
            className="w-full bg-white text-pink-600 border border-pink-200 font-semibold py-4 px-6 rounded-2xl shadow-sm hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
          >
            J'ai effectué le transfert (Valider)
          </button>
        </div>
      </div>
    </div>
  );
}
