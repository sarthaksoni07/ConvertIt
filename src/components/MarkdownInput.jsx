import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { convertMdToPdf } from "../features/mdToPdf/mdToPdf.service";

export default function MarkdownInput() {
  const [markdown, setMarkdown] = useState("");
  const [fileName, setFileName] = useState("");
  const { status, setStatus, setResults } = useAppContext();

  function handleFiles(fileList) {
    const file = fileList[0];
    if (file && (file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMarkdown(e.target.result);
        setFileName(file.name);
      };
      reader.readAsText(file);
    } else if (file) {
      alert("Please upload a .md, .markdown, or .txt file");
    }
  }

  // Handle drag-drop anywhere on the page
  useEffect(() => {
    function onDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    function onDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      handleFiles(e.dataTransfer.files);
    }

    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);

    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, []);

  const handleConvert = async () => {
    if (!markdown.trim()) return;
    setStatus("converting");
    try {
      const result = await convertMdToPdf(markdown, fileName);
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
      
      <div className="file-controls">
        <input
          type="file"
          accept=".md,.markdown,.txt"
          onChange={(e) => handleFiles(e.target.files)}
          hidden
          id="md-file-input"
        />
        <button onClick={() => document.getElementById('md-file-input').click()}>
          📁 Browse Files
        </button>
        <p style={{ fontSize: "0.9em", color: "#666" }}>
          💡 Or drag & drop .md files anywhere on the page
        </p>
      </div>

      <textarea
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        placeholder="Enter your markdown here..."
        rows={10}
        cols={50}
      />
      <p>File: {fileName || "No file selected"}</p>
      <br />
      <button onClick={handleConvert} disabled={status === "converting" || !markdown.trim()}>
        {status === "converting" ? "Converting..." : "Convert to PDF"}
      </button>
    </div>
  );
}
