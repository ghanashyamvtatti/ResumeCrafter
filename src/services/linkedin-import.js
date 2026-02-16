/**
 * LinkedIn Profile PDF import — parses the "Save as PDF" profile export.
 *
 * LinkedIn's profile PDF has a predictable layout:
 *   Contact | Top Skills | Languages | Certifications | Name + Headline
 *   Summary | Experience (entries) | Education (entries)
 *
 * We extract text via pdfjs-dist (already used for resume uploads) and
 * then use section-header detection to split and parse each block.
 */
import { extractTextFromFile } from './file-parser.js';

/**
 * Parse a LinkedIn Profile PDF file and return structured resume data.
 */
export async function parseLinkedInExport(file) {
    const rawText = await extractTextFromFile(file);
    return parseLinkedInProfileText(rawText);
}

/**
 * Core parser — works on the extracted plain-text from the PDF.
 */
export function parseLinkedInProfileText(text) {
    // Normalise whitespace but keep newlines
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const full = lines.join('\n');

    const resume = {};

    // ---- Contact ----
    resume.contact = parseContact(full, lines);

    // ---- Top Skills ----
    resume.skills = parseSkills(full);

    // ---- Summary ----
    resume.summary = parseSummary(full);

    // ---- Experience ----
    resume.experience = parseExperience(full);

    // ---- Education ----
    resume.education = parseEducation(full);

    // ---- Certifications ----
    resume.certifications = parseCertifications(full);

    // ---- Languages (stored as skill.languages) ----
    const langs = parseLanguages(full);
    if (langs.length > 0) {
        resume.skills = resume.skills || { technical: [], soft: [], languages: [] };
        resume.skills.languages = langs;
    }

    return resume;
}

/* ---------- Section helpers ---------- */

// Known section headers that appear in LinkedIn profile PDFs
const SECTION_HEADERS = [
    'Contact', 'Top Skills', 'Languages', 'Certifications', 'Honors-Awards',
    'Summary', 'Experience', 'Education', 'Publications', 'Patents',
    'Volunteer Experience', 'Organizations',
];

/**
 * Extract a section's raw text between its header and the next section header.
 */
function extractSection(text, sectionName) {
    // Section headers appear on their own line
    const headerPattern = new RegExp(`^${sectionName}\\s*$`, 'mi');
    const match = headerPattern.exec(text);
    if (!match) return '';

    const start = match.index + match[0].length;

    // Find the next section header
    let nextStart = text.length;
    for (const header of SECTION_HEADERS) {
        if (header === sectionName) continue;
        const nextPattern = new RegExp(`^${header}\\s*$`, 'mi');
        const nextMatch = nextPattern.exec(text.slice(start));
        if (nextMatch && (start + nextMatch.index) < nextStart) {
            nextStart = start + nextMatch.index;
        }
    }

    // Also stop at "Page X of Y" footers
    const pageFooter = /^Page \d+ of \d+/mi;
    const pageMatch = pageFooter.exec(text.slice(start));
    if (pageMatch && (start + pageMatch.index) < nextStart) {
        nextStart = start + pageMatch.index;
    }

    return text.slice(start, nextStart).trim();
}

/* ---- Contact ---- */
function parseContact(full, lines) {
    const contact = {};

    // Name is typically the first prominent line (before the headline)
    // In LinkedIn PDFs the name appears as a standalone line near the top
    // We look for lines before "Summary" or "Experience" that look like a name
    const contactSection = extractSection(full, 'Contact');

    // Extract email
    const emailMatch = contactSection.match(/[\w.+-]+@[\w.-]+\.\w+/);
    if (emailMatch) contact.email = emailMatch[0];

    // Extract LinkedIn URL
    const linkedinMatch = contactSection.match(/(?:www\.)?linkedin\.com\/in\/[\w-]+/);
    if (linkedinMatch) contact.linkedin = linkedinMatch[0];

    // Extract portfolio / other URLs
    const urlMatches = contactSection.match(/[\w.-]+\.(?:github\.io|com|org|net|dev|io)\/?\S*/gi) || [];
    const nonLinkedinUrls = urlMatches.filter(u => !u.includes('linkedin.com'));
    if (nonLinkedinUrls.length > 0) {
        // Check for github
        const ghUrl = nonLinkedinUrls.find(u => u.includes('github'));
        if (ghUrl) contact.github = ghUrl;
        const portfolioUrl = nonLinkedinUrls.find(u => !u.includes('github'));
        if (portfolioUrl) contact.portfolio = portfolioUrl;
    }

    // Name + headline: appears before the first section, typically at the top of the PDF
    // In the extracted text it's usually:  Name\nHeadline\nLocation
    // We look for the name pattern before "Contact" or "Summary"
    const preContact = full.split(/^(?:Contact|Top Skills|Summary)\s*$/mi)[0] || '';
    const preLines = preContact.split('\n').map(l => l.trim()).filter(Boolean);

    // The last substantial block before sections is usually: Name, Title, Location
    if (preLines.length >= 1) {
        // Name is usually the first non-empty meaningful line
        contact.fullName = preLines[0] || '';
    }
    if (preLines.length >= 3) {
        // Location is typically the last line in this block
        contact.location = preLines[preLines.length - 1] || '';
    }

    return contact;
}

