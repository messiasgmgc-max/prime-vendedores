"use client";

import React, { useState } from "react";
import { Lock, Unlock, KeyRound, X, AlertCircle } from "lucide-react";

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin === "191215") {
        setTimeout(() => {
          onSuccess();
          setPin("");
          setError(false);
        }, 150);
      } else if (nextPin.length === 6) {
        setError(true);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin("");
    setError(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "191215") {
      onSuccess();
      setPin("");
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 w-full max-w-xs rounded-3xl p-6 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
        <div className="w-full flex justify-end">
          <button
            type="button"
            onClick={() => {
              setPin("");
              setError(false);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl mb-3 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-base font-black text-white tracking-wide text-center">
          Área Protegida
        </h3>
        <p className="text-xs text-slate-400 text-center mt-0.5 mb-4">
          Digite a senha de 6 dígitos para acessar o histórico
        </p>

        {/* Indicadores de PIN */}
        <div className="flex gap-2.5 mb-4">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  error
                    ? "border-red-500 bg-red-500/40"
                    : filled
                    ? "border-emerald-400 bg-emerald-400 scale-110 shadow-sm shadow-emerald-400/50"
                    : "border-slate-600 bg-slate-800"
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-1 text-red-400 text-xs font-semibold mb-3 animate-shake">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Senha incorreta! Tente novamente.</span>
          </div>
        )}

        {/* Teclado Numérico Touch Grande para Rua */}
        <div className="grid grid-cols-3 gap-2.5 w-full">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 active:scale-95 text-white text-xl font-black rounded-2xl border border-slate-700 flex items-center justify-center transition-all shadow-md"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 bg-slate-900/60 hover:bg-slate-800 active:scale-95 text-slate-400 text-xs font-bold rounded-2xl border border-slate-800 flex items-center justify-center transition-all"
          >
            LIMPAR
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="h-14 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 active:scale-95 text-white text-xl font-black rounded-2xl border border-slate-700 flex items-center justify-center transition-all shadow-md"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 bg-slate-900/60 hover:bg-slate-800 active:scale-95 text-red-400 text-xs font-bold rounded-2xl border border-slate-800 flex items-center justify-center transition-all"
          >
            APAGAR
          </button>
        </div>
      </div>
    </div>
  );
};
