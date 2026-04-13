/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Discover } from './pages/Discover';
import { Matches } from './pages/Matches';
import { Likes } from './pages/Likes';
import { Chat } from './pages/Chat';
import { ProfileDetail } from './pages/ProfileDetail';
import { PublicProfile } from './pages/PublicProfile';
import { Donation } from './pages/Donation';
import { Settings } from './pages/Settings';
import { Onboarding } from './pages/Onboarding';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-rose-50">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in but hasn't completed onboarding, redirect to onboarding
  if ((!profile || !profile.onboarding_completed) && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/onboarding" element={
        !user ? <Navigate to="/login" replace /> : 
        (profile?.onboarding_completed ? <Navigate to="/" replace /> : <Onboarding />)
      } />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Discover />} />
        <Route path="/likes" element={<Likes />} />
        <Route path="/messages" element={<Matches />} />
        <Route path="/chat/:matchId" element={<Chat />} />
        <Route path="/profile" element={<ProfileDetail />} />
        <Route path="/user/:id" element={<PublicProfile />} />
        <Route path="/donation" element={<Donation />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
