import { useAppContext } from "../context/AppContext";

export default function useCompression() {
  const { files, setStatus, setProgress, setResults } = useAppContext();

  async function startCompression() {
    if (files.length === 0) return;

    // Validate all files first
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
        setStatus("failed");
        return;
      }
    }

    // Dynamically import the required services
    let compressImage = null;
    let compressPdf = null;

    if (hasImages) {
      const mod = await import("../features/img-compression/img.service");
      compressImage = mod.compressImage;
    }
    if (hasPdfs) {
      const mod = await import("../features/pdf/pdf.service");
      compressPdf = mod.compressPdf;
    }

    setStatus("compressing");
    setProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let result;
      try {
        if (file.type.startsWith("image/")) {
          result = await compressImage(file);
        } else if (file.type === "application/pdf") {
          result = await compressPdf(file);
        }

        if (result && result.blob) {
          setResults((prev) => [...prev, result]);
        }
      } catch (err) {
        console.error("Compression error:", err);
        setStatus("failed");
        return;
      }

      const percent = Math.round(((i + 1) / files.length) * 100);
      setProgress(percent);
    }
    setStatus("done");
  }

  return { startCompression };
}
