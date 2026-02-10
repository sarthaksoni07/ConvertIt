import useCompression from "../hooks/useCompression";
import FileUploader from "../components/FileUploader";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import DropZone from "../components/DropZone";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Compress() {
  const { startCompression } = useCompression();
  const { files, setFiles , status, progress, convert, setStatus, compressionLevel, setCompressionLevel } = useAppContext();
  const navigate = useNavigate();
  
  useEffect(() => {
    return () => {
      setStatus("idle");
      setFiles([]);
    };
  }, [setStatus, setFiles]);
  
  function handleClick() {
    navigate("/");
  }
  
  return (
    <div className="page-container">
      <DropZone />
      
      <div className="text-center">
        <h2>Compress Files</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
          Reduce file size while maintaining quality
        </p>
      </div>

      <FileUploader accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" />
      
      <div className="status-container">
        {files.length > 0 && (
          <p className="status-message">
            📁 Files Selected: <strong>{files.length}</strong>
          </p>
        )}
      </div>
      
      {status === "ready" && (
        <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <div style={{ 
            background: 'var(--off-white)', 
            padding: '2rem', 
            borderRadius: '16px',
            marginBottom: '1.5rem'
          }}>
            <label htmlFor="compressionSlider">
              Compression Target: <strong>{compressionLevel}MB</strong>
            </label>
            <input
              id="compressionSlider"
              type="range"
              max="5"
              min="1"
              step="1"
              value={compressionLevel}
              onChange={(e) => setCompressionLevel(Number(e.target.value))}
              style={{ 
                width: '100%',
                marginTop: '1rem',
                '--value': `${((compressionLevel - 1) / 4) * 100}%`
              }}
            />
            <p style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-light)', 
              marginTop: '1rem',
              marginBottom: 0
            }}>
              💡 Lower values = smaller files
            </p>
          </div>
          
          <div className="text-center">
            <button onClick={startCompression} style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
              Start Compression
            </button>
          </div>
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

      {status === "done" && (
        <div className="text-center">
          <p className="status-message status-complete">✅ Compression Complete!</p>
        </div>
      )}
      
      {status === "failed" && (
        <div className="text-center">
          <p className="status-message status-error">❌ Compression Failed</p>
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
