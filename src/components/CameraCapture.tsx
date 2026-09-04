"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Sparkles, SwitchCamera } from "lucide-react";

interface CameraCaptureProps {
  onPhotoCaptured: (base64: string) => void;
  capturedPhoto: string | null;
  onClearPhoto: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onPhotoCaptured,
  capturedPhoto,
  onClearPhoto,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startCamera = async (facing: "environment" | "user" = cameraFacing) => {
    setErrorMsg(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Falha ao abrir stream direto de câmera:", err);
      setErrorMsg("Câmera ao vivo indisponível ou permissão negada. Você ainda pode usar o botão para tirar foto.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Se estiver usando câmera frontal, espelha para ficar natural
    if (cameraFacing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);

    stopCamera();
    onPhotoCaptured(base64);
  };

  const toggleFacing = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        stopCamera();
        onPhotoCaptured(result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Foto do Cliente com o Produto
            </h2>
            <p className="text-xs text-slate-400">
              Garante prova de entrega presencial
            </p>
          </div>
        </div>

        {capturedPhoto && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Foto OK
          </span>
        )}
      </div>

      {/* Input nativo de arquivo oculto com capture="environment" (fallback perfeito para celular) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Se já capturou a foto */}
      {capturedPhoto ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-black aspect-video sm:aspect-4/3 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capturedPhoto}
            alt="Cliente com produto"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex justify-between items-center">
            <span className="text-xs font-mono text-emerald-300 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Foto capturada
            </span>
            <button
              type="button"
              onClick={() => {
                onClearPhoto();
                startCamera();
              }}
              className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-600 flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tirar Outra
            </button>
          </div>
        </div>
      ) : isCameraActive ? (
        /* Modo Câmera Ativa */
        <div className="relative rounded-xl overflow-hidden border-2 border-cyan-500/50 bg-black aspect-video sm:aspect-4/3 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraFacing === "user" ? "scale-x-[-1]" : ""}`}
          />

          {/* Mira / Guia visual para o vendedor centralizar o cliente e produto */}
          <div className="absolute inset-6 border-2 border-dashed border-white/40 rounded-xl pointer-events-none flex flex-col justify-between p-2">
            <span className="text-[11px] font-bold text-white/90 bg-black/60 px-2 py-0.5 rounded self-start">
              Posicione Cliente + Produto
            </span>
          </div>

          {/* Controles da câmera em tela */}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={toggleFacing}
              className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm border border-white/20 active:scale-90 transition-transform"
              title="Alternar Câmera"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-3 flex justify-center items-center gap-4 px-4">
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-2 bg-black/60 text-slate-300 text-xs rounded-lg border border-slate-700 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={takeSnapshot}
              className="h-16 w-16 bg-white hover:bg-slate-200 active:scale-90 transition-transform rounded-full flex items-center justify-center p-1.5 shadow-xl border-4 border-slate-900"
              aria-label="Disparar Foto"
            >
              <div className="w-full h-full rounded-full border-2 border-slate-900 bg-emerald-500" />
            </button>
          </div>
        </div>
      ) : (
        /* Câmera Desligada / Tela Inicial de Captura */
        <div className="flex flex-col gap-2.5">
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => startCamera("environment")}
              className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-800 to-slate-800/80 hover:from-slate-700 hover:to-slate-800 active:scale-[0.98] border-2 border-slate-700 rounded-xl transition-all group"
            >
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-white text-center">Abrir Câmera</span>
              <span className="text-[11px] text-slate-400 text-center">Visualizar ao vivo</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-800 to-slate-800/80 hover:from-slate-700 hover:to-slate-800 active:scale-[0.98] border-2 border-slate-700 rounded-xl transition-all group"
            >
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-white text-center">Tirar Foto</span>
              <span className="text-[11px] text-slate-400 text-center">Disparo nativo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
