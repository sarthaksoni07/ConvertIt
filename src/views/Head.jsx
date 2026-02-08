import { Outlet } from "react-router-dom";
import Announcement from "../components/Announcement";
import { useState } from "react";

export default function Header() {
  const [show, setShow] = useState(false);
  return (
    <>
      <div className="header-container">
        <div className="header-content">
          <h1>ConvertIt</h1>
          <h3>We Love to do it On Device</h3>

          {show && <Announcement />}
          {show && (
            <button
              onClick={() => {
                setShow(false);
              }}
            >
              Hide announcement
            </button>
          )}
          {!show && (
            <button
              onClick={() => {
                setShow(true);
              }}
            >
              Show announcement
            </button>
          )}
        </div>
      </div>
      <Outlet />
    </>
  );
}
