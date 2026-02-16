/**
 * Master Resume Builder — Multi-step wizard page.
 * All steps are inline for simplicity.
 */
import { store } from '../store/resume-store.js';
import {
    createExperienceEntry, createBulletPoint, createEducationEntry,
    createSkillEntry, createCertificationEntry, createProjectEntry,
    createAwardEntry
} from '../models/resume-schema.js';
import { extractTextFromFile } from '../services/file-parser.js';
import { parseLinkedInExport } from '../services/linkedin-import.js';
import {
    parseTextToResume, suggestSkills, enhanceBulletPoint, generateSummary
} from '../services/ai-enhance.js';
import { isConfigured } from '../services/llm-service.js';
import { downloadJSON } from '../services/export-service.js';
import { showToast } from '../utils/toast.js';

const STEPS = [
    { id: 'import', label: 'Import', icon: '📥' },
    { id: 'contact', label: 'Contact', icon: '👤' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'certs', label: 'Certifications', icon: '📜' },
    { id: 'summary', label: 'Summary', icon: '📝' },
    { id: 'review', label: 'Review', icon: '✅' },
];

export function renderBuilderPage() {
    const page = document.createElement('div');
    page.className = 'builder-page';
    let currentStep = 0;

    function render() {
        page.innerHTML = `
      <style>
        .builder-page { padding-bottom: var(--space-16); }
        .builder-header {
          text-align: center;
          padding: var(--space-8) var(--space-6) var(--space-4);
        }
        .builder-header h1 { font-size: var(--font-3xl); margin-bottom: var(--space-2); }
        .builder-header p { color: var(--text-tertiary); font-size: var(--font-sm); }
        .wizard-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 var(--space-6);
        }
        .wizard-nav {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          margin-top: var(--space-8);
        }
        .entry-form {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-4);
        }
        .inline-form { margin-bottom: var(--space-4); }
        .tag-input-container {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          min-height: 44px;
          align-items: center;
          cursor: text;
        }
        .tag-input-container input {
          border: none;
          background: none;
          color: var(--text-primary);
          font-family: var(--font-family);
          font-size: var(--font-sm);
          outline: none;
          flex: 1;
          min-width: 120px;
        }
        .tag-input-container input::placeholder { color: var(--text-tertiary); }
        .suggestions-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-top: var(--space-3);
        }
        .suggestion-label {
          font-size: var(--font-xs);
          color: var(--text-tertiary);
          margin-right: var(--space-2);
          align-self: center;
        }
        .ai-btn-inline {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: var(--font-xs);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, rgba(168,85,247,0.12), rgba(99,102,241,0.12));
          color: var(--color-accent-light);
          border: 1px solid rgba(168,85,247,0.2);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: var(--font-family);
        }
        .ai-btn-inline:hover { background: linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.2)); }
        .ai-btn-inline:disabled { opacity: 0.5; cursor: not-allowed; }
        .bullet-row {
          display: flex;
          gap: var(--space-2);
          align-items: flex-start;
          margin-bottom: var(--space-3);
        }
        .bullet-row textarea {
          flex: 1;
          min-height: 60px;
        }
        .bullet-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          flex-shrink: 0;
          padding-top: 2px;
        }
        .summary-variant {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          margin-bottom: var(--space-3);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .summary-variant:hover, .summary-variant.selected {
          border-color: var(--color-primary);
          background: var(--color-primary-50);
        }
        .summary-variant p { font-size: var(--font-sm); color: var(--text-secondary); }
        .review-section {
          margin-bottom: var(--space-6);
        }
        .review-section h3 {
          font-size: var(--font-lg);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--space-3);
          color: var(--color-primary-light);
        }
        .review-item {
          font-size: var(--font-sm);
          color: var(--text-secondary);
          margin-bottom: var(--space-2);
        }
        .review-item strong { color: var(--text-primary); }
        .import-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }
        .import-card {
          text-align: center;
          padding: var(--space-6);
          cursor: pointer;
        }
        .import-card-icon { font-size: 36px; margin-bottom: var(--space-3); display: block; }
        .import-card h4 { font-weight: var(--weight-semibold); margin-bottom: var(--space-2); }
        .import-card p { font-size: var(--font-xs); color: var(--text-tertiary); }
      </style>

      <div class="builder-header">
        <h1>Build Your <span class="gradient-text">Master Resume</span></h1>
        <p>Fill in your career details — AI will help enhance every section</p>
      </div>

      ${renderProgress(currentStep)}

      <div class="wizard-content" id="wizard-content">
        ${renderStep(currentStep)}
      </div>

      <div class="wizard-nav">
        ${currentStep > 0 ? '<button class="btn btn-secondary" id="wizard-prev">← Previous</button>' : ''}
        ${currentStep < STEPS.length - 1
                ? '<button class="btn btn-primary" id="wizard-next">Next →</button>'
                : '<button class="btn btn-primary" id="wizard-download">📥 Download Master Resume</button>'}
      </div>
    `;

        attachStepEvents(currentStep);
        attachNavEvents();
    }

    function renderProgress(step) {
        return `<div class="wizard-progress">
      ${STEPS.map((s, i) => `
        ${i > 0 ? `<div class="wizard-connector ${i <= step ? 'completed' : ''}"></div>` : ''}
        <div class="wizard-step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}" data-step="${i}">
          <div class="wizard-step-number">${i < step ? '✓' : s.icon}</div>
          <span>${s.label}</span>
        </div>
      `).join('')}
    </div>`;
    }

    function renderStep(step) {
        const resume = store.getResume();
        switch (STEPS[step].id) {
            case 'import': return renderImportStep();
            case 'contact': return renderContactStep(resume.contact);
            case 'experience': return renderExperienceStep(resume.experience);
            case 'education': return renderEducationStep(resume.education);
            case 'skills': return renderSkillsStep(resume.skills);
            case 'projects': return renderProjectsStep(resume.projects);
            case 'certs': return renderCertsStep(resume.certifications);
            case 'summary': return renderSummaryStep(resume.summary, resume.experience, resume.skills);
            case 'review': return renderReviewStep(resume);
            default: return '';
        }
    }

    // ---------- IMPORT STEP ----------
    function renderImportStep() {
        return `
      <div class="section-title">Import Existing Data</div>
      <div class="section-subtitle">Jumpstart your master resume by importing from existing sources</div>

      <div class="import-options">
        <div class="card card-interactive import-card" id="import-resume">
          <span class="import-card-icon">📄</span>
          <h4>Upload Resume</h4>
          <p>PDF or DOCX format</p>
        </div>
        <div class="card card-interactive import-card" id="import-linkedin">
          <span class="import-card-icon">💼</span>
          <h4>LinkedIn Export</h4>
          <p>Upload your LinkedIn data ZIP</p>
        </div>
        <div class="card card-interactive import-card" id="import-text">
          <span class="import-card-icon">📋</span>
          <h4>Paste Text</h4>
          <p>Paste any text with career info</p>
        </div>
        <div class="card card-interactive import-card" id="import-json">
          <span class="import-card-icon">📦</span>
          <h4>Master Resume JSON</h4>
          <p>Import existing master resume</p>
        </div>
      </div>

      <input type="file" id="file-input-resume" accept=".pdf,.docx,.doc" style="display:none" />
      <input type="file" id="file-input-linkedin" accept=".zip" style="display:none" />
      <input type="file" id="file-input-json" accept=".json" style="display:none" />

      <div id="import-text-area" class="hidden">
        <div class="form-group">
          <label class="form-label">Paste your career information</label>
          <textarea class="form-textarea" id="import-text-input" rows="8" placeholder="Paste any text containing your career information — work experience, education, skills, etc. AI will extract and organize it."></textarea>
        </div>
        <div class="mt-4">
          <button class="btn btn-ai" id="import-text-process">✦ Process with AI</button>
        </div>
      </div>

      <div id="import-status" class="mt-4" style="font-size: var(--font-sm); color: var(--text-secondary);"></div>

      <div class="divider"></div>
      <p style="font-size: var(--font-xs); color: var(--text-tertiary); text-align: center;">
        You can skip this step and fill in your details manually in the following steps.
      </p>
    `;
    }

    // ---------- CONTACT STEP ----------
    function renderContactStep(contact) {
        return `
      <div class="section-title">Contact Information</div>
      <div class="section-subtitle">How recruiters and hiring managers can reach you</div>
      <div class="entry-form">
        <div class="form-group mb-4">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input class="form-input" id="contact-name" value="${contact.fullName || ''}" placeholder="John Doe" />
        </div>
        <div class="form-row mb-4">
          <div class="form-group">
            <label class="form-label">Email <span class="required">*</span></label>
            <input class="form-input" id="contact-email" type="email" value="${contact.email || ''}" placeholder="john@example.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input class="form-input" id="contact-phone" value="${contact.phone || ''}" placeholder="+1 (555) 123-4567" />
          </div>
        </div>
        <div class="form-group mb-4">
          <label class="form-label">Location</label>
          <input class="form-input" id="contact-location" value="${contact.location || ''}" placeholder="City, State/Country" />
        </div>
        <div class="form-row mb-4">
          <div class="form-group">
            <label class="form-label">LinkedIn</label>
            <input class="form-input" id="contact-linkedin" value="${contact.linkedin || ''}" placeholder="linkedin.com/in/johndoe" />
          </div>
          <div class="form-group">
            <label class="form-label">GitHub</label>
            <input class="form-input" id="contact-github" value="${contact.github || ''}" placeholder="github.com/johndoe" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Portfolio / Website</label>
          <input class="form-input" id="contact-portfolio" value="${contact.portfolio || ''}" placeholder="https://johndoe.com" />
        </div>
      </div>
    `;
    }

    // ---------- EXPERIENCE STEP ----------
    function renderExperienceStep(experience) {
        return `
      <div class="flex justify-between items-center mb-4">
        <div>
          <div class="section-title">Work Experience</div>
          <div class="section-subtitle">Add your work history in reverse chronological order</div>
        </div>
        <button class="btn btn-primary btn-sm" id="add-experience">+ Add</button>
      </div>
      <div class="entries-list" id="experience-list">
        ${experience.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">💼</div>
            <div class="empty-state-title">No experience added yet</div>
            <div class="empty-state-text">Click "Add" to add your work experience</div>
          </div>
        ` : experience.map((exp, i) => renderExperienceEntry(exp, i)).join('')}
      </div>
    `;
    }

    function renderExperienceEntry(exp, index) {
        const bullets = exp.bullets || [];
        return `
      <div class="entry-form" data-exp-id="${exp.id}">
        <div class="entry-header">
          <div class="flex-1">
            <div class="form-row mb-4">
              <div class="form-group">
                <label class="form-label">Job Title <span class="required">*</span></label>
                <input class="form-input exp-field" data-field="title" value="${exp.title || ''}" placeholder="Software Engineer" />
              </div>
              <div class="form-group">
                <label class="form-label">Company <span class="required">*</span></label>
                <input class="form-input exp-field" data-field="company" value="${exp.company || ''}" placeholder="Acme Corp" />
              </div>
            </div>
            <div class="form-row mb-4">
              <div class="form-group">
                <label class="form-label">Location</label>
                <input class="form-input exp-field" data-field="location" value="${exp.location || ''}" placeholder="San Francisco, CA" />
              </div>
              <div class="form-row" style="gap: var(--space-2);">
                <div class="form-group">
                  <label class="form-label">Start</label>
                  <input class="form-input exp-field" data-field="startDate" type="month" value="${exp.startDate || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">End</label>
                  <input class="form-input exp-field" data-field="endDate" type="month" value="${exp.endDate || ''}" ${exp.current ? 'disabled' : ''} />
                </div>
              </div>
            </div>
            <div class="form-group mb-4">
              <label style="display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-sm); color: var(--text-secondary); cursor: pointer;">
                <input type="checkbox" class="exp-current" ${exp.current ? 'checked' : ''} /> Currently working here
              </label>
            </div>
          </div>
          <div class="entry-actions">
            <button class="btn btn-danger btn-icon btn-sm exp-remove" title="Remove">✕</button>
          </div>
        </div>
        <div class="divider" style="margin: var(--space-3) 0;"></div>
        <div class="flex justify-between items-center mb-4">
          <label class="form-label" style="margin:0;">Bullet Points</label>
          <div class="flex gap-2">
            <button class="ai-btn-inline exp-enhance-all" ${!isConfigured() ? 'disabled title="Configure AI first"' : ''}>✦ Enhance All</button>
            <button class="btn btn-ghost btn-sm exp-add-bullet">+ Bullet</button>
          </div>
        </div>
        <div class="bullets-container">
          ${bullets.map((b, bi) => `
            <div class="bullet-row" data-bullet-idx="${bi}">
              <textarea class="form-textarea bullet-text" rows="2" placeholder="Describe an achievement or responsibility...">${typeof b === 'string' ? b : b.text || ''}</textarea>
              <div class="bullet-actions">
                <button class="ai-btn-inline bullet-enhance" data-idx="${bi}" ${!isConfigured() ? 'disabled' : ''} title="AI Enhance">✦</button>
                <button class="btn btn-ghost btn-icon btn-sm bullet-remove" data-idx="${bi}" title="Remove">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    }

    // ---------- EDUCATION STEP ----------
    function renderEducationStep(education) {
        return `
      <div class="flex justify-between items-center mb-4">
        <div>
          <div class="section-title">Education</div>
          <div class="section-subtitle">Your academic background</div>
        </div>
        <button class="btn btn-primary btn-sm" id="add-education">+ Add</button>
      </div>
      <div class="entries-list" id="education-list">
        ${education.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🎓</div>
            <div class="empty-state-title">No education added yet</div>
            <div class="empty-state-text">Click "Add" to add your education history</div>
          </div>
        ` : education.map((edu) => `
          <div class="entry-form" data-edu-id="${edu.id}">
            <div class="entry-header">
              <div class="flex-1">
                <div class="form-row mb-4">
                  <div class="form-group">
                    <label class="form-label">Institution <span class="required">*</span></label>
                    <input class="form-input edu-field" data-field="institution" value="${edu.institution || ''}" placeholder="MIT" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Degree</label>
                    <input class="form-input edu-field" data-field="degree" value="${edu.degree || ''}" placeholder="Bachelor of Science" />
                  </div>
                </div>
                <div class="form-row mb-4">
                  <div class="form-group">
                    <label class="form-label">Field of Study</label>
                    <input class="form-input edu-field" data-field="field" value="${edu.field || ''}" placeholder="Computer Science" />
                  </div>
                  <div class="form-row" style="gap: var(--space-2);">
                    <div class="form-group">
                      <label class="form-label">Start</label>
                      <input class="form-input edu-field" data-field="startDate" type="month" value="${edu.startDate || ''}" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">End</label>
                      <input class="form-input edu-field" data-field="endDate" type="month" value="${edu.endDate || ''}" />
                    </div>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">GPA</label>
                    <input class="form-input edu-field" data-field="gpa" value="${edu.gpa || ''}" placeholder="3.8/4.0" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Honors</label>
                    <input class="form-input edu-field" data-field="honors" value="${edu.honors || ''}" placeholder="Magna Cum Laude" />
                  </div>
                </div>
              </div>
              <div class="entry-actions">
                <button class="btn btn-danger btn-icon btn-sm edu-remove" title="Remove">✕</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    }

    // ---------- SKILLS STEP ----------
    function renderSkillsStep(skills) {
        const techSkills = skills.technical || [];
        const softSkills = skills.soft || [];
        const languages = skills.languages || [];

        return `
      <div class="section-title">Skills</div>
      <div class="section-subtitle">Your technical skills, soft skills, and languages</div>

      <div class="entry-form mb-6">
        <div class="flex justify-between items-center mb-4">
          <label class="form-label" style="margin:0; font-size: var(--font-base); font-weight: var(--weight-semibold);">Technical Skills</label>
          <button class="ai-btn-inline" id="ai-suggest-skills" ${!isConfigured() ? 'disabled title="Configure AI first"' : ''}>✦ AI Suggest</button>
        </div>
        <div class="tag-input-container" id="tech-skills-container">
          ${techSkills.map(s => `<span class="tag">${s.name}<button class="tag-remove" data-skill-name="${s.name}" data-skill-type="technical">&times;</button></span>`).join('')}
          <input type="text" id="tech-skill-input" placeholder="Type a skill and press Enter..." />
        </div>
        <div class="suggestions-row" id="skill-suggestions"></div>
      </div>

      <div class="entry-form mb-6">
        <label class="form-label" style="font-size: var(--font-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-3); display: block;">Soft Skills</label>
        <div class="tag-input-container" id="soft-skills-container">
          ${softSkills.map(s => `<span class="tag">${s.name}<button class="tag-remove" data-skill-name="${s.name}" data-skill-type="soft">&times;</button></span>`).join('')}
          <input type="text" id="soft-skill-input" placeholder="Type a skill and press Enter..." />
        </div>
      </div>

      <div class="entry-form">
        <label class="form-label" style="font-size: var(--font-base); font-weight: var(--weight-semibold); margin-bottom: var(--space-3); display: block;">Languages</label>
        <div class="tag-input-container" id="lang-skills-container">
          ${languages.map(s => `<span class="tag">${s.name}${s.proficiency ? ` (${s.proficiency})` : ''}<button class="tag-remove" data-skill-name="${s.name}" data-skill-type="languages">&times;</button></span>`).join('')}
          <input type="text" id="lang-skill-input" placeholder="e.g., English (Native), Spanish (Fluent)..." />
        </div>
      </div>
    `;
    }

    // ---------- PROJECTS STEP ----------
    function renderProjectsStep(projects) {
        return `
      <div class="flex justify-between items-center mb-4">
        <div>
          <div class="section-title">Projects</div>
          <div class="section-subtitle">Personal projects, open source, hackathons, etc.</div>
        </div>
        <button class="btn btn-primary btn-sm" id="add-project">+ Add</button>
      </div>
      <div class="entries-list" id="projects-list">
        ${projects.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🚀</div>
            <div class="empty-state-title">No projects added yet</div>
            <div class="empty-state-text">Click "Add" to showcase your projects</div>
          </div>
        ` : projects.map((proj) => `
          <div class="entry-form" data-proj-id="${proj.id}">
            <div class="entry-header">
              <div class="flex-1">
                <div class="form-row mb-4">
                  <div class="form-group">
                    <label class="form-label">Project Name <span class="required">*</span></label>
                    <input class="form-input proj-field" data-field="name" value="${proj.name || ''}" placeholder="My Awesome Project" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">URL</label>
                    <input class="form-input proj-field" data-field="url" value="${proj.url || ''}" placeholder="https://github.com/..." />
                  </div>
                </div>
                <div class="form-group mb-4">
                  <label class="form-label">Description</label>
                  <textarea class="form-textarea proj-field" data-field="description" rows="2" placeholder="Brief description of the project...">${proj.description || ''}</textarea>
                </div>
                <div class="form-group mb-4">
                  <label class="form-label">Technologies</label>
                  <input class="form-input proj-field" data-field="technologies" value="${(proj.technologies || []).join(', ')}" placeholder="React, Node.js, PostgreSQL..." />
                  <span class="form-hint">Comma-separated</span>
                </div>
                <div class="flex justify-between items-center mb-4">
                  <label class="form-label" style="margin:0;">Bullet Points</label>
                  <button class="btn btn-ghost btn-sm proj-add-bullet">+ Bullet</button>
                </div>
                <div class="bullets-container">
                  ${(proj.bullets || []).map((b, bi) => `
                    <div class="bullet-row" data-bullet-idx="${bi}">
                      <textarea class="form-textarea bullet-text" rows="2" placeholder="Describe an achievement...">${typeof b === 'string' ? b : b.text || ''}</textarea>
                      <div class="bullet-actions">
                        <button class="btn btn-ghost btn-icon btn-sm bullet-remove" data-idx="${bi}" title="Remove">✕</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              <div class="entry-actions">
                <button class="btn btn-danger btn-icon btn-sm proj-remove" title="Remove">✕</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    }

    // ---------- CERTIFICATIONS STEP ----------
    function renderCertsStep(certs) {
        return `
      <div class="flex justify-between items-center mb-4">
        <div>
          <div class="section-title">Certifications</div>
          <div class="section-subtitle">Professional certifications and licenses</div>
        </div>
        <button class="btn btn-primary btn-sm" id="add-cert">+ Add</button>
      </div>
      <div class="entries-list" id="certs-list">
        ${certs.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📜</div>
            <div class="empty-state-title">No certifications added</div>
            <div class="empty-state-text">Click "Add" to add your certifications</div>
          </div>
        ` : certs.map((cert) => `
          <div class="entry-form" data-cert-id="${cert.id}">
            <div class="entry-header">
              <div class="flex-1">
                <div class="form-row mb-4">
                  <div class="form-group">
                    <label class="form-label">Certification Name <span class="required">*</span></label>
                    <input class="form-input cert-field" data-field="name" value="${cert.name || ''}" placeholder="AWS Solutions Architect" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Issuer</label>
                    <input class="form-input cert-field" data-field="issuer" value="${cert.issuer || ''}" placeholder="Amazon Web Services" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Date</label>
                    <input class="form-input cert-field" data-field="date" type="month" value="${cert.date || ''}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">URL</label>
                    <input class="form-input cert-field" data-field="url" value="${cert.url || ''}" placeholder="Certificate URL" />
                  </div>
                </div>
              </div>
              <div class="entry-actions">
                <button class="btn btn-danger btn-icon btn-sm cert-remove" title="Remove">✕</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    }

    // ---------- SUMMARY STEP ----------
    function renderSummaryStep(summary, experience, skills) {
        return `
      <div class="section-title">Professional Summary</div>
      <div class="section-subtitle">A compelling overview of your expertise. AI can generate options for you.</div>

      <div class="entry-form mb-6">
        <div class="flex justify-between items-center mb-4">
          <label class="form-label" style="margin:0; font-weight: var(--weight-semibold);">Summary</label>
          <button class="ai-btn-inline" id="ai-generate-summary" ${!isConfigured() ? 'disabled title="Configure AI first"' : ''}>✦ AI Generate</button>
        </div>
        <textarea class="form-textarea" id="summary-text" rows="5" placeholder="Write a 2-3 sentence professional summary highlighting your key qualifications...">${summary.text || ''}</textarea>
      </div>

      ${(summary.variants || []).length > 0 ? `
        <div class="mb-4">
          <label class="form-label">AI-Generated Variants (click to use)</label>
          ${summary.variants.map((v, i) => `
            <div class="summary-variant" data-variant-idx="${i}">
              <p>${v}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
    }

    // ---------- REVIEW STEP ----------
    function renderReviewStep(resume) {
        const contact = resume.contact;
        const techSkills = (resume.skills?.technical || []).map(s => s.name).filter(Boolean);
        const softSkills = (resume.skills?.soft || []).map(s => s.name).filter(Boolean);

        return `
      <div class="section-title">Review & Download</div>
      <div class="section-subtitle">Review your master resume before downloading</div>

      <div class="card mb-6">
        ${contact.fullName ? `
          <div class="review-section">
            <h3>👤 Contact</h3>
            <div class="review-item"><strong>${contact.fullName}</strong></div>
            <div class="review-item">${[contact.email, contact.phone, contact.location].filter(Boolean).join(' · ')}</div>
            <div class="review-item">${[contact.linkedin, contact.github, contact.portfolio].filter(Boolean).join(' · ')}</div>
          </div>
        ` : ''}

        ${resume.summary?.text ? `
          <div class="review-section">
            <h3>📝 Summary</h3>
            <div class="review-item">${resume.summary.text}</div>
          </div>
        ` : ''}

        ${resume.experience.length > 0 ? `
          <div class="review-section">
            <h3>💼 Experience (${resume.experience.length})</h3>
            ${resume.experience.map(e => `
              <div class="review-item"><strong>${e.title}</strong> at ${e.company} — ${e.startDate || '?'} to ${e.current ? 'Present' : e.endDate || '?'}</div>
              ${(e.bullets || []).map(b => `<div class="review-item" style="padding-left: var(--space-4);">• ${typeof b === 'string' ? b : b.text || ''}</div>`).join('')}
            `).join('')}
          </div>
        ` : ''}

        ${resume.education.length > 0 ? `
          <div class="review-section">
            <h3>🎓 Education (${resume.education.length})</h3>
            ${resume.education.map(e => `
              <div class="review-item"><strong>${e.degree || ''} ${e.field ? `in ${e.field}` : ''}</strong> — ${e.institution}</div>
            `).join('')}
          </div>
        ` : ''}

        ${techSkills.length > 0 ? `
          <div class="review-section">
            <h3>⚡ Skills</h3>
            <div class="review-item"><strong>Technical:</strong> ${techSkills.join(', ')}</div>
            ${softSkills.length > 0 ? `<div class="review-item"><strong>Soft:</strong> ${softSkills.join(', ')}</div>` : ''}
          </div>
        ` : ''}

        ${resume.projects.length > 0 ? `
          <div class="review-section">
            <h3>🚀 Projects (${resume.projects.length})</h3>
            ${resume.projects.map(p => `<div class="review-item"><strong>${p.name}</strong>${p.technologies?.length ? ` — ${p.technologies.join(', ')}` : ''}</div>`).join('')}
          </div>
        ` : ''}

        ${resume.certifications.length > 0 ? `
          <div class="review-section">
            <h3>📜 Certifications (${resume.certifications.length})</h3>
            ${resume.certifications.map(c => `<div class="review-item"><strong>${c.name}</strong> — ${c.issuer}</div>`).join('')}
          </div>
        ` : ''}
      </div>

      <div class="text-center">
        <p style="font-size: var(--font-sm); color: var(--text-tertiary); margin-bottom: var(--space-4);">
          Your master resume contains all your career data. Download it as JSON to use with the Resume Crafter.
        </p>
      </div>
    `;
    }

    // ========== EVENT HANDLERS ==========

    function saveCurrentStep() {
        const resume = store.getResume();

        switch (STEPS[currentStep].id) {
            case 'contact':
                store.updateContact({
                    fullName: page.querySelector('#contact-name')?.value || '',
                    email: page.querySelector('#contact-email')?.value || '',
                    phone: page.querySelector('#contact-phone')?.value || '',
                    location: page.querySelector('#contact-location')?.value || '',
                    linkedin: page.querySelector('#contact-linkedin')?.value || '',
                    github: page.querySelector('#contact-github')?.value || '',
                    portfolio: page.querySelector('#contact-portfolio')?.value || '',
                });
                break;

            case 'experience':
                saveExperienceEntries();
                break;

            case 'education':
                saveEducationEntries();
                break;

            case 'skills':
                // Skills are saved on tag add/remove already
                break;

            case 'projects':
                saveProjectEntries();
                break;

            case 'certs':
                saveCertEntries();
                break;

            case 'summary':
                store.updateSummary({
                    text: page.querySelector('#summary-text')?.value || '',
                });
                break;
        }
    }

    function saveExperienceEntries() {
        const entries = page.querySelectorAll('[data-exp-id]');
        const experience = [];
        entries.forEach(el => {
            const id = el.dataset.expId;
            const fields = {};
            el.querySelectorAll('.exp-field').forEach(f => {
                fields[f.dataset.field] = f.value;
            });
            const current = el.querySelector('.exp-current')?.checked || false;
            const bullets = [];
            el.querySelectorAll('.bullet-text').forEach(t => {
                if (t.value.trim()) {
                    bullets.push({ id: crypto.randomUUID(), text: t.value.trim(), tags: [], metrics: [] });
                }
            });
            experience.push({ id, ...fields, current, bullets, skills: [] });
        });
        store.updateSection('experience', experience);
    }

    function saveEducationEntries() {
        const entries = page.querySelectorAll('[data-edu-id]');
        const education = [];
        entries.forEach(el => {
            const id = el.dataset.eduId;
            const fields = {};
            el.querySelectorAll('.edu-field').forEach(f => {
                fields[f.dataset.field] = f.value;
            });
            education.push({ id, ...fields });
        });
        store.updateSection('education', education);
    }

    function saveProjectEntries() {
        const entries = page.querySelectorAll('[data-proj-id]');
        const projects = [];
        entries.forEach(el => {
            const id = el.dataset.projId;
            const fields = {};
            el.querySelectorAll('.proj-field').forEach(f => {
                if (f.dataset.field === 'technologies') {
                    fields.technologies = f.value.split(',').map(t => t.trim()).filter(Boolean);
                } else {
                    fields[f.dataset.field] = f.tagName === 'TEXTAREA' ? f.value : f.value;
                }
            });
            const bullets = [];
            el.querySelectorAll('.bullet-text').forEach(t => {
                if (t.value.trim()) bullets.push({ id: crypto.randomUUID(), text: t.value.trim() });
            });
            projects.push({ id, ...fields, bullets });
        });
        store.updateSection('projects', projects);
    }

    function saveCertEntries() {
        const entries = page.querySelectorAll('[data-cert-id]');
        const certs = [];
        entries.forEach(el => {
            const id = el.dataset.certId;
            const fields = {};
            el.querySelectorAll('.cert-field').forEach(f => {
                fields[f.dataset.field] = f.value;
            });
            certs.push({ id, ...fields });
        });
        store.updateSection('certifications', certs);
    }

    function attachNavEvents() {
        page.querySelector('#wizard-prev')?.addEventListener('click', () => {
            saveCurrentStep();
            currentStep--;
            render();
        });
        page.querySelector('#wizard-next')?.addEventListener('click', () => {
            saveCurrentStep();
            currentStep++;
            render();
        });
        page.querySelector('#wizard-download')?.addEventListener('click', () => {
            saveCurrentStep();
            const resume = store.getResume();
            downloadJSON(resume, `master-resume-${Date.now()}.json`);
            showToast('Master resume downloaded!', 'success');
        });

        // Step click navigation
        page.querySelectorAll('.wizard-step').forEach(el => {
            el.addEventListener('click', () => {
                saveCurrentStep();
                currentStep = parseInt(el.dataset.step);
                render();
            });
        });
    }

    function attachStepEvents(step) {
        switch (STEPS[step].id) {
            case 'import': attachImportEvents(); break;
            case 'experience': attachExperienceEvents(); break;
            case 'education': attachEducationEvents(); break;
            case 'skills': attachSkillsEvents(); break;
            case 'projects': attachProjectsEvents(); break;
            case 'certs': attachCertsEvents(); break;
            case 'summary': attachSummaryEvents(); break;
        }
    }

    // Import events
    function attachImportEvents() {
        const statusEl = page.querySelector('#import-status');
        const fileInputResume = page.querySelector('#file-input-resume');
        const fileInputLinkedin = page.querySelector('#file-input-linkedin');
        const fileInputJson = page.querySelector('#file-input-json');

        page.querySelector('#import-resume')?.addEventListener('click', () => fileInputResume.click());
        page.querySelector('#import-linkedin')?.addEventListener('click', () => fileInputLinkedin.click());
        page.querySelector('#import-json')?.addEventListener('click', () => fileInputJson.click());

        page.querySelector('#import-text')?.addEventListener('click', () => {
            page.querySelector('#import-text-area').classList.toggle('hidden');
        });

        // Resume upload
        fileInputResume.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            statusEl.innerHTML = '<div class="spinner" style="display:inline-block;vertical-align:middle;margin-right:8px;"></div> Extracting text from your resume...';

            try {
                const text = await extractTextFromFile(file);
                statusEl.textContent = 'Text extracted! Processing with AI...';

                if (isConfigured()) {
                    const data = await parseTextToResume(text);
                    mergeImportedData(data);
                    statusEl.innerHTML = '<span style="color:var(--color-success);">✓ Resume imported and processed! Navigate to the next steps to review.</span>';
                } else {
                    statusEl.innerHTML = '<span style="color:var(--color-warning);">Text extracted but AI is not configured. Please configure AI to auto-populate sections, or continue manually.</span>';
                }
            } catch (err) {
                statusEl.innerHTML = `<span style="color:var(--color-error);">Error: ${err.message}</span>`;
            }
        });

        // LinkedIn upload
        fileInputLinkedin.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            statusEl.innerHTML = '<div class="spinner" style="display:inline-block;vertical-align:middle;margin-right:8px;"></div> Processing LinkedIn data...';

            try {
                const data = await parseLinkedInExport(file);
                mergeImportedData(data);
                statusEl.innerHTML = '<span style="color:var(--color-success);">✓ LinkedIn data imported! Navigate to the next steps to review.</span>';
            } catch (err) {
                statusEl.innerHTML = `<span style="color:var(--color-error);">Error: ${err.message}</span>`;
            }
        });

        // JSON upload
        fileInputJson.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                store.importResume(data);
                statusEl.innerHTML = '<span style="color:var(--color-success);">✓ Master resume JSON imported!</span>';
                showToast('Master resume imported!', 'success');
            } catch (err) {
                statusEl.innerHTML = `<span style="color:var(--color-error);">Error: Invalid JSON file</span>`;
            }
        });

        // Plain text process
        page.querySelector('#import-text-process')?.addEventListener('click', async () => {
            const text = page.querySelector('#import-text-input')?.value;
            if (!text?.trim()) return showToast('Please paste some text first', 'warning');
            if (!isConfigured()) return showToast('Please configure AI first', 'warning');

            statusEl.innerHTML = '<div class="spinner" style="display:inline-block;vertical-align:middle;margin-right:8px;"></div> AI is processing your text...';

            try {
                const data = await parseTextToResume(text);
                mergeImportedData(data);
                statusEl.innerHTML = '<span style="color:var(--color-success);">✓ Text processed! Navigate to the next steps to review.</span>';
            } catch (err) {
                statusEl.innerHTML = `<span style="color:var(--color-error);">Error: ${err.message}</span>`;
            }
        });
    }

    function mergeImportedData(data) {
        const resume = store.getResume();

        if (data.contact) {
            const merged = { ...resume.contact };
            Object.entries(data.contact).forEach(([k, v]) => {
                if (v && !merged[k]) merged[k] = v;
            });
            store.updateContact(merged);
        }

        if (data.summary?.text && !resume.summary.text) {
            store.updateSummary(data.summary);
        }

        if (data.experience?.length) {
            const existing = resume.experience;
            data.experience.forEach(e => {
                if (!e.id) e.id = crypto.randomUUID();
                e.bullets = (e.bullets || []).map(b => {
                    if (typeof b === 'string') return { id: crypto.randomUUID(), text: b, tags: [], metrics: [] };
                    if (!b.id) b.id = crypto.randomUUID();
                    return b;
                });
                existing.push(e);
            });
            store.updateSection('experience', existing);
        }

        if (data.education?.length) {
            const existing = resume.education;
            data.education.forEach(e => {
                if (!e.id) e.id = crypto.randomUUID();
                existing.push(e);
            });
            store.updateSection('education', existing);
        }

        if (data.skills) {
            const existing = resume.skills;
            ['technical', 'soft', 'languages'].forEach(type => {
                if (data.skills[type]?.length) {
                    const names = new Set((existing[type] || []).map(s => s.name.toLowerCase()));
                    data.skills[type].forEach(s => {
                        if (typeof s === 'string') s = { name: s, proficiency: 'intermediate', category: 'general' };
                        if (!s.id) s.id = crypto.randomUUID();
                        if (!names.has(s.name.toLowerCase())) {
                            existing[type] = existing[type] || [];
                            existing[type].push(s);
                        }
                    });
                }
            });
            store.updateSection('skills', existing);
        }

        if (data.certifications?.length) {
            const existing = resume.certifications;
            data.certifications.forEach(c => {
                if (!c.id) c.id = crypto.randomUUID();
                existing.push(c);
            });
            store.updateSection('certifications', existing);
        }

        if (data.projects?.length) {
            const existing = resume.projects;
            data.projects.forEach(p => {
                if (!p.id) p.id = crypto.randomUUID();
                existing.push(p);
            });
            store.updateSection('projects', existing);
        }

        showToast('Data imported and merged!', 'success');
    }

    // Experience events
    function attachExperienceEvents() {
        page.querySelector('#add-experience')?.addEventListener('click', () => {
            saveExperienceEntries();
            store.addExperience(createExperienceEntry());
            render();
        });

        page.querySelectorAll('.exp-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('[data-exp-id]');
                const id = card.dataset.expId;
                store.removeExperience(id);
                render();
            });
        });

        page.querySelectorAll('.exp-add-bullet').forEach(btn => {
            btn.addEventListener('click', () => {
                saveExperienceEntries();
                const card = btn.closest('[data-exp-id]');
                const id = card.dataset.expId;
                const exp = store.getResume().experience.find(e => e.id === id);
                if (exp) {
                    exp.bullets.push(createBulletPoint());
                    store.updateExperience(id, { bullets: exp.bullets });
                    render();
                }
            });
        });

        // Individual bullet enhance
        page.querySelectorAll('.bullet-enhance').forEach(btn => {
            btn.addEventListener('click', async () => {
                const bulletRow = btn.closest('.bullet-row');
                const textarea = bulletRow.querySelector('.bullet-text');
                if (!textarea.value.trim()) return;

                btn.disabled = true;
                btn.textContent = '⏳';
                try {
                    const enhanced = await enhanceBulletPoint(textarea.value);
                    textarea.value = enhanced;
                    showToast('Bullet point enhanced!', 'success');
                } catch (err) {
                    showToast(err.message, 'error');
                }
                btn.disabled = false;
                btn.textContent = '✦';
            });
        });

        // Enhance all bullets in an entry
        page.querySelectorAll('.exp-enhance-all').forEach(btn => {
            btn.addEventListener('click', async () => {
                const card = btn.closest('[data-exp-id]');
                const textareas = card.querySelectorAll('.bullet-text');
                btn.disabled = true;
                btn.textContent = '⏳ Enhancing...';

                for (const ta of textareas) {
                    if (ta.value.trim()) {
                        try {
                            ta.value = await enhanceBulletPoint(ta.value);
                        } catch { /* skip */ }
                    }
                }

                btn.disabled = false;
                btn.textContent = '✦ Enhance All';
                showToast('All bullet points enhanced!', 'success');
            });
        });

        // Current checkbox
        page.querySelectorAll('.exp-current').forEach(cb => {
            cb.addEventListener('change', () => {
                const card = cb.closest('[data-exp-id]');
                const endDateInput = card.querySelector('[data-field="endDate"]');
                endDateInput.disabled = cb.checked;
                if (cb.checked) endDateInput.value = '';
            });
        });
    }

    // Education events
    function attachEducationEvents() {
        page.querySelector('#add-education')?.addEventListener('click', () => {
            saveEducationEntries();
            store.addEducation(createEducationEntry());
            render();
        });

        page.querySelectorAll('.edu-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.closest('[data-edu-id]').dataset.eduId;
                store.removeEducation(id);
                render();
            });
        });
    }

    // Skills events
    function attachSkillsEvents() {
        function addSkillTag(type, inputId, containerId) {
            const input = page.querySelector(`#${inputId}`);
            const container = page.querySelector(`#${containerId}`);

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    e.preventDefault();
                    const name = input.value.trim();
                    const skills = store.getResume().skills;
                    const existing = (skills[type] || []).map(s => s.name.toLowerCase());
                    if (!existing.includes(name.toLowerCase())) {
                        store.addSkill(type, createSkillEntry(name));
                        render();
                    }
                    input.value = '';
                }
            });

            // Click on container focuses input
            container.addEventListener('click', () => input.focus());
        }

        addSkillTag('technical', 'tech-skill-input', 'tech-skills-container');
        addSkillTag('soft', 'soft-skill-input', 'soft-skills-container');
        addSkillTag('languages', 'lang-skill-input', 'lang-skills-container');

        // Remove tags
        page.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.skillType;
                const name = btn.dataset.skillName;
                const skills = store.getResume().skills[type].filter(s => s.name !== name);
                store.updateSkills(type, skills);
                render();
            });
        });

        // AI suggest
        page.querySelector('#ai-suggest-skills')?.addEventListener('click', async () => {
            const btn = page.querySelector('#ai-suggest-skills');
            const techSkills = store.getResume().skills.technical || [];
            if (!techSkills.length) return showToast('Add some skills first for suggestions', 'warning');

            btn.disabled = true;
            btn.textContent = '⏳ Suggesting...';

            try {
                const suggestions = await suggestSkills(techSkills);
                const suggestionsDiv = page.querySelector('#skill-suggestions');
                const existingNames = techSkills.map(s => s.name.toLowerCase());

                const filtered = suggestions.filter(s => !existingNames.includes(s.toLowerCase()));

                if (filtered.length > 0) {
                    suggestionsDiv.innerHTML = `
            <span class="suggestion-label">✦ Suggestions:</span>
            ${filtered.map(s => `<span class="tag tag-suggestion" data-suggest="${s}">+ ${s}</span>`).join('')}
          `;

                    suggestionsDiv.querySelectorAll('.tag-suggestion').forEach(tag => {
                        tag.addEventListener('click', () => {
                            store.addSkill('technical', createSkillEntry(tag.dataset.suggest));
                            tag.remove();
                            render();
                        });
                    });
                } else {
                    suggestionsDiv.innerHTML = '<span class="form-hint">No new suggestions found.</span>';
                }
            } catch (err) {
                showToast(err.message, 'error');
            }

            btn.disabled = false;
            btn.textContent = '✦ AI Suggest';
        });
    }

    // Projects events
    function attachProjectsEvents() {
        page.querySelector('#add-project')?.addEventListener('click', () => {
            saveProjectEntries();
            store.addProject(createProjectEntry());
            render();
        });

        page.querySelectorAll('.proj-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.closest('[data-proj-id]').dataset.projId;
                store.removeProject(id);
                render();
            });
        });

        page.querySelectorAll('.proj-add-bullet').forEach(btn => {
            btn.addEventListener('click', () => {
                saveProjectEntries();
                const card = btn.closest('[data-proj-id]');
                const id = card.dataset.projId;
                const proj = store.getResume().projects.find(p => p.id === id);
                if (proj) {
                    proj.bullets = proj.bullets || [];
                    proj.bullets.push({ id: crypto.randomUUID(), text: '' });
                    store.updateProject(id, { bullets: proj.bullets });
                    render();
                }
            });
        });
    }

    // Certs events
    function attachCertsEvents() {
        page.querySelector('#add-cert')?.addEventListener('click', () => {
            saveCertEntries();
            store.addCertification(createCertificationEntry());
            render();
        });

        page.querySelectorAll('.cert-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.closest('[data-cert-id]').dataset.certId;
                store.removeCertification(id);
                render();
            });
        });
    }

    // Summary events
    function attachSummaryEvents() {
        page.querySelector('#ai-generate-summary')?.addEventListener('click', async () => {
            const btn = page.querySelector('#ai-generate-summary');
            const resume = store.getResume();

            if (!resume.experience.length && !(resume.skills.technical || []).length) {
                return showToast('Add some experience and skills first', 'warning');
            }

            btn.disabled = true;
            btn.textContent = '⏳ Generating...';

            try {
                const summary = await generateSummary(resume.experience, resume.skills);
                const textarea = page.querySelector('#summary-text');
                textarea.value = summary;

                // Add to variants
                const variants = resume.summary.variants || [];
                variants.push(summary);
                store.updateSummary({ text: summary, variants });
                render();
                showToast('Summary generated!', 'success');
            } catch (err) {
                showToast(err.message, 'error');
            }

            btn.disabled = false;
            btn.textContent = '✦ AI Generate';
        });

        page.querySelectorAll('.summary-variant').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.variantIdx);
                const variants = store.getResume().summary.variants || [];
                const textarea = page.querySelector('#summary-text');
                textarea.value = variants[idx] || '';
            });
        });
    }

    render();
    return page;
}
