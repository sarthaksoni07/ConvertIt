import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
 
  const [files, setFiles] = useState([]);

  
  const [status, setStatus] = useState("idle");
  

  const [progress, setProgress] = useState(0);

  const [announcement, setAnnouncement] = useState({
    message: "More features coming soon 🚀",
    enabled: true
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
        setAnnouncement
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
