import React, { useRef, useState } from "react";
import { FaMicrophone, FaStop } from "react-icons/fa";

const VoiceRecorder = ({ onSendAudio }) => {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

  const handleClick = async () => {
    // ▶️ START RECORDING
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const file = new File([blob], "voice.webm", {
            type: "audio/webm",
          });
          onSendAudio(file);
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (err) {
        alert("Microphone permission denied");
      }
    }

    // ⏹ STOP RECORDING
    else {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    }
  };

 return (
  <button
    onClick={handleClick}
    title={recording ? "Stop recording" : "Start recording"}
    className={`
      relative
      w-8 h-8
      rounded-full
      flex items-center justify-center
      transition
      focus:outline-none
      ${
        recording
          ? "bg-red-500 shadow-lg shadow-red-500/40"
          : "bg-gray-200 dark:bg-[#202c33]"
      }
    `}
  >
    {recording && (
      <span
        className="
          absolute inset-0
          rounded-full
          animate-ping
          bg-red-500/40
        "
      />
    )}

    {recording ? (
      <FaStop className="h-5 w-5 text-white relative z-10" />
    ) : (
      <FaMicrophone className="h-5 w-5 text-gray-600 dark:text-gray-300" />
    )}
  </button>
);

};

export default VoiceRecorder;
