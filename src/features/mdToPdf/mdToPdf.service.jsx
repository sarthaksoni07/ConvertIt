import { marked } from "marked";
import html2pdf from "html2pdf.js";

export async function convertMdToPdf(text, onProgress) {
  const html = marked(text);
  const options = {
    margin: 1,
    filename: 'markdown.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  const blob = await html2pdf().from(html).set(options).outputPdf('blob');
  return {
    name: 'markdown.pdf',
    blob,
    originalSize: blob.size,
    compressedSize: blob.size,
  };
}