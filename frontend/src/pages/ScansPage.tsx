import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { itemsApi, scansApi } from '../api/services';
import ItemInspectModal, { scanLineToItem } from '../components/ItemInspectModal';
import type { Item, ScanItem, ScanLog } from '../types';

function isoDate(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function apiMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

function csvEscape(value: string | number | null | undefined) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number | null | undefined>>) {
  const csv = [header, ...rows].map((line) => line.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ScansPage() {
  const today = isoDate();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [log, setLog] = useState<ScanLog | null>(null);
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'Working' | 'NotWorking'>('Working');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [inspect, setInspect] = useState<{ item: Item; line: ScanItem } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);

  const viewingToday = from === today && to === today;
  const rangeLabel = useMemo(() => {
    if (from === to) return new Date(`${from}T00:00:00`).toLocaleDateString();
    return `${new Date(`${from}T00:00:00`).toLocaleDateString()} – ${new Date(`${to}T00:00:00`).toLocaleDateString()}`;
  }, [from, to]);

  const load = async (start = from, end = to) => {
    const data = await scansApi.log(start, end);
    setLog(data);
  };

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    load(from, to).catch(() => setError('Failed to load scanned items.'));
  }, [from, to]);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => undefined);
      scannerRef.current = null;
    };
  }, []);

  const startScan = () => {
    setFrom(today);
    setTo(today);
    setScanning(true);
    setError('');
    setMessage('');
  };

  const recordScan = async (rawCode: string) => {
    if (busyRef.current) return;
    const uniqueCode = rawCode.trim();
    if (!uniqueCode) return;
    if (status === 'NotWorking' && !reason.trim()) {
      setError('Enter why this device is not working before recording the scan.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const scanned = await scansApi.record({
        uniqueCode,
        workingStatus: status,
        notWorkingReason: status === 'NotWorking' ? reason.trim() : undefined,
      });
      setCode('');
      setFrom(today);
      setTo(today);
      setMessage(`Recorded ${scanned.uniqueCode} (${scanned.componentName} / ${scanned.brandName}).`);
      await load(today, today);
    } catch (err: unknown) {
      setError(apiMessage(err, 'This barcode is not registered. Add the item in Inventory first, then scan it here.'));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await recordScan(code);
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      await scannerRef.current?.stop().catch(() => undefined);
      scannerRef.current = null;
      setCameraOn(false);
      return;
    }

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 120 } },
      async (decoded) => {
        if (busyRef.current) return;
        await scanner.pause(true);
        await recordScan(decoded);
        setTimeout(() => {
          try {
            scanner.resume();
          } catch {
            /* ignore resume errors */
          }
        }, 1200);
      },
      () => undefined,
    );
    setCameraOn(true);
  };

  const openLine = async (line: ScanItem) => {
    try {
      const item = await itemsApi.get(line.hardwareItemId);
      setInspect({ item, line });
    } catch {
      setInspect({ item: scanLineToItem(line), line });
    }
  };

  const exportCsv = () => {
    if (!log) return;
    downloadCsv(
      `hardware-scan-${from}-to-${to}.csv`,
      ['Date', 'Barcode', 'Category', 'Brand', 'Holder', 'Department', 'Working status', 'Scanned at'],
      log.scannedItems.map((line) => [
        line.scanStartedAt ? new Date(line.scanStartedAt).toLocaleDateString() : '',
        line.uniqueCode,
        line.componentName,
        line.brandName,
        line.holderName || 'In stock',
        line.holderName ? line.holderDepartment || '—' : '—',
        line.workingStatus,
        line.scannedAt ? new Date(line.scannedAt).toLocaleString() : '',
      ]),
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Inventory Scanning</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Scan items found in the office. Today is selected automatically. Change the dates to review or print another period.
          </p>
        </div>
        <button
          type="button"
          onClick={startScan}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
        >
          Start scan
        </button>
      </header>

      <form className="grid gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_auto_auto]">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Start date</span>
          <input
            type="date"
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
            value={from}
            max={today}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">End date</span>
          <input
            type="date"
            className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
            value={to}
            max={today}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <div className="flex items-end">
          <button type="button" onClick={() => window.print()} className="w-full rounded-lg border border-[var(--line)] px-4 py-2 text-sm">
            Print PDF
          </button>
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={exportCsv}
            disabled={!log}
            className="w-full rounded-lg border border-[var(--line)] px-4 py-2 text-sm disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </form>

      {scanning && viewingToday && (
        <section className="grid gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm lg:grid-cols-2">
          <form onSubmit={onSubmit} className="space-y-3">
            <h3 className="text-lg font-semibold">Scan for {new Date(`${today}T00:00:00`).toLocaleDateString()}</h3>
            <p className="text-sm text-[var(--muted)]">
              Every scan is saved to today. Tomorrow a new date starts automatically.
            </p>
            <input
              autoFocus
              placeholder="Scan or enter barcode"
              className="w-full rounded-lg border border-[var(--line)] px-3 py-2 uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <select
              className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Working' | 'NotWorking')}
            >
              <option value="Working">Working</option>
              <option value="NotWorking">Not Working</option>
            </select>
            {status === 'NotWorking' && (
              <textarea
                className="min-h-20 w-full rounded-lg border border-[var(--line)] px-3 py-2"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this device not working? Required."
              />
            )}
            <button disabled={busy} className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white disabled:opacity-60">
              {busy ? 'Saving...' : 'Record scan'}
            </button>
            {message && <p className="text-sm text-[var(--ok)]">{message}</p>}
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          </form>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Camera scanner</h3>
              <button
                type="button"
                onClick={() => toggleCamera().catch(() => setError('Camera unavailable.'))}
                className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm"
              >
                {cameraOn ? 'Stop camera' : 'Start camera'}
              </button>
            </div>
            <div id="qr-reader" className="overflow-hidden rounded-xl border border-[var(--line)]" />
          </div>
        </section>
      )}

      {error && !scanning && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {log && (
        <div id="scan-report-print" className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-[var(--muted)]">In the system</p>
              <p className="mt-1 text-3xl font-semibold">{log.inSystemCount}</p>
            </article>
            <article className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-[var(--muted)]">Scanned in this date range</p>
              <p className="mt-1 text-3xl font-semibold">{log.scannedCount}</p>
            </article>
            <article className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-[var(--muted)]">Not scanned in this date range</p>
              <p className={`mt-1 text-3xl font-semibold ${log.missingCount ? 'text-[var(--danger)]' : ''}`}>
                {log.missingCount}
              </p>
            </article>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-lg font-semibold">
              {viewingToday ? "Today's scanned items" : `Scanned items · ${rangeLabel}`} ({log.scannedItems.length})
            </h3>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Click a row for the full item record. Scanning always writes to today, even if you were browsing another date.
            </p>
            {log.scannedItems.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                {viewingToday
                  ? 'Nothing scanned today yet. Press Start scan to begin.'
                  : 'No items were scanned in this date range.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                    <tr>
                      <th className="px-2 py-2">Barcode</th>
                      <th className="px-2 py-2">Category / brand</th>
                      <th className="px-2 py-2">Holder</th>
                      <th className="px-2 py-2">Department</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Scanned at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.scannedItems.map((item) => (
                      <tr key={`${item.scanId}-${item.id}`} className="border-b border-[var(--line)] last:border-0">
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => void openLine(item)}
                            className="font-medium text-[var(--brand)] hover:underline"
                          >
                            {item.uniqueCode}
                          </button>
                        </td>
                        <td className="px-2 py-3">
                          {item.componentName} / {item.brandName}
                        </td>
                        <td className="px-2 py-3">{item.holderName || 'In stock'}</td>
                        <td className="px-2 py-3">{item.holderName ? item.holderDepartment || '—' : '—'}</td>
                        <td className="px-2 py-3">{item.workingStatus === 'NotWorking' ? 'Not working' : 'Working'}</td>
                        <td className="px-2 py-3">{item.scannedAt ? new Date(item.scannedAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {inspect && (
        <ItemInspectModal item={inspect.item} line={inspect.line} onClose={() => setInspect(null)} />
      )}
    </div>
  );
}
