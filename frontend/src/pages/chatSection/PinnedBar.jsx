import { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaVideo } from "react-icons/fa";

const PinnedBar = ({ pinnedMessages, messageRefs, setPinnedMessages }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ outside click close
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () =>
      document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const getPreviewText = (msg) => {
    switch (msg.contentType) {
      case "text":
        return msg.content;
      case "image":
        return "Photo";
      case "video":
        return "Video";
      case "audio":
        return "Voice message";
      case "poll":
        return "Poll";
      case "location":
        return "Location";
      default:
        return "Pinned message";
    }
  };

  const getTimeLeft = (expiresAt) => {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d left`;
  return `${hours}h left`;
};


  return (
    <div className="bg-[#1f4033] text-white px-3 py-2 flex items-center justify-between border-b border-black/20">
      
      {/* LEFT — scrollable pinned list */}
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 min-w-max">
          {pinnedMessages.map((msg) => (
            <div
              key={msg._id}
              onClick={() =>
                messageRefs.current[msg._id]?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                })
              }
              className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded cursor-pointer whitespace-nowrap hover:bg-black/30"
            >
              📌 {getPreviewText(msg)}

               {/* ⏱️ TIME LEFT */}
    {msg.expiresAt && (
      <span className="text-xs opacity-70 ml-1">
        {getTimeLeft(msg.expiresAt)}
      </span>
    )}

              {msg.contentType === "image" && (
                <img
                  src={msg.imageOrVideoUrl}
                  className="w-6 h-6 rounded object-cover"
                />
              )}

              {msg.contentType === "video" && (
                <FaVideo className="text-xs" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — dropdown */}
      <div className="relative ml-3" ref={dropdownRef}>
        <button onClick={() => setOpen((p) => !p)}>
          <FaChevronDown />
        </button>

        {open && (
          <div className="absolute right-0 top-8 bg-[#202c33] rounded shadow-lg w-64 z-50">
            {pinnedMessages.map((msg) => (
              <div key={msg._id} className="px-4 py-2 hover:bg-black/20">
                <button
                  className="block w-full text-left mb-1"
                  onClick={() => {
                    messageRefs.current[msg._id]?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                    setOpen(false);
                  }}
                >
                  🔎 Go to pinned message
                </button>

                <button
                  className="block w-full text-left text-red-400"
                  onClick={() => {
                    setPinnedMessages((prev) =>
                      prev.filter((m) => m._id !== msg._id)
                    );
                    setOpen(false);
                  }}
                >
                  🔓 Unpin
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PinnedBar;
