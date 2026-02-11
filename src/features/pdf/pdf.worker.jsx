import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";

function getCompressionSettings(level) {
  const settings = {
    1: { quality: 0.3, scaleFactor: 0.5 },
    2: { quality: 0.45, scaleFactor: 0.65 },
    3: { quality: 0.6, scaleFactor: 0.8 },
    4: { quality: 0.75, scaleFactor: 0.9 },
    5: { quality: 0.9, scaleFactor: 1.0 },
  };
  return settings[level] || settings[3];
}

async function recompressJpegImage(ref, imageStream, quality, scaleFactor, context) {
  const width = imageStream.dict.get(PDFName.of("Width"));
  const height = imageStream.dict.get(PDFName.of("Height"));
  if (!width || !height) return false;

  const w = typeof width.numberValue === "function" ? width.numberValue() : width.value();
  const h = typeof height.numberValue === "function" ? height.numberValue() : height.value();
  if (!w || !h || w <= 0 || h <= 0) return false;

  try {
    const jpegData = imageStream.contents || imageStream.getContents();
    const blob = new Blob([jpegData], { type: "image/jpeg" });
    const bitmap = await createImageBitmap(blob);

    const newW = Math.max(1, Math.round(bitmap.width * scaleFactor));
    const newH = Math.max(1, Math.round(bitmap.height * scaleFactor));

    const canvas = new OffscreenCanvas(newW, newH);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, newW, newH);
    bitmap.close();

    const newBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality,
    });

    const newBytes = new Uint8Array(await newBlob.arrayBuffer());

    // Only replace if the result is actually smaller
    if (newBytes.length >= jpegData.length) return false;

    // Build a new dictionary with updated dimensions
    const newDict = imageStream.dict.clone(context);
    newDict.set(PDFName.of("Width"), context.obj(newW));
    newDict.set(PDFName.of("Height"), context.obj(newH));
    newDict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
    newDict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
    newDict.set(PDFName.of("BitsPerComponent"), context.obj(8));
    newDict.delete(PDFName.of("DecodeParms"));
    newDict.delete(PDFName.of("SMask"));
    newDict.set(PDFName.of("Length"), context.obj(newBytes.length));

    const newStream = PDFRawStream.of(newDict, newBytes);
    context.assign(ref, newStream);

    return true;
  } catch {
    return false;
  }
}

self.onmessage = async (e) => {
  try {
    const { file, compressionLevel } = e.data;
    const { quality, scaleFactor } = getCompressionSettings(compressionLevel);

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
    });
    const context = pdfDoc.context;

    // Find all image XObjects in the PDF
    const imageEntries = [];
    context.enumerateIndirectObjects().forEach(([ref, obj]) => {
      if (obj instanceof PDFRawStream) {
        const subtype = obj.dict.get(PDFName.of("Subtype"));
        if (subtype && subtype.toString() === "/Image") {
          imageEntries.push([ref, obj]);
        }
      }
    });

    let processed = 0;
    const total = imageEntries.length;

    for (const [ref, imageStream] of imageEntries) {
      const filter = imageStream.dict.get(PDFName.of("Filter"));
      const filterName = filter ? filter.toString() : "";

      // Handle JPEG images (DCTDecode)
      if (filterName === "/DCTDecode") {
        await recompressJpegImage(ref, imageStream, quality, scaleFactor, context);
      }
      // Other filter types (FlateDecode, JPXDecode, etc.) are left as-is
      // to preserve quality for non-photographic content

      processed++;
      self.postMessage({
        type: "progress",
        value: Math.round((processed / Math.max(total, 1)) * 100),
      });
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
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