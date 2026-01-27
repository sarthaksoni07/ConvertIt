import { useAppContext } from "../context/AppContext";

function FileUploader() {
  const { setFiles, setStatus } = useAppContext();

  function handleFileChange(e) {
    const selectedFiles = Array.from(e.target.files);

    setFiles(selectedFiles);
    setStatus("ready");
  }

  return (
    <>
      <input type="file" multiple onChange={handleFileChange} />
    </>
  );
}
export default FileUploader;