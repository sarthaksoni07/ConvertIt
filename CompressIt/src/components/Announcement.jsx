import { useAppContext } from "../context/AppContext";

export default function Announcement() {
  const { announcement } = useAppContext();
  if (!announcement.enabled) return null;
  return (
    <div style={{ padding: "10px", background: "#eee", marginBottom: "10px" }}>
      {announcement.message}
    </div>
  );
}
