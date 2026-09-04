export async function generateConsolidatedReceiptImage(data: {
  value: string;
  product: string;
  nsu: string;
  formattedDate: string;
  clientPhotoBase64: string;
  signatureBase64: string;
  id: string;
}): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      // Resolução otimizada para comprovante nítido e compartilhável no WhatsApp (800x1200)
      const width = 800;
      const height = 1200;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Não foi possível inicializar o canvas 2D");
      }

      // Fundo escuro premium/seguro
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, width, height);

      // Borda decorativa externa
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Cabeçalho / Banner
      ctx.fillStyle = "#161b22";
      ctx.fillRect(20, 20, width - 40, 100);

      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("COMPROVANTE DE ENTREGA E VENDA PRESENCIAL", width / 2, 60);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "16px sans-serif";
      ctx.fillText("AUTENTICAÇÃO ANTI-FRAUDE • PROTOCOLO #" + data.id.slice(-8).toUpperCase(), width / 2, 92);

      // Caixa de Informações da Venda
      const infoBoxY = 135;
      const infoBoxHeight = 160;
      ctx.fillStyle = "#161b22";
      ctx.roundRect ? ctx.roundRect(25, infoBoxY, width - 50, infoBoxHeight, 12) : ctx.fillRect(25, infoBoxY, width - 50, infoBoxHeight);
      ctx.fill();
      ctx.strokeStyle = "#30363d";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = "left";
      
      // Linha 1: Produto e Valor
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.fillText("PRODUTO ENTREGUE", 45, infoBoxY + 32);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      const truncatedProduct = data.product.length > 28 ? data.product.substring(0, 28) + "..." : data.product;
      ctx.fillText(truncatedProduct || "Não informado", 45, infoBoxY + 60);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.fillText("VALOR TOTAL PAGO", 480, infoBoxY + 32);
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText(data.value || "R$ 0,00", 480, infoBoxY + 63);

      // Linha separadora
      ctx.strokeStyle = "#21262d";
      ctx.beginPath();
      ctx.moveTo(45, infoBoxY + 80);
      ctx.lineTo(width - 45, infoBoxY + 80);
      ctx.stroke();

      // Linha 2: NSU e Data
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.fillText("NSU / AUT. MAQUININHA", 45, infoBoxY + 110);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 20px monospace";
      ctx.fillText(data.nsu || "N/A", 45, infoBoxY + 138);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.fillText("DATA E HORA DO RECEBIMENTO", 480, infoBoxY + 110);
      ctx.fillStyle = "#ffffff";
      ctx.font = "18px sans-serif";
      ctx.fillText(data.formattedDate, 480, infoBoxY + 138);

      // Carregamento da Foto do Cliente
      const photoBoxY = 310;
      const photoBoxHeight = 490;

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("FOTO DO CLIENTE COM O PRODUTO ENTREGUE:", 30, photoBoxY);

      const clientImg = new Image();
      await new Promise((imgResolve) => {
        clientImg.onload = () => imgResolve(true);
        clientImg.onerror = () => imgResolve(false);
        clientImg.src = data.clientPhotoBase64;
      });

      // Moldura da foto
      ctx.fillStyle = "#000000";
      ctx.fillRect(25, photoBoxY + 12, width - 50, photoBoxHeight);
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3;
      ctx.strokeRect(25, photoBoxY + 12, width - 50, photoBoxHeight);

      if (clientImg.width > 0) {
        // Ajuste mantendo proporção (cover/contain)
        const frameW = width - 50;
        const frameH = photoBoxHeight;
        const imgAspect = clientImg.width / clientImg.height;
        const frameAspect = frameW / frameH;

        let drawW = frameW;
        let drawH = frameH;
        let drawX = 25;
        let drawY = photoBoxY + 12;

        if (imgAspect > frameAspect) {
          drawW = frameH * imgAspect;
          drawX = 25 - (drawW - frameW) / 2;
        } else {
          drawH = frameW / imgAspect;
          drawY = (photoBoxY + 12) - (drawH - frameH) / 2;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(25, photoBoxY + 12, frameW, frameH);
        ctx.clip();
        ctx.drawImage(clientImg, drawX, drawY, drawW, drawH);
        ctx.restore();
      }

      // Selo sobre a foto
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(35, photoBoxY + photoBoxHeight - 40, width - 70, 32);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`CAPTURA DE RECONHECIMENTO FÍSICO • NSU: ${data.nsu}`, width / 2, photoBoxY + photoBoxHeight - 19);

      // Área de Assinatura do Cliente
      const signBoxY = 825;
      const signBoxHeight = 220;

      ctx.textAlign = "left";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("ASSINATURA DIGITAL DO CLIENTE / TITULAR:", 30, signBoxY);

      // Termo de aceite rápido
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("Confirmo o recebimento em mãos da mercadoria e aprovação da transação na maquininha.", 30, signBoxY + 18);

      // Caixa da assinatura
      ctx.fillStyle = "#161b22";
      ctx.fillRect(25, signBoxY + 26, width - 50, signBoxHeight);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(25, signBoxY + 26, width - 50, signBoxHeight);

      // Linha de assinatura
      ctx.strokeStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(60, signBoxY + signBoxHeight - 35);
      ctx.lineTo(width - 60, signBoxY + signBoxHeight - 35);
      ctx.stroke();

      const signImg = new Image();
      await new Promise((signResolve) => {
        signImg.onload = () => signResolve(true);
        signImg.onerror = () => signResolve(false);
        signImg.src = data.signatureBase64;
      });

      if (signImg.width > 0) {
        ctx.drawImage(signImg, 50, signBoxY + 30, width - 100, signBoxHeight - 65);
      }

      ctx.fillStyle = "#64748b";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Assinatura coletada em tela touch pelo dispositivo do vendedor", width / 2, signBoxY + signBoxHeight - 12);

      // Rodapé de Segurança
      const footerY = 1085;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(20, footerY, width - 40, 90);
      ctx.strokeStyle = "#1e293b";
      ctx.strokeRect(20, footerY, width - 40, 90);

      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("✓ REGISTRO DE TRANSAÇÃO ANTI-CHARGEBACK VERIFICADO", width / 2, footerY + 30);

      ctx.fillStyle = "#64748b";
      ctx.font = "11px monospace";
      ctx.fillText(`ID: ${data.id} • REGISTRADO EM: ${data.formattedDate}`, width / 2, footerY + 54);
      ctx.fillText("Documento probatório gerado no momento da entrega do bem.", width / 2, footerY + 74);

      resolve(canvas.toDataURL("image/jpeg", 0.92));
    } catch (err) {
      reject(err);
    }
  });
}
