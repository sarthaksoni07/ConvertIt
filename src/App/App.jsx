import Announcement from "../components/Announcement";
import FileUploader from "../components/FileUploader";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import useCompression from "../hooks/useCompression";
import ResultsList from "../components/ResultsList";
import useConversion from "../hooks/useConversion";
export default function App() {
  const { files, status, progress, convert } = useAppContext();
  const { startCompression } = useCompression();
  const { startConversion } = useConversion();

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
      {status === "ready" && <button onClick={startConversion}>Convert</button>}

      {status === "compressing" && (
        <>
          <p>Progress: {progress}%</p>
          <Loading />
        </>
      )}

      {status === "done" && <p>Compression complete ✅</p>}
      {status === "failed" && <p>Compression Failed ❌</p>}
      {convert === "failed" && <p>Conversion Failed ❌</p>}
      {convert === "done" && <p>Conversion complete ✅</p>}

      {(status === "done" || convert === "done") && <ResultsList />}
    </>
  );
}
