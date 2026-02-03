import useCompression from "../hooks/useCompression";
import FileUploader from "../components/FileUploader";
import { useAppContext } from "../context/AppContext";
import ResultsList from "../components/ResultsList";
import Loading from "../components/Loading";
import { useNavigate} from "react-router-dom";
export default function Compress() {
    const { startCompression } = useCompression();
      const { files, status,setStatus,setProgress, progress, convert } = useAppContext();

      const navigate = useNavigate();
      function handleClick(){
        navigate("/");
      }
  return (
    <>
     
      <FileUploader />
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
