import React from "react";
import useCallHistoryStore from "../../store/useCallHistoryStore";
import { FaPhoneAlt, FaVideo } from "react-icons/fa";

const CallsPage = () => {
  const calls = useCallHistoryStore((s) => s.calls);

  if (!calls.length) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        No call history
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="p-4 text-lg font-semibold">Calls</h2>

      {calls.map((call) => (
        <div
          key={call.id}
          className="flex items-center px-4 py-3 hover:bg-black/5 cursor-pointer"
        >
          {/* Avatar */}
          <img
            src={call.avatar || "/placeholder.svg"}
            alt=""
            className="w-10 h-10 rounded-full object-cover mr-4"
          />

          {/* Name + info */}
          <div className="flex-1">
            <p className="font-medium">{call.name}</p>
            <p className="text-xs text-gray-400">
              {call.direction} • {call.missed ? "Missed" : "Connected"}
            </p>
          </div>

          {/* Type + time */}
          <div className="text-right text-sm text-gray-400">
            {call.type === "video" ? <FaVideo /> : <FaPhoneAlt />}
            <div>{call.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CallsPage;
