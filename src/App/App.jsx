import Announcement from "../components/Announcement";
import FileUploader from "../components/FileUploader";
import { useAppContext } from "../context/AppContext";
import useCompression from "../hooks/useCompression";
import ResultsList from "../components/ResultsList";
export default function App() {
  const { files, status, progress } = useAppContext();
  const { startCompression } = useCompression();

  return (
    <>
      <h1>ConvertIt.</h1>
      <h3>We Love to do it On Device</h3>
      <Announcement />
      <FileUploader />
      <p>Status:{status}</p>
      <p>Files Selected:{files.length}</p>

      {status === "ready" && (
        <button onClick={startCompression}>Compress</button>
      )}

      {status === "compressing" && <p>Progress: {progress}%</p>}

      {status === "done" && <p>Compression complete ✅</p>}
      {status === "failed" && <p>Compression Failed ❌</p>}

      {status === "done" && <ResultsList/>}
    </>
  );
}
