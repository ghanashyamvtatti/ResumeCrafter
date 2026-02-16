/**
 * Export service — generates PDF and DOCX from resume data.
 */
import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Export resume as PDF using html2pdf.js (dynamic import for code splitting).
 */
export async function exportPDF(resumeHTML, filename = 'resume.pdf') {
    const html2pdf = (await import('html2pdf.js')).default;

    const options = {
        margin: [0.5, 0.6, 0.5, 0.6],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
        },
        jsPDF: {
            unit: 'in',
            format: 'letter',
            orientation: 'portrait',
        },
        pagebreak: { mode: 'avoid-all' },
    };

    // Create a temp container
    const wrapper = document.createElement('div');
    wrapper.innerHTML = resumeHTML;
    wrapper.style.cssText = `
    font-family: 'Inter', Arial, sans-serif;
    color: #1a1a2e;
    background: white;
    padding: 0;
    width: 7.3in;
    font-size: 11pt;
    line-height: 1.4;
  `;
    document.body.appendChild(wrapper);

    try {
        await html2pdf().set(options).from(wrapper).save();
    } finally {
        document.body.removeChild(wrapper);
    }
}

/**
 * Export resume as DOCX.
 */
export async function exportDOCX(resumeData, filename = 'resume.docx') {
    const sections = [];

    // Helper for section divider
    const divider = () => new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' } },
        spacing: { before: 100, after: 200 },
    });

    // Contact
    const contact = resumeData.contact || {};
    sections.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
                new TextRun({ text: contact.fullName || 'Your Name', bold: true, size: 28, font: 'Arial' }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
                new TextRun({
                    text: [contact.email, contact.phone, contact.location].filter(Boolean).join(' | '),
                    size: 20,
                    font: 'Arial',
                    color: '555555',
                }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
                new TextRun({
                    text: [contact.linkedin, contact.portfolio, contact.github].filter(Boolean).join(' | '),
                    size: 18,
                    font: 'Arial',
                    color: '0066cc',
                }),
            ],
        })
    );

    // Summary
    if (resumeData.summary?.text) {
        sections.push(
            divider(),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 100, after: 100 },
                children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true, size: 22, font: 'Arial' })],
            }),
            new Paragraph({
                spacing: { after: 100 },
                children: [new TextRun({ text: resumeData.summary.text, size: 20, font: 'Arial' })],
            })
        );
    }

    // Experience
    const experience = resumeData.experience || [];
    if (experience.length > 0) {
        sections.push(
            divider(),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 100, after: 100 },
                children: [new TextRun({ text: 'WORK EXPERIENCE', bold: true, size: 22, font: 'Arial' })],
            })
        );

        for (const exp of experience) {
            sections.push(
                new Paragraph({
                    spacing: { before: 120, after: 40 },
                    children: [
                        new TextRun({ text: exp.title || '', bold: true, size: 21, font: 'Arial' }),
                        new TextRun({ text: ` at ${exp.company || ''}`, size: 21, font: 'Arial' }),
                    ],
                }),
                new Paragraph({
                    spacing: { after: 60 },
                    children: [
                        new TextRun({
                            text: `${exp.location || ''} | ${exp.startDate || ''} – ${exp.current ? 'Present' : exp.endDate || ''}`,
                            size: 18,
                            font: 'Arial',
                            color: '777777',
                            italics: true,
                        }),
                    ],
                })
            );

            const bullets = exp.bullets || [];
            for (const bullet of bullets) {
                const text = typeof bullet === 'string' ? bullet : bullet.text;
                if (text) {
                    sections.push(
                        new Paragraph({
                            bullet: { level: 0 },
                            spacing: { after: 40 },
                            children: [new TextRun({ text, size: 20, font: 'Arial' })],
                        })
                    );
                }
            }
        }
    }

    // Education
    const education = resumeData.education || [];
    if (education.length > 0) {
        sections.push(
            divider(),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 100, after: 100 },
                children: [new TextRun({ text: 'EDUCATION', bold: true, size: 22, font: 'Arial' })],
            })
        );

        for (const edu of education) {
            sections.push(
                new Paragraph({
                    spacing: { before: 80, after: 40 },
                    children: [
                        new TextRun({ text: `${edu.degree || ''} in ${edu.field || ''}`, bold: true, size: 21, font: 'Arial' }),
                    ],
                }),
                new Paragraph({
                    spacing: { after: 40 },
                    children: [
                        new TextRun({
                            text: `${edu.institution || ''} | ${edu.startDate || ''} – ${edu.endDate || ''}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`,
                            size: 18,
                            font: 'Arial',
                            color: '777777',
                            italics: true,
                        }),
                    ],
                })
            );
        }
    }

    // Skills
    const skills = resumeData.skills || {};
    const techSkills = (skills.technical || []).map(s => typeof s === 'string' ? s : s.name).filter(Boolean);
    const softSkills = (skills.soft || []).map(s => typeof s === 'string' ? s : s.name).filter(Boolean);

    if (techSkills.length > 0 || softSkills.length > 0) {
        sections.push(
            divider(),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 100, after: 100 },
                children: [new TextRun({ text: 'SKILLS', bold: true, size: 22, font: 'Arial' })],
            })
        );

        if (techSkills.length > 0) {
            sections.push(
                new Paragraph({
                    spacing: { after: 40 },
                    children: [
                        new TextRun({ text: 'Technical: ', bold: true, size: 20, font: 'Arial' }),
                        new TextRun({ text: techSkills.join(', '), size: 20, font: 'Arial' }),
                    ],
                })
            );
        }

        if (softSkills.length > 0) {
            sections.push(
                new Paragraph({
                    spacing: { after: 40 },
                    children: [
                        new TextRun({ text: 'Soft Skills: ', bold: true, size: 20, font: 'Arial' }),
                        new TextRun({ text: softSkills.join(', '), size: 20, font: 'Arial' }),
                    ],
                })
            );
        }
    }

    // Certifications
    const certs = resumeData.certifications || [];
    if (certs.length > 0) {
        sections.push(
            divider(),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 100, after: 100 },
                children: [new TextRun({ text: 'CERTIFICATIONS', bold: true, size: 22, font: 'Arial' })],
            })
        );

        for (const cert of certs) {
            sections.push(
                new Paragraph({
                    bullet: { level: 0 },
                    spacing: { after: 40 },
                    children: [
                        new TextRun({ text: cert.name || '', bold: true, size: 20, font: 'Arial' }),
                        new TextRun({ text: ` — ${cert.issuer || ''}${cert.date ? ` (${cert.date})` : ''}`, size: 20, font: 'Arial' }),
                    ],
                })
            );
        }
    }

    // Projects
    const projects = resumeData.projects || [];
    if (projects.length > 0) {
        sections.push(
            divider(),
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 100, after: 100 },
                children: [new TextRun({ text: 'PROJECTS', bold: true, size: 22, font: 'Arial' })],
            })
        );

        for (const proj of projects) {
            sections.push(
                new Paragraph({
                    spacing: { before: 80, after: 40 },
                    children: [
                        new TextRun({ text: proj.name || '', bold: true, size: 21, font: 'Arial' }),
                        new TextRun({
                            text: proj.technologies?.length ? ` (${proj.technologies.join(', ')})` : '',
                            size: 18, font: 'Arial', color: '777777',
                        }),
                    ],
                })
            );

            if (proj.description) {
                sections.push(
                    new Paragraph({
                        spacing: { after: 40 },
                        children: [new TextRun({ text: proj.description, size: 20, font: 'Arial' })],
                    })
                );
            }

            const projBullets = proj.bullets || [];
            for (const bullet of projBullets) {
                const text = typeof bullet === 'string' ? bullet : bullet.text;
                if (text) {
                    sections.push(
                        new Paragraph({
                            bullet: { level: 0 },
                            spacing: { after: 40 },
                            children: [new TextRun({ text, size: 20, font: 'Arial' })],
                        })
                    );
                }
            }
        }
    }

    // Build document
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: { top: 720, bottom: 720, left: 720, right: 720 },
                },
            },
            children: sections,
        }],
    });

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, filename);
}

