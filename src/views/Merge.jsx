import FileUploader from "../components/FileUploader";
import useMerge from "../hooks/useMerge";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import DropZone from "../components/DropZone";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
export default function Convert() {
  const { files, setFiles, status, progress, convert, setStatus, setConvert } = useAppContext();
  const { startMerge } = useMerge();
  const navigate = useNavigate();
  
  useEffect(() => {
    return () => {
      setStatus("idle");
      setConvert("idle");
      setFiles([]);
    };
  }, [setStatus, setConvert ,setFiles]);
  
  function handleClick() {
    navigate("/");
  }
  
  return (
    <div className="page-container">
      <DropZone />
      
      <div className="text-center">
        <h2>Merge Pdfs</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
          Merge Multiple Pdfs Into One !
        </p>
      </div>

      <FileUploader accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" />
      
      <div className="status-container">
        {files.length > 0 && (
          <p className="status-message">
            📁 Files Selected: <strong>{files.length}</strong>
          </p>
        )}
        

      </div>

      {status === "ready" && (
        <div className="text-center mt-3">
          <button onClick={startMerge} style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
            Start Merge
          </button>
        </div>
      )}
      
      {(status === "compressing" || convert === "converting") && (
        <div className="text-center">
          <p className="status-message status-processing">
            Progress: {progress}%
          </p>
          <Loading />
        </div>
      )}

      {convert === "done" && (
        <div className="text-center">
          <p className="status-message status-complete">Merge Complete!</p>
        </div>
      )}
      
      {convert === "failed" && (
        <div className="text-center">
          <p className="status-message status-error">Merge Failed !</p>
        </div>
      )}
      
      <div className="text-center mt-3">
        <button onClick={handleClick} className="secondary-button">
          Main Menu
        </button>
      </div>
    </div>
  );
}
