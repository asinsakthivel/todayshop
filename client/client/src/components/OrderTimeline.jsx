import { getDeliveryStatusLabel, normalizeDeliveryStatus, timelineSteps } from "../lib/deliveryStatus.js";

const OrderTimeline = ({ status }) => (
  <div className="d-flex flex-wrap gap-2 align-items-center">
    {timelineSteps.map((step, idx) => {
      const done = timelineSteps.indexOf(normalizeDeliveryStatus(status)) >= idx;
      return (
        <div key={step} className="d-flex align-items-center gap-2">
          <span className={`timeline-step ${done ? "done" : ""}`}>{getDeliveryStatusLabel(step)}</span>
          {idx < timelineSteps.length - 1 ? <span className="text-muted">&gt;</span> : null}
        </div>
      );
    })}
  </div>
);

export default OrderTimeline;
