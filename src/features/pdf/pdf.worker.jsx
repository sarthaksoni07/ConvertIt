import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { PDFDocument } from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

self.document = {
  createElement: (tagName) => {
    if (tagName === "canvas") {
      return new OffscreenCanvas(1, 1);
    }
    throw new Error(`Unsupported element: ${tagName}`);
  },
};

class OffscreenCanvasFactory {
  create(width, height) {
    return new OffscreenCanvas(width, height);
  }
  reset(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
  }
  destroy() {}
}

const canvasFactory = new OffscreenCanvasFactory();

function getCompressionSettings(level) {
  const settings = {
    1: { scale: 1.5, quality: 0.5 },
    2: { scale: 1.65, quality: 0.6 },
    3: { scale: 1.85, quality: 0.7 },
    4: { scale: 1.95, quality: 0.8 },
    5: { scale: 2.0, quality: 1 },
  };
  return settings[level] || settings[3];
}

self.onmessage = async (e) => {
  try {
    const { file, compressionLevel } = e.data;
    const { scale, quality } = getCompressionSettings(compressionLevel);

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const newPdf = await PDFDocument.create();
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      // Get original page dimensions (in PDF points at scale=1)
      const originalViewport = page.getViewport({ scale: 1.0 });
      // Render at the target scale for quality control
      const renderViewport = page.getViewport({ scale });

      const canvas = new OffscreenCanvas(
        Math.floor(renderViewport.width),
        Math.floor(renderViewport.height)
      );
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport: renderViewport,
        canvasFactory,
      }).promise;

      const blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality,
      });

      const imageBytes = new Uint8Array(await blob.arrayBuffer());
      const image = await newPdf.embedJpg(imageBytes);

      // Create page with original dimensions (PDF points)
      const newPage = newPdf.addPage([
        originalViewport.width,
        originalViewport.height,
      ]);
      newPage.drawImage(image, {
        x: 0,
        y: 0,
        width: originalViewport.width,
        height: originalViewport.height,
      });

      self.postMessage({
        type: "progress",
        value: Math.round((pageNum / totalPages) * 100),
      });
    }

    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    const resultBlob = new Blob([pdfBytes], { type: "application/pdf" });

    self.postMessage({
      type: "done",
      result: {
        name: file.name,
        originalSize: file.size,
        compressedSize: pdfBytes.length,
        blob: resultBlob,
        mimeType: "application/pdf",
      },
    });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err.message,
    });
  }
};
