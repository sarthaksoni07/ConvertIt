import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [files, setFiles] = useState([]);

  const [results, setResults] = useState([]);

  const [status, setStatus] = useState("idle");

  const [progress, setProgress] = useState(0);

  const [convert, setConvert] = useState("idle");

  const [compressionLevel, setCompressionLevel] = useState(1); 

  const [announcement, setAnnouncement] = useState({
    message: "More features coming soon 🚀",
    message1:"Pdf Compression is a Beta feature, Compression Ratio May not be Significant.",
    enabled: true,
  });

  return (
    <AppContext.Provider
      value={{
        files,
        setFiles,
        status,
        setStatus,
        progress,
        setProgress,
        announcement,
        setAnnouncement,
        results,
        setResults,
        convert,
        setConvert,
        compressionLevel,
        setCompressionLevel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
}
