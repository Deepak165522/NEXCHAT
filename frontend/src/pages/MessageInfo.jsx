import React from "react";
import { FaTimes, FaCheckDouble } from "react-icons/fa";
import { format } from "date-fns";

const MessageInfo = ({ message, onClose }) => {
  if (!message) return null;

  const formatTime = (date) =>
    format(new Date(date), "dd/MM/yyyy, HH:mm");

  // 🔹 MESSAGE PREVIEW
  const renderPreview = () => {
    switch (message.contentType) {
      case "text":
        return <p className="text-sm">{message.content}</p>;

      case "image":
        return (
          <img
            src={message.imageOrVideoUrl}
            className="rounded-lg max-w-full"
            alt="img"
          />
        );

      case "video":
        return (
          <video
            src={message.imageOrVideoUrl}
            controls
            className="rounded-lg max-w-full"
          />
        );

      case "audio":
        return (
          <audio
            src={message.imageOrVideoUrl}
            controls
            className="w-full"
          />
        );

      case "poll":
        return (
          <div>
            <p className="font-semibold">
              {message.poll?.question}
            </p>
            {message.poll?.options?.map((o, i) => (
              <p key={i} className="text-sm opacity-70">
                • {o.text}
              </p>
            ))}
          </div>
        );

      case "location":
        return (
          <p className="text-sm">
            📍 Location shared
          </p>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="w-96 bg-white dark:bg-[#202c33] h-full p-4">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onClose}>
            <FaTimes />
          </button>
          <h2 className="text-lg font-semibold">
            Message info
          </h2>
        </div>

        {/* MESSAGE */}
        <div className="border rounded-lg p-3 mb-6">
          {renderPreview()}
        </div>

        {/* READ */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <FaCheckDouble
              className={
                message.messageStatus === "read"
                  ? "text-blue-500"
                  : "text-gray-400"
              }
            />
            <span className="font-semibold">
              Read
            </span>
          </div>

          <p className="text-sm opacity-70 ml-6">
            {message.messageStatus === "read"
              ? formatTime(message.updatedAt || message.createdAt)
              : "Not read yet"}
          </p>
        </div>

        {/* DELIVERED */}
        <div>
          <div className="flex items-center gap-2">
            <FaCheckDouble className="text-gray-400" />
            <span className="font-semibold">
              Delivered
            </span>
          </div>

          <p className="text-sm opacity-70 ml-6">
            {["delivered", "read"].includes(message.messageStatus)
              ? formatTime(message.updatedAt || message.createdAt)
              : "Not delivered yet"}
          </p>
        </div>

      </div>
    </div>
  );
};

export default MessageInfo;
