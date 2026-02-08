import { useState, useEffect } from "react";

export default function DropZone() {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    function handleDragEnter(e) {
      e.preventDefault();
      dragCounter++;
      if (dragCounter === 1) {
        setIsDragging(true);
      }
    }

    function handleDragLeave(e) {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    }

    function handleDragOver(e) {
      e.preventDefault();
    }

    function handleDrop(e) {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);
    }

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  if (!isDragging) return null;

  return (
    <div className="drag-overlay">
      <div className="drag-content">
        <h2>📁 Drop Files Here</h2>
        <p>Release to upload your files</p>
      </div>
    </div>
  );
}
