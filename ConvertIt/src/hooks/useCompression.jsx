import { useAppContext } from "../context/AppContext";
import { compressImage } from "../features/img-compression/img.service";
import { compressPdf } from "../features/pdf/pdf.service";

export default function useCompression() {
  const { files, setStatus, setProgress, setResults } = useAppContext();

  async function startCompression() {
    if (files.length === 0) return;

    // Validate all files first
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isValidImage = file.type.startsWith("image/");
      const isValidPdf = file.type === "application/pdf";

      if (!isValidImage && !isValidPdf) {
        console.warn("Unsupported file:", file.name);
        setStatus("failed");
        return;
      }
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
