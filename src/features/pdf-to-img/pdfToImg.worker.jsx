import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

self.document = {
  createElement: (tagName) => {
    if (tagName === 'canvas') {
      return new OffscreenCanvas(1, 1);
    }
    throw new Error(`Unsupported element: ${tagName}`);
  }
};

class OffscreenCanvasFactory {
  create(width, height) {
    return new OffscreenCanvas(width, height);
  }

  reset(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
  }

  destroy(canvas) {
  }
}

const canvasFactory = new OffscreenCanvasFactory();

self.onmessage = async (e) => {
  try {
    if (typeof OffscreenCanvas === 'undefined') {
      throw new Error('OffscreenCanvas is not supported in this browser.');
    }

    const { file, scale = 2, imageType = "image/png" } = e.data;

    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    if (pdf.isEncrypted) {
      throw new Error('Encrypted PDFs are not supported.');
    }

    const results = [];
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        let viewport = page.getViewport({ scale });

        const maxWidth = 2048;
        const maxHeight = 2048;
        if (viewport.width > maxWidth || viewport.height > maxHeight) {
          const scaleX = maxWidth / viewport.width;
          const scaleY = maxHeight / viewport.height;
          const newScale = Math.min(scale, scaleX, scaleY);
          viewport = page.getViewport({ scale: newScale });
        }

        const canvas = new OffscreenCanvas(
          viewport.width,
          viewport.height
        );
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, viewport.width, viewport.height);

        await page.render({
          canvasContext: ctx,
          viewport,
          canvasFactory,
        }).promise;

        const blob = await canvas.convertToBlob({
          type: imageType,
          quality: 0.95,
        });

        if (blob.size === 0) {
          throw new Error(`Rendering resulted in empty image for page ${pageNum}`);
        }

        const extension = imageType.split('/')[1];

        results.push({
          name: `page-${pageNum}.${extension}`,
          blob,
          size: blob.size,
        });
      } catch (pageErr) {
        console.error(`Error processing page ${pageNum}:`, pageErr);
        continue;
      }

      self.postMessage({
        type: "progress",
        value: Math.round((pageNum / totalPages) * 100),
      });

    }

    if (results.length === 0) {
      throw new Error('No pages could be converted to images.');
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
