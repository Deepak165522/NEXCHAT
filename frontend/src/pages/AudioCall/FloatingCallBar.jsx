import { FaPhoneSlash, FaExpand } from "react-icons/fa";
import useAudioCallStore from "../../store/audioCallStore";

const FloatingCallBar = () => {
  const {
    callStatus,
    currentCall,
    callDuration,
    setCallMinimized,
    endCall,
  } = useAudioCallStore();

//   if (callStatus !== "connected") return null;
if (callStatus === "idle") return null;


  return (
    <div className="fixed top-4 right-4 z-50 bg-[#202c33] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
      <span className="text-sm font-medium truncate max-w-[120px]">
        {currentCall?.participantName}
      </span>

      <span className="text-xs opacity-70 font-mono">
        {Math.floor(callDuration / 60)}:
        {String(callDuration % 60).padStart(2, "0")}
      </span>

      {/* 🔼 OPEN FULL UI */}
      <button onClick={() => setCallMinimized(false)}>
        <FaExpand />
      </button>

      {/* ❌ END */}
      {/* <button onClick={endCall} className="text-red-400">
        <FaPhoneSlash />
      </button> */}
    </div>
  );
};

export default FloatingCallBar;
