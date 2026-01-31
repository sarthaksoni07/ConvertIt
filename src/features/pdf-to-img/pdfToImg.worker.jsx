import * as pdfjsLib from "pdfjs-dist";

// IMPORTANT: tell pdf.js where its worker is
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString();

self.onmessage = async (e) => {
  try {
    const { file, scale = 2, imageType = "image/png" } = e.data;

    //  Read PDF as ArrayBuffer
    const pdfData = await file.arrayBuffer();

    //  Load PDF
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    const results = [];
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      //  Load page
      const page = await pdf.getPage(pageNum);

      const viewport = page.getViewport({ scale });

      //  Render using OffscreenCanvas (worker-safe)
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      //  Convert canvas → Blob
      const blob = await canvas.convertToBlob({
        type: imageType,
        quality: 0.95,
      });

      results.push({
        name: `page-${pageNum}.png`,
        blob,
        size: blob.size,
      });

      //  Progress update
      self.postMessage({
        type: "progress",
        value: Math.round((pageNum / totalPages) * 100),
      });

      //  Help GC
      page.cleanup();
    }

    // Send final result
    self.postMessage({
      type: "done",
      result: {
        name: `${file.name}-images`,
        originalSize: file.size,
        images: results, // multiple outputs
      },
    });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err.message,
    });
  }
};
