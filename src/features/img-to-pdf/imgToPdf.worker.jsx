import { PDFDocument, degrees } from "pdf-lib";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PADDING = 10;

function getJpegExifOrientation(buffer) {
  try {
    const view = new DataView(buffer);
    if (view.getUint16(0) !== 0xFFD8) return 1;

    let offset = 2;
    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset);
      offset += 2;

      if (marker === 0xFFE1) {
        const segLen = view.getUint16(offset);
        if (offset + segLen > view.byteLength) return 1;

        // Check for "Exif\0\0"
        if (
          view.getUint32(offset + 2) !== 0x45786966 ||
          view.getUint16(offset + 6) !== 0x0000
        ) {
          offset += segLen;
          continue;
        }

        const tiffStart = offset + 8;
        const bigEndian = view.getUint16(tiffStart) === 0x4d4d;
        const ifdOffset = view.getUint32(tiffStart + 4, !bigEndian);
        const entries = view.getUint16(tiffStart + ifdOffset, !bigEndian);

        for (let i = 0; i < entries; i++) {
          const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
          if (entryOffset + 12 > view.byteLength) break;
          // Tag 0x0112 = Orientation
          if (view.getUint16(entryOffset, !bigEndian) === 0x0112) {
            return view.getUint16(entryOffset + 8, !bigEndian);
          }
        }
        return 1;
      } else if ((marker & 0xff00) === 0xff00) {
        offset += view.getUint16(offset);
      } else {
        break;
      }
    }
  } catch {
    // EXIF parse failure — assume normal orientation
  }
  return 1;
}

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
      const isJpeg =
        file.type === "image/jpeg" || file.type === "image/jpg";

      if (isJpeg) {
        image = await pdfDoc.embedJpg(imageBytes);
      } else if (file.type === "image/png") {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        throw new Error(`Unsupported image type: ${file.type}`);
      }

      const rawW = image.width;
      const rawH = image.height;

      // Read EXIF orientation for JPEGs (phones store portrait photos rotated)
      const orientation = isJpeg ? getJpegExifOrientation(imageBytes) : 1;

      // Orientations 5-8 swap the display width/height
      const swapped = orientation >= 5;
      const displayW = swapped ? rawH : rawW;
      const displayH = swapped ? rawW : rawH;

      // Pick page orientation to match the image aspect ratio
      const isLandscape = displayW > displayH;
      const pageW = isLandscape ? A4_HEIGHT : A4_WIDTH;
      const pageH = isLandscape ? A4_WIDTH : A4_HEIGHT;

      // Scale image to fit the page with padding
      const maxW = pageW - 2 * PADDING;
      const maxH = pageH - 2 * PADDING;
      const scale = Math.min(maxW / displayW, maxH / displayH);

      const scaledDisplayW = displayW * scale;
      const scaledDisplayH = displayH * scale;

      const page = pdfDoc.addPage([pageW, pageH]);
      const cx = pageW / 2;
      const cy = pageH / 2;

      // Draw with correct rotation for each EXIF orientation.
      // pdf-lib rotates CCW around the draw origin (x, y).
      switch (orientation) {
        case 6: {
          // 90° CW
          page.drawImage(image, {
            x: cx - scaledDisplayW / 2,
            y: cy + scaledDisplayH / 2,
            width: rawW * scale,
            height: rawH * scale,
            rotate: degrees(-90),
          });
          break;
        }
        case 8: {
          // 90° CCW
          page.drawImage(image, {
            x: cx + scaledDisplayW / 2,
            y: cy - scaledDisplayH / 2,
            width: rawW * scale,
            height: rawH * scale,
            rotate: degrees(90),
          });
          break;
        }
        case 3: {
          // 180°
          page.drawImage(image, {
            x: cx + scaledDisplayW / 2,
            y: cy + scaledDisplayH / 2,
            width: rawW * scale,
            height: rawH * scale,
            rotate: degrees(180),
          });
          break;
        }
        default: {
          // Orientation 1 (normal) or unsupported flip-only orientations
          page.drawImage(image, {
            x: cx - scaledDisplayW / 2,
            y: cy - scaledDisplayH / 2,
            width: scaledDisplayW,
            height: scaledDisplayH,
          });
          break;
        }
      }

      self.postMessage({
        type: "progress",
        value: Math.round(((i + 1) / files.length) * 100),
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const baseName =
      files.length > 1
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
