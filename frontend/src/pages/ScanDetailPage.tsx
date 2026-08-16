import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { scansApi } from '../api/services';
import type { ScanDetail } from '../types';

export default function ScanDetailPage() {
  const { id } = useParams();
  const scanId = Number(id);
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'Working' | 'NotWorking'>('Working');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);

  const load = async () => {
    setScan(await scansApi.get(scanId));
  };

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    if (!scanId) return;
    load().catch(() => setError('Failed to load scan session.'));
    return () => {
      scannerRef.current?.stop().catch(() => undefined);
      scannerRef.current = null;
    };
  }, [scanId]);

  const recordScan = async (rawCode: string) => {
    if (busyRef.current) return;
    const uniqueCode = rawCode.trim();
    if (!uniqueCode) return;

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const scanned = await scansApi.scan(scanId, {
        uniqueCode,
        workingStatus: status,
      });
      setCode('');
      setMessage(`Recorded ${scanned.uniqueCode} (${scanned.componentName} / ${scanned.brandName}).`);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'This barcode is not registered. Add the item from Hardware first.';
      setError(msg);
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

  const completeScan = async () => {
    if (!confirm('Complete this inventory scan? Missing items will be listed for audit.')) return;
    const data = await scansApi.complete(scanId);
    setScan(data);
  };

  const updateItemStatus = async (
    scanItemId: number,
    workingStatus: 'Working' | 'NotWorking',
  ) => {
    await scansApi.updateItem(scanId, scanItemId, {
      isPresent: true,
      workingStatus,
    });
    await load();
  };

  if (!scan) return <p className="text-[var(--muted)]">Loading scan...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/scans" className="text-sm text-[var(--brand)] hover:underline">
            ← Back to inventory scanning
          </Link>
          <h2 className="mt-2 text-2xl font-semibold">{scan.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Status: {scan.status} · Started {new Date(scan.startedAt).toLocaleString()}
          </p>
        </div>
        {scan.status === 'InProgress' && (
          <button
            onClick={completeScan}
            className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white"
          >
            Complete Scan
          </button>
        )}
      </div>

      {scan.status === 'InProgress' && (
        <section className="grid gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm lg:grid-cols-2">
          <form onSubmit={onSubmit} className="space-y-3">
            <h3 className="text-lg font-semibold">Scan / Enter Code</h3>
            <p className="text-sm text-[var(--muted)]">
              Scan or type the barcode that was entered when the item was registered.
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
            <button disabled={busy} className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white disabled:opacity-60">
              {busy ? 'Saving...' : 'Record scan'}
            </button>
            {message && <p className="text-sm text-[var(--ok)]">{message}</p>}
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          </form>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Camera Scanner</h3>
              <button
                type="button"
                onClick={() => toggleCamera().catch(() => setError('Camera unavailable.'))}
                className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm"
              >
                {cameraOn ? 'Stop Camera' : 'Start Camera'}
              </button>
            </div>
            <div id="qr-reader" className="overflow-hidden rounded-xl border border-[var(--line)]" />
            <p className="mt-2 text-xs text-[var(--muted)]">
              USB barcode scanners that type into the focused input also work.
            </p>
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">
            Scanned Items ({scan.scannedItems.length})
          </h3>
          <div className="space-y-2">
            {scan.scannedItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2"
              >
                <div>
                  <p className="font-medium">{item.uniqueCode}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {item.componentName} / {item.brandName} · {item.workingStatus}
                  </p>
                </div>
                {scan.status === 'InProgress' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateItemStatus(item.id, 'Working')}
                      className="text-xs text-[var(--ok)] hover:underline"
                    >
                      Working
                    </button>
                    <button
                      onClick={() => updateItemStatus(item.id, 'NotWorking')}
                      className="text-xs text-[var(--danger)] hover:underline"
                    >
                      Not Working
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">
            Missing Items ({scan.missingItems.length})
          </h3>
          {scan.missingItems.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              {scan.status === 'Completed'
                ? 'All registered items were scanned.'
                : 'Unscanned registered items appear here during/after the scan.'}
            </p>
          ) : (
            <div className="space-y-2">
              {scan.missingItems.map((item) => (
                <div key={item.hardwareItemId} className="rounded-xl border border-[var(--line)] px-3 py-2">
                  <p className="font-medium">{item.uniqueCode}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {item.componentName} / {item.brandName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
