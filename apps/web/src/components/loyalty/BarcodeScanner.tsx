"use client";

// app_build/apps/web/src/components/loyalty/BarcodeScanner.tsx

import React, { useState, useEffect } from "react";
import { BarcodeFormat } from "../../types/loyalty-card";

interface BarcodeScannerProps {
  onScan: (data: string, format: BarcodeFormat) => void;
  onCancel: () => void;
}

export function BarcodeScanner({ onScan, onCancel }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate camera access and scanning
    const startScanning = () => {
      setScanning(true);
      setError(null);
    };
    startScanning();

    const simulateScan = setTimeout(() => {
      if (Math.random() > 0.2) {
        // 80% chance of successful scan
        onScan(
          "SIMULATED_BARCODE_DATA_" + Date.now().toString().slice(-4),
          BarcodeFormat.CODE_128,
        );
      } else {
        setError("Échec de la détection du code-barres. Veuillez réessayer.");
      }
      setScanning(false);
    }, 2000); // Simulate 2 seconds scanning time

    return () => clearTimeout(simulateScan);
  }, [onScan]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {scanning ? (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-lg animate-pulse">
          <p className="text-gray-600">Recherche de code-barres...</p>
        </div>
      ) : (
        <div className="w-full h-48 bg-green-100 flex items-center justify-center rounded-lg">
          <p className="text-green-800">Prêt à scanner.</p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="mt-4 flex space-x-2">
        <button
          onClick={onCancel}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
