import React from "react";
import formatTimestamp from "../../utils/formatTime";

const StatusList = ({ contact, onPreview, theme }) => {
  return (
    <div
      onClick={onPreview}
      className={`flex items-center gap-4 px-4 py-3 cursor-pointer
      transition
      ${theme === "dark"
        ? "hover:bg-[#202c33]"
        : "hover:bg-gray-100"}`}
    >
      {/* AVATAR + STATUS RING */}
      <div className="relative shrink-0">
        <img
          src={contact.avatar}
          alt={contact.name}
          className="h-14 w-14 rounded-full object-cover"
        />

        {/* GREEN STATUS RING (WhatsApp style) */}
        <svg
          className="absolute inset-0 w-14 h-14"
          viewBox="0 0 100 100"
        >
          {contact.statuses.map((_, index) => {
            const circumference = 2 * Math.PI * 48;
            const segment = circumference / contact.statuses.length;
            const offset = index * segment;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="#25D366"
                strokeWidth="4"
                strokeDasharray={`${segment - 6} 6`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            );
          })}
        </svg>
      </div>

      {/* TEXT */}
      <div className="flex flex-col">
        <p
          className={`font-medium leading-tight
          ${theme === "dark" ? "text-white" : "text-gray-900"}`}
        >
          {contact?.name}
        </p>

        <p
          className={`text-sm mt-0.5
          ${theme === "dark"
            ? "text-gray-400"
            : "text-gray-500"}`}
        >
          {formatTimestamp(
            contact.statuses[contact.statuses.length - 1].timestamp
          )}
        </p>
      </div>
    </div>
  );
};

export default StatusList;
