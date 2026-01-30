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

  // delay revoke slightly to avoid race condition
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

  return (
    <>
      <h3>Compressed files</h3>
      <p>Results count: {results.length}</p>

      <ul>
        {results.map((res) => (
          <li key={res.name}>
            {res.name} — {Math.round(res.originalSize / 1024)} KB →{" "}
            {Math.round(res.compressedSize / 1024)} KB
            <button
              onClick={() => {
                downloadFile(res.blob, res.name);
              }}
            >
              Download
            </button>
          </li>
        ))}

      </ul>
    </>
  );
}
