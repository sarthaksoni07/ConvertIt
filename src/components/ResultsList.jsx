import { useAppContext } from "../context/AppContext";

export default function ResultsList() {
  const { results } = useAppContext();

  if (results.length === 0) return null;

  function downloadFile(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  return (
    <div className="results-container">
      <h3>Processed Files ({results.length})</h3>
      <ul className="results-list">
        {results.map((res, index) => (
          <li key={res.name + index} className="result-item">
            <div className="result-info">
              <strong>📄 {res.name}</strong>
              <br />
              <span style={{ fontSize: "0.9rem", color: "var(--text-light)" }}>
                {res.originalSize && res.compressedSize ? (
                  <>
                    {Math.round(res.originalSize / 1024)} KB →{" "}
                    <span
                      style={{ color: "var(--success)", fontWeight: "600" }}
                    >
                      {Math.round(res.compressedSize / 1024)} KB
                    </span>{" "}
                  </>
                ) : (
                  "Ready to download"
                )}
              </span>
            </div>
            <button onClick={() => downloadFile(res.blob, res.name)}>
              Download
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
