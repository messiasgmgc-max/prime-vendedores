"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Package,
  CreditCard,
  ShieldAlert,
  CheckCircle,
  FileCheck,
  Zap,
  Sparkles,
  AlertTriangle,
  History,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CameraCapture } from "@/components/CameraCapture";
import { SignaturePad } from "@/components/SignaturePad";
import { ReceiptModal } from "@/components/ReceiptModal";
import { PasswordModal } from "@/components/PasswordModal";
import {
  formatCurrencyBRL,
  SaleReceiptData,
} from "@/utils/formatters";
import { generateConsolidatedReceiptImage } from "@/utils/generateReceiptImage";
import { supabase } from "@/utils/supabaseClient";

export default function Home() {
  // Inputs da Venda
  const [value, setValue] = useState("");
  const [product, setProduct] = useState("");
  const [nsu, setNsu] = useState("");

  // Foto e Assinatura
  const [clientPhoto, setClientPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  // Estados de Processamento
  const [isGenerating, setIsGenerating] = useState(false);
  const [receiptModalData, setReceiptModalData] = useState<{
    image: string;
    saleData: SaleReceiptData;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Histórico local e proteção com senha do cadeado (PIN: 191215)
  const [recentSales, setRecentSales] = useState<
    Array<{ id: string; nsu: string; value: string; product: string; time: string; image: string }>
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pendingAction, setPendingAction] = useState<"history" | "receipt" | null>(null);

  // Comprovante recém-gerado aguardando liberação do cadeado
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("prime_recent_sales");
      if (saved) {
        setRecentSales(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Falha ao recuperar histórico local", e);
    }
  }, []);

  const saveToLocalHistory = (entry: {
    id: string;
    nsu: string;
    value: string;
    product: string;
    time: string;
    image: string;
  }) => {
    const updated = [entry, ...recentSales.slice(0, 9)];
    setRecentSales(updated);
    try {
      localStorage.setItem("prime_recent_sales", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage cheio ou indisponível");
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatCurrencyBRL(raw);
    setValue(formatted);
  };

  const handleSaveReceipt = async () => {
    setValidationError(null);

    // Validações essenciais
    if (!value || value === "R$ 0,00") {
      setValidationError("Informe o Valor da venda.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!product.trim()) {
      setValidationError("Informe o Produto vendido.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!nsu.trim()) {
      setValidationError("Informe o NSU/Autorização da maquininha.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!clientPhoto) {
      setValidationError("Capture a foto do cliente segurando o produto.");
      return;
    }
    if (!signature) {
      setValidationError("Solicite a assinatura do cliente na tela.");
      return;
    }

    setIsGenerating(true);

    try {
      const now = new Date();
      const formattedDate = now.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const saleId = "AUTH-" + Math.random().toString(36).substring(2, 9).toUpperCase();

      const saleData: SaleReceiptData = {
        id: saleId,
        value,
        product: product.trim(),
        nsu: nsu.trim(),
        timestamp: now.toISOString(),
        formattedDate,
        clientPhotoBase64: clientPhoto,
        signatureBase64: signature,
      };

      // Gera a imagem combinada anti-fraude
      const consolidatedImage = await generateConsolidatedReceiptImage({
        value: saleData.value,
        product: saleData.product,
        nsu: saleData.nsu,
        formattedDate: saleData.formattedDate,
        clientPhotoBase64: clientPhoto,
        signatureBase64: signature,
        id: saleId,
      });

      // Efeito de sucesso e vibração tátil no celular se suportado
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {}

      saveToLocalHistory({
        id: saleId,
        nsu: saleData.nsu,
        value: saleData.value,
        product: saleData.product,
        time: formattedDate,
        image: consolidatedImage,
      });

      // Sincronização em nuvem no Supabase em segundo plano
      (async () => {
        try {
          const { error } = await supabase
            .from("comprovantes")
            .insert([
              {
                protocolo: saleId,
                valor: saleData.value,
                produto: saleData.product,
                nsu: saleData.nsu,
                comprovante_consolidado_url: consolidatedImage,
                payload: {
                  data: saleData.formattedDate,
                  hasPhoto: !!clientPhoto,
                  hasSignature: !!signature,
                },
              },
            ]);

          if (error) {
            console.warn("Supabase: Tabela 'comprovantes' ainda não criada ou erro de inserção:", error.message);
          } else {
            console.log("Comprovante sincronizado com sucesso no Supabase!");
          }
        } catch (err) {
          console.warn("Erro de conexão com Supabase:", err);
        }
      })();

      // Limpa os campos para a próxima venda ágil
      setValue("");
      setProduct("");
      setNsu("");
      setClientPhoto(null);
      setSignature(null);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Guarda os dados do comprovante recém-gerado
      setReceiptModalData({
        image: consolidatedImage,
        saleData,
      });

      // Exibe mensagem de sucesso protegida
      setSavedSuccessMessage(`Comprovante ${saleId} gravado com sucesso! Clique no cadeado com a senha para visualizar.`);
    } catch (err: any) {
      console.error(err);
      setValidationError("Erro ao processar comprovante: " + (err.message || "Tente novamente"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetForm = () => {
    setValue("");
    setProduct("");
    setNsu("");
    setClientPhoto(null);
    setSignature(null);
    setReceiptModalData(null);
    setValidationError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center pb-24 sm:pb-12">
      {/* Barra de Topo Compacta e Rápida */}
      <header className="w-full max-w-lg sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4 fill-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-1.5">
              PRIME ANTI-FRAUDE
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold border border-emerald-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Comprovante de entrega presencial</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Cadeado Seguro */}
          <button
            type="button"
            onClick={() => {
              if (isUnlocked) {
                setShowHistory(!showHistory);
              } else {
                setPendingAction("history");
                setIsPasswordModalOpen(true);
              }
            }}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 ${
              isUnlocked
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                : "bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-300"
            }`}
            title={isUnlocked ? "Histórico desbloqueado" : "Acessar histórico com senha"}
          >
            {isUnlocked ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>Histórico</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Acesso</span>
              </>
            )}
            {recentSales.length > 0 && !isUnlocked && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          {isUnlocked && (
            <button
              type="button"
              onClick={() => {
                setIsUnlocked(false);
                setShowHistory(false);
              }}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-850 rounded-xl text-xs font-semibold"
              title="Bloquear novamente"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Histórico Deslizante / Recolhível */}
      {showHistory && (
        <div className="w-full max-w-lg px-4 pt-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Últimos Comprovantes
              </h3>
              <button
                type="button"
                onClick={() => {
                  setRecentSales([]);
                  localStorage.removeItem("prime_recent_sales");
                }}
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Limpar
              </button>
            </div>
            {recentSales.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">Nenhum comprovante salvo ainda hoje.</p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => {
                      setReceiptModalData({
                        image: sale.image,
                        saleData: {
                          id: sale.id,
                          value: sale.value,
                          product: sale.product,
                          nsu: sale.nsu,
                          formattedDate: sale.time,
                          timestamp: "",
                          clientPhotoBase64: null,
                          signatureBase64: null,
                        },
                      });
                    }}
                    className="p-2 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{sale.product}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        NSU: {sale.nsu} • {sale.time.split(" ")[1] || sale.time}
                      </p>
                    </div>
                    <span className="text-xs font-black text-emerald-400">{sale.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo Principal (Single-Screen Mobile First) */}
      <div className="w-full max-w-lg px-4 pt-3 flex flex-col gap-4">
        {/* Banner de Sucesso de Venda Salva (Protegido por Senha) */}
        {savedSuccessMessage && (
          <div className="p-3.5 bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Venda Salva com Sucesso!</p>
                <p className="text-[11px] text-emerald-400/90 font-medium">
                  Comprovante protegido contra acesso não autorizado.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPendingAction("receipt");
                setIsPasswordModalOpen(true);
              }}
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              Ver Comprovante
            </button>
          </div>
        )}

        {/* Banner de Validação / Erro */}
        {validationError && (
          <div className="p-3 bg-red-500/10 border-2 border-red-500/30 text-red-300 rounded-xl flex items-center gap-2 text-xs font-medium animate-bounce">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* 1. SEÇÃO DE INPUTS ESSENCIAIS */}
        <section className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Dados da Venda na Maquininha
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {/* Campo Valor com Teclado Numérico */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor Total (R$) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                  <DollarSign className="w-5 h-5 font-bold" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  value={value}
                  onChange={handleCurrencyChange}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xl font-black text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors tracking-wide"
                />
              </div>
            </div>

            {/* Campo Produto */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Produto / Descrição *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Package className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Ex: Tênis Air 41, Celular S22..."
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            {/* Campo NSU / Autorização */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                NSU / Cód. Autorização da Maquininha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 84920194"
                  value={nsu}
                  onChange={(e) => setNsu(e.target.value.replace(/[^0-9A-Za-z]/g, ""))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-sm font-mono font-bold text-sky-400 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. CÂMERA DO CELULAR */}
        <CameraCapture
          capturedPhoto={clientPhoto}
          onPhotoCaptured={(b64) => setClientPhoto(b64)}
          onClearPhoto={() => setClientPhoto(null)}
        />

        {/* 3. ASSINATURA TOUCH COM O DEDO */}
        <SignaturePad
          hasSignature={!!signature}
          onSignatureChange={(b64) => setSignature(b64)}
        />

        {/* 4. BOTÃO PRINCIPAL DE AÇÃO RÁPIDA (FIXO NA PARTE INFERIOR NO MOBILE) */}
        <div className="pt-2 pb-6">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleSaveReceipt}
            className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none text-slate-950 font-black rounded-2xl text-lg tracking-wide shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all border-2 border-emerald-400"
          >
            {isGenerating ? (
              <>
                <div className="w-6 h-6 border-3 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Processando Prova...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 stroke-[2.5]" />
                <span>SALVAR COMPROVANTE</span>
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            Gera o comprovante único contra chargeback e contestação indevida.
          </p>
        </div>
      </div>

      {/* Modal de Comprovante Consolidado (Só abre se desbloqueado com a senha 191215) */}
      {receiptModalData && isUnlocked && (
        <ReceiptModal
          receiptImage={receiptModalData.image}
          data={receiptModalData.saleData}
          onClose={() => setReceiptModalData(null)}
          onNewSale={handleResetForm}
        />
      )}

      {/* Modal de Senha do Cadeado (PIN 191215) */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={() => {
          setIsUnlocked(true);
          setIsPasswordModalOpen(false);
          if (pendingAction === "history") {
            setShowHistory(true);
          }
          setPendingAction(null);
        }}
      />
    </main>
  );
}
