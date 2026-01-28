import { FaBan } from "react-icons/fa";

export default function BlockUserModal({ user, onCancel, onBlock }) {
  return (
    <div className="modal">
      <h2>Block {user.username}?</h2>

      <p>
        This person won't be able to message or call you.
        They won't know you blocked or reported them.
      </p>

      <label>
        <input type="checkbox" /> Report to NashApp
      </label>

      <p className="text-sm">
        The last 5 messages will be sent to NashApp.
        <a href="/help" className="text-green-500"> Learn more</a>
      </p>

      <div className="flex justify-end gap-4">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onBlock} className="text-red-500">
          <FaBan /> Block
        </button>
      </div>
    </div>
  );
}
