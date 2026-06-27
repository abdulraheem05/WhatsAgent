import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SplashScreen.css'; 

export default function SplashScreen({ user, loading }) {
  const navigate = useNavigate();

  const handleVideoEnd = () => {
    // Wait until Supabase finishes the loading check before choosing where to go
    if (loading) {
      setTimeout(() => handleVideoEnd(), 200);
      return;
    }
    navigate(user ? '/home' : '/login');
  };

  return (
    <div className="splash-video-container">
      <video 
        autoPlay 
        muted 
        playsInline 
        className="splash-video"
        onEnded={handleVideoEnd}
        onError={(e) => {
          console.error("Video failed to load:", e);
          handleVideoEnd();
        }}
      >
        {/* ✅ Updated to match a standard filename without raw spaces */}
        <source src="/video/WhatsAgent_Splashscreen.mp4" type="video/mp4" />
      </video>
    </div>
  );
}