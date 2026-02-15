import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-medline-ai-page',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./medline-ai-page.component.scss'],
  template: `
    <div class="medline-page">

      <!-- NAV -->
      <header style="background: #0F172A; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <nav class="med-nav">
          <a href="/" class="nav-brand">
            <span class="brand-logo">🩺</span>
            <span class="brand-name">TruWit <span>MedLine AI</span></span>
          </a>
          <div class="nav-cta">
            <a href="mailto:assistant&#64;truwit.ai" class="btn-med-secondary">Book a Demo</a>
            <a href="tel:+16179044251" class="btn-med-phone">📞 Try It Live</a>
          </div>
        </nav>
      </header>

      <!-- HERO -->
      <section class="hero-section">
        <div class="med-container">
          <div class="hero-inner">
            <div class="hero-content">
              <div class="hero-badge">🔴 Live & Taking Calls Now</div>
              <h1 class="hero-title">
                AI-Powered Front Office<br>
                <span class="highlight">for GI Practices</span>
              </h1>
              <p class="hero-subtitle">
                A conversational AI voice agent that answers every call to your GI practice — 
                scheduling appointments, handling prep questions, processing refills, and routing 
                urgent cases. Live conversations, not voicemail.
              </p>
              <div class="hero-actions">
                <a href="tel:+16179044251" class="btn-med-phone">📞 Call Now to Try</a>
                <a href="mailto:assistant&#64;truwit.ai" class="btn-med-primary">Book a Demo</a>
              </div>
              <div class="hero-proof">
                <div class="proof-item"><span class="check">✓</span> Live with real practices</div>
                <div class="proof-item"><span class="check">✓</span> 24/7 availability</div>
                <div class="proof-item"><span class="check">✓</span> &lt;2s response time</div>
              </div>
            </div>
            <div class="hero-visual">
              <div class="hero-phone-mockup">
                <div class="mockup-header">
                  <div class="mockup-icon">🤖</div>
                  <div class="mockup-title">MedLine AI</div>
                  <div class="mockup-sub">Live call in progress...</div>
                </div>
                <div class="mockup-conversation">
                  <div class="msg ai">Hi, thank you for calling Dr. Patel's GI office. How can I help you today?</div>
                  <div class="msg patient">I need to schedule a colonoscopy follow-up.</div>
                  <div class="msg ai">I'd be happy to help with that. I see you were last seen on January 15th. Dr. Patel has availability next Tuesday at 10am or Thursday at 2pm. Which works better?</div>
                  <div class="msg patient">Thursday at 2 works great.</div>
                  <div class="msg ai">Perfect, you're confirmed for Thursday at 2pm. I'll send prep instructions to your phone. Is there anything else?</div>
                </div>
                <div class="mockup-status">
                  <div class="pulse"></div>
                  Live — Telnyx Ultra-Low Latency
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PROBLEM -->
      <section class="problem-section">
        <div class="med-container fade-in">
          <div class="problem-header">
            <span class="section-label">The Problem</span>
            <h2 class="section-title">Your front desk is overwhelmed. Patients are on hold. Calls go to voicemail.</h2>
            <p class="section-subtitle" style="margin: 1rem auto 0;">GI practices handle hundreds of calls daily. Most solutions make it worse.</p>
          </div>
          <div class="problem-grid">
            <div class="problem-card">
              <div class="problem-icon">📞</div>
              <h3><span class="strikethrough">Phone Trees</span></h3>
              <p>"Press 1 for scheduling, press 2 for..." — patients hang up. DTMF menus frustrate everyone and solve nothing.</p>
            </div>
            <div class="problem-card">
              <div class="problem-icon">🤖</div>
              <h3><span class="strikethrough">Bad Chatbots</span></h3>
              <p>Text-based chatbots can't handle phone calls. Your patients want to talk, not type on a tiny form.</p>
            </div>
            <div class="problem-card">
              <div class="problem-icon">📱</div>
              <h3><span class="strikethrough">Voicemail & Callbacks</span></h3>
              <p>Transcription services just create more work — someone still has to listen, triage, and call back.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- EHR INTEGRATION -->
      <section class="ehr-section">
        <div class="med-container fade-in">
          <div class="ehr-inner">
            <div>
              <span class="section-label">EHR Integration</span>
              <h2 class="section-title">Plug in your EHR.<br>Go live in days, not months.</h2>
              <p class="section-subtitle">
                MedLine AI connects directly to your practice management system. We read your schedule, 
                understand your providers, and handle calls with real context.
              </p>
              <div class="ehr-logos">
                <div class="ehr-logo-card active">
                  Practice Fusion
                  <span class="ehr-status">✓ Live Now</span>
                </div>
                <div class="ehr-logo-card">
                  Epic
                  <span class="ehr-status">Coming Q2</span>
                </div>
                <div class="ehr-logo-card">
                  Cerner
                  <span class="ehr-status">Coming Q3</span>
                </div>
                <div class="ehr-logo-card">
                  Athena
                  <span class="ehr-status">Coming Q3</span>
                </div>
              </div>
            </div>
            <div class="ehr-visual">
              <div class="ehr-flow">
                <div class="flow-step">
                  <div class="flow-num">1</div>
                  <div class="flow-text"><strong>Connect your EHR</strong> — secure API integration with your existing system</div>
                </div>
                <div class="flow-step">
                  <div class="flow-num">2</div>
                  <div class="flow-text"><strong>Configure your practice</strong> — providers, hours, procedures, prep protocols</div>
                </div>
                <div class="flow-step">
                  <div class="flow-num">3</div>
                  <div class="flow-text"><strong>Forward your calls</strong> — patients call your same number, AI answers</div>
                </div>
                <div class="flow-step">
                  <div class="flow-num">4</div>
                  <div class="flow-text"><strong>Staff focuses on patients</strong> — not phone queues</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURE 1: CALL HANDLING -->
      <section class="feature-section" style="background: #F1F5F9;">
        <div class="med-container fade-in">
          <div class="feature-inner">
            <div>
              <span class="section-label">Live Call Handling</span>
              <h2 class="section-title">Every call answered.<br>Every time.</h2>
              <p class="section-subtitle">
                MedLine AI picks up every call with a natural voice conversation — not a phone tree, 
                not a recording. Patients talk naturally and get things done.
              </p>
              <ul class="feature-list">
                <li><span class="li-icon">✓</span> Natural language — patients speak normally, no menus</li>
                <li><span class="li-icon">✓</span> Handles 1,000+ calls per day simultaneously</li>
                <li><span class="li-icon">✓</span> Sub-2-second response time via Telnyx</li>
                <li><span class="li-icon">✓</span> After-hours coverage included — 24/7/365</li>
                <li><span class="li-icon">✓</span> Warm transfer to staff for complex cases</li>
              </ul>
            </div>
            <div class="feature-visual">
              <div class="visual-metric-grid">
                <div class="visual-metric">
                  <div class="metric-num">1,000+</div>
                  <div class="metric-label">Calls/day capacity</div>
                </div>
                <div class="visual-metric">
                  <div class="metric-num">&lt;2s</div>
                  <div class="metric-label">Response time</div>
                </div>
                <div class="visual-metric">
                  <div class="metric-num">24/7</div>
                  <div class="metric-label">Availability</div>
                </div>
                <div class="visual-metric">
                  <div class="metric-num">0</div>
                  <div class="metric-label">Missed calls</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURE 2: ROUTING & TRIAGE -->
      <section class="feature-section">
        <div class="med-container fade-in">
          <div class="feature-inner reverse">
            <div>
              <span class="section-label">Intelligent Routing</span>
              <h2 class="section-title">Route patients to exactly the right place.</h2>
              <p class="section-subtitle">
                MedLine AI understands urgency. Routine calls are handled automatically. 
                Urgent cases are escalated immediately to clinical staff with full context.
              </p>
              <ul class="feature-list">
                <li><span class="li-icon">✓</span> Urgent symptom detection and immediate escalation</li>
                <li><span class="li-icon">✓</span> Automatic routing by call type and provider</li>
                <li><span class="li-icon">✓</span> Context-rich handoffs — staff gets a summary, not a cold transfer</li>
                <li><span class="li-icon">✓</span> Patient portal guidance for self-service tasks</li>
              </ul>
            </div>
            <div class="feature-visual">
              <div class="visual-call-types">
                <div class="call-type-bar">
                  <div class="bar-label"><span>Appointment Scheduling</span><span>35%</span></div>
                  <div class="bar-track"><div class="bar-fill" style="width: 35%"></div></div>
                </div>
                <div class="call-type-bar">
                  <div class="bar-label"><span>Prep Questions</span><span>25%</span></div>
                  <div class="bar-track"><div class="bar-fill" style="width: 25%"></div></div>
                </div>
                <div class="call-type-bar">
                  <div class="bar-label"><span>Medication Refills</span><span>20%</span></div>
                  <div class="bar-track"><div class="bar-fill" style="width: 20%"></div></div>
                </div>
                <div class="call-type-bar">
                  <div class="bar-label"><span>Billing Questions</span><span>10%</span></div>
                  <div class="bar-track"><div class="bar-fill" style="width: 10%"></div></div>
                </div>
                <div class="call-type-bar">
                  <div class="bar-label"><span>Urgent / Clinical</span><span>10%</span></div>
                  <div class="bar-track"><div class="bar-fill" style="width: 10%"></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- USE CASES -->
      <section class="usecases-section">
        <div class="med-container fade-in">
          <div class="usecases-header">
            <span class="section-label">What MedLine AI Handles</span>
            <h2 class="section-title">Built for GI practice workflows</h2>
          </div>
          <div class="usecases-grid">
            <div class="usecase-card">
              <div class="uc-icon">📅</div>
              <h3>Appointment Scheduling</h3>
              <p>Book, reschedule, and confirm appointments across all providers.</p>
            </div>
            <div class="usecase-card">
              <div class="uc-icon">📋</div>
              <h3>Colonoscopy Prep</h3>
              <p>Walk patients through prep instructions, timing, and dietary restrictions.</p>
            </div>
            <div class="usecase-card">
              <div class="uc-icon">💊</div>
              <h3>Medication Refills</h3>
              <p>Process refill requests and route to the prescribing provider.</p>
            </div>
            <div class="usecase-card">
              <div class="uc-icon">🔬</div>
              <h3>Lab Results</h3>
              <p>Direct patients to their portal or schedule follow-up for results review.</p>
            </div>
            <div class="usecase-card">
              <div class="uc-icon">💳</div>
              <h3>Billing & Insurance</h3>
              <p>Answer coverage questions and route complex billing to your team.</p>
            </div>
            <div class="usecase-card">
              <div class="uc-icon">📞</div>
              <h3>Referral Status</h3>
              <p>Check referral status and coordinate with referring physicians.</p>
            </div>
            <div class="usecase-card">
              <div class="uc-icon">🚨</div>
              <h3>Urgent Triage</h3>
              <p>Detect urgent symptoms and immediately escalate to clinical staff.</p>
            </div>
            <div class="usecase-card">
              <div class="uc-icon">🕐</div>
              <h3>After-Hours Coverage</h3>
              <p>Handle calls 24/7 — nights, weekends, and holidays included.</p>
            </div>
            <div class="usecase-card">
              <div class="uc-icon">📍</div>
              <h3>Location & Directions</h3>
              <p>Provide office hours, directions, parking info, and facility details.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- STATS BAR -->
      <section class="stats-section">
        <div class="med-container fade-in">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-num">$15-35K</div>
              <div class="stat-label">Monthly staffing savings</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">1,000+</div>
              <div class="stat-label">Calls handled per day</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">24/7</div>
              <div class="stat-label">Always available</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">&lt;2s</div>
              <div class="stat-label">Average response time</div>
            </div>
          </div>
        </div>
      </section>

      <!-- TESTIMONIAL -->
      <section class="testimonial-section">
        <div class="med-container fade-in">
          <div class="testimonial-header">
            <span class="section-label">What Doctors Say</span>
            <h2 class="section-title">Tested by real physicians</h2>
          </div>
          <div class="testimonial-card">
            <div class="quote-mark">"</div>
            <p class="quote-text">
              I called the AI line myself to test it. The conversation was natural, it understood my questions, 
              and it handled the scheduling perfectly. It was great — I couldn't believe it wasn't a person.
            </p>
            <div class="quote-author">GI Physician</div>
            <div class="quote-role">Early Access Partner — Practice Fusion EHR</div>
          </div>
        </div>
      </section>

      <!-- PRICING -->
      <section class="pricing-section">
        <div class="med-container fade-in">
          <div class="pricing-inner">
            <span class="section-label">Pricing</span>
            <h2 class="section-title">A fraction of a single receptionist's salary</h2>
            <div class="pricing-card">
              <div class="pricing-amount">$2,000<span class="period">/month</span></div>
              <p class="pricing-note">Replaces 8-12 FTEs worth of phone work</p>
              <ul class="pricing-features">
                <li><span class="pf-check">✓</span> Unlimited calls — 1,000+/day capacity</li>
                <li><span class="pf-check">✓</span> 24/7 coverage including after-hours</li>
                <li><span class="pf-check">✓</span> EHR integration (Practice Fusion live, more coming)</li>
                <li><span class="pf-check">✓</span> Natural voice conversations — no phone trees</li>
                <li><span class="pf-check">✓</span> Urgent case escalation & warm transfers</li>
                <li><span class="pf-check">✓</span> Setup and onboarding included</li>
              </ul>
              <a href="tel:+16179044251" class="btn-med-phone" style="width: 100%; justify-content: center;">📞 Call Now to Try It</a>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="faq-section">
        <div class="med-container fade-in">
          <div class="faq-header">
            <span class="section-label">FAQ</span>
            <h2 class="section-title">Common questions</h2>
          </div>
          <div class="faq-list">
            <div class="faq-item" *ngFor="let faq of faqs; let i = index">
              <button class="faq-question" (click)="toggleFaq(i)">
                {{ faq.q }}
                <span class="faq-toggle" [class.open]="faq.open">+</span>
              </button>
              <div class="faq-answer" *ngIf="faq.open">{{ faq.a }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- FINAL CTA -->
      <section class="cta-section">
        <div class="med-container fade-in">
          <span class="section-label" style="color: #67E8F9; background: rgba(103,232,249,0.1);">Get Started</span>
          <h2 class="section-title">Stop losing patients to voicemail.</h2>
          <p class="section-subtitle">
            Try MedLine AI right now — call our demo line and have a real conversation with our AI agent.
          </p>
          <div class="cta-actions">
            <a href="tel:+16179044251" class="btn-med-phone" style="font-size: 1.1rem; padding: 1rem 2.5rem;">📞 Call (617) 904-4251</a>
            <a href="mailto:assistant&#64;truwit.ai" class="btn-med-primary">Book a Demo</a>
          </div>
          <p class="cta-phone">Or email us at <a href="mailto:assistant&#64;truwit.ai">assistant&#64;truwit.ai</a></p>
        </div>
      </section>

      <!-- FOOTER -->
      <footer style="background: #0F172A; padding: 2rem 0; text-align: center; color: #64748B; font-size: 0.85rem; border-top: 1px solid rgba(255,255,255,0.05);">
        <div class="med-container">
          <p style="margin: 0;">© 2026 TruWit Inc. — MedLine AI</p>
        </div>
      </footer>
    </div>
  `
})
export class MedlineAiPageComponent implements OnInit, AfterViewInit {
  faqs = [
    {
      q: 'How does MedLine AI handle calls differently from a phone tree?',
      a: 'MedLine AI uses conversational AI — patients speak naturally and the AI understands intent, asks clarifying questions, and completes tasks like scheduling. There are no "press 1 for..." menus. It\'s like talking to a knowledgeable receptionist.',
      open: false
    },
    {
      q: 'What happens with urgent or complex calls?',
      a: 'MedLine AI is trained to detect urgent symptoms and clinical scenarios. When it identifies something that needs human attention, it immediately warm-transfers the call to your clinical staff with a full summary of the conversation so far.',
      open: false
    },
    {
      q: 'How long does setup take?',
      a: 'Most practices are live within a few days. We connect to your EHR, configure your providers and scheduling rules, and you forward your calls. No hardware, no IT projects.',
      open: false
    },
    {
      q: 'Does it work with my EHR?',
      a: 'We\'re live with Practice Fusion today, with Epic, Cerner, and Athena integrations coming in 2026. Contact us if you use a different system — we\'re adding new integrations based on demand.',
      open: false
    },
    {
      q: 'Can patients still reach a real person?',
      a: 'Absolutely. MedLine AI can transfer calls to your staff at any time — either when the patient requests it or when the AI determines a human is needed. Your team stays in control.',
      open: false
    },
    {
      q: 'Is patient data secure?',
      a: 'Yes. All calls are processed with HIPAA-compliant infrastructure. We don\'t store call recordings beyond what\'s needed for the conversation, and all EHR connections use encrypted, authenticated APIs.',
      open: false
    },
    {
      q: 'What about colonoscopy and endoscopy prep questions?',
      a: 'MedLine AI is specifically trained for GI workflows. It can walk patients through prep instructions, answer questions about dietary restrictions, timing, and medications to hold — all based on your practice\'s specific protocols.',
      open: false
    },
    {
      q: 'How does the $2,000/month compare to staffing costs?',
      a: 'A single full-time receptionist costs $3,000-$4,000/month in salary alone, before benefits. MedLine AI handles the phone work of 8-12 staff members for a fraction of one person\'s salary, and it never calls in sick or takes vacation.',
      open: false
    }
  ];

  constructor(
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle('MedLine AI — AI-Powered Front Office for GI Practices | TruWit');
    this.meta.updateTag({
      name: 'description',
      content: 'MedLine AI answers every call to your GI practice with conversational AI. Schedule appointments, handle prep questions, process refills — 24/7, starting at $2,000/month.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'GI practice AI, gastroenterology phone AI, medical office automation, AI receptionist, healthcare voice agent, colonoscopy scheduling AI'
    });
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }
  }

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
