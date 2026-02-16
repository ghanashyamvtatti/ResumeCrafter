# ResumeCrafter ✨

**AI-Powered Resume Builder & Tailoring Tool**

Build a comprehensive master resume, then let AI tailor it for each job application. ATS-optimized, keyword-rich, and designed to land interviews.

🔗 **[Live Demo →](https://ghanashyamvtatti.github.io/ResumeCrafter/)**

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 **Multi-AI Support** | Works with Claude, Gemini, and GPT — bring your own API key |
| 📊 **ATS-Optimized** | Single-column layout, standard sections, keyword optimization |
| 🎯 **Job-Targeted** | AI cherry-picks relevant experience, skills, and achievements |
| 📥 **Import Anywhere** | Upload PDF/DOCX resumes, LinkedIn data exports, or paste plain text |
| ✨ **AI Enhancement** | Auto-suggest skills, enhance bullet points, generate summaries |
| 🔒 **Privacy-First** | Everything runs in your browser — no data stored on any server |
| 📄 **Export Options** | Download as PDF, DOCX, or master resume JSON |

## How It Works

1. **Set Up AI** — Choose your preferred AI provider (Claude, Gemini, or GPT) and enter your API key
2. **Build Master Resume** — Enter your full career history using the guided wizard, or import from existing sources
3. **Paste a Job Description** — Provide the job posting you're targeting
4. **Get Your Tailored Resume** — AI crafts a single-page, ATS-friendly resume highlighting your most relevant qualifications

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- An API key from one of: [Anthropic (Claude)](https://console.anthropic.com/), [Google (Gemini)](https://aistudio.google.com/apikey), or [OpenAI (GPT)](https://platform.openai.com/api-keys)

### Run Locally

```bash
# Clone the repository
git clone https://github.com/ghanashyamvtatti/ResumeCrafter.git
cd ResumeCrafter

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

The built files are output to the `dist/` directory and can be served by any static file host.

## Tech Stack

- **Framework**: [Vite](https://vitejs.dev/) with vanilla JavaScript
- **PDF Parsing**: [pdf.js](https://mozilla.github.io/pdf.js/)
- **DOCX Parsing**: [mammoth.js](https://github.com/mwilliamson/mammoth.js)
- **PDF Export**: [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/)
- **DOCX Export**: [docx](https://docx.js.org/)
- **LinkedIn Import**: [JSZip](https://stuk.github.io/jszip/)
- **Hosting**: [GitHub Pages](https://pages.github.com/)

## Privacy & Security

- **API keys** are stored only in your browser's `sessionStorage` — they are never sent to any server other than the AI provider's API and are cleared when you close the tab.
- **Resume data** is stored in `localStorage` on your device. No data is ever transmitted to or stored on any external server.
- The application runs entirely client-side with no backend.

## License

MIT
