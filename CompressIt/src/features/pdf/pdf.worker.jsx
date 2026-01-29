import { PDFDocument, PDFName, PDFDict } from "pdf-lib";
import imageCompression from "browser-image-compression";

self.onmessage = async (e) => {
  try {
    const { file } = e.data;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Remove metadata to reduce size
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");

    const pages = pdfDoc.getPages();

    // Compress images in PDF
    for (const page of pages) {
      const resources = page.node.Resources();
      if (!resources) continue;

      const xObject = resources.lookupMaybe(PDFName.of("XObject"), PDFDict);
      if (!xObject) continue;

      for (const [key, ref] of xObject.entries()) {
        const obj = pdfDoc.context.lookup(ref);

        if (!obj || obj.constructor.name !== "PDFRawStream") continue;

        const subtype = obj.dict.lookupMaybe(PDFName.of("Subtype"));
        if (!subtype || subtype.name !== "Image") continue;

        try {
          const imageBytes = obj.contents;
          const imageBlob = new Blob([imageBytes], { type: "image/jpeg" });

          // Aggressive compression for PDFs
          const compressedImage = await imageCompression(imageBlob, {
            maxSizeMB: 0.2,        // More aggressive
            maxWidthOrHeight: 1200, // Lower resolution
            useWebWorker: false,
            fileType: "image/jpeg",
            initialQuality: 0.6    // Lower quality
          });

          const compressedBytes = new Uint8Array(
            await compressedImage.arrayBuffer()
          );

          obj.contents = compressedBytes;
          obj.dict.set(PDFName.of("Length"), compressedBytes.length);
          
          // Add JPEG quality hint
          obj.dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
        } catch (imgErr) {
          console.warn("Image compression failed:", imgErr);
        }
      }
    }

    // Save with maximum compression
    const newPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50
    });

    self.postMessage({
      name: file.name,
      originalSize: file.size,
      compressedSize: newPdfBytes.length,
      blob: newPdfBytes.buffer,
      mimeType: "application/pdf"
    });
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
