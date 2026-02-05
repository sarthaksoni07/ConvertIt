import { PDFDocument } from "pdf-lib";

self.onmessage = async (e) => {
  try {
    const { files } = e.data;
    const pdfDoc = await PDFDocument.create();

    let totalOriginalSize = 0;
    let firstFileName = "";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      totalOriginalSize += file.size;

      if (i === 0) {
        firstFileName = file.name;
      }

    const imageBytes = await file.arrayBuffer();

    let image;
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (file.type === "image/png") {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error(`Unsupported image type: ${file.type}`);
    }

    const page = pdfDoc.addPage([image.width, image.height]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });

      self.postMessage({
        type: "progress",
        value: Math.round(((i + 1) / files.length) * 100),
      });
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const baseName = files.length > 1 
      ? "combined" 
      : firstFileName.replace(/\.[^/.]+$/, "");
    const outputName = baseName + ".pdf";
    self.postMessage({
      type: "done",
      result: {
        name: outputName,
        originalSize: totalOriginalSize,
        compressedSize: blob.size,
        blob,
      },
    });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err.message,
    });
  }
};
