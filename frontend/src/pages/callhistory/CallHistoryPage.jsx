import useCallHistoryStore from "../../store/useCallHistoryStore";
import { FaPhoneAlt, FaVideo } from "react-icons/fa";

const CallHistoryPage = () => {
  const { callHistory } = useCallHistoryStore();

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="px-4 py-3 font-semibold text-lg">Calls</h2>

      {callHistory.map((call) => (
        <div
          key={call.id}
          className="flex items-center px-4 py-3 hover:bg-black/5 cursor-pointer"
        >
          <img
            src={call.avatar}
            alt=""
            className="w-10 h-10 rounded-full object-cover mr-4"
          />

          <div className="flex-1">
            <p className={`font-medium ${call.missed ? "text-red-500" : ""}`}>
              {call.name}
            </p>
            <p className="text-xs text-gray-500">
              {call.direction} • {call.time}
            </p>
          </div>

          {call.type === "video" ? (
            <FaVideo className="text-[#25D366]" />
          ) : (
            <FaPhoneAlt className="text-[#25D366]" />
          )}
        </div>
      ))}
    </div>
  );
};

export default CallHistoryPage;
