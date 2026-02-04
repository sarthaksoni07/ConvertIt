import FileUploader from "../components/FileUploader";
import useConversion from "../hooks/useConversion";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
export default function Convert() {
  const { files, status, progress, convert, setStatus, setConvert } = useAppContext();
  const { startConversion } = useConversion();
  const navigate = useNavigate();
  
  // Reset status and convert when leaving this page
  useEffect(() => {
    return () => {
      setStatus("idle");
      setConvert("idle");
    };
  }, [setStatus, setConvert]);
  
  function handleClick() {
    navigate("/");
  }
  return (
    <>
      <FileUploader accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" />
      <p>Pro Tip : Select Multiple Images to Convert them into a Single Pdf ! </p>
      <p>Status:{status}</p>
      <p>Files Selected:{files.length}</p>
      {status === "ready" && <button onClick={startConversion}>Convert</button>}
      {(status === "compressing" || convert === "converting") && (
        <>
          <p>Progress: {progress}%</p>
          <Loading />
        </>
      )}

      {status === "done" && <p>Conversion complete ✅</p>}
      {status === "failed" && <p>Conversion Failed ❌</p>}
      <button onClick={handleClick}>Main Menu</button>
    </>
  );
}
