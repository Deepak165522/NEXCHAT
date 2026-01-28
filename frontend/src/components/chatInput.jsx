import { FaCamera } from "react-icons/fa";
import CameraModal from "./CameraModal";
import { useState } from "react";

const ChatInput = () => {
  const [showCamera, setShowCamera] = useState(false);

  return (
    <div className="flex items-center gap-2 p-2">

      {/* 😊 Emoji / typing ke bagal */}
      <button
        onClick={() => setShowCamera(true)}
        className="p-2 text-gray-500 hover:text-green-500"
      >
        <FaCamera size={20} />
      </button>

      <input
        type="text"
        placeholder="Type a message"
        className="flex-1 px-4 py-2 rounded-full border"
      />

      {showCamera && (
        <CameraModal onClose={() => setShowCamera(false)} />
      )}
    </div>
  );
};

export default ChatInput;
