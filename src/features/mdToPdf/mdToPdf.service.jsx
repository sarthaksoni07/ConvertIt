import { marked } from "marked";
import html2pdf from "html2pdf.js";

export async function convertMdToPdf(text, fileName = "markdown") {
  const html = marked(text);
  const filename = fileName.replace(/\.(md|markdown|txt)$/, '') || 'markdown';
  
  const options = {
    margin: 0.3,
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 4 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['p', 'li', 'pre', 'blockquote', 'table', 'img'] }
  };

  const blob = await html2pdf().from(html).set(options).outputPdf('blob');
  return {
    name: `${filename}.pdf`,
    blob,
    originalSize: blob.size,
    compressedSize: blob.size,
  };
}