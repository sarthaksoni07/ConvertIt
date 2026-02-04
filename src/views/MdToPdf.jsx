import { useAppContext } from "../context/AppContext";
import MarkdownInput from "../components/Markdowninput";
import { useNavigate } from "react-router-dom";
export default function MdToPdf() {
  const { convert } = useAppContext();
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
