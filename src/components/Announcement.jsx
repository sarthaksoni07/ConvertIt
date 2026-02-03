import { useAppContext } from "../context/AppContext";

export default function Announcement() {
  const { announcement } = useAppContext();
  if (!announcement.enabled) return null;
  return (
    <div style={{ padding: "10px", background: "#eee", marginBottom: "5px" }}>
      <p>{announcement.message}</p>
      <p>{announcement.message1}</p>
      <p>{announcement.message2}</p>
    </div>
  );
}
