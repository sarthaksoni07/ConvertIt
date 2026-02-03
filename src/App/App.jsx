import { Routes, Route, Link} from "react-router-dom";
import  Home  from "../views/Home";
import Convert from "../views/Convert";
import MdToPdf from "../views/MdToPdf";
import Compress from "../views/Compress";
import Header from "../views/Head";
export default function App() {
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
