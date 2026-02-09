import FileUploader from "../components/FileUploader";
import useConversion from "../hooks/useConversion";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import DropZone from "../components/DropZone";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
export default function Convert() {
  const { files, setFiles, status, progress, convert, setStatus, setConvert } = useAppContext();
  const { startConversion } = useConversion();
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
        <h2>Convert Files</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
          Convert Images to Pdf or Pdf to Images !
        </p>
      </div>

      <FileUploader accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" />
      
      <div className="status-container">
        {files.length > 0 && (
          <p className="status-message">
            📁 Files Selected: <strong>{files.length}</strong>
          </p>
        )}
        
        {files.length > 1 && (
          <p style={{ color: 'var(--primary-blue)', fontWeight: '500', marginTop: '1rem' }}>
            💡 Pro Tip: Multiple images will be combined into a single PDF!
          </p>
        )}
      </div>

      {status === "ready" && (
        <div className="text-center mt-3">
          <button onClick={startConversion} style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
            Start Conversion
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
          <p className="status-message status-complete">✅ Conversion Complete!</p>
        </div>
      )}
      
      {convert === "failed" && (
        <div className="text-center">
          <p className="status-message status-error">❌ Conversion Failed</p>
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
