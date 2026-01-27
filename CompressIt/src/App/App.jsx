import Announcement from "../components/Announcement";
import FileUploader from "../components/FileUploader";
import { useAppContext } from "../context/AppContext";
export default function App() {
  const {files,status}=useAppContext();
  return (
    <>
      <h1>CompressIt.</h1>
      <h3>We Love to Compress</h3>
      <Announcement />
      <FileUploader />
      <p>Status:{status}</p>
      <p>Files Selected:{files.length}</p>
    </>
  );
}