/* ---- Skills ---- */
function parseSkills(text) {
    const section = extractSection(text, 'Top Skills');
    if (!section) return { technical: [], soft: [], languages: [] };

    const skillLines = section.split('\n').map(l => l.trim()).filter(Boolean);
    const technical = skillLines.map(name => ({
        id: crypto.randomUUID(),
        name,
        proficiency: 'intermediate',
        category: 'general',
        relatedSkills: [],
    }));

    return { technical, soft: [], languages: [] };
}

/* ---- Languages ---- */
function parseLanguages(text) {
    const section = extractSection(text, 'Languages');
    if (!section) return [];

    return section.split('\n').map(l => l.trim()).filter(Boolean)
        .filter(l => !/^Page \d/i.test(l))
        .map(line => {
            // Lines look like: "English (Full Professional)" or just "English"
            const m = line.match(/^(.+?)\s*\((.+?)\)\s*$/);
            return {
                id: crypto.randomUUID(),
                name: m ? m[1].trim() : line,
                proficiency: m ? m[2].trim() : '',
                category: 'language',
                relatedSkills: [],
            };
        });
}

/* ---- Summary ---- */
function parseSummary(text) {
    const section = extractSection(text, 'Summary');
    return { text: section || '', variants: [] };
}

/* ---- Experience ---- */
function parseExperience(text) {
    const section = extractSection(text, 'Experience');
    if (!section) return [];

    const entries = [];
    const lines = section.split('\n').map(l => l.trim()).filter(Boolean);

    // LinkedIn experience entries follow this pattern:
    // Company Name
    // Title
    // Date range (contains month names and/or years + duration in parens)
    // Location (optional)
    // Description lines (optional)

    // Date pattern: "Month YYYY - Present (X years Y months)" or "Month YYYY - Month YYYY (duration)"
    const datePattern = /^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s*-\s*.+$/i;
    const durationOnlyPattern = /^\w+\s+\d{4}\s+-\s+/;

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        // Skip page footers
        if (/^Page \d+ of \d+/.test(line)) { i++; continue; }

        // Try to detect a new experience entry by finding a date line
        // We look for date patterns and then backtrack to get company/title
        if (datePattern.test(line) || durationOnlyPattern.test(line)) {
            const dateLine = line;
            const entry = createExperienceFromDateLine(dateLine, lines, i);
            if (entry) {
                entries.push(entry);
                // Skip past description lines
                i = entry._endIdx + 1;
                delete entry._endIdx;
                continue;
            }
        }

        i++;
    }

    // If regex-based parsing found nothing, try a simpler heuristic
    if (entries.length === 0) {
        return parseExperienceSimple(lines);
    }

    return entries;
}

function createExperienceFromDateLine(dateLine, lines, dateIdx) {
    // Look backwards for company and title
    let company = '';
    let title = '';
    let location = '';

    // Title is typically the line before the date
    if (dateIdx >= 1) title = lines[dateIdx - 1];
    // Company is the line before title
    if (dateIdx >= 2) company = lines[dateIdx - 2];

    // Parse date range
    const { startDate, endDate, current } = parseDateRange(dateLine);

    // Location is after the date line (if it doesn't look like a description)
    let descStart = dateIdx + 1;
    if (dateIdx + 1 < lines.length) {
        const nextLine = lines[dateIdx + 1];
        // Location lines are typically short and contain geographic info
        if (nextLine.length < 80 && !nextLine.includes('.') && /[A-Z]/.test(nextLine)) {
            // Check if it looks like a location (contains comma or common location words)
            if (nextLine.includes(',') || /(?:United States|Area|City|State|Remote)/i.test(nextLine)) {
                location = nextLine;
                descStart = dateIdx + 2;
            }
        }
    }

    // Collect description lines until the next entry or section
    const descLines = [];
    const datePattern = /^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s*-/i;

    for (let j = descStart; j < lines.length; j++) {
        const l = lines[j];
        if (/^Page \d+ of \d+/.test(l)) continue;

        // Stop if we hit what looks like the next entry's company/title/date
        // Heuristic: if the line after this one or the one after that is a date, stop
        if (j + 1 < lines.length && datePattern.test(lines[j + 1])) break;
        if (j + 2 < lines.length && datePattern.test(lines[j + 2])) break;

        descLines.push(l);
    }

    const description = descLines.join(' ').trim();

    return {
        id: crypto.randomUUID(),
        company,
        title,
        location,
        startDate,
        endDate,
        current,
        bullets: description
            ? [{ id: crypto.randomUUID(), text: description, tags: [], metrics: [] }]
            : [],
        skills: [],
        _endIdx: descStart + descLines.length - 1,
    };
}

