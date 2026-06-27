import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

import SplashScreen from './pages/SplashScreen/SplashScreen';
import HomeDashboard from './pages/HomeDashboard/HomeDashboard';
import Navbar from './components/Navbar/Navbar';
import LoginScreen from './pages/LoginScreen/LoginScreen';
import AgentDetails from './pages/AgentDetails/AgentDetails';
import WhyWhatsAgent from './pages/WhyWhatsAgent/WhyWhatsAgent';
import Advices from './pages/Advices/Advices';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);


  return (
    <div className="app-layout">
      {/* Navbar only shows if NOT on splash or login */}
      {location.pathname !== '/' && location.pathname !== '/login' && <Navbar user={user} />}
      
      <Routes>
        {/* Pass loading status to SplashScreen so it knows to wait for auth */}
        <Route path="/" element={<SplashScreen user={user} loading={loading} />} />
        
        <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginScreen />} />
        <Route path="/agent/:id" element={user ? <AgentDetails user={user} /> : <Navigate to="/login" replace />} />
        <Route path="/why-whatsagent" element={<WhyWhatsAgent />} />
        <Route path='/advices' element={<Advices/>}/>
        <Route path="/home" element={user ? <HomeDashboard user={user} /> : <Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}