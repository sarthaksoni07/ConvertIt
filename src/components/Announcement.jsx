import { useAppContext } from "../context/AppContext";

export default function Announcement() {
  const { announcement } = useAppContext();

  return (
    <div className="announcement-container">
      <h3 className="announcement-punchline">
        Your Privacy Matters: 100% On-Device Processing
      </h3>
      {announcement.enabled && (
        <>
          {announcement.message && <h4>{announcement.message}</h4>}
          {announcement.message1 && <h3>{announcement.message1}</h3>}
        </>
      )}
    </div>
  );
}
