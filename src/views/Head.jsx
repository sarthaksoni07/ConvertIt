import { Outlet } from "react-router-dom";
import Announcement from "../components/Announcement";
import ResultsList from "../components/ResultsList";
export default function Header() {
  return (
    <>
      
        <h1>ConvertIt.</h1>
        <h3>We Love to do it On Device</h3>
        <Announcement />
        <Outlet />
        <ResultsList/>
    </>
  );
}
