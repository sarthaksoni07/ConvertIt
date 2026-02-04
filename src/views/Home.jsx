import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  function handleCompress() {
    navigate("/compress");
  }
  function handleConvert() {
    navigate("/convert");
  }
  function handleMdToPdf() {
    navigate("/mdtopdf");
  }

  return (
    <>
      <p>
        <button onClick={handleConvert}>Convert</button>
      </p>
      <p>
        <button onClick={handleCompress}>Compress</button>
      </p>
      <p>
        <button onClick={handleMdToPdf}>ChatGPT / AI Text → PDF</button>
      </p>
    </>
  );
}
