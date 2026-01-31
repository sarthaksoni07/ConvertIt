import { PDFDocument } from "pdf-lib";

self.onmessage = async (e) => {
  try {
    const { file } = e.data;

    // Create a new PDF
    const pdfDoc = await PDFDocument.create();

    //  Read image as ArrayBuffer (memory-safe)
    const imageBytes = await file.arrayBuffer();

    let image;
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      image = await pdfDoc.embedJpg(imageBytes);
    } else if (file.type === "image/png") {
      image = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error("Unsupported image type");
    }

    //  Create page sized exactly to image
    const page = pdfDoc.addPage([image.width, image.height]);

    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });

    //  Save PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });

    //  Send result (STRICT CONTRACT)
    self.postMessage({
      type: "done",
      result: {
        name: file.name.replace(/\.[^/.]+$/, ".pdf"),
        originalSize: file.size,
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
