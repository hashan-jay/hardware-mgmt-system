import { Tracker } from '@tremor/react';
import type { Color } from '@tremor/react';
import type { Dashboard } from '../../types';
import ChartFrame from './ChartFrame';

function activityColor(total: number): Color {
  if (total <= 0) return 'gray';
  if (total === 1) return 'teal';
  if (total <= 3) return 'emerald';
  return 'amber';
}

function dayColor(added: number, issued: number, reissued: number): Color {
  if (issued > 0 && added > 0) return 'amber';
  if (issued > 0) return 'emerald';
  if (added > 0) return 'teal';
  if (reissued > 0) return 'sky';
  return 'gray';
}

function scanColor(scanned: number, missing: number, status: string): Color {
  if (status === 'InProgress') return 'amber';
  if (scanned === 0 && missing === 0) return 'gray';
  if (missing > 0) return 'rose';
  return 'emerald';
}

export default function OpsTracker({ data }: { data: Dashboard }) {
  const daily = (data.dailyPulse ?? []).map((day) => ({
    key: day.date,
    color: dayColor(day.added, day.issued, day.reissued),
    tooltip: `${day.label}: added ${day.added}, first issued ${day.issued}, reissued ${day.reissued}`,
  }));

  const activity = (data.activityPulse ?? []).map((day) => ({
    key: day.date,
    color: activityColor(day.total),
    tooltip: `${day.label}: ${day.total} actions · create ${day.creates} · update ${day.updates} · scan ${day.scans}`,
  }));

  const scans = [...(data.recentScans ?? [])].reverse().map((scan) => ({
    key: String(scan.id),
    color: scanColor(scan.scannedCount, scan.missingCount, scan.status),
    tooltip: `${scan.title}: ${scan.scannedCount} present, ${scan.missingCount} missing (${scan.status})`,
  }));

  return (
    <ChartFrame
      title="Operations trackers"
      caption="Each block is a day or a scan. Grey is quiet. Teal is intake. Green is issues or a clean scan. Amber is mixed activity. Rose is missing units."
      live
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium">14-day inventory pulse</p>
          <Tracker data={daily} />
          <p className="mt-2 text-xs text-[var(--muted)]">Added to stock, first issues, and reissues by office date.</p>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">14-day admin activity</p>
          <Tracker data={activity} />
          <p className="mt-2 text-xs text-[var(--muted)]">Creates, updates, and scan events from the audit log.</p>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Recent inventory scans</p>
          {scans.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No scans recorded yet. Completed scans will track presence here.</p>
          ) : (
            <>
              <Tracker data={scans} />
              <p className="mt-2 text-xs text-[var(--muted)]">Oldest on the left, latest on the right.</p>
            </>
          )}
        </div>
      </div>
    </ChartFrame>
  );
}
