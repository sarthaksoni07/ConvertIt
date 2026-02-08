import { useAppContext } from "../context/AppContext";

export default function Announcement() {
  const { announcement } = useAppContext();

  return (
    <div className="announcement-container">
      <h3 className="announcement-punchline">
        Your Privacy Matters: 100% On-Device Processing
      </h3>
      <p>
        No uploads, no servers, no tracking. Your files never leave your device.
      </p>
      {announcement.enabled && (
        <>
          {announcement.message && <p>{announcement.message}</p>}
          {announcement.message1 && <p>{announcement.message1}</p>}
        </>
      )}
    </div>
  );
}
