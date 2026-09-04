"use client";

import React, { useState } from "react";
import { X, Download, Share2, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { SaleReceiptData } from "@/utils/formatters";

interface ReceiptModalProps {
  receiptImage: string;
  data: SaleReceiptData;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receiptImage,
  data,
  onClose,
  onNewSale,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const downloadReceipt = () => {
    const link = document.createElement("a");
    link.href = receiptImage;
    link.download = `comprovante-${data.nsu || "venda"}-${data.id.slice(-6)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareReceipt = async () => {
    setIsSharing(true);
    try {
      // Converte data URL em File se o navegador suportar Web Share API com arquivos
      if (navigator.canShare && navigator.canShare({ files: [] })) {
        const res = await fetch(receiptImage);
        const blob = await res.blob();
        const file = new File([blob], `comprovante-venda-${data.nsu}.jpg`, {
          type: "image/jpeg",
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Comprovante de Venda - ${data.product}`,
            text: `Comprovante de entrega presencial da venda ${data.value} (NSU: ${data.nsu})`,
            files: [file],
          });
          setIsSharing(false);
          return;
        }
      }

      // Fallback para share de link / texto ou download
      if (navigator.share) {
        await navigator.share({
          title: `Comprovante de Venda - ${data.product}`,
          text: `Venda ${data.value} - NSU ${data.nsu} realizada em ${data.formattedDate}.`,
        });
      } else {
        downloadReceipt();
      }
    } catch (err) {
      console.log("Compartilhamento cancelado ou não suportado", err);
    } finally {
      setIsSharing(false);
    }
  };

  const copyPayloadJSON = () => {
    const payload = JSON.stringify(
      {
        id: data.id,
        produto: data.product,
        valor: data.value,
        nsu: data.nsu,
        data: data.formattedDate,
        temFoto: !!data.clientPhotoBase64,
        temAssinatura: !!data.signatureBase64,
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Comprovante Anti-Fraude Gerado</h3>
              <p className="text-[11px] font-mono text-emerald-400">
                NSU #{data.nsu || "0000"} • {data.value}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview do Comprovante Consolidado */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center bg-slate-950/50">
          <div className="relative rounded-xl overflow-hidden shadow-xl border border-slate-700 w-full max-w-xs sm:max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptImage}
              alt="Comprovante Consolidado"
              className="w-full h-auto object-contain block"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Imagem única contendo foto do cliente, dados da venda, NSU e assinatura.
          </p>
        </div>

        {/* Botões de Ação em Linha/Grid */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={shareReceipt}
              disabled={isSharing}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-lg shadow-emerald-500/20"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>

            <button
              type="button"
              onClick={downloadReceipt}
              className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 border border-slate-700 active:scale-98 transition-transform"
            >
              <Download className="w-4 h-4 text-sky-400" />
              Baixar Foto
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={copyPayloadJSON}
              className="text-xs text-slate-400 hover:text-slate-200 underline flex items-center gap-1 py-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
              {copied ? "JSON Copiado!" : "Copiar Payload JSON"}
            </button>

            <button
              type="button"
              onClick={onNewSale}
              className="px-4 py-2 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-xs font-bold rounded-lg border border-sky-500/30 active:scale-95 transition-all"
            >
              + Nova Venda Rápida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
