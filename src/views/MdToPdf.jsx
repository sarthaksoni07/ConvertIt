import { useAppContext } from "../context/AppContext";
import MarkdownInput from "../components/Markdowninput";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
export default function MdToPdf() {
  const { convert, setConvert } = useAppContext();
  const navigate = useNavigate();
  
  // Reset convert state when leaving this page
  useEffect(() => {
    return () => {
      setConvert("idle");
    };
  }, [setConvert]);
  
  function handleClick() {
    navigate("/");
  }
  return (
    <>
      <MarkdownInput />

      <button onClick={handleClick}>Main Menu</button>
    </>
  );
}
