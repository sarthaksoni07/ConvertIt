import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { convertMdToPdf } from "../features/mdToPdf/mdToPdf.service";

export default function MarkdownInput() {
  const [markdown, setMarkdown] = useState("");
  const { status, setStatus, setResults } = useAppContext();

  const handleConvert = async () => {
    if (!markdown.trim()) return;
    setStatus("converting");
    try {
      const result = await convertMdToPdf(markdown);
      setResults((prev) => [...prev, result]);
      setStatus("done");
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Failed to convert markdown to PDF");
      setStatus("failed");
    }
  };

  return (
    <div>
      <h2>Markdown to PDF</h2>
      <textarea
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        placeholder="Enter your markdown here..."
        rows={10}
        cols={50}
      />
      <br />
      <button onClick={handleConvert} disabled={status === "converting" || !markdown.trim()}>
        {status === "converting" ? "Converting..." : "Convert to PDF"}
      </button>
    </div>
  );
}
