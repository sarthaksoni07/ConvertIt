import { useAppContext } from "../context/AppContext";
import { useEffect } from "react";

export default function FileUploader({ accept }) {
  const { setFiles, setStatus } = useAppContext();

  function handleFiles(fileList) {
    const filesArray = Array.from(fileList);
    setFiles(filesArray);
    if (filesArray.length > 0) {
      setStatus("ready");
    } else {
      setStatus("idle");
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

  return (
    <div className="file-controls">
      <input
        type="file"
        multiple
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
        hidden
        id="file-input"
      />

      <button onClick={() => document.getElementById('file-input').click()}>
        📁 Browse Files
      </button>
      <p style={{ fontSize: "0.9em", color: "#666" }}>
        💡 Or drag & drop files anywhere on the page
      </p>
    </div>
  );
}
