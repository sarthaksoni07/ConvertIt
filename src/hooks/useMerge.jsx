
import { useAppContext } from "../context/AppContext";
import { mergePdfs } from "../features/merge-pdf/pdfMerge.service";
export default function useMerge() {
  const { files, setConvert, setProgress, setResults } = useAppContext();

  async function startMerge() {
    const pdfFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isValidPdf = file.type === "application/pdf";

      if (isValidPdf) {
        pdfFiles.push(file);
      }

      if (!isValidPdf) {
        console.warn("Unsupported file:", file.name);
        setConvert("failed");
        return;
      }
    }

    if (pdfFiles.length >= 2) {
      setConvert("converting");
      setProgress(0);
      setResults([]);

      try {
        const result = await mergePdfs(pdfFiles, setProgress);

        setResults([
          {
            name: result.name,
            originalSize: pdfFiles.reduce((s, f) => s + f.size, 0),
            compressedSize: result.size,
            blob: result.blob,
          },
        ]);

        setConvert("done");
        return;
      } catch (err) {
        console.error("PDF merge error:", err);
        setConvert("failed");
        return;
      }
    }
    else if(pdfFiles.length<=1){
        setConvert("failed");
    }
  }
  return { startMerge };
}
