import { NextResponse } from "next/server";

// Endpoint de IA Conversacional com Injeção Global do Catálogo e Regras da Loja
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, apiKey, storeKnowledge, cart = [] } = body;

    if (!message) {
      return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 });
    }

    const key = apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Monta o System Prompt contextualizado com toda a Base de Conhecimento do Restaurante
    const storeName = storeKnowledge?.storeName || "Brasa & Burger Grill";
    const address = storeKnowledge?.address || "Av. Engenheiro Roberto Freire, 2040 - Ponta Negra, Natal/RN";
    const hours = storeKnowledge?.openingHours || "Terça a Domingo das 18h às 23h30";
    const isOpen = storeKnowledge?.isOpen !== false;
    const pixKey = storeKnowledge?.pixKey || "financeiro@a2isolutions.com.br";
    const phone = storeKnowledge?.phone || "(84) 99876-5432";

    const productsList = (storeKnowledge?.products || [])
      .filter((p: any) => p.isAvailable !== false)
      .map(
        (p: any) =>
          `- [ID: ${p.id}] ${p.name} (Categoria: ${p.category}) — R$ ${Number(p.price).toFixed(2)} | Descrição: ${p.description || "Preparado na hora"}`
      )
      .join("\n");

    const neighborhoodsList = (storeKnowledge?.neighborhoods || [])
      .filter((n: any) => n.active !== false)
      .map((n: any) => `- ${n.neighborhood}: R$ ${Number(n.fee).toFixed(2)} (${n.estimatedMinutes || "30-45 min"})`)
      .join("\n");

    const cartSummary =
      Array.isArray(cart) && cart.length > 0
        ? cart.map((c: any) => `${c.quantity}x ${c.name} (R$ ${(c.price * c.quantity).toFixed(2)})`).join(", ")
        : "Carrinho vazio no momento";

    const systemPrompt = `Você é o atendente virtual oficial no WhatsApp do restaurante "${storeName}", operando na plataforma Tá na Mesa (A2i Solutions).
Seu tom é acolhedor, natural, rápido e direto ao ponto, usando formatação de WhatsApp (*negrito* para nomes de pratos e preços, e emojis adequados ao item).

=== DADOS OFICIAIS DA LOJA ===
- Nome do Restaurante: ${storeName}
- Endereço Físico: ${address}
- Telefone / WhatsApp Humano: ${phone}
- Horário de Funcionamento: ${hours}
- Status neste instante: ${isOpen ? "ABERTO E ATENDENDO NORMALMENTE" : "FECHADO NO MOMENTO"}
- Chave Pix: ${pixKey}
- Formas de Pagamento: Pix, Cartão de Crédito/Débito na entrega (motoboy leva maquininha) e Dinheiro. NÃO aceitamos Vale Refeição (VR/Alelo/Sodexo/Ticket).
- Carrinho atual do cliente: ${cartSummary}

=== CATÁLOGO COMPLETO E OFICIAL DE PRODUTOS (ÚNICOS ITENS QUE A LOJA VENDE) ===
${productsList}

=== TAXAS DE ENTREGA POR BAIRRO ===
${neighborhoodsList}

=== REGRAS OBRIGATÓRIAS DE INTERPRETAÇÃO GLOBAL ===
1. ESTUDE O CATÁLOGO ACIMA ANTES DE RESPONDER: Jamais confunda um produto com outro. Se o cliente perguntar "vcs tem açaí?", procure "Açaí" na lista acima e responda especificamente sobre o *Açaí no Copo 500ml Especial* (R$ 18,00) e sua descrição real, NUNCA sobre pastel de Nutella.
2. ITEM FORA DO CATÁLOGO: Se o cliente perguntar por qualquer item que NÃO existe na lista acima (ex: sopa, sushi, feijoada, almoço, cerveja, acarajé), diga com simpatia que a casa não trabalha com esse item e sugira 2 ou 3 categorias reais do catálogo.
3. ATENDIMENTO HUMANO: Se o cliente pedir para falar com um humano, atendente, pessoa, gerente ou suporte, transfira imediatamente informando o WhatsApp/Telefone oficial (${phone}) com total educação.
4. MENSAGENS PASSIVAS / ENGANO: Se o cliente disser "não falei nada", "nada", "só olhando" ou "foi engano", responda de forma leve e educada dizendo que está à disposição quando bater a fome.
5. SEJA CONCISO: Responda em português brasileiro natural para WhatsApp (máximo de 3 parágrafos curtos).`;

    // 1. Tentativa Primária: Google Gemini API oficial (se a chave tiver cota liberada)
    if (key) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${systemPrompt}\n\nMensagem do cliente no WhatsApp: "${message}"\nResposta do atendente:`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 350,
            },
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const replyText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return NextResponse.json({
              success: true,
              engine: "gemini-2.5-flash",
              reply: replyText.trim(),
            });
          }
        }
      } catch (e) {
        console.warn("Aviso na chamada Gemini primária:", e);
      }
    }

    // 2. Motor LLM Cloud Integrado (Zero configuração / Sem bloqueio de Billing)
    // Garante raciocínio por IA Generativa sobre 100% do catálogo mesmo se a conta Google não tiver cartão cadastrado
    try {
      const llmRes = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          temperature: 0.3,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
        }),
      });

      if (llmRes.ok) {
        const llmData = await llmRes.json();
        const replyText = llmData?.choices?.[0]?.message?.content;
        if (replyText) {
          return NextResponse.json({
            success: true,
            engine: "cloud-llm",
            reply: replyText.trim(),
          });
        }
      }
    } catch (llmErr) {
      console.warn("Aviso no motor LLM secundário:", llmErr);
    }

    return NextResponse.json({ fallback: true }, { status: 200 });
  } catch (error: any) {
    console.error("Erro no endpoint de IA:", error);
    return NextResponse.json({ fallback: true, error: String(error?.message || error) });
  }
}
