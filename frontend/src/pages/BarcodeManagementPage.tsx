import { useEffect, useMemo, useState } from 'react';
import { ListOrdered, Printer, Ruler } from 'lucide-react';
import { barcodeQueueApi, printersApi } from '../api/services';
import Barcode from '../components/Barcode';
import type { LabelPrinter, PrintSize, QueuedBarcode } from '../types';

function apiMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
}

export default function BarcodeManagementPage() {
  const [printers, setPrinters] = useState<LabelPrinter[]>([]);
  const [sizes, setSizes] = useState<PrintSize[]>([]);
  const [queue, setQueue] = useState<QueuedBarcode[]>([]);
  const [printerName, setPrinterName] = useState('');
  const [sizeName, setSizeName] = useState('');
  const [widthMm, setWidthMm] = useState('50');
  const [heightMm, setHeightMm] = useState('25');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [printJob, setPrintJob] = useState<QueuedBarcode[] | null>(null);

  const selectedPrinter = printers.find((printer) => printer.isSelected) ?? null;

  const load = async () => {
    const nextPrinters = await printersApi.list();
    setPrinters(nextPrinters);
    const selected = nextPrinters.find((printer) => printer.isSelected) ?? null;
    const [nextSizes, nextQueue] = await Promise.all([
      selected ? printersApi.listSizes(selected.id) : Promise.resolve([]),
      barcodeQueueApi.list(),
    ]);
    setSizes(nextSizes);
    setQueue(nextQueue);
  };

  useEffect(() => {
    void load().catch((err: unknown) => setError(apiMessage(err, 'Failed to load barcode management.')));
  }, []);

  useEffect(() => {
    if (!printJob?.length) return;
    const timer = window.setTimeout(() => window.print(), 120);
    const onAfterPrint = () => setPrintJob(null);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [printJob]);

  const defaultSize = sizes.find((size) => size.isDefault) ?? sizes[0] ?? null;
  const printSize = printJob?.[0]
    ? sizes.find((size) => size.id === printJob[0].printSizeId) ??
      (printJob[0].widthMm && printJob[0].heightMm
        ? { widthMm: printJob[0].widthMm, heightMm: printJob[0].heightMm }
        : defaultSize)
    : null;

  const readyToPrint = useMemo(
    () => queue.filter((item) => item.printSizeId && sizes.some((size) => size.id === item.printSizeId)),
    [queue, sizes],
  );

  const run = async (work: () => Promise<void>, ok?: string) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await work();
      await load();
      if (ok) setMessage(ok);
    } catch (err: unknown) {
      setError(apiMessage(err, 'Could not save barcode settings.'));
    } finally {
      setBusy(false);
    }
  };

  const addPrinter = () => {
    if (!printerName.trim()) {
      setError('Printer name is required.');
      return;
    }
    void run(async () => {
      await printersApi.create({ name: printerName.trim() });
      setPrinterName('');
    }, 'Printer added. Create a matching label size next.');
  };

  const addSize = () => {
    if (!selectedPrinter) {
      setError('Select a printer before adding a size.');
      return;
    }
    const width = Number(widthMm);
    const height = Number(heightMm);
    if (!sizeName.trim() || !(width > 0) || !(height > 0)) {
      setError('Enter a size name plus width and height in millimetres.');
      return;
    }
    void run(async () => {
      await printersApi.createSize(selectedPrinter.id, {
        name: sizeName.trim(),
        widthMm: width,
        heightMm: height,
      });
      setSizeName('');
    }, 'Print size saved for the selected printer.');
  };

  const printItems = (items: QueuedBarcode[]) => {
    const printable = items.filter((item) => item.printSizeId && item.widthMm && item.heightMm);
    if (printable.length === 0) {
      setError('Assign a print size that matches the selected printer before printing.');
      return;
    }
    const firstSize = printable[0].printSizeId;
    if (printable.some((item) => item.printSizeId !== firstSize)) {
      setError('Queued barcodes use different sizes. Print them one at a time, or set them to the same size.');
      return;
    }
    setError('');
    setPrintJob(printable);
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Barcode Management</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Queue barcodes, choose the office label printer, then set sizes that match that printer’s labels.
        </p>
      </header>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && <p className="text-sm text-[var(--ok)]">{message}</p>}

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListOrdered size={18} className="text-[var(--brand)]" />
            <h3 className="text-lg font-semibold">Queued barcodes</h3>
          </div>
          <button
            type="button"
            disabled={busy || readyToPrint.length === 0}
            onClick={() => printItems(queue)}
            className="rounded-lg bg-[var(--inverse)] px-3 py-2 text-sm font-medium text-[var(--on-inverse)] disabled:opacity-60"
          >
            Print queued
          </button>
        </div>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Use Queue Barcode on an item, then pick a size that matches the selected printer.
        </p>
        {queue.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No barcodes in the print queue yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="px-2 py-2 font-medium">Barcode</th>
                  <th className="px-2 py-2 font-medium">Component</th>
                  <th className="px-2 py-2 font-medium">Brand</th>
                  <th className="px-2 py-2 font-medium">Print size</th>
                  <th className="px-2 py-2 font-medium">Queued at</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => {
                  const sizeMatches = !item.printSizeId || sizes.some((size) => size.id === item.printSizeId);
                  return (
                    <tr key={item.id} className="border-b border-[var(--line)] last:border-0">
                      <td className="px-2 py-3 font-medium">{item.uniqueCode}</td>
                      <td className="px-2 py-3">{item.componentName}</td>
                      <td className="px-2 py-3">{item.brandName}</td>
                      <td className="px-2 py-3">
                        <select
                          className="w-full min-w-[160px] rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5"
                          value={sizeMatches ? item.printSizeId ?? '' : ''}
                          onChange={(event) => {
                            const printSizeId = Number(event.target.value);
                            if (!printSizeId) return;
                            void run(() => barcodeQueueApi.assignSize(item.id, printSizeId));
                          }}
                        >
                          <option value="">{sizes.length ? 'Select size' : 'Add a printer size first'}</option>
                          {sizes.map((size) => (
                            <option key={size.id} value={size.id}>
                              {size.name} · {size.widthMm}×{size.heightMm} mm
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="px-2 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="mr-3 text-sm text-[var(--brand)] hover:underline"
                          onClick={() => printItems([item])}
                        >
                          Print
                        </button>
                        <button
                          type="button"
                          className="text-sm text-[var(--danger)] hover:underline"
                          onClick={() => void run(() => barcodeQueueApi.remove(item.id))}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Printer size={18} className="text-[var(--brand)]" />
          <h3 className="text-lg font-semibold">Integrated printers</h3>
        </div>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Add the label printer used in this office, then select it. Choose the same printer in the Windows print dialog
          so the label size matches.
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">New printer</span>
            <input
              className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
              placeholder="e.g. Zebra ZD220"
              value={printerName}
              onChange={(event) => setPrinterName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addPrinter();
                }
              }}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={addPrinter}
            className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white disabled:opacity-60 md:mt-6"
          >
            Add printer
          </button>
        </div>
        <label className="mt-4 block max-w-md text-sm">
          <span className="mb-1 block font-medium">Selected printer</span>
          <select
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
            value={selectedPrinter?.id ?? ''}
            onChange={(event) => {
              const id = Number(event.target.value);
              if (!id) return;
              void run(() => printersApi.select(id), 'Printer selected. Use sizes that match this printer.');
            }}
          >
            <option value="">{printers.length ? 'Select printer' : 'No printers added yet'}</option>
            {printers.map((printer) => (
              <option key={printer.id} value={printer.id}>
                {printer.name}
              </option>
            ))}
          </select>
        </label>
        {selectedPrinter && (
          <button
            type="button"
            className="mt-3 text-sm text-[var(--danger)] hover:underline"
            onClick={() => void run(() => printersApi.remove(selectedPrinter.id), 'Printer removed.')}
          >
            Remove selected printer
          </button>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Ruler size={18} className="text-[var(--brand)]" />
          <h3 className="text-lg font-semibold">Printing sizes</h3>
        </div>
        <p className="mb-4 text-sm text-[var(--muted)]">
          {selectedPrinter
            ? `Sizes for ${selectedPrinter.name}. Width and height should match the labels loaded in that printer.`
            : 'Select a printer first, then add the label sizes it can print.'}
        </p>
        <div className="grid gap-3 md:grid-cols-[1.2fr_repeat(2,0.7fr)_auto]">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Size name</span>
            <input
              className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
              placeholder="e.g. 50 × 25 mm"
              value={sizeName}
              onChange={(event) => setSizeName(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Width (mm)</span>
            <input
              className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
              type="number"
              min="1"
              step="0.1"
              value={widthMm}
              onChange={(event) => setWidthMm(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Height (mm)</span>
            <input
              className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
              type="number"
              min="1"
              step="0.1"
              value={heightMm}
              onChange={(event) => setHeightMm(event.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={busy || !selectedPrinter}
            onClick={addSize}
            className="rounded-lg bg-[var(--brand)] px-4 py-2 font-medium text-white disabled:opacity-60 md:mt-6"
          >
            Add size
          </button>
        </div>
        {sizes.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No print sizes saved for this printer yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="px-2 py-2 font-medium">Size name</th>
                  <th className="px-2 py-2 font-medium">Width</th>
                  <th className="px-2 py-2 font-medium">Height</th>
                  <th className="px-2 py-2 font-medium">Default</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {sizes.map((size) => (
                  <tr key={size.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-2 py-3 font-medium">{size.name}</td>
                    <td className="px-2 py-3">{size.widthMm} mm</td>
                    <td className="px-2 py-3">{size.heightMm} mm</td>
                    <td className="px-2 py-3">{size.isDefault ? 'Yes' : '—'}</td>
                    <td className="px-2 py-3 text-right whitespace-nowrap">
                      {!size.isDefault && (
                        <button
                          type="button"
                          className="mr-3 text-sm text-[var(--brand)] hover:underline"
                          onClick={() => void run(() => printersApi.setDefaultSize(size.id), 'Default size updated.')}
                        >
                          Make default
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-sm text-[var(--danger)] hover:underline"
                        onClick={() => void run(() => printersApi.removeSize(size.id))}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {printJob && printSize && (
        <div
          id="queued-barcode-print"
          className="hidden print:block"
          style={{ width: `${printSize.widthMm}mm`, height: `${printSize.heightMm}mm` }}
        >
          <style>{`@media print { @page { size: ${printSize.widthMm}mm ${printSize.heightMm}mm; margin: 2mm; } }`}</style>
          {printJob.map((item, index) => (
            <div
              key={item.id}
              className="flex h-full flex-col items-center justify-center bg-white"
              style={index > 0 ? { pageBreakBefore: 'always' } : undefined}
            >
              <Barcode
                value={item.uniqueCode}
                height={Math.max(28, Number(printSize.heightMm) * 1.6)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