/**
 * Generate ATS-friendly HTML for resume preview and PDF export.
 */
export function generateResumeHTML(resumeData) {
    const contact = resumeData.contact || {};
    const summary = resumeData.summary?.text || '';
    const experience = resumeData.experience || [];
    const education = resumeData.education || [];
    const skills = resumeData.skills || {};
    const certs = resumeData.certifications || [];
    const projects = resumeData.projects || [];

    const contactLinks = [contact.email, contact.phone, contact.location].filter(Boolean).join(' · ');
    const webLinks = [contact.linkedin, contact.portfolio, contact.github].filter(Boolean).join(' · ');

    const techSkills = (skills.technical || []).map(s => typeof s === 'string' ? s : s.name).filter(Boolean);
    const softSkills = (skills.soft || []).map(s => typeof s === 'string' ? s : s.name).filter(Boolean);

    return `
    <div style="font-family: 'Inter', Arial, Helvetica, sans-serif; color: #1a1a2e; max-width: 7.5in; margin: 0 auto; font-size: 10.5pt; line-height: 1.35;">
      <!-- Contact -->
      <div style="text-align: center; margin-bottom: 8px;">
        <h1 style="font-size: 20pt; font-weight: 800; margin: 0 0 4px 0; color: #1a1a2e; letter-spacing: -0.5px;">${contact.fullName || 'Your Name'}</h1>
        <div style="font-size: 9.5pt; color: #555; margin-bottom: 2px;">${contactLinks}</div>
        ${webLinks ? `<div style="font-size: 9pt; color: #0066cc;">${webLinks}</div>` : ''}
      </div>

      ${summary ? `
      <!-- Summary -->
      <div style="border-top: 1.5px solid #1a1a2e; padding-top: 8px; margin-top: 6px;">
        <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0; color: #1a1a2e;">Professional Summary</h2>
        <p style="margin: 0; font-size: 10pt; color: #333;">${summary}</p>
      </div>` : ''}

      ${experience.length > 0 ? `
      <!-- Experience -->
      <div style="border-top: 1.5px solid #1a1a2e; padding-top: 8px; margin-top: 10px;">
        <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0; color: #1a1a2e;">Work Experience</h2>
        ${experience.map(exp => `
          <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <div>
                <span style="font-weight: 700; font-size: 10.5pt;">${exp.title || ''}</span>
                <span style="color: #555;"> at </span>
                <span style="font-weight: 600;">${exp.company || ''}</span>
              </div>
              <span style="font-size: 9pt; color: #777; white-space: nowrap;">${exp.startDate || ''} – ${exp.current ? 'Present' : exp.endDate || ''}</span>
            </div>
            ${exp.location ? `<div style="font-size: 9pt; color: #777; font-style: italic;">${exp.location}</div>` : ''}
            <ul style="margin: 4px 0 0 0; padding-left: 18px;">
              ${(exp.bullets || []).map(b => {
        const text = typeof b === 'string' ? b : b.text;
        return text ? `<li style="margin-bottom: 2px; font-size: 10pt; color: #333;">${text}</li>` : '';
    }).join('')}
            </ul>
          </div>
        `).join('')}
      </div>` : ''}

      ${education.length > 0 ? `
      <!-- Education -->
      <div style="border-top: 1.5px solid #1a1a2e; padding-top: 8px; margin-top: 10px;">
        <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0; color: #1a1a2e;">Education</h2>
        ${education.map(edu => `
          <div style="margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <div>
                <span style="font-weight: 700; font-size: 10.5pt;">${edu.degree || ''} ${edu.field ? `in ${edu.field}` : ''}</span>
              </div>
              <span style="font-size: 9pt; color: #777; white-space: nowrap;">${edu.startDate || ''} – ${edu.endDate || ''}</span>
            </div>
            <div style="font-size: 9.5pt; color: #555;">${edu.institution || ''}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}${edu.honors ? ` | ${edu.honors}` : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}

      ${techSkills.length > 0 || softSkills.length > 0 ? `
      <!-- Skills -->
      <div style="border-top: 1.5px solid #1a1a2e; padding-top: 8px; margin-top: 10px;">
        <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0; color: #1a1a2e;">Skills</h2>
        ${techSkills.length > 0 ? `<p style="margin: 0 0 3px 0; font-size: 10pt;"><strong>Technical:</strong> ${techSkills.join(', ')}</p>` : ''}
        ${softSkills.length > 0 ? `<p style="margin: 0; font-size: 10pt;"><strong>Soft Skills:</strong> ${softSkills.join(', ')}</p>` : ''}
      </div>` : ''}

      ${certs.length > 0 ? `
      <!-- Certifications -->
      <div style="border-top: 1.5px solid #1a1a2e; padding-top: 8px; margin-top: 10px;">
        <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0; color: #1a1a2e;">Certifications</h2>
        <ul style="margin: 0; padding-left: 18px;">
          ${certs.map(c => `<li style="margin-bottom: 2px; font-size: 10pt;"><strong>${c.name || ''}</strong> — ${c.issuer || ''}${c.date ? ` (${c.date})` : ''}</li>`).join('')}
        </ul>
      </div>` : ''}

      ${projects.length > 0 ? `
      <!-- Projects -->
      <div style="border-top: 1.5px solid #1a1a2e; padding-top: 8px; margin-top: 10px;">
        <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0; color: #1a1a2e;">Projects</h2>
        ${projects.map(p => `
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 700; font-size: 10.5pt;">${p.name || ''}</span>
            ${p.technologies?.length ? `<span style="font-size: 9pt; color: #777;"> (${p.technologies.join(', ')})</span>` : ''}
            ${p.description ? `<div style="font-size: 10pt; color: #333; margin-top: 2px;">${p.description}</div>` : ''}
            ${(p.bullets || []).length > 0 ? `
            <ul style="margin: 3px 0 0 0; padding-left: 18px;">
              ${p.bullets.map(b => {
        const text = typeof b === 'string' ? b : b.text;
        return text ? `<li style="margin-bottom: 2px; font-size: 10pt; color: #333;">${text}</li>` : '';
    }).join('')}
            </ul>` : ''}
          </div>
        `).join('')}
      </div>` : ''}
    </div>
  `;
}

/**
 * Download master resume as JSON.
 */
export function downloadJSON(data, filename = 'master-resume.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, filename);
}
