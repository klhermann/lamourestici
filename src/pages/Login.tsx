import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Heart } from 'lucide-react';

export function Login() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setSuccessMessage('Inscription réussie ! Veuillez vérifier votre boîte mail pour confirmer votre compte.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-rose-50 overflow-hidden relative shadow-2xl sm:rounded-3xl sm:h-[850px] sm:my-8 border border-rose-100 p-8">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-pink-200 rotate-12">
          <Heart className="w-12 h-12 text-white -rotate-12" fill="currentColor" />
        </div>
        
        <h1 className="text-4xl font-bold text-rose-950 mb-2 tracking-tight">
          LAEI
        </h1>
        <p className="text-rose-700 text-lg mb-8 font-medium">
          L'Amour Est Ici.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4 mb-6">
          {error && (
            <div className="p-3 bg-red-100 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-100 text-green-700 text-sm rounded-xl">
              {successMessage}
            </div>
          )}
          
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-rose-100 rounded-2xl py-4 px-6 text-rose-900 placeholder:text-rose-300 focus:ring-2 focus:ring-pink-200 outline-none"
            required
          />
          
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-rose-100 rounded-2xl py-4 px-6 text-rose-900 placeholder:text-rose-300 focus:ring-2 focus:ring-pink-200 outline-none"
            required
            minLength={6}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-md hover:bg-pink-700 transition-colors disabled:opacity-70"
          >
            {loading ? 'Chargement...' : (isSignUp ? 'Créer un compte' : 'Se connecter')}
          </button>
        </form>

        <div className="w-full space-y-4">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-pink-600 font-medium py-2 hover:text-pink-700 transition-colors"
          >
            {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
          </button>
        </div>
      </div>
      
      <p className="text-center text-xs text-rose-400 mt-8">
        En continuant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.
      </p>
    </div>
  );
}
