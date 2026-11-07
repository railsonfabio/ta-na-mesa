"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Logo } from "./Logo";
import { X, Copy, Check, Smartphone, Wifi } from "lucide-react";

interface TableQrModalProps {
  tableNumber: number;
  onClose: () => void;
}

export function TableQrModal({ tableNumber, onClose }: TableQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [networkUrl, setNetworkUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Detect host or use local LAN IP 192.168.1.2
    let host = "192.168.1.2";
    if (typeof window !== "undefined") {
      const currentHost = window.location.hostname;
      if (currentHost !== "localhost" && currentHost !== "127.0.0.1") {
        host = currentHost;
      }
    }

    const targetUrl = `http://${host}:3005/mesa/${tableNumber}`;
    setNetworkUrl(targetUrl);

    // Generate real 2D QR Code
    QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: "#1F2421",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Erro gerando QR Code:", err));
  }, [tableNumber]);

  const handleCopy = () => {
    navigator.clipboard.writeText(networkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-[#EFE9DF] shadow-2xl relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Topo: Display de Mesa em Acrílico */}
        <div className="flex flex-col items-center mb-3">
          <Logo size="md" variant="full" />
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2F0] text-[#C83E2B] border border-[#FADCD7] text-xs font-black">
            <span>🍽️ DISPLAY DA MESA {tableNumber}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 mb-4 px-2">
          Aponte a <strong>câmera do seu celular</strong> para este QR Code para abrir o cardápio e a comanda viva da mesa!
        </p>

        {/* O QR Code Real e Legível */}
        <div className="p-3 bg-white rounded-2xl border-2 border-neutral-200 shadow-md inline-block mb-3">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code Mesa ${tableNumber}`}
              className="w-52 h-52 mx-auto rounded-lg"
            />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center bg-neutral-100 text-xs text-neutral-400">
              Gerando QR Code...
            </div>
          )}
        </div>

        {/* Dica de Rede Wi-Fi */}
        <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-500 mb-3 bg-[#FAF8F5] py-1.5 px-3 rounded-xl border border-neutral-200">
          <Wifi className="w-3.5 h-3.5 text-[#F4A261]" />
          <span>Certifique-se de que o celular está no mesmo Wi-Fi</span>
        </div>

        {/* Link direto caso queira copiar no WhatsApp */}
        <div className="bg-neutral-100 rounded-xl p-2 flex items-center justify-between text-[11px] font-mono text-neutral-600 mb-4">
          <span className="truncate mr-2">{networkUrl}</span>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-1.5 bg-white rounded-lg shadow-2xs hover:bg-neutral-50 text-neutral-700"
            title="Copiar Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#1F2421] hover:bg-neutral-800 text-white font-bold text-xs py-3 rounded-xl cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
