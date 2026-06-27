import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WhyWhatsAgent.css';

export default function WhyWhatsAgent() {
  const navigate = useNavigate();

  return (
    <div className="why-page-wrapper">
        <div className="back-btn-container">
            <button className="back-btn" onClick={() => navigate('/home')}>
            ← Back to Dashboard
            </button>
        </div>

      <main className="why-content">
        
        {/* Page Hero */}
        <section className="why-hero">
          <div className="badge">The Architecture</div>
          <h1>Agent That Never Sleeps,<br/>So Your Clients Don't Wait.</h1>
          <p>
            Customer support shouldn't mean drowning in unread messages. 
            Discover how WhatsAgent transforms your WhatsApp from a chaotic inbox into an automated, dynamic support engine.
          </p>
        </section>

        {/* Feature 1: The Problem & Speed */}
        <section className="feature-block reverse">
          <div className="feature-text">
            <h2>Instant Replies. Zero Burnout.</h2>
            <p>
              It is impossible for human teams to keep up with hundreds of customer queries, leading to slow response times and lost sales. 
            </p>
            <ul className="feature-list">
              <li><strong>Sub-10 Second Responses:</strong> Our AI processes and replies to inquiries instantly, 24/7.</li>
              <li><strong>Natural Pacing:</strong> Built-in "humanized typing" algorithms prevent Meta spam flags.</li>
            </ul>
          </div>
          <div className="feature-visual speed-visual">
            <div className="mock-chat-bubble customer">Hello</div>
            <div className="mock-chat-bubble ai">Hello! How can I help you today?</div>
            <div className="mock-chat-bubble customer">Do you all have Grade 11 Maths classes?</div>
            <div className="mock-chat-bubble ai fast">Yes we do! <br/>Sir Albert teaches on Sundays from 9AM to 11AM</div>
          </div>
        </section>

        {/* Feature 2: Dynamic Knowledge Base */}
        <section className="feature-block">
          <div className="feature-text">
            <h2>Dynamic Docs, Not Static PDFs.</h2>
            <p>
              Business knowledge changes daily. Prices update, inventory shifts, and policies evolve. Traditional bots rely on static PDF uploads that become outdated the moment you upload them.
            </p>
            <ul className="feature-list">
              <li><strong>Live Google Docs Sync:</strong> Update your Google Doc, and the agent learns it instantly.</li>
              <li><strong>No Re-training Required:</strong> Drop a new link in your dashboard, and the AI adapts its answers on the fly.</li>
            </ul>
          </div>
          <div className="feature-visual docs-visual">
            <div className="sync-graphic">
              <div className="doc-icon">📄</div>
              <div className="sync-arrows">⟷</div>
              <div className="brain-icon">🧠</div>
            </div>
          </div>
        </section>

        {/* Feature 3: Human Fallback & Dashboard */}
        <section className="feature-block reverse">
          <div className="feature-text">
            <h2>AI handles the noise. You handle the exceptions.</h2>
            <p>
              No AI is perfect, and sometimes a customer needs a human touch. WhatsAgent doesn't trap your customers in endless loops.
            </p>
            <ul className="feature-list">
              <li><strong>Intelligent Hand-off:</strong> If the AI doesn't know the answer, it politely pauses the conversation.</li>
              <li><strong>Unanswered Queue:</strong> Every unhandled message is marked and isolated in your dashboard, so your human team knows exactly where to step in.</li>
            </ul>
          </div>
          <div className="feature-visual dashboard-visual">
            <div className="mock-dashboard">
              <div className="mock-dash-header">Unanswered Queries (2)</div>
              <div className="mock-dash-row warning">"I have a specific complaint..."</div>
              <div className="mock-dash-row warning">"Can I get a bulk discount?"</div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="why-cta">
          <h2>Ready to upgrade your WhatsApp?</h2>
          <button className="cta-btn" onClick={() => navigate('/home')}>Get Started Now</button>
        </section>

      </main>
    </div>
  );
}