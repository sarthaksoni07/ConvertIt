import { useAppContext } from "../context/AppContext";
import { compressImage } from "../features/img-compression/img.service";
import { compressPdf } from "../features/pdf/pdf.service";

export default function useCompression() {
  const { files, setStatus, setProgress } = useAppContext();

  async function startCompression() {
    if (files.length === 0) return;

    setStatus("compressing");
    setProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type.startsWith("image/")) {
        await compressImage(file);
      }
       else if (file.type === "application/pdf") {
        await compressPdf(file);
      } 
      else {
        console.warn("Unsupported file:", file.name);
      }
      
      const percent = Math.round(((i + 1) / files.length) * 100);
      setProgress(percent);
    }

    setStatus("done");
  }

  return { startCompression };
}
