import { useNavigate } from "react-router-dom"

export const Home=()=>{
    const navigate = useNavigate();
    function handleCompress(){
        navigate("/Compress");
    }
    function handleConvert(){
        navigate("/Convert");
    }
    function handleMdToPdf(){
        navigate("/mdtopdf");
    }

    return(
        <>
            <button onClick={handleConvert}>Convert</button>
            <button onClick={handleCompress}>Compress</button>
            <button onClick={handleMdToPdf}>Convert Markdown to Pdf</button>
        </>
    );
}