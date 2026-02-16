/**
 * Resume preview component — renders ATS-friendly resume preview.
 */
import { generateResumeHTML } from '../services/export-service.js';

export function createResumePreview(resumeData) {
    const container = document.createElement('div');
    container.className = 'resume-preview-container';

    container.innerHTML = `
    <style>
      .resume-preview-container {
        background: white;
        border-radius: var(--radius-xl);
        padding: 40px;
        box-shadow: var(--shadow-xl);
        max-width: 8.5in;
        margin: 0 auto;
        min-height: 11in;
      }
      @media (max-width: 768px) {
        .resume-preview-container {
          padding: 20px;
          border-radius: var(--radius-md);
        }
      }
    </style>
    ${generateResumeHTML(resumeData)}
  `;

    return container;
}
