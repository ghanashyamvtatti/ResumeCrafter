/**
 * Landing page with hero section and CTAs.
 */

export function renderHomePage() {
    const page = document.createElement('div');
    page.className = 'home-page';

    page.innerHTML = `
    <style>
      .hero {
        position: relative;
        min-height: 80vh;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: var(--space-8) var(--space-6);
      }
      .hero-bg {
        position: absolute;
        inset: 0;
        z-index: 0;
      }
      .hero-content {
        position: relative;
        z-index: 1;
        text-align: center;
        max-width: 700px;
      }
      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        background: var(--color-primary-50);
        border: 1px solid var(--color-primary-100);
        border-radius: var(--radius-full);
        font-size: var(--font-xs);
        font-weight: var(--weight-semibold);
        color: var(--color-primary-light);
        margin-bottom: var(--space-6);
        animation: slideDown 0.6s ease forwards;
      }
      .hero-title {
        font-size: clamp(2.5rem, 6vw, 3.75rem);
        font-weight: var(--weight-extrabold);
        line-height: 1.1;
        margin-bottom: var(--space-6);
        letter-spacing: -1px;
        animation: slideUp 0.6s ease 0.1s both;
      }
      .hero-subtitle {
        font-size: var(--font-lg);
        color: var(--text-secondary);
        line-height: 1.7;
        margin-bottom: var(--space-10);
        animation: slideUp 0.6s ease 0.2s both;
      }
      .hero-actions {
        display: flex;
        gap: var(--space-4);
        justify-content: center;
        flex-wrap: wrap;
        animation: slideUp 0.6s ease 0.3s both;
      }
      .hero-actions .btn { padding: var(--space-4) var(--space-8); font-size: var(--font-base); }

      /* Features */
      .features {
        padding: var(--space-16) var(--space-6);
        max-width: 1100px;
        margin: 0 auto;
      }
      .features-title {
        text-align: center;
        font-size: var(--font-3xl);
        font-weight: var(--weight-bold);
        margin-bottom: var(--space-12);
      }
      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--space-6);
      }
      .feature-card {
        padding: var(--space-8);
        text-align: center;
      }
      .feature-icon {
        font-size: 40px;
        margin-bottom: var(--space-4);
        display: block;
      }
      .feature-card h3 {
        font-size: var(--font-lg);
        font-weight: var(--weight-bold);
        margin-bottom: var(--space-3);
      }
      .feature-card p {
        font-size: var(--font-sm);
        color: var(--text-tertiary);
        line-height: 1.6;
      }

      /* How it works */
      .how-it-works {
        padding: var(--space-16) var(--space-6);
        max-width: 900px;
        margin: 0 auto;
      }
      .how-it-works-title {
        text-align: center;
        font-size: var(--font-3xl);
        font-weight: var(--weight-bold);
        margin-bottom: var(--space-12);
      }
      .steps-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }
      .step-item {
        display: flex;
        gap: var(--space-5);
        align-items: flex-start;
      }
      .step-number {
        width: 48px;
        height: 48px;
        min-width: 48px;
        border-radius: 50%;
        background: var(--gradient-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--weight-bold);
        font-size: var(--font-lg);
        color: white;
      }
      .step-info h4 {
        font-weight: var(--weight-semibold);
        margin-bottom: var(--space-2);
      }
      .step-info p {
        font-size: var(--font-sm);
        color: var(--text-tertiary);
      }
    </style>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg">
        <div class="orb orb-primary" style="top: -100px; left: 10%;"></div>
        <div class="orb orb-accent" style="bottom: -50px; right: 15%;"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          ✦ AI-Powered Resume Building
        </div>
        <h1 class="hero-title">
          Craft the <span class="gradient-text">Perfect Resume</span> for Every Job
        </h1>
        <p class="hero-subtitle">
          Build a comprehensive master resume, then let AI tailor it for each job application.
          ATS-optimized, keyword-rich, and designed to land interviews.
        </p>
        <div class="hero-actions">
          <a href="#/builder" class="btn btn-primary btn-lg" id="cta-builder">
            📝 Build Master Resume
          </a>
          <a href="#/crafter" class="btn btn-secondary btn-lg" id="cta-crafter">
            ✨ Craft Custom Resume
          </a>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <h2 class="features-title">Why <span class="gradient-text">ResumeCrafter</span>?</h2>
      <div class="features-grid">
        <div class="card card-interactive feature-card hover-lift">
          <span class="feature-icon">🤖</span>
          <h3>Multi-AI Support</h3>
          <p>Works with Claude, Gemini, and GPT. Bring your own API key — it stays on your device, always.</p>
        </div>
        <div class="card card-interactive feature-card hover-lift">
          <span class="feature-icon">📊</span>
          <h3>ATS-Optimized</h3>
          <p>Single-column layout, standard sections, keyword optimization — passes every Applicant Tracking System.</p>
        </div>
        <div class="card card-interactive feature-card hover-lift">
          <span class="feature-icon">🎯</span>
          <h3>Job-Targeted</h3>
          <p>AI cherry-picks your most relevant experience, skills, and achievements for each specific job description.</p>
        </div>
        <div class="card card-interactive feature-card hover-lift">
          <span class="feature-icon">📤</span>
          <h3>Import Anywhere</h3>
          <p>Upload existing resumes (PDF/DOCX), import LinkedIn data, or paste plain text — AI structures it all.</p>
        </div>
        <div class="card card-interactive feature-card hover-lift">
          <span class="feature-icon">✨</span>
          <h3>AI Enhancement</h3>
          <p>Auto-suggest skills, enhance bullet points with action verbs and metrics, generate professional summaries.</p>
        </div>
        <div class="card card-interactive feature-card hover-lift">
          <span class="feature-icon">🔒</span>
          <h3>Privacy-First</h3>
          <p>Everything runs in your browser. No data stored on any server. Your resume, your data, your control.</p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="how-it-works">
      <h2 class="how-it-works-title">How It Works</h2>
      <div class="steps-list">
        <div class="step-item">
          <div class="step-number">1</div>
          <div class="step-info">
            <h4>Set Up AI</h4>
            <p>Choose your preferred AI provider and enter your API key. It's stored only in your browser session.</p>
          </div>
        </div>
        <div class="step-item">
          <div class="step-number">2</div>
          <div class="step-info">
            <h4>Build Your Master Resume</h4>
            <p>Enter your full career history — import from LinkedIn, upload existing resumes, or type manually. AI enhances every entry.</p>
          </div>
        </div>
        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-info">
            <h4>Paste a Job Description</h4>
            <p>Find a job you want to apply to and paste the description. The AI will analyze requirements and keywords.</p>
          </div>
        </div>
        <div class="step-item">
          <div class="step-number">4</div>
          <div class="step-info">
            <h4>Get Your Tailored Resume</h4>
            <p>AI crafts a single-page, ATS-friendly resume highlighting your most relevant qualifications. Download as PDF or DOCX.</p>
          </div>
        </div>
      </div>
    </section>
  `;

    return page;
}
