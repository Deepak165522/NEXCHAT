import React from "react";
import { RxCross2 } from "react-icons/rx";

const ViewVotesModal = ({ isOpen, onClose, poll }) => {
  if (!isOpen || !poll) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-[#202c33] text-white w-80 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-600">
          <h3 className="font-semibold">Votes</h3>
          <button onClick={onClose}>
            <RxCross2 />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {poll.options.map((opt, idx) => (
            <div key={idx} className="px-4 py-2">
              <p className="text-sm text-gray-300 mb-2">
                {opt.text} · {opt.votes.length}
              </p>

              {opt.votes.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 py-1"
                >
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{user.username}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewVotesModal;
