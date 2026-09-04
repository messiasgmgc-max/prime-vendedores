"use client";

import React, { useRef, useState, useEffect } from "react";
import { PenTool, RotateCcw, CheckCircle2 } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (base64: string | null) => void;
  hasSignature: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureChange,
  hasSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  // Inicializa o Canvas mantendo DPI correto para telas retina / mobile
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Guarda o conteúdo atual caso haja resize
    const prevData = canvas.toDataURL();
    const hadContent = isTouched;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#38bdf8"; // Cor azul cyan vibrante para contraste excelente no tema escuro

    if (hadContent && prevData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = prevData;
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    // Evita comportamentos indesejados no touch
    if ("touches" in e && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsTouched(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    if ("touches" in e && e.cancelable) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      // Exporta base64 da assinatura
      const base64 = canvas.toDataURL("image/png");
      onSignatureChange(base64);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsTouched(false);
    onSignatureChange(null);
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Assinatura do Cliente
            </h2>
            <p className="text-xs text-slate-400">
              O cliente assina com o dedo na tela
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasSignature && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Assinado
            </span>
          )}
          <button
            type="button"
            onClick={clearSignature}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1 transition-all"
            title="Limpar assinatura"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>
      </div>

      {/* Caixa do Canvas Touch */}
      <div
        ref={containerRef}
        className="relative w-full h-44 bg-slate-950 border-2 border-slate-700/80 rounded-xl overflow-hidden cursor-crosshair shadow-inner"
      >
        {/* Linha guia de assinatura */}
        <div className="absolute inset-x-8 bottom-10 border-b border-dashed border-slate-700 pointer-events-none flex justify-between items-end pb-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            x Assine aqui
          </span>
          <span className="text-[10px] text-slate-400">
            Dedo ou caneta touch
          </span>
        </div>

        {!isTouched && !hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs font-medium text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-700/50">
              Toque e arraste o dedo para assinar
            </p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
};
