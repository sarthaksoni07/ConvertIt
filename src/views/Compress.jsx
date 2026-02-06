import useCompression from "../hooks/useCompression";
import FileUploader from "../components/FileUploader";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
export default function Compress() {
    const { startCompression } = useCompression();
      const { files, status, progress, convert, setStatus, compressionLevel, setCompressionLevel } = useAppContext();

      const navigate = useNavigate();
      
      useEffect(() => {
        return () => {
          setStatus("idle");
        };
      }, [setStatus]);
      
      function handleClick(){
        navigate("/");
      }
  return (
    <>
     
      <FileUploader accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" />
      <p>Status:{status}</p>
      <p>Files Selected:{files.length}</p>
      
      {status === "ready" && (
        <>
          <div style={{ margin: "20px 20px", padding: "10px 10px" }}>
            <label htmlFor="compressionSlider" style={{ display: "block", marginBottom: "10px" }}>
              Compression Level : {compressionLevel}MB
            </label>
            <input
              id="compressionSlider"
              type="range"
              max="5"
              min="1"
              step="1"
              value={6-compressionLevel}
              onChange={(e) => setCompressionLevel(6-Number(e.target.value))}
              style={{ width: "100%", maxWidth: "400px" }}
            />

          </div>
          <button onClick={startCompression}>Compress</button>
        </>
      )}
      {(status === "compressing" || convert === "converting") && (
        <>
          <p>Progress: {progress}%</p>
          <Loading />
        </>
      )}

      {status === "done" && <p>Compression complete ✅</p>}
      {status === "failed" && <p>Compression Failed ❌</p>}
      <button onClick={handleClick}>Main Menu</button>
      
    </>
  );
}
