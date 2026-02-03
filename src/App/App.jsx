import Announcement from "../components/Announcement";
import { useAppContext } from "../context/AppContext";
// import useCompression from "../hooks/useCompression";
// import ResultsList from "../components/ResultsList";
// import useConversion from "../hooks/useConversion";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
// import MarkdownInput from "../components/MarkdownInput";
import { Home } from "../views/Home";
import Convert from "../views/Convert";
import MdToPdf from "../views/MdToPdf";
import Compress from "../views/Compress";
import NotFound from "../views/NotFound";
import { useState } from "react";
import Header from "../views/Head";
export default function App() {
  const { error, setError } = useState(false);

  return (
    
      <Routes>
        <Route element={<Header />}>
        <Route path="/" element={<Home />} />
        <Route path="/convert" element={<Convert />} />
        <Route path="/compress" element={<Compress />} />
        <Route path="/mdtopdf" element={<MdToPdf />} />
        </Route>
        <Route
          path="*"
          element={
            <>
              <h1>Error 404: Not Found</h1>
              <Link to="/">
                <button>Go to Main page</button>
              </Link>
            </>
          }
          />
      </Routes>
  );
}
