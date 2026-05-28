const Notification = ({ note }) => (
  <div className={`alert ${note.isRead ? "alert-secondary" : "alert-info"} py-2 mb-2`}>{note.message}</div>
);

export default Notification;
