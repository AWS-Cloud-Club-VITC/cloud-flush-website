"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onScan: (text: string) => void;
}

let instanceCounter = 0;

export default function QRScannerWidget({ onScan }: Props) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const idRef = useRef(`qr-scanner-${++instanceCounter}`);
  const [error, setError] = useState("");

  useEffect(() => {
    const divId = idRef.current;
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let stopped = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped) return;
        scanner = new Html5Qrcode(divId);
        const config = { fps: 15, qrbox: { width: 250, height: 250 } };
        try {
          await scanner.start({ facingMode: "environment" }, config,
            (text: string) => { if (!stopped) onScanRef.current(text); }, () => {});
        } catch {
          if (stopped) return;
          await scanner.start({ facingMode: "user" }, config,
            (text: string) => { if (!stopped) onScanRef.current(text); }, () => {});
        }
      } catch (err) {
        if (!stopped) setError(err instanceof Error ? err.message : "Camera failed. Check permissions.");
      }
    }

    startScanner();

    return () => {
      stopped = true;
      scanner?.stop().catch(() => {}).finally(() => scanner?.clear());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div
        className="w-full rounded-xl flex items-center justify-center text-sm px-6 text-center"
        style={{ minHeight: "200px", background: "#0d1117", color: "#f85149", border: "1px solid #da3633" }}
      >
        ⚠ {error}
      </div>
    );
  }

  return (
    <div
      id={idRef.current}
      className="w-full rounded-xl"
      style={{ background: "#0d1117", minHeight: "340px" }}
    />
  );
}
