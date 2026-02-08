import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { convertMdToPdf } from "../features/mdToPdf/mdToPdf.service";
import Loading from "./Loading";

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
      setMarkdown("");
      setFileName("");
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Failed to convert to PDF");
      setStatus("failed");
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="file-controls" style={{ marginBottom: '2rem' }}>
        <input
          type="file"
          accept=".md,.markdown,.txt"
          onChange={(e) => handleFiles(e.target.files)}
          hidden
          id="md-file-input"
        />
        <button onClick={() => document.getElementById('md-file-input').click()}>
          📁 Import File
        </button>
        <p>
          💡 Or drag & drop .md/.txt files anywhere on this page
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="markdown-textarea">
          Paste your text below:
        </label>
        <textarea
          id="markdown-textarea"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="Paste text from ChatGPT, Gemini, or any other source..."
          rows={15}
          style={{ width: '100%' }}
        />
      </div>

      {fileName && (
        <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
          📄 File loaded: <strong>{fileName}</strong>
        </p>
      )}

      {status === "converting" && <Loading />}
      
      {status === "done" && (
        <div className="text-center">
          <p className="status-message status-complete">✅ PDF Created Successfully!</p>
        </div>
      )}
      
      {status === "failed" && (
        <div className="text-center">
          <p className="status-message status-error">❌ Conversion Failed</p>
        </div>
      )}

      <div className="text-center" style={{ marginTop: '1.5rem' }}>
        <button 
          onClick={handleConvert} 
          disabled={status === "converting" || !markdown.trim()}
          style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}
        >
          {status === "converting" ? "Converting..." : "Convert to PDF"}
        </button>
      </div>
    </div>
  );
}
