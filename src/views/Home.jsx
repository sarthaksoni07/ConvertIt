import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  function handleCompress() {
    navigate("/compress");
  }
  function handleConvert() {
    navigate("/convert");
  }
  function handleMdToPdf() {
    navigate("/mdtopdf");
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
    <>
      <p>
        <button onClick={handleConvert}>Convert</button>
      </p>
      <p>
        <button onClick={handleCompress}>Compress</button>
      </p>
      <p>
        <button onClick={handleMdToPdf}>ChatGPT / AI Text → PDF</button>
      </p>
    </>
  );
}
