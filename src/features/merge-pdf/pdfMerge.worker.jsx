import { PDFDocument } from "pdf-lib";

self.onmessage = async (e) => {
  try {
    const { files } = e.data;

    if (!files || files.length < 2) {
      throw new Error("At least two PDFs are required to merge.");
    }

    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      const pages = await mergedPdf.copyPages(
        pdf,
        pdf.getPageIndices()
      );

      pages.forEach((page) => mergedPdf.addPage(page));

      self.postMessage({
        type: "progress",
        value: Math.round(((i + 1) / files.length) * 100),
      });
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], {
      type: "application/pdf",
    });

    self.postMessage({
      type: "done",
      result: {
        name: "merged.pdf",
        blob,
        size: blob.size,
      },
    });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err.message || "PDF merge failed",
    });
  }
};
