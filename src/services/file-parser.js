/**
 * File parser service — extracts text from PDF and DOCX files client-side.
 */
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

/**
 * Extract text from a PDF file.
 */
export async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
            .map(item => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
        pages.push(text);
    }

    return pages.join('\n\n');
}

/**
 * Extract text from a DOCX file.
 */
export async function extractTextFromDOCX(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

/**
 * Extract text from a supported file (PDF or DOCX).
 */
export async function extractTextFromFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
        return extractTextFromPDF(file);
    } else if (ext === 'docx' || ext === 'doc') {
        return extractTextFromDOCX(file);
    } else {
        throw new Error(`Unsupported file format: .${ext}. Please upload PDF or DOCX files.`);
    }
}
