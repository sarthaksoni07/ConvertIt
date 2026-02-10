import { useAppContext } from "../context/AppContext";

export default function Announcement() {
  const { announcement } = useAppContext();

  return (
    <div className="announcement-container">
      {announcement.enabled && (
        <>
          {announcement.message && <h4>{announcement.message}</h4>}
        </>
      )}
    </div>
  );
}
