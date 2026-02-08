import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <>
      <h1>Oops !</h1>
      <h3>ERROR 404:PAGE NOT FOUND !</h3>
      <button
        onClick={() => {
          navigate("/");
        }}
      >
        Go to Home Page
      </button>
    </>
  );
}
