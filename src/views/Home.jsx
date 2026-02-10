import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <div className="page-container">
        <div className="home-container">
          <button
            className="home-card"
            onClick={() => navigate("/convert")}
            aria-label="Convert files"
          >
            <h2 className="home-card-title">Convert</h2>
          </button>

          <button
            className="home-card"
            onClick={() => navigate("/compress")}
            aria-label="Compress files"
          >
            <h2 className="home-card-title">Compress</h2>
          </button>

          <button
            className="home-card"
            onClick={() => navigate("/mdtopdf")}
            aria-label="Convert AI text to PDF"
          >
            <h2 className="home-card-title"> AI Text → PDF</h2>
          </button>
          <button
            className="home-card"
            onClick={() => navigate("/mergepdf")}
            aria-label="Merge Pdf"
          >
            <h2 className="home-card-title">Merge Pdfs</h2>
          </button>
        </div>
      </div>
    </>
  );
}
