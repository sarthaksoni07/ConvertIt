import { useAppContext } from "../context/AppContext";
import MarkdownInput from "../components/Markdowninput";
import DropZone from "../components/DropZone";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";


export default function AiToPdf() {
  const {  setConvert, setFiles } = useAppContext();
  const navigate = useNavigate();
  
  useEffect(() => {
    return () => {
      setConvert("idle");
      setFiles([]);
    };
  }, [setConvert, setFiles]);
  
  function handleClick() {
    navigate("/");
  }
  
  return (
    <div className="page-container">
      <DropZone />
      
      <div className="text-center">
        <h2>AI Text to PDF</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
          Convert ChatGPT, Gemini, or any AI output to beautifully formatted PDFs
        </p>
      </div>

      <MarkdownInput />

      <div className="text-center mt-3">
        <button onClick={handleClick} className="secondary-button">
          Main Menu
        </button>
      </div>
    </div>
  );
}
