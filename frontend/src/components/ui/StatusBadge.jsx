import clsx from "clsx";

const STATUS_STYLES = {
  sent: "badge-green",
  sending: "badge-yellow",
  draft: "badge-gray",
  failed: "badge-red",
  delivered: "badge-green",
  opened: "badge-blue",
  clicked: "badge-orange",
  queued: "badge-gray",
};

export default function StatusBadge({ status }) {
  return (
    <span className={clsx(STATUS_STYLES[status] || "badge-gray")}>
      {status}
    </span>
  );
}
