import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './AgentDetails.css';

const BACKEND_URL = "https://abdulraheem05-whatsagent-backend.hf.space";

export default function AgentDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [settings, setSettings] = useState(null);
  const [docs, setDocs] = useState([]);
  const [updates, setUpdates] = useState([]); // <-- NEW: Knowledge Updates State
  const [unanswered, setUnanswered] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const [toast, setToast] = useState({ show: false, type: 'success', title: '', message: '' });

  // --- Menu States ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // --- Rename States ---
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState("");

  // --- Delete States ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchAgentData();
  }, [id]);

  // 1. ADD THE FLAG TO THE FUNCTION
  const fetchAgentData = async (isBackgroundRefresh = false) => {
    // Only show the global loading screen if it's NOT a background refresh
    if (!isBackgroundRefresh) setLoading(true);
    
    const { data: bizData } = await supabase.from('businesses').select('*').eq('id', id).single();
    const { data: settingsData } = await supabase.from('bot_settings').select('*').eq('business_id', id).single();
    const { data: docsData } = await supabase.from('documents').select('*').eq('business_id', id);
    const { data: updatesData } = await supabase.from('knowledge_updates').select('*').eq('business_id', id).order('created_at', { ascending: false });
    const { data: msgData } = await supabase.from('unanswered_messages').select('*').eq('business_id', id).order('created_at', { ascending: false });

    setAgent(bizData);
    setSettings(settingsData);
    setDocs(docsData || []);
    setUpdates(updatesData || []);
    setUnanswered(msgData || []);
    
    // Only hide the loader if we actually turned it on
    if (!isBackgroundRefresh) setLoading(false);
  };

  const handleToggleBot = async () => {
    // If settings is null, assume we are turning it ON for the first time
    const newStatus = settings ? !settings.is_active : true; 
    
    // Optimistic UI update for instant feedback
    setSettings({ ...settings, is_active: newStatus, business_id: id }); 

    // UPSERT: This will update the row if it exists, or create it if it's missing!
    const { error } = await supabase
      .from('bot_settings')
      .upsert({ 
        business_id: id, 
        is_active: newStatus,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'business_id' // Uses the unique constraint we just added
      });

    if (error) {
      alert("Failed to update bot status.");
      console.error(error);
      // Revert if failed
      setSettings(settings); 
    }
  };

  const handleRenameSubmit = async () => {
    if (!newName.trim()) return;
    
    const { error } = await supabase
      .from('businesses')
      .update({ name: newName })
      .eq('id', id);

    if (!error) {
      setAgent(prev => ({ ...prev, name: newName }));
      setShowRenameModal(false);
      triggerToast('success', 'Renamed', 'Agent name updated successfully.');
    } else {
      triggerToast('error', 'Error', 'Failed to rename agent.');
    }
  };

  const handleDeleteAgent = async () => {
    // Because of CASCADE, this deletes EVERYTHING related to this bot!
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id);

    if (!error) {
      navigate('/home'); // Send them back to the dashboard instantly
    } else {
      triggerToast('error', 'Error', 'Failed to delete agent.');
    }
  };

  // --- Mark Message as Answered ---
  const handleResolveMessage = async (messageId) => {
    // 1. Optimistically remove it from the UI so it feels instant
    setUnanswered(prev => prev.filter(msg => msg.id !== messageId));

    // 2. Delete the row from the unanswered queue in Supabase
    const { error } = await supabase
      .from('unanswered_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      alert("Failed to mark message as resolved.");
      // Re-fetch to fix UI if the database failed
      await fetchAgentData(true); 
    } else {
      triggerToast('success', 'Resolved', 'Message cleared from queue.');
    }
  };

  const triggerToast = (type, title, message) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleUpdateDocs = async (docUrl) => {
    setIsUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${BACKEND_URL}/knowledge/sync-doc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'X-Agent-Id': id
        },
        body: JSON.stringify({ google_doc_url: docUrl })
      });

      // Safely parse the backend JSON response
      const responseData = await res.json().catch(() => ({}));

      // 1. Check for AI Model Spikes / Rate Limiting (Usually HTTP 429 or 503)
      if (res.status === 429 || res.status === 503 || (responseData.detail && responseData.detail.toLowerCase().includes("quota"))) {
        triggerToast('error', 'High Demand', 'Model is facing high demands. Please try again later.');
        return;
      }

      if (res.ok) {
        // 2. Check for "No Changes Detected"
        // This looks for keywords your backend might send if the hashes match
        const msg = (responseData.message || responseData.status || responseData.detail || "").toLowerCase();
        
        if (msg.includes('no change') || msg.includes('same') || res.status === 304) {
           triggerToast('info', 'Up to Date', 'No changes detected. Document is already current.');
        } else {
           // 3. Complete Success
           triggerToast('success', 'Knowledge Updated', 'Document synced successfully.');
        }
        
        // Refresh the UI to show the new table rows
        await fetchAgentData(true);
      } else {
        // Handle normal errors
        triggerToast('error', 'Update Failed', responseData.detail || 'Could not sync the document.');
      }
    } catch (error) {
      triggerToast('error', 'Connection Error', 'Failed to connect to the server.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="agent-loading-screen">
        <div className="loader-spinner"></div>
        <p>Loading Agent Details...</p>
      </div>
    );
  }

  if (!agent) {
    return <div className="agent-loading-screen"><p>Agent not found.</p></div>;
  }

  return (
    <div className="agent-details-wrapper">
      <div className="agent-details-container">
        
        {/* --- HEADER --- */}
        <header className="agent-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/home')}>
              &larr; Back to Dashboard
            </button>
            <div className="title-row">
              <h1>{agent.name}</h1>
              <span className="badge">{agent.business_type}</span>
            </div>
          </div>
          
          <div className="header-right">
            
            {/* The existing toggle */}
            <div className="status-toggle-wrapper">
              <span className={`status-text ${settings?.is_active !== false ? 'active' : 'inactive'}`}>
                {settings?.is_active !== false ? 'Bot is Active' : 'Bot is Paused'}
              </span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={settings?.is_active !== false} 
                  onChange={handleToggleBot}
                />
                <span className="slider round"></span>
              </label>
            </div>

            {/* THE NEW 3-DOT MENU */}
            <div className="kebab-menu-container">
              <button className="kebab-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                ⋮
              </button>
              
              {isMenuOpen && (
                <>
                  <div className="kebab-overlay" onClick={() => setIsMenuOpen(false)}></div>
                  <div className="kebab-dropdown">
                    <button onClick={() => { setIsMenuOpen(false); setNewName(agent.name); setShowRenameModal(true); }}>
                      Rename Agent
                    </button>
                    <button className="danger-text" onClick={() => { setIsMenuOpen(false); setShowDeleteModal(true); }}>
                      Delete Bot
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        <div className="agent-content-grid">
          
          {/* --- LEFT COLUMN: KNOWLEDGE BASE --- */}
          <div className="details-card kb-card">
            <h2 className="card-title">Knowledge Base</h2>
            
            <div className="docs-master-container">
              {docs.length === 0 ? (
                <p className="empty-state">No documents imported yet.</p>
              ) : (
                docs.map((doc) => (
                  <div key={doc.id} className="doc-hero-section">
                    
                    {/* Google Docs Icon & Info */}
                    {/* Google Docs Icon & Info */}
                    <div className="doc-hero-left">
                      <img className="doc-hero-icon" src="/icons/google-docs.png" alt="Google Docs" />
                      <div className="doc-hero-text">
                        
                        {/* 1. Clickable Title */}
                        <a href={doc.google_doc_url} target="_blank" rel="noopener noreferrer" className="doc-title-link">
                          <h3>{doc.title || "Untitled Document"}</h3>
                        </a>
                        
                        <p className="doc-last-updated">
                          Last updated on {formatDate(doc.last_synced_at || doc.last_imported_at || doc.created_at)}
                        </p>
                        
                        {/* 2. Helper Text below date */}
                        <p className="doc-helper-text">
                          Type your changes into this Google Doc and click <strong>Update</strong> so your bot has the latest information.
                        </p>
                        
                      </div>
                    </div>

                    {/* Google-style Update Button */}
                    <div className="doc-hero-right">
                      <button 
                        className="google-blue-btn" 
                        onClick={() => handleUpdateDocs(doc.google_doc_url)} 
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <><span className="spinner-small"></span> Syncing...</>
                        ) : (
                          "Update"
                        )}
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* Knowledge Updates Table */}
            <div className="updates-table-section">
              <h3 className="section-subtitle">Sync History</h3>
              <div className="updates-list">
                {updates.length === 0 ? (
                  <p className="empty-state-small">No recent updates.</p>
                ) : (
                  updates.map((update) => (
                    <div key={update.id} className="update-row">
                      <div className="update-status-col">
                        <span className={`status-dot ${update.status}`}></span>
                      </div>
                      <div className="update-content-col">
                        <p className="update-msg">{update.update_text || "Document chunk synchronized"}</p>
                        <span className="update-time">{formatDate(update.created_at)}</span>
                      </div>
                      <div className="update-badge-col">
                        <span className={`status-badge ${update.status}`}>{update.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: UNANSWERED MESSAGES --- */}
          {/* --- RIGHT COLUMN: UNANSWERED MESSAGES --- */}
          <div className="details-card">
            <div className="card-header">
              <h2>Unanswered Messages</h2>
              <span className="msg-count">{unanswered?.length || 0}</span>
            </div>
            
            <div className="messages-table-container">
              {(!unanswered || unanswered.length === 0) ? (
                <p className="empty-state">All caught up! No pending messages.</p>
              ) : (
                <table className="messages-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Message</th>
                      <th className="action-col">Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unanswered.map((msg) => (
                      <tr key={msg.id} className="message-row">
                        
                        {/* Column 1: Clean Phone Number & Date */}
                        <td className="msg-phone-cell">
                          {msg.customer_phone ? msg.customer_phone.split('@')[0] : "Unknown Number"}
                          <div className="msg-time-subtext">{formatDate(msg.created_at)}</div>
                        </td>
                        
                        {/* Column 2: Message Text */}
                        <td className="msg-text-cell">
                          {msg.message_text || msg.query}
                        </td>
                        
                        {/* Column 3: The Checkmark Button */}
                        <td className="msg-action-cell">
                          <button 
                            className="resolve-btn" 
                            onClick={() => handleResolveMessage(msg.id)}
                            title="Mark as answered"
                          >
                            ✓
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
      
      <div className={`dynamic-toast ${toast.show ? 'show' : ''} ${toast.type}`}>
        <div className="toast-icon">
          {toast.type === 'success' ? '✓' : toast.type === 'info' ? 'i' : '!'}
        </div>
        <div className="toast-text">
          <h4>{toast.title}</h4>
          <p>{toast.message}</p>
        </div>
      </div>

      {/* RENAME MODAL */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Rename Agent</h3>
            <input 
              type="text" 
              className="rename-input" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              autoFocus
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowRenameModal(false)}>Cancel</button>
              <button className="google-blue-btn" onClick={handleRenameSubmit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Agent?</h3>
            <p>Are you sure you want to delete <strong>{agent.name}</strong>? This will permanently wipe all documents, chat history, and disconnect the WhatsApp number.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="danger-btn" onClick={handleDeleteAgent}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>

    
  );
}