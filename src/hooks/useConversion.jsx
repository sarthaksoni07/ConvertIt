import { useAppContext } from "../context/AppContext";

export default function useConversion() {
  const { files, setConvert, setProgress, setResults } = useAppContext();

  async function startConversion() {
    if (!files || files.length === 0) return;

    let hasImages = false;
    let hasPdfs = false;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isValidImage = file.type.startsWith("image/");
        const isValidPdf = file.type === "application/pdf";

        if (isValidImage) hasImages = true;
        if (isValidPdf) hasPdfs = true;

        if (!isValidImage && !isValidPdf) {
        console.warn("Unsupported file:", file.name);
        setConvert("failed");
        return;
      }
    }

    // Dynamically import the required services
    let convertImgToPdf = null;
    let convertPdfToImg = null;

    if (hasImages) {
      const mod = await import("../features/img-to-pdf/imgToPdf.service");
      convertImgToPdf = mod.convertImgToPdf;
    }
    if (hasPdfs) {
      const mod = await import("../features/pdf-to-img/pdfToImg.service");
      convertPdfToImg = mod.convertPdfToImg;
    }

    setConvert("converting");
    setProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let result;
      try {
        if (file.type.startsWith("image/")) {
          result = await convertImgToPdf(file);
          if (result && result.blob) {
            setResults((prev) => [...prev, result]);
          }
        } else if (file.type === "application/pdf") {
          result = await convertPdfToImg(file);
          if (result && result.images) {
            setResults((prev) => [...prev, ...result.images.map(img => ({
              name: img.name,
              originalSize: result.originalSize,
              compressedSize: img.size,
              blob: img.blob,
            }))]);
          }
        }
      } catch (err) {
        console.error("Conversion error:", err);
        setConvert("failed");
        return;
      }

      const percent = Math.round(((i + 1) / files.length) * 100);
      setProgress(percent);
    }

    setConvert("done");
  }

  return { startConversion };
}
