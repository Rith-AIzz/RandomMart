"use client";

import { useState } from "react";
import Link from "next/link";
import { BookmarkPlus, Trash2 } from "lucide-react";

type SavedReport = { id: string; name: string; href: string };
type Filters = {
  range: "7" | "30" | "90" | "custom";
  from: string;
  to: string;
  timezone: string;
  metric: "revenue" | "orders";
};

export function SavedReportControls({
  liveMode,
  reports: initialReports,
  filters,
}: {
  liveMode: boolean;
  reports: SavedReport[];
  filters: Filters;
}) {
  const [reports, setReports] = useState(initialReports);
  const [message, setMessage] = useState("");
  const save = async () => {
    const name = window.prompt("Name this report:")?.trim();
    if (!name) return;
    const response = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, filters }),
    });
    const result = (await response.json()) as {
      report?: { id: string; name: string };
      message?: string;
    };
    if (!response.ok || !result.report)
      return setMessage(result.message ?? "Unable to save report.");
    const href = `/admin?range=${filters.range}&from=${filters.from}&to=${filters.to}&timezone=${encodeURIComponent(filters.timezone)}&metric=${filters.metric}`;
    setReports((current) => [
      { ...result.report!, href },
      ...current.filter((report) => report.id !== result.report!.id),
    ]);
    setMessage("Report saved.");
  };
  const remove = async (id: string) => {
    const response = await fetch(`/api/admin/reports/${id}`, {
      method: "DELETE",
    });
    if (response.ok)
      setReports((current) => current.filter((report) => report.id !== id));
    else setMessage("Unable to delete report.");
  };
  return (
    <section className="admin-card saved-reports">
      <div>
        <p className="eyebrow">Views</p>
        <h2>Saved reports</h2>
      </div>
      {message && <p role="status">{message}</p>}
      <div className="saved-report-list">
        {reports.map((report) => (
          <span key={report.id}>
            <Link href={report.href}>{report.name}</Link>
            {liveMode && (
              <button
                type="button"
                aria-label={`Delete ${report.name}`}
                onClick={() => void remove(report.id)}
              >
                <Trash2 size={13} />
              </button>
            )}
          </span>
        ))}
        {!reports.length && <small>No reports saved yet.</small>}
      </div>
      <button
        className="button button-outline"
        type="button"
        disabled={!liveMode}
        onClick={() => void save()}
      >
        <BookmarkPlus size={16} /> Save current view
      </button>
    </section>
  );
}
