/**
 * Resume tailoring service — uses AI to cherry-pick from master resume
 * based on a job description.
 */
import { chat, isConfigured } from './llm-service.js';

/**
 * Analyze a job description and tailor a resume.
 */
export async function tailorResume(masterResume, jobDescription) {
    if (!isConfigured()) throw new Error('Please configure your AI provider first.');

    const response = await chat([
        {
            role: 'system',
            content: `You are an expert ATS resume optimizer. Given a master resume (with all career data) and a job description, create the most effective single-page resume by:

1. Cherry-picking the most relevant experience, skills, projects, and achievements
2. Rewriting bullet points to match the job's keywords and requirements
3. Crafting a targeted professional summary
4. Prioritizing items that demonstrate direct relevance to the role
5. Ensuring ATS-friendliness: standard section names, keyword optimization, quantified achievements

Return the tailored resume as valid JSON matching this schema:
{
  "contact": { "fullName": "", "email": "", "phone": "", "location": "", "linkedin": "", "portfolio": "", "github": "" },
  "summary": { "text": "" },
  "experience": [{ "company": "", "title": "", "location": "", "startDate": "", "endDate": "", "current": false, "bullets": [{ "text": "" }] }],
  "education": [{ "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "gpa": "", "honors": "" }],
  "skills": { "technical": [{ "name": "" }], "soft": [{ "name": "" }] },
  "certifications": [{ "name": "", "issuer": "", "date": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [], "bullets": [{ "text": "" }] }]
}

Rules:
- Select at most 3-4 experience entries with 3-4 bullets each
- Include 8-12 most relevant technical skills
- Include only relevant certifications and projects
- Keep content concise enough for a single page
- Return ONLY valid JSON, no markdown or explanation.`
        },
        {
            role: 'user',
            content: `MASTER RESUME:\n${JSON.stringify(masterResume, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription}`
        }
    ], { temperature: 0.2, maxTokens: 4096 });

    try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        throw new Error('Failed to parse tailored resume. Please try again.');
    }
}

/**
 * Extract job description from a URL (via CORS proxy).
 */
export async function fetchJobDescription(url) {
    try {
        // Try fetching via CORS proxy
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const html = await res.text();

        // Basic HTML to text extraction
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Remove scripts, styles, nav, footer
        doc.querySelectorAll('script, style, nav, footer, header, aside').forEach(el => el.remove());

        // Get main content
        const main = doc.querySelector('main, article, [role="main"], .job-description, #job-description')
            || doc.body;

        return main.textContent
            .replace(/\s+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    } catch (e) {
        throw new Error(`Could not fetch job description from URL. Please paste the text directly. Error: ${e.message}`);
    }
}
