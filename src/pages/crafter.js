/**
 * Custom Resume Crafter page.
 * Takes a master resume + job description → tailored resume.
 */
import { store } from '../store/resume-store.js';
import { isConfigured } from '../services/llm-service.js';
import { tailorResume, fetchJobDescription } from '../services/resume-tailor.js';
import { exportPDF, exportDOCX, generateResumeHTML } from '../services/export-service.js';
import { showToast } from '../utils/toast.js';

export function renderCrafterPage() {
    const page = document.createElement('div');
    page.className = 'crafter-page';

    let tailoredResume = null;
    let masterResume = store.getResume();

    function render() {
        const hasMaster = masterResume && (masterResume.experience?.length > 0 || masterResume.contact?.fullName);

        page.innerHTML = `
      <style>
        .crafter-page { padding-bottom: var(--space-16); }
        .crafter-header {
          text-align: center;
          padding: var(--space-8) var(--space-6) var(--space-4);
        }
        .crafter-header h1 { font-size: var(--font-3xl); margin-bottom: var(--space-2); }
        .crafter-header p { color: var(--text-tertiary); font-size: var(--font-sm); }
        .crafter-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 var(--space-6);
        }
        .crafter-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
          margin-bottom: var(--space-6);
        }
        @media (max-width: 768px) {
          .crafter-grid { grid-template-columns: 1fr; }
        }
        .jd-section { margin-bottom: var(--space-6); }
        .jd-source-toggle {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
        }
        .preview-section {
          margin-top: var(--space-8);
        }
        .export-bar {
          display: flex;
          gap: var(--space-3);
          justify-content: center;
          margin: var(--space-6) 0;
          flex-wrap: wrap;
        }
        .master-info-card {
          padding: var(--space-4);
          font-size: var(--font-sm);
        }
        .master-info-card .info-row {
          display: flex;
          justify-content: space-between;
          padding: var(--space-1) 0;
          color: var(--text-secondary);
        }
        .master-info-card .info-row strong {
          color: var(--text-primary);
        }
      </style>

      <div class="crafter-header">
        <h1>Craft Your <span class="gradient-text">Perfect Resume</span></h1>
        <p>AI will tailor your master resume for the specific job description</p>
      </div>

      <div class="crafter-content">
        <!-- Master Resume Source -->
        <div class="card mb-6">
          <div class="flex justify-between items-center mb-4">
            <h3 style="font-size: var(--font-lg); font-weight: var(--weight-semibold);">📦 Master Resume</h3>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-sm" id="upload-master">Upload JSON</button>
            </div>
          </div>
          <input type="file" id="master-file-input" accept=".json" style="display:none" />

          ${hasMaster ? `
            <div class="master-info-card card" style="background: var(--color-primary-50); border-color: var(--color-primary-100);">
              <div class="info-row"><span>Name</span><strong>${masterResume.contact?.fullName || 'Not set'}</strong></div>
              <div class="info-row"><span>Experience</span><strong>${masterResume.experience?.length || 0} entries</strong></div>
              <div class="info-row"><span>Skills</span><strong>${(masterResume.skills?.technical?.length || 0) + (masterResume.skills?.soft?.length || 0)} skills</strong></div>
              <div class="info-row"><span>Education</span><strong>${masterResume.education?.length || 0} entries</strong></div>
              <div class="info-row"><span>Last Updated</span><strong>${masterResume.meta?.updatedAt ? new Date(masterResume.meta.updatedAt).toLocaleDateString() : 'N/A'}</strong></div>
            </div>
          ` : `
            <div class="empty-state" style="padding: var(--space-6);">
              <div class="empty-state-icon">📦</div>
              <div class="empty-state-title">No Master Resume Found</div>
              <div class="empty-state-text">Build one in the <a href="#/builder">Builder</a> or upload a JSON file.</div>
            </div>
          `}
        </div>

        <!-- Job Description -->
        <div class="card jd-section">
          <h3 style="font-size: var(--font-lg); font-weight: var(--weight-semibold); margin-bottom: var(--space-4);">📋 Job Description</h3>

          <div class="jd-source-toggle">
            <button class="btn btn-sm jd-tab active" data-source="text">Paste Text</button>
            <button class="btn btn-sm jd-tab" data-source="url">From URL</button>
          </div>

          <div id="jd-text-source">
            <div class="form-group">
              <textarea class="form-textarea" id="jd-input" rows="10" placeholder="Paste the full job description here..."></textarea>
            </div>
          </div>

          <div id="jd-url-source" class="hidden">
            <div class="form-group">
              <div style="display: flex; gap: var(--space-2);">
                <input class="form-input" id="jd-url" placeholder="https://jobs.example.com/posting/123" style="flex: 1;" />
                <button class="btn btn-secondary btn-sm" id="jd-fetch-url">Fetch</button>
              </div>
              <span class="form-hint" id="jd-url-status"></span>
            </div>
          </div>
        </div>

        <!-- Generate Button -->
        <div class="text-center mb-6">
          <button class="btn btn-primary btn-lg" id="generate-resume" ${!hasMaster ? 'disabled' : ''}>
            ✨ Generate Tailored Resume
          </button>
          ${!isConfigured() ? '<p style="font-size: var(--font-xs); color: var(--color-warning); margin-top: var(--space-2);">⚠ Please configure AI provider first</p>' : ''}
        </div>

        <!-- Loading State -->
        <div id="crafter-loading" class="hidden">
          <div class="loading-overlay">
            <div class="spinner spinner-lg"></div>
            <div>AI is crafting your perfect resume...</div>
            <div style="font-size: var(--font-xs); color: var(--text-tertiary);">This may take 15-30 seconds</div>
          </div>
        </div>

        <!-- Preview -->
        <div id="resume-preview-section" class="${tailoredResume ? '' : 'hidden'}">
          <h2 style="font-size: var(--font-2xl); font-weight: var(--weight-bold); text-align: center; margin-bottom: var(--space-6);">
            Your Tailored Resume
          </h2>

          <div class="export-bar">
            <button class="btn btn-primary" id="export-pdf">📄 Download PDF</button>
            <button class="btn btn-secondary" id="export-docx">📝 Download DOCX</button>
          </div>

          <div id="resume-preview-content">
            ${tailoredResume ? `
              <div style="background: white; border-radius: var(--radius-xl); padding: 40px; box-shadow: var(--shadow-xl); max-width: 8.5in; margin: 0 auto;">
                ${generateResumeHTML(tailoredResume)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

        attachCrafterEvents();
    }

    function attachCrafterEvents() {
        // Upload master JSON
        const fileInput = page.querySelector('#master-file-input');
        page.querySelector('#upload-master')?.addEventListener('click', () => fileInput.click());
        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                masterResume = JSON.parse(text);
                showToast('Master resume loaded!', 'success');
                render();
            } catch {
                showToast('Invalid JSON file', 'error');
            }
        });

        // JD source toggle
        page.querySelectorAll('.jd-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                page.querySelectorAll('.jd-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const source = tab.dataset.source;
                page.querySelector('#jd-text-source').classList.toggle('hidden', source !== 'text');
                page.querySelector('#jd-url-source').classList.toggle('hidden', source !== 'url');
            });
        });

        // Fetch JD from URL
        page.querySelector('#jd-fetch-url')?.addEventListener('click', async () => {
            const url = page.querySelector('#jd-url').value.trim();
            if (!url) return showToast('Please enter a URL', 'warning');
            const status = page.querySelector('#jd-url-status');
            status.textContent = 'Fetching...';

            try {
                const text = await fetchJobDescription(url);
                page.querySelector('#jd-input').value = text;
                // Switch to text tab to show the fetched content
                page.querySelectorAll('.jd-tab').forEach(t => t.classList.remove('active'));
                page.querySelector('[data-source="text"]').classList.add('active');
                page.querySelector('#jd-text-source').classList.remove('hidden');
                page.querySelector('#jd-url-source').classList.add('hidden');
                status.textContent = '';
                showToast('Job description fetched!', 'success');
            } catch (err) {
                status.textContent = err.message;
                status.style.color = 'var(--color-error)';
                showToast('Failed to fetch URL', 'error');
            }
        });

        // Generate resume
        page.querySelector('#generate-resume')?.addEventListener('click', async () => {
            const jd = page.querySelector('#jd-input')?.value?.trim();
            if (!jd) return showToast('Please provide a job description', 'warning');
            if (!isConfigured()) return showToast('Please configure AI provider first', 'warning');

            const loading = page.querySelector('#crafter-loading');
            const previewSection = page.querySelector('#resume-preview-section');
            const generateBtn = page.querySelector('#generate-resume');

            loading.classList.remove('hidden');
            previewSection.classList.add('hidden');
            generateBtn.disabled = true;
            generateBtn.textContent = '⏳ Generating...';

            try {
                tailoredResume = await tailorResume(masterResume, jd);

                // Make sure contact info is preserved
                if (!tailoredResume.contact?.fullName && masterResume.contact?.fullName) {
                    tailoredResume.contact = masterResume.contact;
                }

                loading.classList.add('hidden');
                render();
                showToast('Resume crafted successfully!', 'success');
            } catch (err) {
                loading.classList.add('hidden');
                generateBtn.disabled = false;
                generateBtn.textContent = '✨ Generate Tailored Resume';
                showToast(err.message, 'error');
            }
        });

        // Export PDF
        page.querySelector('#export-pdf')?.addEventListener('click', async () => {
            if (!tailoredResume) return;
            const btn = page.querySelector('#export-pdf');
            btn.disabled = true;
            btn.textContent = '⏳ Generating PDF...';

            try {
                const html = generateResumeHTML(tailoredResume);
                const name = tailoredResume.contact?.fullName?.replace(/\s/g, '_') || 'resume';
                await exportPDF(html, `${name}_resume.pdf`);
                showToast('PDF downloaded!', 'success');
            } catch (err) {
                showToast('PDF export failed: ' + err.message, 'error');
            }

            btn.disabled = false;
            btn.textContent = '📄 Download PDF';
        });

        // Export DOCX
        page.querySelector('#export-docx')?.addEventListener('click', async () => {
            if (!tailoredResume) return;
            const btn = page.querySelector('#export-docx');
            btn.disabled = true;
            btn.textContent = '⏳ Generating DOCX...';

            try {
                const name = tailoredResume.contact?.fullName?.replace(/\s/g, '_') || 'resume';
                await exportDOCX(tailoredResume, `${name}_resume.docx`);
                showToast('DOCX downloaded!', 'success');
            } catch (err) {
                showToast('DOCX export failed: ' + err.message, 'error');
            }

            btn.disabled = false;
            btn.textContent = '📝 Download DOCX';
        });
    }

    render();
    return page;
}
