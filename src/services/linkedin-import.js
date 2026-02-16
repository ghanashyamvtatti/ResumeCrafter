/**
 * LinkedIn data import — processes LinkedIn "Download Your Data" export.
 */
import JSZip from 'jszip';

/**
 * Parse LinkedIn data export ZIP file.
 * LinkedIn exports contain CSVs for each section.
 */
export async function parseLinkedInExport(file) {
    const zip = await JSZip.loadAsync(file);

    const result = {
        profile: null,
        positions: [],
        education: [],
        skills: [],
        certifications: [],

    };

    // Parse each CSV file
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;

        const lowerName = filename.toLowerCase();
        const content = await zipEntry.async('string');

        if (lowerName.includes('profile')) {
            result.profile = parseCSV(content);
        } else if (lowerName.includes('position')) {
            result.positions = parseCSV(content);
        } else if (lowerName.includes('education')) {
            result.education = parseCSV(content);
        } else if (lowerName.includes('skill')) {
            result.skills = parseCSV(content);
        } else if (lowerName.includes('certif')) {
            result.certifications = parseCSV(content);
        }
    }

    return mapToResumeSchema(result);
}

/**
 * Simple CSV parser (handles quoted fields).
 */
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => {
            row[h.trim().toLowerCase().replace(/\s+/g, '_')] = (values[idx] || '').trim();
        });
        rows.push(row);
    }

    return rows;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

/**
 * Map LinkedIn data to resume schema format.
 */
function mapToResumeSchema(data) {
    const resume = {};

    // Contact
    if (data.profile && data.profile.length > 0) {
        const p = data.profile[0];
        resume.contact = {
            fullName: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
            email: p.email_address || '',
            location: p.location || p.geo_location || '',
            linkedin: p.profile_url || p.public_profile_url || '',
        };

        if (p.summary || p.headline) {
            resume.summary = {
                text: p.summary || p.headline || '',
            };
        }
    }

    // Experience
    if (data.positions.length > 0) {
        resume.experience = data.positions.map(p => ({
            id: crypto.randomUUID(),
            company: p.company_name || p.company || '',
            title: p.title || p.position || '',
            location: p.location || '',
            startDate: formatLinkedInDate(p.started_on || p.start_date || ''),
            endDate: formatLinkedInDate(p.finished_on || p.end_date || ''),
            current: !p.finished_on && !p.end_date,
            bullets: p.description ? [{ id: crypto.randomUUID(), text: p.description, tags: [], metrics: [] }] : [],
            skills: [],
        }));
    }

    // Education
    if (data.education.length > 0) {
        resume.education = data.education.map(e => ({
            id: crypto.randomUUID(),
            institution: e.school_name || e.institution || '',
            degree: e.degree_name || e.degree || '',
            field: e.field_of_study || e.notes || '',
            startDate: formatLinkedInDate(e.start_date || ''),
            endDate: formatLinkedInDate(e.end_date || ''),
            gpa: '',
            honors: e.activities || '',
        }));
    }

    // Skills
    if (data.skills.length > 0) {
        resume.skills = {
            technical: data.skills.map(s => ({
                id: crypto.randomUUID(),
                name: s.name || s.skill || '',
                proficiency: 'intermediate',
                category: 'general',
                relatedSkills: [],
            })),
        };
    }

    // Certifications
    if (data.certifications.length > 0) {
        resume.certifications = data.certifications.map(c => ({
            id: crypto.randomUUID(),
            name: c.name || c.certification || '',
            issuer: c.authority || c.organization || '',
            date: formatLinkedInDate(c.started_on || c.start_date || ''),
            url: c.url || '',
        }));
    }

    return resume;
}

function formatLinkedInDate(dateStr) {
    if (!dateStr) return '';
    // LinkedIn dates are often like "Jan 2020" or "2020-01"
    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return d.toISOString().slice(0, 7); // YYYY-MM
        }
    } catch { /* ignore */ }
    return dateStr;
}
