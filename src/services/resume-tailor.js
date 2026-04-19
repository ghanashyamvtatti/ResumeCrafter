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
            content: `You are an expert ATS resume optimizer. Given a master resume and a job description, produce a **single-page** tailored resume.

STRICT CONTENT LIMITS — the resume MUST fit on one US Letter page (8.5 × 11 in) with 0.5 in margins. Violating any limit will cause the resume to overflow:
• Professional summary: 2–3 sentences, MAX 50 words total.
• Experience: select EXACTLY 2–3 entries. Each entry gets EXACTLY 3 concise bullet points (one line each, ~15 words max per bullet). Use strong action verbs and quantify achievements.
• Education: include all entries but keep each to one line (degree, institution, dates).
• Technical skills: list 8–10 most relevant skills as a flat comma-separated list. No categories or sub-groups.
• Soft skills: list 3–5 max, or omit if not relevant.
• Projects: include AT MOST 1 project with 2 bullet points, OR omit the projects section entirely if experience is strong enough.
• Certifications: include AT MOST 3 relevant certifications as a simple list, OR omit if not directly relevant.

PRIORITIES:
1. Cherry-pick experience and skills that directly match the job description keywords
2. Rewrite bullets to mirror the JD's language and requirements
3. Quantify achievements wherever possible (%, $, counts)
4. Use standard ATS section names: Professional Summary, Work Experience, Education, Skills, Projects, Certifications
5. Err on the side of BREVITY — less content that fits on one page is better than more content that overflows

Return the tailored resume as valid JSON matching this EXACT schema:
{
  "contact": { "fullName": "", "email": "", "phone": "", "location": "", "linkedin": "", "portfolio": "", "github": "" },
  "summary": { "text": "" },
  "experience": [{ "company": "", "title": "", "location": "", "startDate": "", "endDate": "", "current": false, "bullets": [{ "text": "" }] }],
  "education": [{ "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "gpa": "", "honors": "" }],
  "skills": { "technical": [{ "name": "" }], "soft": [{ "name": "" }] },
  "certifications": [{ "name": "", "issuer": "", "date": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [], "bullets": [{ "text": "" }] }]
}

Return ONLY valid JSON. No markdown fences, no explanation, no commentary.`
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
