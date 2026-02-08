import { Routes, Route, Link } from "react-router-dom";
import Home from "../views/Home";
import Convert from "../views/Convert";
import AiToPdf from "../views/AiToPdf";
import Compress from "../views/Compress";
import Header from "../views/Head";
export default function App() {
  return (
    <Routes>
      <Route element={<Header />}>
        <Route path="/" element={<Home />} />
        <Route path="/convert" element={<Convert />} />
        <Route path="/compress" element={<Compress />} />
        <Route path="/mdtopdf" element={<AiToPdf />} />
      </Route>
    
      <Route
        path="*"
        element={
          <div className="page-container text-center" style={{ paddingTop: '4rem' }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
            <h2 style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>Page Not Found</h2>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                Go to Main Page
              </button>
            </Link>
          </div>
        }
      />
    </Routes>
  );
}
