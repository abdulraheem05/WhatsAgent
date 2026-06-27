import React from 'react';
import { useNavigate } from 'react-router-dom'; // MISSING IMPORT
import './Advices.css';

const Advices = () => {
  const navigate = useNavigate(); // ADDED HOOK

  const adviceList = [
    { title: "Public Document URLs", description: "Any documentation link imported into the system must be set to public access ('Anyone with the link can view'). Restricted or private cloud document links will fail during ingestion." },
    { title: "Use Standard WhatsApp Accounts", description: "When linking WhatsApp, always prefer a standard personal account over a WhatsApp Business account. The Evolution API demonstrates significantly higher connection stability with standard accounts." },
    { title: "Account Warm-Up Period", description: "Do not connect a freshly created WhatsApp number. To prevent automated spam triggers and carrier bans, ensure the account has been actively used for at least 2 weeks prior to linking." }
  ];

  return (
    <div className="advices-page-wrapper">
      {/* Container aligned with the card */}
      <div className="advices-container">
        
        <button className="back-btn" onClick={() => navigate('/home')}>
          ← Back to Dashboard
        </button>

        <div className="advices-card">
          <div className="advices-header">
            <h2>Setup Guidelines & Best Practices</h2>
            <p>Review these critical recommendations before deploying your agent.</p>
          </div>

          <div className="advices-grid">
            {adviceList.map((item, index) => (
              <div className="advice-item" key={index}>
                <div className="advice-badge">{index + 1}</div>
                <div className="advice-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Advices;