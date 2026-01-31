import { useAppContext } from "../context/AppContext";
import { convertImgToPdf } from "../features/img-to-pdf/imgToPdf.service";
export default function useConversion() {
  const { files, setConvert, setProgress, setResults } = useAppContext();

  async function startConversion() {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isValidImage = file.type.startsWith("image/");
      //   const isValidPdf = file.type === "application/pdf";

      //   if (!isValidImage && !isValidPdf) {
      if (!isValidImage) {
        console.warn("Unsupported file:", file.name);
        setConvert("failed");
        return;
      }
    }

    setConvert("converting");
    setProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let result;
      try {
        if (file.type.startsWith("image/")) {
          result = await convertImgToPdf(file);
        }
        //  else if (file.type === "application/pdf") {
        //   result = await compressPdf(file);
        // }

        if (result && result.blob) {
          setResults((prev) => [...prev, result]);
        }
      } catch (err) {
        console.error("Compression error:", err);
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
