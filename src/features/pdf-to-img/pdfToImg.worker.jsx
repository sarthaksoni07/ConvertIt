import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

self.onmessage = async (e) => {
  try {
    const { file, scale = 2, imageType = "image/png" } = e.data;

    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    const results = [];
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = new OffscreenCanvas(
        viewport.width,
        viewport.height
      );
      const ctx = canvas.getContext("2d");

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const blob = await canvas.convertToBlob({
        type: imageType,
        quality: 0.95,
      });

      results.push({
        name: `page-${pageNum}.png`,
        blob,
        size: blob.size,
      });

      self.postMessage({
        type: "progress",
        value: Math.round((pageNum / totalPages) * 100),
      });

      page.cleanup();
    }

    self.postMessage({
      type: "done",
      result: {
        name: `${file.name}-images`,
        originalSize: file.size,
        images: results,
      },
    });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err.message,
    });
  }
};
