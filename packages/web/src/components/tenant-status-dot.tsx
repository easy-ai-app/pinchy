"use client";

const statusColors: Record<string, string> = {
  running: "bg-emerald-500",
  provisioning: "bg-amber-500 animate-pulse",
  error: "bg-red-500",
  stopped: "bg-gray-400",
  deleting: "bg-gray-400",
};

export function TenantStatusDot({ status }: { status: string }) {
  const colorClass = statusColors[status] ?? "bg-gray-400";
  return <span className={`inline-block size-2 rounded-full ${colorClass}`} />;
}
