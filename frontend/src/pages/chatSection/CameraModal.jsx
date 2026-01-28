import React, { useEffect, useRef, useState } from "react";

const CameraModal = ({ onClose, onCapture }) => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const chunksRef = useRef([]);

  // 🎥 CAMERA START
  useEffect(() => {
    const startCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // 📸 PHOTO CAPTURE
  const capturePhoto = () => {
    const canvas = document.createElement("canvas");
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      onCapture(file);
    });
  };

  // 🎥 START RECORD
  const startRecording = () => {
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], "video.webm", { type: "video/webm" });
      onCapture(file);
    };

    recorder.start();
    setRecording(true);
  };

  // ⏹ STOP RECORD
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between">

      <video
  ref={videoRef}
  autoPlay
  playsInline
  className="
    w-full h-full object-cover
  "
/>


      <div className="
  absolute bottom-0 left-0 right-0
  pb-8 pt-4
  flex items-center justify-center gap-10
">

       <button
  onClick={capturePhoto}
  className="
    w-16 h-16 rounded-full
    bg-white
    border-4 border-gray-300
    active:scale-95
    transition
  "
/>


        {!recording ? (
          <button
  onClick={startRecording}
  className="
    w-16 h-16 rounded-full
    border-4 border-red-500
    flex items-center justify-center
    active:scale-95
  "
>
  <div className="w-10 h-10 bg-red-500 rounded-full" />
            
          </button>
        ) : (
         <button
  onClick={stopRecording}
  className="
    w-16 h-16 rounded-full
    border-4 border-red-500
    flex items-center justify-center
    active:scale-95
  "
>
  <div className="w-8 h-8 bg-red-500 rounded-sm" />
</button>

        )}

        <button
  onClick={onClose}
  className="
    absolute top-4 right-4
    w-10 h-10 rounded-full
    bg-black/50 text-white
    flex items-center justify-center
    text-xl
  "
>
  ✕
</button>

      </div>
    </div>
  );
};

export default CameraModal;
