-- Execute este script no SQL Editor do seu painel Supabase se desejar persistir os comprovantes em banco:

-- 1. Criação da tabela de comprovantes
CREATE TABLE IF NOT EXISTS public.comprovantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocolo TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    produto TEXT NOT NULL,
    nsu TEXT NOT NULL,
    data_venda TIMESTAMPTZ DEFAULT now(),
    foto_cliente_url TEXT,
    assinatura_url TEXT,
    comprovante_consolidado_url TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.comprovantes ENABLE ROW LEVEL SECURITY;

-- 3. Política de inserção pública/anônima (para os vendedores enviarem comprovantes)
CREATE POLICY "Permitir insercao de comprovantes" 
ON public.comprovantes FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 4. Política de leitura
CREATE POLICY "Permitir leitura de comprovantes" 
ON public.comprovantes FOR SELECT 
TO anon, authenticated 
USING (true);
