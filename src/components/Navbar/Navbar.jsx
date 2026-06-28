import React from 'react';
import { supabase } from '../../supabaseClient';
import { Link } from 'react-router-dom';
import "./Navbar.css";

export default function Navbar({ user }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login'; 
  };

  const scrollToFeedback = () => {
    const element = document.getElementById('feedback-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.warn("Feedback section not found on this page.");
    }
  };

  return (
    <nav className="navbar">
      {/* LEFT: Brand */}
      <div className="nav-brand">
        <Link to="/home" className="brand-link">
          <img 
            src="/WhatsAgent.png-Green.png" /* 👈 Replace with the path to your actual logo asset (e.g., /icons/logo.png) */
            alt="WhatsAgent Logo" 
            className="nav-logo" 
          />
          <span className="brand-text">WhatsAgent</span>
        </Link>
      </div>
      
      {/* CENTER: Navigation Actions */}
      <div className="nav-center">
        
        {/* FIXED: Advices is a Link that routes to /advices page */}
        <Link to="/advices" className="advice-box-btn">
          <svg className="bulb-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M12 2v1" />
            <path d="M12 7v1" />
            <path d="M4.5 16.5l.5-.5" />
            <path d="M19.5 16.5l-.5-.5" />
            <path d="M2 12h1" />
            <path d="M21 12h1" />
            <path d="M4.5 7.5l.5.5" />
            <path d="M19.5 7.5l-.5.5" />
            <circle cx="12" cy="12" r="5" />
          </svg>
          <span className="advice-text">Advices</span>
        </Link>

        {/* Feedback remains a button to trigger the scroll */}
        <button className="feedback-btn" onClick={scrollToFeedback}>
          Feedback
        </button>
      </div>

      {/* RIGHT: Profile */}
      {user ? (
        <div className="nav-profile">
          <span className="nav-user-name">Hi {user?.user_metadata?.full_name || "User"}!</span>
          <img 
            src={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} 
            alt="Profile" 
            className="profile-avatar" 
            referrerPolicy="no-referrer"
          />
          <button className="sign-out-btn" onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <div className="nav-profile-placeholder"></div> 
      )}
    </nav>
  );
}