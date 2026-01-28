export default function UnblockConfirm({ user, onUnblock }) {
  return (
    <div className="modal">
      <h2>Unblock {user.username}?</h2>
      <button onClick={onUnblock} className="bg-green-500 text-white">
        Unblock
      </button>
    </div>
  );
}