function parseExperienceSimple(lines) {
    // Fallback: group consecutive lines into rough entries
    // This is less accurate but better than nothing
    return [];
}

/* ---- Education ---- */
function parseEducation(text) {
    const section = extractSection(text, 'Education');
    if (!section) return [];

    const entries = [];
    const lines = section.split('\n').map(l => l.trim()).filter(Boolean)
        .filter(l => !/^Page \d+ of \d+/i.test(l));

    // Education entries typically:
    // Institution Name
    // Degree, Field · (StartYear - EndYear)
    // or: Degree, Field
    // · (StartYear - EndYear)

    let i = 0;
    while (i < lines.length) {
        const institution = lines[i];
        i++;

        let degree = '';
        let field = '';
        let startDate = '';
        let endDate = '';

        // Try to find degree/field and date range in the next line(s)
        if (i < lines.length) {
            let infoLine = lines[i];

            // Check for date range pattern: "Something · (YYYY - YYYY)"
            const dateInLineMatch = infoLine.match(/^(.+?)\s*·\s*\((\d{4})\s*-\s*(\d{4})\)/);
            const standaloneDateMatch = infoLine.match(/^\s*·?\s*\(?(\d{4})\s*-\s*(\d{4})\)?/);

            if (dateInLineMatch) {
                const degreeField = dateInLineMatch[1].trim();
                startDate = dateInLineMatch[2];
                endDate = dateInLineMatch[3];
                const parts = degreeField.split(',').map(s => s.trim());
                degree = parts[0] || '';
                field = parts.slice(1).join(', ') || '';
                i++;
            } else if (standaloneDateMatch) {
                startDate = standaloneDateMatch[1];
                endDate = standaloneDateMatch[2];
                i++;
            } else {
                // Degree/field line without date
                const parts = infoLine.split(',').map(s => s.trim());
                degree = parts[0] || '';
                field = parts.slice(1).join(', ') || '';
                i++;

                // Check next line for date
                if (i < lines.length) {
                    const nextDateMatch = lines[i].match(/^\s*·?\s*\(?(\d{4})\s*-\s*(\d{4})\)?/);
                    if (nextDateMatch) {
                        startDate = nextDateMatch[1];
                        endDate = nextDateMatch[2];
                        i++;
                    }
                }
            }
        }

        entries.push({
            id: crypto.randomUUID(),
            institution,
            degree,
            field,
            startDate,
            endDate,
            gpa: '',
            honors: '',
        });
    }

    return entries;
}

/* ---- Certifications ---- */
function parseCertifications(text) {
    const section = extractSection(text, 'Certifications');
    if (!section) return [];

    const lines = section.split('\n').map(l => l.trim()).filter(Boolean)
        .filter(l => !/^Page \d+ of \d+/i.test(l));

    return lines.map(name => ({
        id: crypto.randomUUID(),
        name,
        issuer: '',
        date: '',
        url: '',
    }));
}

/* ---- Date utilities ---- */
const MONTHS = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12',
};

function parseDateRange(line) {
    // "June 2021 - Present (4 years 9 months)"
    // "September 2016 - August 2019 (3 years)"
    const match = line.match(
        /(\w+)\s+(\d{4})\s*-\s*(Present|(?:\w+)\s+\d{4})/i
    );

    if (!match) return { startDate: '', endDate: '', current: false };

    const startMonth = MONTHS[match[1].toLowerCase()] || '';
    const startYear = match[2];
    const startDate = startMonth ? `${startYear}-${startMonth}` : startYear;

    const endRaw = match[3].trim();
    const current = /present/i.test(endRaw);
    let endDate = '';

    if (!current) {
        const endMatch = endRaw.match(/(\w+)\s+(\d{4})/);
        if (endMatch) {
            const endMonth = MONTHS[endMatch[1].toLowerCase()] || '';
            endDate = endMonth ? `${endMatch[2]}-${endMonth}` : endMatch[2];
        }
    }

    return { startDate, endDate, current };
}
