import useCompression from "../hooks/useCompression";
import FileUploader from "../components/FileUploader";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
export default function Compress() {
    const { startCompression } = useCompression();
      const { files, status, progress, convert, setStatus } = useAppContext();

      const navigate = useNavigate();
      
      // Reset status when leaving this page
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
        <button onClick={startCompression}>Compress</button>
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
