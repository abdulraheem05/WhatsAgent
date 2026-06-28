import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './HomeDashboard.css';

const BACKEND_URL = "https://abdulraheem05-whatsagent-backend.hf.space";

// --- Icons ---
const DocsIcon = () => (
  <img className="custom-app-icon" src="/icons/google-docs.png" alt="Google Docs" />
);

const WhatsAppIcon = () => (
  <img className="custom-app-icon" src="/icons/whatsapp.png" alt="WhatsApp" />
);

const TickIcon = () => (
  <svg className="icon tick-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default function HomeDashboard({ user }) {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);

  // Add this right below: const [activeBusinessId, setActiveBusinessId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const agentsGridRef = useRef(null);
  
  // --- UI States ---
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [typeFocused, setTypeFocused] = useState(false);

  const [feedbackData, setFeedbackData] = useState({ name: '', message: '' });
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // --- Creation States ---
  const [activeBusinessId, setActiveBusinessId] = useState(null); // <-- 1. ADDED STATE
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [showCancelQrConfirm, setShowCancelQrConfirm] = useState(false);
  const [isCancellingQr, setIsCancellingQr] = useState(false);

  const businessTypes = [
    "Education", "Entertainment", "Clothing", "Beauty Parlour", "Food & Beverage", "Tech & Software", "Other"
  ];

  // --- Docs Modal States ---
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [docsInput, setDocsInput] = useState("");
  const [isDocsInputFocused, setIsDocsInputFocused] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [extractedTitle, setExtractedTitle] = useState(null);
  const [docAccess, setDocAccess] = useState(null); 
  const [isImporting, setIsImporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isStartingTest, setIsStartingTest] = useState(false);
  const TEST_BOT_NUMBER = "076-438-1423";

  // --- WhatsApp Modal States ---
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState(null);
  const [showWaDisconnectConfirm, setShowWaDisconnectConfirm] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isPollingStatus, setIsPollingStatus] = useState(false);

  const [qrExpired, setQrExpired] = useState(false);
  const pollingIntervalRef = useRef(null);
  const qrTimeoutRef = useRef(null);

  // --- Fetch Initial Data ---
  useEffect(() => {
    if (user) {
      fetchBusinesses(user.id);
    }
  }, [user]);

  const fetchBusinesses = async (userId) => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setBusinesses(data);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackData.name || !feedbackData.message) {
      alert("Please fill in both your name and message.");
      return;
    }

    setIsSubmittingFeedback(true);

    try {
      const { error } = await supabase.from('feedback').insert([{ 
        name: feedbackData.name, 
        message: feedbackData.message 
      }]);

      if (error) throw error;

      // Show success toast and clear form
      setShowFeedbackToast(true);
      setFeedbackData({ name: '', message: '' });
      
      // Hide toast after 4 seconds
      setTimeout(() => setShowFeedbackToast(false), 4000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to send feedback. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // --- 2. CREATE DRAFT ON OPEN ---
  const handleOpenSetup = async () => {
    setIsSetupOpen(true);
    
    // Instantly create a "Draft" row in the database to get an ID
    const { data, error } = await supabase
      .from('businesses')
      .insert([{ user_id: user.id, name: "Draft Agent", business_type: "Draft" }])
      .select('id')
      .single();

    if (data) {
      setActiveBusinessId(data.id);
    } else {
      console.error("Failed to create draft row:", error);
    }
  };

  // --- Safe Panel Close Logic ---
  const handleAttemptClosePanel = () => {
    if (businessName || businessType || step1Done || step2Done || docsInput) {
      setShowCloseConfirm(true);
    } else {
      handleClosePanelAndClear();
    }
  };

  // Separated UI reset so we can call it after successful activation
  // without deleting the database row!
  const resetSetupUI = () => {
    setIsSetupOpen(false);
    setShowCloseConfirm(false);
    setActiveBusinessId(null);
    setBusinessName("");
    setBusinessType("");
    setStep1Done(false);
    setStep2Done(false);
    setDocsInput("");
    setExtractedTitle(null);
    setDocAccess(null);
    
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
  };

  // --- 5. DELETE DRAFT ON CANCEL ---
  const handleClosePanelAndClear = async () => {
    if (activeBusinessId) {
      // Wipe the draft from Supabase if they abort setup
      await supabase.from('businesses').delete().eq('id', activeBusinessId);
    }
    resetSetupUI();
  };


  // --- Global Timer Cleanup ---
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
    };
  }, []);

  // --- Docs API Logic ---
  useEffect(() => {
    const checkDocUrl = async () => {
      if (docsInput.includes("docs.google.com/document/d/")) {
        setDocAccess('checking');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(`${BACKEND_URL}/knowledge/check-doc`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ google_doc_url: docsInput })
          });
          const data = await res.json();
          if (data.is_public) {
            setExtractedTitle(data.title);
            setDocAccess('public');
          } else {
            setDocAccess('private');
          }
        } catch (error) {
          setDocAccess('private');
        }
      } else {
        setDocAccess(null);
        setExtractedTitle(null);
      }
    };
    const timeoutId = setTimeout(checkDocUrl, 800);
    return () => clearTimeout(timeoutId);
  }, [docsInput]);

  const handleImport = async () => {
    if (docsInput.trim() === "" || docAccess !== 'public') return;
    setIsImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${BACKEND_URL}/knowledge/import-doc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Agent-Id': activeBusinessId // <-- 3. UPDATED
        },
        body: JSON.stringify({ google_doc_url: docsInput, title: extractedTitle || "Untitled Document" })
      });
      if (res.ok) {
        setStep1Done(true);
        setShowError(false);
        setIsDocsModalOpen(false);
      } else {
        const errorData = await res.json();
        console.error("Backend Error during Import:", errorData);
        alert(`Failed to import document.\nReason: ${errorData.detail || 'Unknown server error'}`);
      }
    } catch (error) {
      alert("Error connecting to server.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteDoc = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${BACKEND_URL}/knowledge/delete-doc`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      setStep1Done(false);
      setDocsInput("");
      setExtractedTitle(null);
      setDocAccess(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      alert("Failed to delete document.");
    }
  };

  // --- WhatsApp API Logic ---
  const handleGenerateQR = async () => {
    setIsGeneratingQr(true);
    setQrExpired(false); 

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${BACKEND_URL}/whatsapp/instance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Agent-Id': activeBusinessId // <-- 3. UPDATED
        }
      });

      if (res.ok) {
        const data = await res.json();
        setQrCodeData(data.qr_code);
        setIsGeneratingQr(false);
        setIsPollingStatus(true);
        startStatusPolling();

        if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
        qrTimeoutRef.current = setTimeout(() => {
          setQrExpired(true);
          setIsPollingStatus(false);
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        }, 40000);

      } else {
        alert("Failed to generate QR Code.");
        setIsGeneratingQr(false);
      }
    } catch (error) {
      alert("Error connecting to backend.");
      setIsGeneratingQr(false);
    }
  };

  const startStatusPolling = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/whatsapp/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'X-Agent-Id': activeBusinessId
          }
        });

        // 1. Handle the "Duplicate Number" Error (400)
        if (res.status === 400) {
          const errorData = await res.json();
          clearInterval(pollingIntervalRef.current);
          if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
          
          setIsPollingStatus(false);
          // Show the error message sent from your backend
          alert(errorData.detail || "This WhatsApp number is already in use by another agent.");
          return; // Stop the function
        }

        // 2. Handle Success (200)
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'connected') {
            clearInterval(pollingIntervalRef.current); 
            if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current); 
            
            setIsPollingStatus(false);
            setWaPhoneNumber("Linked Device Active");
            setStep2Done(true);
            setIsWaModalOpen(false);
            setShowError(false);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);
  };

  const handleStartTest = async () => {
    setIsStartingTest(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${BACKEND_URL}/knowledge/start-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Shows: "Someone else is testing... return back after X minutes"
        alert(data.detail); 
      } else {
        alert("Test started! You have exclusive access for 10 minutes.");
        setIsTestModalOpen(false); 
      }
    } catch (error) {
      alert("Failed to start test.");
    } finally {
      setIsStartingTest(false);
    }
  };

  const closeWaModal = () => {
    if (isGeneratingQr) return; // Prevent closing while the API is initially fetching

    // If there is an active QR code that hasn't expired yet, ask for confirmation
    if (qrCodeData && !qrExpired) {
      setShowCancelQrConfirm(true);
    } else {
      // Safely close if no active QR
      setIsWaModalOpen(false);
      setQrCodeData(null);
      setQrExpired(false);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
    }
  };

  const handleCancelQr = async () => {
    setIsCancellingQr(true);
    
    // 1. Stop polling immediately
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (qrTimeoutRef.current) clearTimeout(qrTimeoutRef.current);
    setIsPollingStatus(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 2. Call your existing disconnect endpoint to completely NUKE the pending instance
      await fetch(`${BACKEND_URL}/whatsapp/disconnect`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
    } catch (error) {
      console.error("Failed to kill QR instance", error);
    } finally {
      // 3. Reset everything so the "Generate QR" button comes back fresh
      setIsCancellingQr(false);
      setQrCodeData(null);
      setQrExpired(false);
      setShowCancelQrConfirm(false);
      // We keep the main WA modal open so they see the "Generate" button again, 
      // but you can optionally call setIsWaModalOpen(false) here to close it entirely.
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${BACKEND_URL}/whatsapp/disconnect`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        setStep2Done(false);
        setWaPhoneNumber(null);
        setQrCodeData(null);
        setShowWaDisconnectConfirm(false);
      } else {
        alert("Failed to disconnect WhatsApp.");
      }
    } catch (error) {
      alert("Error connecting to server.");
    }
  };

  // --- Final Activation ---
  const handleActivate = async () => {
    // 1. TEST MODE: Removed the strict checks
    if (!businessName || !businessType) {
      setShowError(true);
      return;
    }
    
    // Turn on the Google-style progress bar
    setIsCreating(true);

    // 2. UX UPGRADE: Add a 1.5-second artificial delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // UPDATE the existing draft row with the real name
    const { error: bizError } = await supabase
      .from('businesses')
      .update({ name: businessName, business_type: businessType })
      .eq('id', activeBusinessId);

    // INSERT the default bot settings
    const { error: settingsError } = await supabase
      .from('bot_settings')
      .insert([{ 
        business_id: activeBusinessId, 
        is_active: true
      }]);

    setIsCreating(false);

    // ONLY CHECK BIZ ERROR FOR NOW
    if (bizError) {
      alert("Failed to finalize business setup.");
      console.error(bizError);
    } else {
      // 1. Close panel safely
      resetSetupUI();
      
      // 2. Fetch fresh data so the new bot appears (using await!)
      await fetchBusinesses(user.id); 
      
      // 3. Show the Success Toast for 4 seconds
      setShowToast(true);
      setTimeout(() => setShowToast(false), 6000);
      
      // 4. Smooth scroll down to the agents grid!
      setTimeout(() => {
        agentsGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  return (
    <div className="dashboard-wrapper">

      {/* --- GOOGLE LOADING BAR --- */}
      {isCreating && (
        <div className="global-progress-bar">
          <div className="progress-indicator"></div>
        </div>
      )}
      
      {/* ---------- CONTENT ---------- */}
      <main className={`dashboard-content ${isSetupOpen ? 'dimmed' : ''}`}>
        
        {/* --- HERO SECTION --- */}
        <div className="dashboard-hero">
          <div className="hero-text-container">
            <div className="floating-icon float-docs">
              <DocsIcon />
            </div>
            <div className="floating-icon float-wa">
              <WhatsAppIcon />
            </div>

            <h1>Automate your WhatsApp customer support.</h1>
            <p>
              Draft your business knowledge in a Google Doc, link your WhatsApp account, and let WhatsAgent handle every inquiry instantly.
            </p>

            {/* --- NEW: Why WhatsAgent & Contact Us --- */}
            <div className="hero-extra-links">
              <Link to="/why-whatsagent" style={{ textDecoration: 'none' }}>
                <button className="why-whatsagent-btn">
                  Why WhatsAgent?
                </button>
              </Link>
              
              <a 
                href="https://mail.google.com/mail/?view=cm&fs=1&to=abdlraheem26@gmail.com&su=Inquiry%20regarding%20WhatsAgent" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hero-contact-link"
              >
                Contact Us
              </a>
            </div>
            {/* --------------------------------------- */}

          </div>

          <div className="hero-action-container">
            <div className="vertical-create-card" onClick={handleOpenSetup}>
              <div className="create-circle">+</div>
              <h3>Create Agent</h3>
              <p>Deploy a new assistant</p>
            </div>
          </div>
        </div>

        {/* --- ACTIVE AGENTS GRID --- */}

        <div ref={agentsGridRef} style={{ paddingTop: '24px' }}></div>

        {businesses.length > 0 && (
          <div className="active-agents-section">
            <h2 className="section-title">Your Agents</h2>
            <div className="agent-grid">
              {businesses.map((biz) => (
                <div key={biz.id} className="agent-card active-card" onClick={() => navigate(`/agent/${biz.id}`)}>
                  <div>
                    <div className="card-badge">{biz.business_type}</div>
                    <h3>{biz.name}</h3>
                    
                  </div>
                  <div className="status-pill">
                    <span className="pulse-dot"></span> Active
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- SLIDE-IN SETUP PANEL --- */}
      {isSetupOpen && (
        <aside className="setup-side-panel">
          <div className="panel-border-glow"></div> 
          
          <div className="panel-inner-content">
            <header className="panel-header">
              <h2>Setup</h2>
              <div className="header-actions">
                <button className="help-btn">Need help?</button>
                <button className="close-panel-btn" onClick={handleAttemptClosePanel}>×</button>
              </div>
            </header>

            <div className="panel-body">
              <div className={`floating-input-wrapper ${nameFocused || businessName ? 'active' : ''}`}>
                <label className="floating-label">Enter business name</label>
                <input 
                  type="text" 
                  className="floating-input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  placeholder={nameFocused ? "e.g. WhatsAgent" : ""}
                />
              </div>

              <div className={`floating-input-wrapper ${typeFocused || businessType ? 'active' : ''}`}>
                <label className="floating-label">Business type</label>
                <select 
                  className="floating-input"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  onFocus={() => setTypeFocused(true)}
                  onBlur={() => setTypeFocused(false)}
                >
                  <option value="" disabled></option>
                  {businessTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Timeline Flow */}
              <div className="setup-timeline">
                <div className="step-wrapper">
                  <span className="step-pill">STEP 01</span>
                  <div className="relative-wrapper">
                    {step1Done && (
                      <button className="remove-doc-cross" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}>×</button>
                    )}
                    <button 
                      className={`step-btn docs-btn ${step1Done ? 'completed' : ''}`}
                      onClick={() => !step1Done && setIsDocsModalOpen(true)}
                    >
                      <div className="icon-slot">
                        {step1Done ? <TickIcon /> : <DocsIcon />}
                      </div>
                      <span>{step1Done ? "Google Docs Imported" : "Import Google Docs URL"}</span>
                    </button>
                  </div>
                </div>

                <div className="dotted-line"></div>

                <div className="step-wrapper">
                  <span className="step-pill">STEP 02</span>
                  <div className="relative-wrapper">
                    {step2Done && (
                      <button className="remove-doc-cross" onClick={(e) => { e.stopPropagation(); setShowWaDisconnectConfirm(true); }}>×</button>
                    )}
                    <button 
                      className={`step-btn wa-btn ${step2Done ? 'completed' : ''}`}
                      onClick={() => !step2Done && setIsWaModalOpen(true)}
                    >
                      <div className="icon-slot">
                        {step2Done ? <TickIcon /> : <WhatsAppIcon />}
                      </div>
                      <span>{step2Done ? "Connected" : "Connect your WhatsApp account"}</span>
                    </button>
                  </div>
                </div>

                <div className="dotted-line"></div>

                <div className="activate-wrapper">
                  <button className="activate-btn" onClick={handleActivate} disabled={isCreating}>
                    {isCreating ? "Creating..." : "Activate Agent"}
                  </button>
                  {showError && (
                    <p className="error-message">Please fill all details and complete Step 1 & 2.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* --- ALL OVERLAY MODALS --- */}
      {/* 1. Docs Import Modal */}
      {isDocsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDocsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Import Docs</h2>
              <button className="close-btn" onClick={() => setIsDocsModalOpen(false)}>×</button>
            </header>
            <div className="modal-body">
              {/* ... inside your <div className="modal-body"> ... */}
              <div className="import-action-row">
                <div className="input-column">
                  <div className={`floating-input-wrapper ${isDocsInputFocused || docsInput ? 'active' : ''} ${urlError || docAccess === 'private' ? 'error' : ''}`}>
                    <label className="floating-label">Enter Google Docs URL</label>
                    <input 
                      type="text" 
                      className="floating-input"
                      value={docsInput}
                      onChange={(e) => { setDocsInput(e.target.value); setUrlError(false); }}
                      onFocus={() => setIsDocsInputFocused(true)}
                      onBlur={() => setIsDocsInputFocused(false)}
                      placeholder={isDocsInputFocused ? "e.g. https://docs.google.com/..." : ""}
                    />
                  </div>

                  {/* 1. EXTRACTED TITLE: Appears only when ready */}
                  {extractedTitle && docAccess === 'public' && (
                    <div className="extracted-metadata">
                      <p>Title: <span className="success-text">{extractedTitle}</span></p>
                    </div>
                  )}

                  {/* 2. GLOSSY NOTE: Always appears, pushed down by the title div above */}
                  <div className="glossy-info-note">
                    <svg className="info-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>Make sure the document access is set to <strong>"Anyone with the link"</strong>.</span>
                  </div>

                  {/* Error messages remain below everything */}
                  {urlError && <span className="input-error-text">Not a valid Google Docs URL</span>}
                  {docAccess === 'private' && <span className="input-status-text error">This document is private or invalid.</span>}
                </div>

                <button className={`import-submit-btn ${docAccess === 'public' ? 'ready' : ''}`} onClick={handleImport} disabled={docAccess !== 'public' || isImporting}>
                  {isImporting ? <span className="loader-spinner"></span> : "Import"}
                </button>
              </div>
            </div>
            <footer className="modal-footer">
              <a href="https://docs.google.com/document/create" target="_blank" rel="noopener noreferrer" className="create-docs-link">Create New Docs</a>
            </footer>
          </div>
        </div>
      )}

      {/* 2. WhatsApp Connection Modal */}
      {isWaModalOpen && (
        <div className="modal-overlay" onClick={closeWaModal}>
          <div className="modal-content wa-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>Connect WhatsApp</h2>
              <button className="close-btn" onClick={closeWaModal}>×</button>
            </header>
            <div className="modal-body">
              
              <div className="link-device-section">
                <h3>Link Your WhatsApp Account</h3>
                <p>Connect your phone via WhatsApp Web (Linked Devices) to deploy the agent.</p>
                
                <div className="glossy-success-note">
                  <svg className="success-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  <span><strong>Recommendation:</strong> Use a normal WhatsApp account. Avoid using newly created accounts to prevent account restrictions.</span>
                </div>

                {!qrCodeData ? (
                  <button className="generate-qr-btn" onClick={handleGenerateQR} disabled={isGeneratingQr}>
                    {isGeneratingQr ? "Generating QR..." : "Generate Connection QR"}
                  </button>
                ) : (
                  <div className="qr-display-panel">
                    <div className="qr-image-container">
                      <img 
                        src={qrCodeData} 
                        alt="WhatsApp QR Code" 
                        className={`qr-image ${qrExpired ? 'expired' : ''}`} 
                      />
                      {qrExpired && (
                        <div className="qr-expired-overlay">
                          <div className="expired-circle">↻</div>
                          <p>QR Code Expired</p>
                          <button className="refresh-qr-btn" onClick={handleGenerateQR}>Refresh Code</button>
                        </div>
                      )}
                    </div>
                    <div className="qr-instructions">
                      <ol>
                        <li>Open WhatsApp on your phone</li>
                        <li>Tap <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong></li>
                        <li>Point your phone at this screen to capture the code</li>
                      </ol>
                      {isPollingStatus && !qrExpired && <p className="polling-status">Waiting for scan...</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Confirm Delete Docs */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <h3>Remove Knowledge Base?</h3>
            <p>Do you want to remove the existing docs? This clears the agent's memory.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="danger-btn" onClick={handleDeleteDoc}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Confirm Disconnect WA */}
      {showWaDisconnectConfirm && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <h3>Disconnect WhatsApp?</h3>
            <p>Do you want to unlink your WhatsApp account?</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowWaDisconnectConfirm(false)}>Cancel</button>
              <button className="danger-btn" onClick={handleDisconnectWhatsApp}>Yes, Disconnect</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Confirm Close Panel */}
      {showCloseConfirm && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <h3>Cancel Setup?</h3>
            <p>Are you sure you want to close? All entered details and progress will be permanently cleared.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowCloseConfirm(false)}>
                Continue Setup
              </button>
              <button className="danger-btn" onClick={handleClosePanelAndClear}>
                Yes, Clear & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Confirm Cancel Active QR Code */}
      {showCancelQrConfirm && (
        <div className="modal-overlay">
          <div className="modal-content confirm-modal">
            <h3>Cancel Connection?</h3>
            <p>Are you sure you want to cancel? This will invalidate the current QR code and reset the connection process.</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowCancelQrConfirm(false)} 
                disabled={isCancellingQr}
              >
                No, Keep It
              </button>
              <button 
                className="danger-btn" 
                onClick={handleCancelQr} 
                disabled={isCancellingQr}
              >
                {isCancellingQr ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isTestModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTestModalOpen(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Test Your Agent</h3>
            <p style={{ marginBottom: "1rem" }}>
              Message <strong>{TEST_BOT_NUMBER}</strong> in WhatsApp and ask questions related to the business knowledge you just imported.
            </p>
            <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>
              <em>Note: You will have exclusive access for 10 minutes to test the bot. If someone else is testing, you will be asked to wait.</em>
            </p>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setIsTestModalOpen(false)}
                disabled={isStartingTest}
              >
                Cancel
              </button>
              <button 
                className="activate-btn" // Reusing your blue button style
                onClick={handleStartTest}
                disabled={isStartingTest}
                style={{ width: "auto", padding: "10px 20px" }}
              >
                {isStartingTest ? "Starting..." : "Start Test"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FEEDBACK FOOTER --- */}
      <footer id="feedback-section" className="feedback-footer-section">
        <div className="feedback-card">
          <div className="feedback-header">
            <h3>Share your Feedback</h3>
            <p>Help us improve your experience with WhatsAgent.</p>
          </div>
          
          <div className="feedback-form">
            <input 
              type="text" 
              placeholder="Your Name" 
              className="feedback-input"
              value={feedbackData.name}
              onChange={(e) => setFeedbackData({ ...feedbackData, name: e.target.value })}
            />
            <textarea 
              placeholder="Your Message..." 
              className="feedback-textarea"
              rows="4"
              value={feedbackData.message}
              onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
            ></textarea>
            
            <button 
              className="feedback-submit-btn" 
              onClick={handleSubmitFeedback}
              disabled={isSubmittingFeedback}
            >
              {isSubmittingFeedback ? "Sending..." : "Send Feedback"}
            </button>
          </div>
        </div>
      </footer>

      {/* --- FEEDBACK SUCCESS TOAST --- */}
      <div className={`success-toast feedback-toast ${showFeedbackToast ? 'show' : ''}`}>
        <div className="toast-icon">✓</div>
        <div className="toast-text">
          <h4>Feedback Sent!</h4>
          <p>Thank you for your valuable feedback.</p>
        </div>
      </div>

      {/* --- SUCCESS TOAST NOTIFICATION --- */}
      <div className={`success-toast ${showToast ? 'show' : ''}`}>
        <div className="toast-icon">✓</div>
        <div className="toast-text">
          <h4>Agent Created!</h4>
          <p>Your bot is online.<br/>Please wait ~5 mins for the AI to fully configure before testing.</p>
        </div>
      </div>

    </div>
  );
}