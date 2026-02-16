/**
 * AI Enhancement service — uses LLMs to enhance resume content.
 */
import { chat, isConfigured } from './llm-service.js';

/**
 * Parse unstructured text into resume sections.
 */
export async function parseTextToResume(text) {
    if (!isConfigured()) throw new Error('Please configure your AI provider first.');

    const response = await chat([
        {
            role: 'system',
            content: `You are a resume data extraction expert. Extract structured resume data from the provided text and return it as valid JSON matching EXACTLY this schema (use empty arrays/strings for missing data):
{
  "contact": { "fullName": "", "email": "", "phone": "", "location": "", "linkedin": "", "portfolio": "", "github": "" },
  "summary": { "text": "" },
  "experience": [{ "company": "", "title": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "current": false, "bullets": [{ "text": "" }], "skills": [] }],
  "education": [{ "institution": "", "degree": "", "field": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "gpa": "", "honors": "" }],
  "skills": { "technical": [{ "name": "", "proficiency": "intermediate", "category": "general" }], "soft": [{ "name": "" }], "languages": [{ "name": "", "proficiency": "" }] },
  "certifications": [{ "name": "", "issuer": "", "date": "YYYY-MM", "url": "" }],
  "projects": [{ "name": "", "description": "", "url": "", "technologies": [], "bullets": [{ "text": "" }] }],
  "awards": [{ "name": "", "issuer": "", "date": "", "description": "" }]
}
Return ONLY valid JSON, no markdown or explanation.`
        },
        { role: 'user', content: text }
    ], { temperature: 0.1 });

    try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        // Add IDs to entries
        addIds(parsed);
        return parsed;
    } catch (e) {
        throw new Error('Failed to parse AI response. Please try again.');
    }
}

/**
 * Suggest related skills based on existing skills.
 */
export async function suggestSkills(existingSkills) {
    if (!isConfigured()) throw new Error('Please configure your AI provider first.');
    if (!existingSkills.length) return [];

    const skillNames = existingSkills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean);

    const response = await chat([
        {
            role: 'system',
            content: 'You are a career skills expert. Given existing skills, suggest related skills the person likely also has. Return a JSON array of strings with 5-10 skill names. Return ONLY the JSON array, no explanation.'
        },
        {
            role: 'user',
            content: `My existing skills: ${skillNames.join(', ')}\n\nSuggest related skills I might also have.`
        }
    ], { temperature: 0.5 });

    try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch {
        return [];
    }
}

/**
 * Enhance a bullet point with action verbs and metrics.
 */
export async function enhanceBulletPoint(text) {
    if (!isConfigured()) throw new Error('Please configure your AI provider first.');

    const response = await chat([
        {
            role: 'system',
            content: 'You are a professional resume writer. Rewrite the given bullet point to be more impactful. Use strong action verbs, quantify achievements where possible, and follow the format: "[Action verb] [task/project] [result/impact]". Keep it concise (1-2 lines). Return ONLY the rewritten bullet point, no quotes or explanation.'
        },
        {
            role: 'user',
            content: text
        }
    ], { temperature: 0.3 });

    return response.trim();
}

/**
 * Generate professional summary from experience and skills.
 */
export async function generateSummary(experience, skills) {
    if (!isConfigured()) throw new Error('Please configure your AI provider first.');

    const expSummary = experience.map(e =>
        `${e.title} at ${e.company} (${e.startDate}–${e.current ? 'Present' : e.endDate})`
    ).join('; ');

    const skillNames = [
        ...(skills.technical || []).map(s => s.name),
        ...(skills.soft || []).map(s => s.name),
    ].filter(Boolean).join(', ');

    const response = await chat([
        {
            role: 'system',
            content: 'You are a professional resume writer. Write a compelling 2-3 sentence professional summary for this person. Be specific about their expertise and impact. Return ONLY the summary text, no quotes or explanation.'
        },
        {
            role: 'user',
            content: `Experience: ${expSummary}\nSkills: ${skillNames}`
        }
    ], { temperature: 0.4 });

    return response.trim();
}

/**
 * Enhance parsed resume data from a file upload.
 */
export async function enhanceParsedResume(rawText) {
    return parseTextToResume(rawText);
}

/* ---- Helpers ---- */

function addIds(obj) {
    if (Array.isArray(obj)) {
        obj.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                if (!item.id) item.id = crypto.randomUUID();
                addIds(item);
            }
        });
    } else if (typeof obj === 'object' && obj !== null) {
        for (const key of Object.keys(obj)) {
            if (Array.isArray(obj[key])) {
                addIds(obj[key]);
            }
        }
    }
}
