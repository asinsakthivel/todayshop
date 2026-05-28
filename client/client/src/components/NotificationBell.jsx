import { useEffect, useMemo, useState } from "react";

const NotificationBell = ({
  title = "Notifications",
  items = [],
  count = 0,
  emptyMessage = "No notifications yet.",
  onMarkRead = null
}) => {
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(() => {
    if (typeof count === "number") return count;
    return items.filter((n) => !n.isRead).length;
  }, [count, items]);

  const playSound = () => {
    try {
      const audio = new Audio("/notification-sound.mp3");
      audio.volume = 0.25;
      void audio.play();
    } catch {}
  };

  const [prevUnreadCount, setPrevUnreadCount] = useState(
    items.filter((n) => !n.isRead).length
  );

  useEffect(() => {
    const nextUnreadCount = items.filter(
      (n) => !n.isRead
    ).length;

    if (nextUnreadCount > prevUnreadCount) {
      playSound();
    }

    setPrevUnreadCount(nextUnreadCount);
  }, [items, prevUnreadCount]);

  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      if (
        !e.target?.closest?.(
          ".notification-dropdown"
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "click",
      onDocClick
    );

    return () =>
      document.removeEventListener(
        "click",
        onDocClick
      );
  }, [open]);

  const handleOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen && unreadCount > 0 && onMarkRead) {
      await onMarkRead();
    }
  };

  return (
    <div className="notification-dropdown position-relative notification-bell-card">
      <button
        className="btn btn-outline-secondary"
        type="button"
        onClick={handleOpen}
      >
        <i className="bi bi-bell-fill fs-5" />

        {unreadCount > 0 && (
          <span className="cart-count-badge ms-1">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-panel card shadow-sm border-0">
          <div
            className="card-body p-2"
            style={{ minWidth: 340 }}
          >
            <div className="d-flex justify-content-between align-items-center px-2 py-1 mb-2">
              <div className="fw-semibold">
                {title}
              </div>

              {unreadCount > 0 && (
                <span className="badge rounded-pill text-bg-dark">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {items.length ? (
              <div className="notification-list">
                {items
                  .slice(0, 8)
                  .map((item) => (
                    <div
                      key={
                        item.id ||
                        `${item.orderId}-${item.time}`
                      }
                      className="notification-list-item text-start w-100"
                    >
                      <div className="small fw-semibold">
                        {item.statusMessage ||
                          item.message}
                      </div>

                      <div className="text-muted small mt-1">
                        <div>
                          Order:{" "}
                          {item.orderId || "-"}
                        </div>
                        <div>
                          Customer:{" "}
                          {item.customerName ||
                            "-"}
                        </div>
                        <div>
                          Location:{" "}
                          {item.deliveryLocation ||
                            "-"}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-muted small px-2 py-2">
                {emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
