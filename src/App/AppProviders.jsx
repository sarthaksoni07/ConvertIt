import { AppProvider } from "../context/AppContext";

export default function AppProviders({ children }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}
