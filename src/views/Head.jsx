import { Outlet } from "react-router-dom";
import Announcement from "../components/Announcement";
import { useState } from "react";
import ResultsList from "../components/ResultsList";

export default function Header() {
  const [show, setShow] = useState(false);
  return (
    <>
      <div className="header-container">
        <div className="header-content">
          <h1>ConvertIt.</h1>
          <h3>100% On-Device Processing</h3>

          <div
            className={`announcement-wrapper${show ? " is-visible" : ""}`}
            aria-hidden={!show}
          >
            <Announcement />
          </div>
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
          <h3>Supported Formats : Image, Pdf and Markdown(Md)</h3>
        </div>
      </div>
      <Outlet />
      <ResultsList />
    </>
  );
}
