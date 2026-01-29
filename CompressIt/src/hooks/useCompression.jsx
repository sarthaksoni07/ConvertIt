import { useAppContext } from "../context/AppContext";
import { compressImage } from "../features/img-compression/img.service";
import { compressPdf } from "../features/pdf/pdf.service";

export default function useCompression() {
  const { files, setStatus, setProgress, setResults } = useAppContext();

  async function startCompression() {
    if (files.length === 0) return;

    setStatus("compressing");
    setProgress(0);

    const newResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let result;
      if (file.type.startsWith("image/")) {
        result = await compressImage(file);
        setStatus("done");
      } else if (file.type === "application/pdf") {
        result = await compressPdf(file);
        setStatus("done");
      } else {
        console.warn("Unsupported file:", file.name);
        setStatus("failed");
      }

      if (result) {
        newResults.push(result);
      }

      const percent = Math.round(((i + 1) / files.length) * 100);
      setProgress(percent);
    }
    setResults(newResults);
  }

  return { startCompression };
}
