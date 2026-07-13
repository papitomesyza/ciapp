import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import PortionPicker from './PortionPicker.jsx';

function offToFood(product) {
  return {
    name: product.name,
    barcode: product.barcode,
    basisAmount: product.basis_amount,
    unit: product.unit,
    defaultAmount: product.default_amount,
    basisMacros: product.per100g,
    source: 'scan',
  };
}

export default function ScanTab({ defaultMeal, onLogged }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | scanning | not-supported | denied | error
  const [found, setFound] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const streamRef = useRef(null);
  const detectorLoopRef = useRef(null);
  const html5QrRef = useRef(null);
  const lookedUpRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function lookup(code) {
      if (lookedUpRef.current) return;
      lookedUpRef.current = true;
      try {
        const product = await api.lookupBarcode(code);
        if (!cancelled) setFound(offToFood(product));
      } catch {
        if (!cancelled) {
          setStatus('not-found');
          lookedUpRef.current = false;
        }
      }
    }

    async function startNativeDetector() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
      setStatus('scanning');
      const tick = async () => {
        if (cancelled || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            lookup(codes[0].rawValue);
          }
        } catch {
          // ignore per-frame errors
        }
        detectorLoopRef.current = requestAnimationFrame(tick);
      };
      detectorLoopRef.current = requestAnimationFrame(tick);
    }

    async function startHtml5Qrcode() {
      const { Html5Qrcode } = await import('html5-qrcode');
      const el = document.getElementById('html5qr-region');
      if (!el) return;
      const scanner = new Html5Qrcode('html5qr-region', { verbose: false });
      html5QrRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => lookup(decodedText),
        () => {}
      );
      setStatus('scanning');
    }

    async function start() {
      try {
        if ('BarcodeDetector' in window) {
          await startNativeDetector();
        } else {
          await startHtml5Qrcode();
        }
      } catch (err) {
        if (err && err.name === 'NotAllowedError') setStatus('denied');
        else setStatus('error');
      }
    }

    start();

    return () => {
      cancelled = true;
      if (detectorLoopRef.current) cancelAnimationFrame(detectorLoopRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (html5QrRef.current) html5QrRef.current.stop().catch(() => {});
    };
  }, []);

  async function handleManualLookup() {
    if (!manualCode.trim()) return;
    lookedUpRef.current = false;
    setStatus('scanning');
    try {
      const product = await api.lookupBarcode(manualCode.trim());
      setFound(offToFood(product));
    } catch {
      setStatus('not-found');
    }
  }

  async function handleConfirm(entry) {
    await onLogged(entry);
    setFound(null);
    lookedUpRef.current = false;
  }

  return (
    <div>
      {(status === 'starting' || status === 'scanning') && (
        <div className="scanner-frame">
          <video ref={videoRef} muted playsInline />
          <div id="html5qr-region" />
        </div>
      )}
      {status === 'starting' && <div className="empty-state">Starting camera…</div>}
      {status === 'scanning' && <div className="empty-state">Point the camera at a barcode</div>}
      {status === 'not-found' && <div className="empty-state">No product found for that barcode. Try search instead, or add it as a custom food.</div>}
      {(status === 'denied' || status === 'error' || status === 'not-supported') && (
        <div className="empty-state">Camera unavailable. Enter the barcode manually below.</div>
      )}

      <div className="field-row" style={{ marginTop: 14 }}>
        <div className="field">
          <label>Enter barcode manually</label>
          <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="e.g. 0123456789012" />
        </div>
      </div>
      <button className="btn btn-ghost btn-block" onClick={handleManualLookup}>Look up</button>

      {found && (
        <PortionPicker food={found} defaultMeal={defaultMeal} onClose={() => setFound(null)} onConfirm={handleConfirm} />
      )}
    </div>
  );
}
