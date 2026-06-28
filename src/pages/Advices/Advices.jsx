import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Advices.css';

const Advices = () => {
  const navigate = useNavigate();

  const setupSteps = [
    {
      id: 1,
      title: "Create Your Knowledge Base",
      description: "Write all your business details, FAQs, and policies in a Google Doc. Set the sharing permission to 'Anyone with the link can view' and paste the link here.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      id: 2,
      title: "Connect Your WhatsApp",
      description: "Link your account by scanning the QR code, just like WhatsApp Web. WhatsAgent operates smoothly as an official linked device.",
      alert: "Privacy Note: We do not access, read, or save your past personal chats.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
      )
    },
    {
      id: 3,
      title: "Initial Configuration",
      description: "Allow up to 5 minutes for the system to configure your AI. The very first reply might take a moment, but all subsequent responses will be delivered within 5-10 seconds.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    }
  ];

  const features = [
    {
      title: "Update Knowledge Instantly",
      description: "Have a new offer or policy change? Simply edit your Google Doc and click the 'Update' button on your dashboard. The bot will instantly learn the new information.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.22l-5.36 5.36"></path>
        </svg>
      )
    },
    {
      title: "Unanswered Queries",
      description: "If a customer asks a question that isn't covered in your document, the bot won't guess. It will mark the conversation as 'Unanswered' so you can step in and reply manually.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="13" x2="15" y2="13"></line>
        </svg>
      )
    },
    {
      title: "Pause & Take Over",
      description: "Want to handle a customer personally? Use the 'Pause Bot' toggle on your dashboard. The bot will stop replying until you turn it back on.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      )
    }
  ];

  return (
    <div className="advices-page-wrapper">
      <div className="advices-container">
        
        <button className="back-btn" onClick={() => navigate('/home')}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Dashboard
        </button>

        <div className="how-to-header">
          <h2>How to use WhatsAgent</h2>
          <p>Everything you need to know to automate your WhatsApp support.</p>
        </div>

        <div className="how-to-section">
          <h3 className="section-title">1. Getting Started</h3>
          <div className="steps-container">
            {setupSteps.map((step) => (
              <div className="step-card" key={step.id}>
                <div className="step-icon-wrapper">
                  {step.icon}
                </div>
                <div className="step-content">
                  <h4>{step.id}. {step.title}</h4>
                  <p>{step.description}</p>
                  {step.alert && (
                    <div className="privacy-alert">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      {step.alert}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="how-to-section">
          <h3 className="section-title">2. Managing Your Agent</h3>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Advices;