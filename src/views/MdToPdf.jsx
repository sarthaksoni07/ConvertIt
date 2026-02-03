import { useAppContext } from "../context/AppContext";
import ResultsList from "../components/ResultsList";
// import Loading from "../components/Loading";
// import useConversion from "../hooks/useConversion";
import MarkdownInput from "../components/MarkdownInput";
import { useNavigate } from "react-router-dom";
export default function MdToPdf() {
  const { status, convert } = useAppContext();
  const navigate = useNavigate();
  function handleClick() {
    navigate("/");
  }
  return (
    <>
      <MarkdownInput />
      {convert === "failed" && <p>Conversion Failed ❌</p>}
      {convert === "done" && <p>Conversion complete ✅</p>}
      <button onClick={handleClick}>Main Menu</button>
    </>
  );
}
