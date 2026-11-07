"use client";

import React, { useState, useRef, useEffect } from "react";
import { ProductItem, Order, CartItem, OrderStatus, OrderChannel } from "../lib/types";
import { PRODUCTS, RESTAURANT_INFO } from "../lib/mock-data";
import { StoreSettings } from "../lib/server-db";
import {
  X,
  Send,
  Bot,
  Sparkles,
  QrCode,
  CheckCheck,
  Smartphone,
  Sliders,
  RotateCcw,
  MessageCircle,
  HelpCircle,
  ShoppingBag,
  Plus,
  Trash2,
  MapPin,
  CreditCard,
  Check,
  ExternalLink,
  Clock,
  Phone,
  RefreshCw,
  Copy,
  ChevronRight,
  Flame,
  ArrowRight,
} from "lucide-react";

export interface BotCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  optionsSelected?: string[];
  notes?: string;
}

export interface BotActionChip {
  label: string;
  actionText: string;
  variant?: "primary" | "secondary" | "success" | "danger";
}

export interface NLUResult {
  reply: string;
  chips?: BotActionChip[];
  orderReceipt?: {
    orderNumber: number;
    status: string;
    total: number;
    deliveryAddress: string;
    estimatedMinutes: string;
  };
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  actionChips?: BotActionChip[];
  cartSnapshot?: {
    items: { name: string; quantity: number; price: number }[];
    subtotal: number;
    deliveryFee: number;
    total: number;
  };
  orderReceipt?: {
    orderNumber: number;
    status: string;
    total: number;
    deliveryAddress: string;
    estimatedMinutes: string;
  };
}

interface WhatsAppBotModalProps {
  products?: ProductItem[];
  settings?: StoreSettings;
  onClose: () => void;
  onOrderCreated?: (order: Order) => void;
}

export function WhatsAppBotModal({
  products = PRODUCTS,
  settings,
  onClose,
  onOrderCreated,
}: WhatsAppBotModalProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "config" | "qrcode">("chat");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Estado do Carrinho Ativo e Fluxo de Conversação (Checkout do WhatsApp)
  const [cart, setCart] = useState<BotCartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<
    "idle" | "address" | "payment" | "confirm" | "finished"
  >("idle");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "retirada">("delivery");
  const [customerName, setCustomerName] = useState("Fábio");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState(
    settings?.neighborhoods?.[0]?.neighborhood || "Ponta Negra"
  );
  const [deliveryFee, setDeliveryFee] = useState(
    settings?.neighborhoods?.[0]?.fee || 5.0
  );
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao" | "dinheiro">("pix");
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);

  // Configurações do Motor de IA (Estilo Consumer / ChatGPT / Gemini)
  const [aiEngine, setAiEngine] = useState<"native" | "external">("external");
  const [apiKey, setApiKey] = useState(
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
  );
  const [botTone, setBotTone] = useState<"amigavel" | "formal" | "vendedor">("amigavel");
  const [alwaysOfferDessert, setAlwaysOfferDessert] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Agora mesmo");
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexSuccess, setReindexSuccess] = useState(false);

  const handleReindexKnowledge = () => {
    setIsReindexing(true);
    setTimeout(() => {
      setIsReindexing(false);
      setReindexSuccess(true);
      setLastSyncTime(
        new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setTimeout(() => setReindexSuccess(false), 3500);
    }, 450);
  };

  const [customInstructions, setCustomInstructions] = useState(
    `Você é o atendente virtual do ${settings?.storeName || RESTAURANT_INFO.name} da plataforma Tá na Mesa da A2i Solutions.
Atenda os clientes com carinho e rapidez.
Quando o cliente perguntar se tem algo ou pedir cardápio, descreva com água na boca e pergunte quantos quer pedir.
Quando o cliente pedir itens (ex: "Quero 2 pastéis de dois queijos e uma coca"), adicione ao carrinho, informe o subtotal e conduza para o fechamento (entrega/retirada, endereço e forma de pagamento Pix/Cartão/Dinheiro).`
  );

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "bot",
      text: `Olá! 👋 Sou o atendente virtual inteligente do *${settings?.storeName || RESTAURANT_INFO.name}* da plataforma *Tá na Mesa*!\n\nPosso te apresentar nosso cardápio, anotar seus lanches, calcular sua taxa de entrega e fechar o seu pedido direto por aqui. 🍔🍟\n\nComo posso te ajudar hoje?`,
      time: "Agora",
      actionChips: [
        { label: "🍔 Burgers Artesanais", actionText: "Quais os hambúrgueres artesanais da casa?" },
        { label: "🕒 Vcs estão atendendo ainda?", actionText: "Vcs estão atendendo ainda?" },
        { label: "🥟 Pastéis Crocantes", actionText: "Olá.. Vcs tem Pastel de Queijo?" },
        { label: "🎁 Combos Promocionais", actionText: "Quais combos promocionais vocês têm?" },
        { label: "🛵 Taxas de Entrega", actionText: "Qual a taxa de entrega para o meu bairro?" },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Função Auxiliar de Normalização de Texto
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Parser de Quantidades em Português
  const parseQuantity = (segment: string): number => {
    const numMatch = segment.match(/\b(\d+)\b/);
    if (numMatch) return Math.min(Math.max(parseInt(numMatch[1], 10), 1), 50);

    const s = normalize(segment);
    if (/\b(um|uma)\b/.test(s)) return 1;
    if (/\b(dois|duas)\b/.test(s)) return 2;
    if (/\b(tres|três)\b/.test(s)) return 3;
    if (/\b(quatro)\b/.test(s)) return 4;
    if (/\b(cinco)\b/.test(s)) return 5;
    if (/\b(seis)\b/.test(s)) return 6;
    if (/\b(dez)\b/.test(s)) return 10;
    return 1;
  };

  // Helper para ícone dinâmico por categoria de produto
  const getCategoryEmoji = (category?: string, name?: string) => {
    const c = normalize(category || "");
    const n = normalize(name || "");
    if (n.includes("acai") || c.includes("sobremesa") || c.includes("doce")) return "🍨";
    if (c.includes("burger") || c.includes("hamburguer")) return "🍔";
    if (c.includes("hotdog") || c.includes("hot dog")) return "🌭";
    if (c.includes("pizza") || n.includes("calzone")) return "🍕";
    if (c.includes("tapioca")) return "🌮";
    if (c.includes("porcao") || c.includes("porcoes") || n.includes("batata") || n.includes("macaxeira")) return "🍟";
    if (c.includes("bebida") || n.includes("coca") || n.includes("guarana") || n.includes("suco") || n.includes("agua")) return "🥤";
    if (c.includes("combo")) return "🎁";
    return "🥟";
  };

  // Mapeamento 100% Dinâmico de Produtos sobre o Catálogo Ativo (Excel / Banco de Dados)
  const findProductByAlias = (segment: string): ProductItem | null => {
    const availableProducts = products.filter((p) => p.isAvailable !== false);
    const s = normalize(segment);
    const cleanS = s
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, " ")
      .replace(/\b(vcs|voces|voce|tem|teem|vendem|vende|fazem|faz|trabalham|com|quero|manda|pedir|um|uma|dois|duas|tres|ai|hoje|agora|por|favor|de|do|da|no|na)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanS) return null;

    const findByNameKeywords = (...keywords: string[]) =>
      availableProducts.find((p) => {
        const pNorm = normalize(p.name);
        return keywords.every((kw) => pNorm.includes(normalize(kw)));
      }) || null;

    // 1. Sobremesas & Açaí (Busca direta pelo nome real no catálogo)
    if (s.includes("acai")) {
      return findByNameKeywords("acai") || null;
    }
    if (s.includes("nutella") || s.includes("ninho")) {
      return findByNameKeywords("nutella") || findByNameKeywords("ninho") || null;
    }
    if (s.includes("cartola")) {
      return findByNameKeywords("cartola") || null;
    }

    // 2. Pastéis
    if (s.includes("dois queijos") || (s.includes("pastel") && s.includes("queijo") && !s.includes("carne"))) {
      return findByNameKeywords("pastel", "queijo") || null;
    }
    if (s.includes("carne de sol") && s.includes("pastel")) {
      return findByNameKeywords("pastel", "carne de sol") || null;
    }
    if (s.includes("camarao")) {
      return findByNameKeywords("camarao") || null;
    }
    if (s.includes("pastel") && s.includes("frango")) {
      return findByNameKeywords("pastel", "frango") || null;
    }

    // 3. Tapiocas
    if (s.includes("tapioca") && s.includes("carne")) {
      return findByNameKeywords("tapioca", "carne") || null;
    }
    if (s.includes("tapioca") && s.includes("frango")) {
      return findByNameKeywords("tapioca", "frango") || null;
    }

    // 4. Bebidas
    if (s.includes("coca") && (s.includes("zero") || s.includes("sem acucar"))) {
      return findByNameKeywords("coca", "sem acucar") || findByNameKeywords("coca") || null;
    }
    if (s.includes("coca")) {
      return findByNameKeywords("coca") || null;
    }
    if (s.includes("guarana")) {
      return findByNameKeywords("guarana") || null;
    }
    if (s.includes("suco") && s.includes("laranja")) {
      return findByNameKeywords("suco", "laranja") || null;
    }
    if (s.includes("suco") && s.includes("acerola")) {
      return findByNameKeywords("suco", "acerola") || null;
    }
    if (s.includes("agua")) {
      return findByNameKeywords("agua") || null;
    }

    // 5. Hot Dogs
    if (s.includes("hot dog") || s.includes("hotdog") || s.includes("cachorro quente")) {
      if (s.includes("nata") || s.includes("potiguar")) return findByNameKeywords("hot dog", "nata") || null;
      if (s.includes("bacon")) return findByNameKeywords("hot dog", "bacon") || null;
      if (s.includes("tradicional")) return findByNameKeywords("hot dog", "tradicional") || null;
      if (s.includes("cheddar") || s.includes("catupiry")) return findByNameKeywords("hot dog", "cheddar") || null;
    }

    // 6. Combos
    if (s.includes("combo")) {
      if (s.includes("casal")) return findByNameKeywords("combo", "casal") || null;
      if (s.includes("smash")) return findByNameKeywords("combo", "smash") || null;
      if (s.includes("familia")) return findByNameKeywords("combo", "familia") || null;
      if (s.includes("pizza")) return findByNameKeywords("combo", "pizza") || null;
    }

    // 7. Burgers & Smashes
    if (s.includes("smash") && s.includes("salada")) return findByNameKeywords("smash", "salada") || null;
    if (s.includes("smash") && s.includes("bacon")) return findByNameKeywords("smash", "bacon") || null;
    if (s.includes("x frango") || s.includes("x-frango")) return findByNameKeywords("frango", "x") || null;
    if (s.includes("x tudo") || s.includes("x-tudo")) return findByNameKeywords("tudo") || null;

    // 8. Porções
    if (s.includes("macaxeira") || s.includes("mandioca")) return findByNameKeywords("macaxeira") || null;
    if (s.includes("cebola") || s.includes("aneis")) return findByNameKeywords("cebola") || null;
    if (s.includes("batata") && (s.includes("suprema") || s.includes("cheddar") || s.includes("bacon"))) {
      return findByNameKeywords("batata", "suprema") || findByNameKeywords("batata") || null;
    }
    if (s.includes("batata") || s.includes("fritas")) {
      return findByNameKeywords("batata", "tradicional") || findByNameKeywords("batata") || null;
    }

    // 9. Busca Dinâmica Universal por Palavras-Chave no Catálogo Completo (inclusive itens subidos via Excel)
    const segWords = cleanS.split(" ").filter((w) => w.length >= 3);
    if (segWords.length === 0) return null;

    // Match direto de nome completo ou termo específico
    for (const prod of availableProducts) {
      const pNorm = normalize(prod.name).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, " ").trim();
      if (cleanS === pNorm || pNorm.includes(cleanS)) {
        return prod;
      }
    }

    // Pontuação por sobreposição de palavras do nome do produto
    let bestMatch: ProductItem | null = null;
    let bestScore = 0;

    for (const prod of availableProducts) {
      const prodWords = normalize(prod.name)
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 3);

      const matchedWords = segWords.filter((w) => prodWords.some((pw) => pw === w || pw.startsWith(w) || w.startsWith(pw)));
      if (matchedWords.length > 0) {
        // Se o usuário buscou 1 palavra específica (ex: "calzone", "acai") e ela está no nome do produto
        const score = matchedWords.length / Math.max(segWords.length, 1) + matchedWords.length * 0.5;
        if (score > bestScore && (matchedWords.length >= 2 || segWords.length === 1)) {
          bestScore = score;
          bestMatch = prod;
        }
      }
    }

    return bestMatch;
  };

  // Extração de Itens da Frase do Usuário (Processamento Semântico)
  const extractItemsFromSentence = (
    text: string
  ): { product: ProductItem; quantity: number }[] => {
    const rawSegments = text.split(/\be\b|,|\+/i);
    const results: { product: ProductItem; quantity: number }[] = [];

    for (const seg of rawSegments) {
      const trimmed = seg.trim();
      if (!trimmed) continue;
      const matchedProd = findProductByAlias(trimmed);
      if (matchedProd) {
        const qty = parseQuantity(trimmed);
        results.push({ product: matchedProd, quantity: qty });
      }
    }

    return results;
  };

  // Extrator Inteligente de Dúvidas de Disponibilidade de Produto ("Vcs vendem X?", "Tem X?", etc.)
  const extractAvailabilityInquiry = (
    cleanText: string
  ): { isInquiry: boolean; itemQuery: string } => {
    // 1. Padrões explícitos com verbos de venda, oferta e posse
    const patterns = [
      /(?:vcs|voces|voce)?\s*(?:vendem|vende)\s+(?:de\s+)?(.+)/i,
      /(?:vcs|voces|voce)?\s*(?:trabalham|trabalha)\s+com\s+(.+)/i,
      /(?:vcs|voces|voce)?\s*(?:servem|serve)\s+(.+)/i,
      /(?:vcs|voces|voce)?\s*(?:fazem|faz)\s+(.+)/i,
      /(?:vcs|voces|voce)?\s*(?:tem|teem)\s+(?:(?:ai|aí)\s+)?(?:(?:opcao|opção)\s+de\s+)?(.+)/i,
      /(?:da|dá)\s+pra\s+pedir\s+(.+)/i,
      /(?:queria|quero|gostaria\s+de)\s+saber\s+se\s+(?:vcs|voces)?\s*(?:tem|vendem|trabalham\s+com)\s+(.+)/i,
    ];

    for (const pat of patterns) {
      const match = cleanText.match(pat);
      if (match && match[1]) {
        let rawItem = match[1].trim();
        // Remove artigos / pronomes do início
        rawItem = rawItem.replace(/^(um|uma|uns|umas|algum|alguma|o|a|os|as|de)\s+/i, "");
        // Remove complementos de tempo e lugar do final
        rawItem = rawItem.replace(
          /\s+(hoje|agora|ai|aí|no momento|por favor|pra entrega|para entrega|aqui|nesse momento)$/i,
          ""
        );
        rawItem = rawItem.trim();

        // Evita interceptar tópicos gerais ou categorias inteiras que possuem vitrines específicas
        const ignoredKeywords = [
          "entrega", "frete", "taxa", "bairro", "bairros",
          "pix", "cartao", "cartão", "dinheiro", "pagamento", "pagamentos", "troco",
          "cupom", "desconto", "promocao", "promoção",
          "horario", "horário", "horas", "aberto", "abertos", "funcionando",
          "mesa", "mesas", "estacionamento", "espaco kids", "espaço kids",
          "cardapio", "cardápio", "menu", "status", "pedido", "conta",
          "tapioca", "tapiocas", "sobremesa", "sobremesas", "doce", "doces",
          "bebida", "bebidas", "refrigerante", "refrigerantes", "suco", "sucos",
          "porcao", "porção", "porcoes", "porções", "petisco", "petiscos",
          "pastel", "pasteis", "pastéis", "pizza", "pizzas", "brotinho",
          "burger", "burgers", "hamburguer", "hambúrguer", "hamburgueres", "smash",
          "hot dog", "hot dogs", "hotdog", "cachorro quente", "combo", "combos"
        ];

        if (ignoredKeywords.includes(rawItem)) {
          return { isInquiry: false, itemQuery: "" };
        }

        if (rawItem.length >= 2) {
          return { isInquiry: true, itemQuery: rawItem };
        }
      }
    }

    // 2. Alimentos comuns fora do cardápio digitados de forma direta
    const commonFoodsUnlisted = [
      "sopa", "sopas", "caldo", "caldos", "canja", "feijoada", "sushi",
      "sashimi", "temaki", "acaraje", "acarajé", "churrasco", "espetinho",
      "marmita", "marmitex", "almoco", "almoço", "peixe", "peixada",
      "lasanha", "parmegiana", "strogonoff", "yakisoba", "poke", "cuscuz", "crepe"
    ];

    for (const food of commonFoodsUnlisted) {
      if (cleanText === food || cleanText.includes(` ${food}`) || cleanText.includes(`${food} `)) {
        return { isInquiry: true, itemQuery: food };
      }
    }

    return { isInquiry: false, itemQuery: "" };
  };

  // Motor Conversacional com Inteligência Semântica e Máquina de Estado
  const processMessageNLU = (userText: string): NLUResult => {
    const q = normalize(userText);
    // Remove pontuações para não quebrar a análise semântica
    const cleanQ = q
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // ----------------------------------------------------
    // ETAPA 0: INTERCEPTADORES GLOBAIS DE PRIORIDADE MÁXIMA
    // (Funcionam inclusive se o cliente estiver no meio do Checkout!)
    // ----------------------------------------------------

    // 0.1 Atendimento Humano / Falar com Atendente / Suporte
    const isHumanSupportIntent =
      cleanQ.includes("humano") ||
      cleanQ.includes("atendente") ||
      cleanQ.includes("atendente humano") ||
      cleanQ.includes("falar com humano") ||
      cleanQ.includes("falar com um humano") ||
      cleanQ.includes("falar com alguem") ||
      cleanQ.includes("falar com alguém") ||
      cleanQ.includes("falar com pessoa") ||
      cleanQ.includes("falar com uma pessoa") ||
      cleanQ.includes("pessoa real") ||
      cleanQ.includes("suporte") ||
      cleanQ.includes("ajuda humana") ||
      cleanQ.includes("chama o atendente") ||
      cleanQ.includes("chamar atendente") ||
      cleanQ.includes("passa pro atendente") ||
      cleanQ.includes("passa para o atendente") ||
      cleanQ.includes("falar com o dono") ||
      cleanQ.includes("falar com gerente") ||
      cleanQ.includes("falar com funcionario") ||
      cleanQ.includes("falar com funcionário") ||
      cleanQ.includes("quero falar") ||
      cleanQ.includes("quero conversar");

    if (isHumanSupportIntent) {
      setCheckoutStep("idle");
      const store = settings?.storeName || RESTAURANT_INFO.name;
      const phone = settings?.phone || RESTAURANT_INFO.phone;
      return {
        reply: `Com certeza! Já estou transferindo o seu atendimento para a nossa equipe humana do *${store}*! 👨‍💼📲\n\nVocê pode falar diretamente com o nosso atendente no WhatsApp ou ligação:\n📞 *${phone}*\n\nNosso atendente humano já foi notificado sobre a sua solicitação. Se preferir continuar o autoatendimento por aqui para pedir seus lanches em menos de 1 minuto, estou à total disposição!`,
        chips: [
          { label: "📞 Falar no WhatsApp", actionText: `Olá, gostaria de falar com um atendente humano da loja` },
          { label: "🍔 Continuar no Autoatendimento", actionText: "Quero continuar fazendo meu pedido por aqui" },
          { label: "📋 Ver Cardápio Completo", actionText: "Qual o cardápio completo?" },
        ],
      };
    }

    // 0.2 Cancelamento / Limpar Carrinho / Alterar Endereço (Libera qualquer etapa de checkout)
    if (
      q.includes("limpar") ||
      q.includes("cancelar pedido") ||
      q.includes("zerar pedido") ||
      q.includes("apagar") ||
      cleanQ === "cancelar"
    ) {
      setCart([]);
      setCheckoutStep("idle");
      return {
        reply: `Carrinho e pedido zerados com sucesso! 🗑️\n\nO que você gostaria de pedir ou consultar agora?`,
        chips: [
          { label: "📋 Cardápio Completo", actionText: "Qual o cardápio completo?" },
          { label: "🍔 Ver Burgers", actionText: "Quais os hambúrgueres artesanais da casa?" },
          { label: "🥟 Ver Pastéis", actionText: "Quais os pastéis?" },
          { label: "🌭 Ver Hot Dogs", actionText: "Quais os hot dogs?" },
        ],
      };
    }

    if (q.includes("alterar o endereco") || q.includes("alterar endereco") || q.includes("mudar endereco")) {
      setCheckoutStep("address");
      return {
        reply: `Sem problemas! Por favor, digite o novo **Endereço Completo de Entrega** (Rua, Número e Bairro): 📍`,
        chips: [
          { label: "🏬 Prefiro Retirar no Balcão", actionText: "Vou retirar no balcão" },
        ],
      };
    }

    // 0.3 Mensagens Passivas, de Engano ou Desinteresse ("não falei nada", "nada", "só olhando")
    const isPassiveOrDismissive =
      cleanQ === "nao falei nada" ||
      cleanQ === "não falei nada" ||
      cleanQ === "nada" ||
      cleanQ === "nada nao" ||
      cleanQ === "nada não" ||
      cleanQ === "nao quero nada" ||
      cleanQ === "não quero nada" ||
      cleanQ.includes("so olhando") ||
      cleanQ.includes("só olhando") ||
      cleanQ.includes("apenas olhando") ||
      cleanQ.includes("foi engano") ||
      cleanQ.includes("por engano") ||
      cleanQ.includes("mandei errado") ||
      cleanQ === "desculpa" ||
      cleanQ === "desculpe" ||
      cleanQ === "foi mal" ||
      cleanQ.includes("deixa pra la") ||
      cleanQ.includes("deixa pra lá") ||
      cleanQ.includes("deixa quieto");

    if (isPassiveOrDismissive) {
      setCheckoutStep("idle");
      return {
        reply: `Sem problemas! Fique super à vontade. 😉\n\nQuando bater aquela fome ou se quiser tirar qualquer dúvida sobre os nossos burgers artesanais, hot dogs, pastéis, tapiocas, pizzas brotinho ou açaí, é só me chamar por aqui!\n\nEstou à sua disposição!`,
        chips: [
          { label: "📋 Ver Cardápio", actionText: "Qual o cardápio completo?" },
          { label: "🍔 Burgers Artesanais", actionText: "Quais os hambúrgueres artesanais da casa?" },
          { label: "🥟 Pastéis Crocantes", actionText: "Olá.. Vcs tem Pastel de Queijo?" },
          { label: "🛵 Taxas de Entrega", actionText: "Qual a taxa de entrega para o meu bairro?" },
        ],
      };
    }

    // ----------------------------------------------------
    // ETAPA 1: FLUXO DE CHECKOUT GUIADO (Máquina de Estados)
    // ----------------------------------------------------

    // 1.1 Se o bot pediu o Endereço de Entrega
    if (checkoutStep === "address" && !q.includes("retirar") && !q.includes("balcao")) {
      const nList =
        settings?.neighborhoods && settings.neighborhoods.length > 0
          ? settings.neighborhoods
          : [
              { neighborhood: "Ponta Negra", fee: 5.0, estimatedMinutes: "25-40 min", active: true },
              { neighborhood: "Capim Macio", fee: 7.0, estimatedMinutes: "30-45 min", active: true },
              { neighborhood: "Neópolis / Pirangi", fee: 8.0, estimatedMinutes: "35-50 min", active: true },
              { neighborhood: "Candelária", fee: 10.0, estimatedMinutes: "40-55 min", active: true },
              { neighborhood: "Lagoa Nova", fee: 10.0, estimatedMinutes: "45-60 min", active: true },
              { neighborhood: "Tirol / Petrópolis", fee: 12.0, estimatedMinutes: "45-60 min", active: true },
            ];

      let calculatedFee = 7.0;
      let matchedBairro = nList[0]?.neighborhood || "Ponta Negra";
      let estimatedTime = nList[0]?.estimatedMinutes || "30-45 min";

      for (const n of nList) {
        const normN = normalize(n.neighborhood);
        if (q.includes(normN) || normN.split("/").some((part) => q.includes(part.trim()))) {
          calculatedFee = n.fee;
          matchedBairro = n.neighborhood;
          estimatedTime = n.estimatedMinutes;
          break;
        }
      }

      setDeliveryAddress(userText);
      setDeliveryNeighborhood(matchedBairro);
      setDeliveryFee(calculatedFee);
      setCheckoutStep("payment");

      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const grandTotal = subtotal + calculatedFee;

      return {
        reply: `Endereço registrado com sucesso! 📍\n*${userText}*\nBairro: *${matchedBairro}*\n🛵 Taxa de Entrega: *R$ ${calculatedFee.toFixed(2)}* (Tempo estimado: *${estimatedTime}*)\n\n📋 *Resumo Financeiro:*\n• Subtotal dos itens: R$ ${subtotal.toFixed(2)}\n• Taxa de entrega: R$ ${calculatedFee.toFixed(2)}\n💵 *Total Geral: R$ ${grandTotal.toFixed(2)}*\n\nComo você prefere realizar o pagamento?`,
        chips: [
          { label: "🔑 Pagar via Pix", actionText: "Vou pagar no Pix" },
          { label: "💳 Cartão na Entrega", actionText: "Vou pagar no Cartão (motoboy leva a maquininha)" },
          { label: "💵 Dinheiro", actionText: "Vou pagar em Dinheiro" },
        ],
      };
    }

    // 1.2 Se o bot pediu a Forma de Pagamento
    if (checkoutStep === "payment") {
      if (q.includes("pix")) {
        setPaymentMethod("pix");
        setCheckoutStep("confirm");
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const grandTotal = subtotal + deliveryFee;

        return {
          reply: `Perfeito! Seguem as instruções para o pagamento instantâneo via Pix: 🔑\n\n📱 *Chave Pix:* \`${settings?.pixKey || RESTAURANT_INFO.pixKey}\`\n🏢 *Favorecido:* ${settings?.storeName || RESTAURANT_INFO.name} / A2i Solutions\n💰 *Valor Exato:* R$ ${grandTotal.toFixed(2)}\n\nO pedido já está prontinho para ser impresso na chapa da cozinha! Posso confirmar o envio agora? 🚀`,
          chips: [
            { label: "✅ Confirmar e Enviar Pedido", actionText: "Pode confirmar o pedido!", variant: "success" as const },
            { label: "✏️ Alterar Endereço", actionText: "Quero alterar o endereço" },
          ],
        };
      }

      if (q.includes("cartao") || q.includes("cartão") || q.includes("debito") || q.includes("débito") || q.includes("credito") || q.includes("crédito")) {
        setPaymentMethod("cartao");
        setCheckoutStep("confirm");
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const grandTotal = subtotal + deliveryFee;

        return {
          reply: `Combinado! O motoboy levará a maquininha Smart POS até você na entrega. Aceitamos Débito, Crédito e aproximação! 💳\n\n💰 *Total a pagar na entrega:* R$ ${grandTotal.toFixed(2)}\n\nPosso confirmar e disparar a produção na cozinha?`,
          chips: [
            { label: "✅ Confirmar e Enviar Pedido", actionText: "Pode confirmar o pedido!", variant: "success" as const },
          ],
        };
      }

      if (q.includes("dinheiro")) {
        setPaymentMethod("dinheiro");
        setCheckoutStep("confirm");
        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const grandTotal = subtotal + deliveryFee;

        return {
          reply: `Anotado! Pagamento em dinheiro na entrega. 💵\nTotal: *R$ ${grandTotal.toFixed(2)}*.\n\nVocê vai precisar de troco para quanto? (Se não precisar de troco, basta confirmar abaixo!)`,
          chips: [
            { label: "✅ Não preciso de troco", actionText: "Não preciso de troco, pode confirmar o pedido!", variant: "success" as const },
            { label: "💵 Troco para R$ 50", actionText: "Troco para 50" },
            { label: "💵 Troco para R$ 100", actionText: "Troco para 100" },
          ],
        };
      }
    }

    // 1.3 Se o bot pediu a Confirmação Final do Pedido
    if (checkoutStep === "confirm") {
      if (q.includes("confirmar") || q.includes("pode") || q.includes("sim") || q.includes("fechado") || q.includes("manda") || q.includes("troco")) {
        return handleFinalizeOrder();
      }
    }

    // ----------------------------------------------------
    // ETAPA 2: AÇÕES DIRETAS DO CLIENTE (Fechar, Retirar, Status)
    // ----------------------------------------------------

    // 2.1 Fechamento Direto do Pedido
    if (
      q.includes("fechar") ||
      q.includes("finalizar") ||
      q.includes("concluir") ||
      q.includes("fechar pedido") ||
      q.includes("manda a conta") ||
      q.includes("quero entrega") ||
      q.includes("fazer pedido")
    ) {
      if (cart.length === 0) {
        return {
          reply: `Seu carrinho ainda está vazio! 🛒\n\nQue tal experimentar nosso famoso *Pastel Dois Queijos (Mussarela & Coalho)* por R$ 18,00 ou o *Combo Casal Brasa & Burger* por R$ 44,00?\n\nMe diga o que você tem vontade de comer que eu separo para você! 😊`,
          chips: [
            { label: "🥟 Quero 2x Pastel de Queijo", actionText: "Quero dois pastéis de dois queijos" },
            { label: "🎁 Quero Combo Casal", actionText: "Quero um combo casal" },
          ],
        };
      }

      setCheckoutStep("address");
      setDeliveryType("delivery");
      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

      const storeAddress = settings?.address || RESTAURANT_INFO.address;
      const nList =
        settings?.neighborhoods && settings.neighborhoods.length > 0
          ? settings.neighborhoods
          : [
              { neighborhood: "Ponta Negra", fee: 5.0, estimatedMinutes: "25-40 min", active: true },
              { neighborhood: "Capim Macio", fee: 7.0, estimatedMinutes: "30-45 min", active: true },
              { neighborhood: "Neópolis", fee: 8.0, estimatedMinutes: "35-50 min", active: true },
            ];

      const addressChips = nList.slice(0, 3).map((n) => ({
        label: `📍 ${n.neighborhood} (R$ ${n.fee.toFixed(2)})`,
        actionText: `Fábio, Av. Principal 100, ${n.neighborhood}`,
      }));

      return {
        reply: `Maravilha! Vamos fechar o seu pedido para entrega rápida! 🛵💨\n\n🛒 *Itens do seu pedido:*\n${cart.map((i) => `• ${i.quantity}x ${i.name} — R$ ${(i.price * i.quantity).toFixed(2)}`).join("\n")}\n\n💰 *Subtotal:* R$ ${subtotal.toFixed(2)}\n\nPor favor, informe seu **Nome** e o **Endereço Completo de Entrega** (Rua, Número e Bairro):`,
        chips: [
          ...addressChips,
          { label: "🏬 Prefiro Retirar no Balcão", actionText: "Vou retirar no balcão" },
        ],
      };
    }

    // 2.2 Retirada no Balcão
    if (q.includes("retirar") || q.includes("balcao") || q.includes("balcão")) {
      if (cart.length === 0) {
        return {
          reply: `Seu carrinho ainda está vazio! Escolha algum item do cardápio para retirar no balcão.`,
        };
      }
      const storeAddress = settings?.address || RESTAURANT_INFO.address;
      setDeliveryType("retirada");
      setDeliveryAddress(`Retirada no Balcão (${storeAddress})`);
      setDeliveryNeighborhood("Balcão / Takeaway");
      setDeliveryFee(0.0);
      setCheckoutStep("payment");

      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

      return {
        reply: `Perfeito! Você pode retirar quentinho no nosso balcão na *${storeAddress}* em 20-30 min! 🏬\nTaxa de entrega: *R$ 0,00 (Grátis)*.\nTotal a pagar: *R$ ${subtotal.toFixed(2)}*.\n\nComo deseja pagar?`,
        chips: [
          { label: "🔑 Pagar via Pix", actionText: "Vou pagar no Pix" },
          { label: "💳 Cartão no Balcão", actionText: "Vou pagar no Cartão no balcão" },
          { label: "💵 Dinheiro no Balcão", actionText: "Vou pagar em Dinheiro no balcão" },
        ],
      };
    }

    // 2.3 Cancelamento / Limpar Carrinho
    if (q.includes("limpar") || q.includes("cancelar pedido") || q.includes("zerar pedido") || q.includes("apagar")) {
      setCart([]);
      setCheckoutStep("idle");
      return {
        reply: `Carrinho zerado com sucesso! 🗑️ O que deseja pedir agora?`,
        chips: [
          { label: "🥟 Ver Pastéis", actionText: "Quais os pastéis?" },
          { label: "🌭 Ver Hot Dogs", actionText: "Quais os hot dogs?" },
        ],
      };
    }

    // 2.4 Consulta de Status de Pedido Ativo
    if (q.includes("status") || q.includes("cade meu pedido") || q.includes("cadê meu pedido") || q.includes("como esta meu pedido") || q.includes("como tá meu pedido") || q.includes("vai demorar")) {
      if (lastCreatedOrder) {
        return {
          reply: `Seu pedido *#${lastCreatedOrder.orderNumber}* está com status: 👨‍🍳 *${lastCreatedOrder.status.toUpperCase()}* na chapa da cozinha!\n\nItens: ${lastCreatedOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}.\nEndereço de Entrega: *${lastCreatedOrder.deliveryAddress}*.\nPrevisão: *30 a 45 min* a partir da confirmação. Agradecemos a preferência! 🌭`,
        };
      }
      return {
        reply: `Você ainda não possui nenhum pedido aberto neste atendimento. Deseja fazer um pedido agora? 😊`,
      };
    }

    // ----------------------------------------------------
    // ETAPA 3: INTENÇÃO DE ADIÇÃO DE ITENS (O Caso do Fábio!)
    // Ex: "Quero dois pastéis de dois queijos e uma coca de 1l"
    // ----------------------------------------------------
    const nonOrderPhrases = [
      "falar", "conversar", "saber", "perguntar", "tirar", "ver", "olhar", "consultar",
      "ajuda", "suporte", "reclamar", "reclamacao", "reclamação", "cancelar", "nao quero", "não quero",
      "humano", "atendente", "pessoa", "dono", "gerente"
    ];

    const hasNonOrderAction = nonOrderPhrases.some((word) => cleanQ.includes(word));

    const isOrderIntent =
      !hasNonOrderAction &&
      (q.includes("quero") ||
      q.includes("manda") ||
      q.includes("adiciona") ||
      q.includes("bota") ||
      q.includes("põe") ||
      q.includes("me ve") ||
      q.includes("me vê") ||
      q.includes("vou querer") ||
      q.includes("gostaria de") ||
      q.includes("pedir") ||
      /\b\d+\s*(pasteis|pastel|coca|guarana|suco|agua|hot dog|hotdog|combo|smash|burger|hamburguer|tapioca|refrigerante|batata|macaxeira|cebola|pizza|calzone|acai|açaí|nutella|cartola)\b/.test(q));

    const isQuestionOnly =
      (q.includes("tem") || q.includes("quais") || q.includes("cardapio") || q.includes("cardápio") || q.includes("preco") || q.includes("preço") || q.includes("quanto custa") || q.includes("vcs tem") || q.includes("voces tem")) &&
      !q.includes("quero") &&
      !q.includes("manda") &&
      !q.includes("bota");

    if (isOrderIntent && !isQuestionOnly) {
      const extracted = extractItemsFromSentence(userText);

      if (extracted.length > 0) {
        // Adiciona ao carrinho da sessão
        const newCartItems: BotCartItem[] = [...cart];

        for (const item of extracted) {
          const existingIndex = newCartItems.findIndex((c) => c.productId === item.product.id);
          if (existingIndex >= 0) {
            newCartItems[existingIndex].quantity += item.quantity;
          } else {
            newCartItems.push({
              productId: item.product.id,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            });
          }
        }

        setCart(newCartItems);

        const subtotal = newCartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

        const itemsFormatted = extracted
          .map((i) => `• *${i.quantity}x ${i.product.name}* — R$ ${(i.product.price * i.quantity).toFixed(2)}`)
          .join("\n");

        let response = `Perfeito! Já adicionei ao seu pedido: 🛒✨\n\n${itemsFormatted}\n\n💰 *Subtotal atual:* R$ ${subtotal.toFixed(2)}`;

        if (alwaysOfferDessert && !newCartItems.some((i) => i.productId.startsWith("sb-"))) {
          response += `\n\n🍨 *Sugestão do Chef:* Que tal incluir um *Pastel Doce de Nutella com Ninho* (R$ 14,00) ou um *Açaí no Copo 500ml* geladinho?`;
        }

        response += `\n\nDeseja adicionar mais alguma coisa ou já podemos fechar para **Entrega** ou **Retirada**?`;

        return {
          reply: response,
          chips: [
            { label: "🛵 Fechar Pedido (Entrega)", actionText: "Pode fechar para entrega!", variant: "primary" as const },
            { label: "🏬 Retirar no Balcão", actionText: "Vou retirar no balcão", variant: "secondary" as const },
            { label: "🥟 + 1 Pastel Carne de Sol", actionText: "Quero 1 pastel de carne de sol" },
            { label: "🍨 Adicionar Pastel Nutella", actionText: "Quero um pastel de nutella com ninho" },
            { label: "❌ Limpar Pedido", actionText: "Limpar pedido", variant: "danger" as const },
          ],
        };
      } else {
        // O cliente tentou pedir algo que não consta no cardápio cadastrado (ex: "Quero sopa", "Manda um sushi", "Quero feijoada")
        let requestedItem = cleanQ
          .replace(/^(quero|manda|adiciona|bota|põe|me ve|me vê|vou querer|gostaria de|pedir|eu quero|queria)\s+/i, "")
          .replace(/^(um|uma|uns|umas|dois|duas|tres|três|quatro|1|2|3|4)\s+/i, "")
          .trim();
        if (!requestedItem) requestedItem = cleanQ;

        // Se após a limpeza o texto não é um alimento real, não executa resposta de comida
        const isNotAFoodQuery =
          requestedItem.length < 2 ||
          requestedItem.includes("falar") ||
          requestedItem.includes("conversar") ||
          requestedItem.includes("humano") ||
          requestedItem.includes("atendente") ||
          requestedItem.includes("ajuda") ||
          requestedItem.includes("saber") ||
          (requestedItem.includes("por favor") && requestedItem.length > 15);

        if (!isNotAFoodQuery) {
          const storeTitle = settings?.storeName || RESTAURANT_INFO.name;
          return {
            reply: `Identifiquei que você gostaria de pedir *${requestedItem}*, mas no momento não trabalhamos com esse item em nosso cardápio! 🍲❌\n\nNossa especialidade no *${storeTitle}* são:\n🍔 *Hambúrgueres Artesanais & Smashes Grelhados*\n🌭 *Hot Dogs Prensados Potiguares*\n🥟 *Pastéis Crocantes Fritos na Hora*\n🍕 *Pizzas Brotinho de Fermentação Lenta*\n🍟 *Porções & Petiscos*\n🥤 *Bebidas Geladinhas*\n\nPosso te sugerir uma das nossas opções mais vendidas?`,
            chips: [
              { label: "🍔 Ver Burgers Artesanais", actionText: "Quais os hambúrgueres artesanais da casa?" },
              { label: "🥟 Ver Pastéis Crocantes", actionText: "Olá.. Vcs tem Pastel de Queijo?" },
              { label: "🌭 Ver Hot Dogs", actionText: "Quais os hot dogs?" },
              { label: "🍕 Ver Pizzas Brotinho", actionText: "Quais pizzas brotinho vocês têm?" },
              { label: "🎁 Ver Combos", actionText: "Quais combos promocionais vocês têm?" },
            ],
          };
        }
      }
    }

    // ----------------------------------------------------
    // ETAPA 4: DÚVIDAS DE CARDÁPIO & CONVERSAÇÃO NATURAL
    // ----------------------------------------------------

    // 4.0 Saudações e Boas-Vindas Inteligentes (Trata "Olá, Boa noite", "Oi!", "Boa noite", etc.)
    const isGreeting =
      cleanQ === "ola" ||
      cleanQ === "oi" ||
      cleanQ === "oie" ||
      cleanQ === "opa" ||
      cleanQ === "e ai" ||
      cleanQ === "salve" ||
      cleanQ.includes("boa noite") ||
      cleanQ.includes("boa tarde") ||
      cleanQ.includes("bom dia") ||
      cleanQ.includes("tudo bem") ||
      cleanQ.includes("como vai") ||
      cleanQ.startsWith("ola") ||
      cleanQ.startsWith("oi ") ||
      cleanQ.startsWith("opa");

    if (
      isGreeting &&
      !cleanQ.includes("pastel") &&
      !cleanQ.includes("burger") &&
      !cleanQ.includes("pizza") &&
      !cleanQ.includes("coca") &&
      !cleanQ.includes("hot dog") &&
      !cleanQ.includes("combo") &&
      !cleanQ.includes("quero") &&
      !cleanQ.includes("manda") &&
      !cleanQ.includes("pedir")
    ) {
      const store = settings?.storeName || RESTAURANT_INFO.name;
      let greetingWord = "Olá! 👋";
      if (cleanQ.includes("boa noite")) greetingWord = "Boa noite! 🌙";
      else if (cleanQ.includes("boa tarde")) greetingWord = "Boa tarde! ☀️";
      else if (cleanQ.includes("bom dia")) greetingWord = "Bom dia! ☀️";

      return {
        reply: `${greetingWord} Seja muito bem-vindo ao *${store}*!\n\nNossa cozinha está a todo vapor preparando hambúrgueres artesanais, hot dogs prensados, pastéis crocantes, pizzas brotinho e porções sequinhas! 🔥🍔🥟\n\nComo posso te atender hoje? Você pode me dizer o que deseja pedir ou escolher uma das opções abaixo:`,
        chips: [
          { label: "🍔 Ver Burgers Artesanais", actionText: "Quais os hambúrgueres artesanais da casa?" },
          { label: "🕒 Vcs estão atendendo ainda?", actionText: "Vcs estão atendendo ainda?" },
          { label: "🥟 Ver Pastéis", actionText: "Olá.. Vcs tem Pastel de Queijo?" },
          { label: "🎁 Ver Combos", actionText: "Quais combos promocionais vocês têm?" },
          { label: "🛵 Taxas de Entrega", actionText: "Qual a taxa de entrega para o meu bairro?" },
        ],
      };
    }

    // 4.1 Horário de Funcionamento & Status de Atendimento (O Teste do Fábio!)
    const isOperatingQuery =
      cleanQ.includes("atendendo") ||
      cleanQ.includes("aberto") ||
      cleanQ.includes("abertos") ||
      cleanQ.includes("aberta") ||
      cleanQ.includes("fechado") ||
      cleanQ.includes("fechada") ||
      cleanQ.includes("fecha") ||
      cleanQ.includes("horario") ||
      cleanQ.includes("horas") ||
      cleanQ.includes("funcionando") ||
      cleanQ.includes("atendimento") ||
      cleanQ.includes("da tempo") ||
      cleanQ.includes("vai abrir") ||
      cleanQ.includes("tao atendendo");

    if (isOperatingQuery) {
      const store = settings?.storeName || RESTAURANT_INFO.name;
      const hours = settings?.openingHours || RESTAURANT_INFO.openingHours;
      const isOpen = settings?.isOpen ?? RESTAURANT_INFO.isOpen;

      if (isOpen) {
        return {
          reply: `Sim! Estamos *ABERTOS* e atendendo a todo vapor agora! 🔥🚀\n\n🕒 *Horário de Funcionamento:* ${hours}\n📍 *Endereço:* ${settings?.address || RESTAURANT_INFO.address}\n\nPode escolher os seus lanches que já encaminhamos o pedido direto para a chapa da nossa cozinha! O que você gostaria de saborear hoje?`,
          chips: [
            { label: "🍔 Ver Burgers Artesanais", actionText: "Quais os hambúrgueres artesanais da casa?" },
            { label: "🥟 Ver Pastéis Crocantes", actionText: "Olá.. Vcs tem Pastel de Queijo?" },
            { label: "🎁 Combos Promocionais", actionText: "Quais combos promocionais vocês têm?" },
            { label: "🛵 Taxas de Entrega", actionText: "Qual a taxa de entrega para o meu bairro?" },
          ],
        };
      } else {
        return {
          reply: `No momento nossa cozinha está em intervalo ou fechada para atendimento externo. 🌙\n\n🕒 *Nosso Horário de Funcionamento:* ${hours}\n📍 *Endereço:* ${settings?.address || RESTAURANT_INFO.address}\n\nFique à vontade para consultar nosso cardápio e valores para o seu próximo pedido!`,
          chips: [
            { label: "🍔 Ver Cardápio Completo", actionText: "Quais os hambúrgueres artesanais da casa?" },
            { label: "🛵 Ver Bairros Atendidos", actionText: "Qual a taxa de entrega para o meu bairro?" },
          ],
        };
      }
    }

    // 4.2 Localização e Endereço Físico
    if (
      q.includes("endereco") ||
      q.includes("endereço") ||
      q.includes("onde fica") ||
      q.includes("localizacao") ||
      q.includes("localização") ||
      q.includes("ponto de referencia") ||
      q.includes("ponto de referência") ||
      q.includes("onde vcs ficam") ||
      q.includes("onde vocês ficam")
    ) {
      const storeAddress = settings?.address || RESTAURANT_INFO.address;
      return {
        reply: `Estamos localizados em: 📍\n*${storeAddress}*\n\nVocê pode pedir pelo delivery com entrega rápida no seu endereço ou retirar quentinho diretamente no nosso balcão! 🛵🏬`,
        chips: [
          { label: "🛵 Pedir Delivery", actionText: "Quero fazer um pedido para entrega" },
          { label: "🏬 Retirar no Balcão", actionText: "Vou retirar no balcão" },
        ],
      };
    }

    // 4.2.1 Disponibilidade de Produto: "Vcs vendem [X]?", "Tem [X]?", "Fazem [X]?", "Trabalham com [X]?"
    const availabilityCheck = extractAvailabilityInquiry(cleanQ);
    if (availabilityCheck.isInquiry) {
      const queriedItem = availabilityCheck.itemQuery;
      // Procura se existe algum produto no catálogo correspondente
      const matchedProd = findProductByAlias(queriedItem) || findProductByAlias(cleanQ);

      if (matchedProd) {
        const emoji = getCategoryEmoji(matchedProd.category, matchedProd.name);
        const shortName = matchedProd.name.split("(")[0].trim().slice(0, 22);
        return {
          reply: `Temos sim! ${emoji}✨\n\nO nosso *${matchedProd.name}* sai por *R$ ${matchedProd.price.toFixed(2)}*!\n_${matchedProd.description}_\n\nQuantos você gostaria que eu separasse para você? É só me falar a quantidade ou tocar nos botões abaixo! 👇`,
          chips: [
            { label: `🛒 Pedir 1x ${shortName}`, actionText: `Quero 1 ${matchedProd.name}` },
            { label: `🛒 Pedir 2x ${shortName}`, actionText: `Quero 2 ${matchedProd.name}` },
            { label: "🥤 Ver Bebidas", actionText: "Quais refrigerantes vocês têm?" },
            { label: "🍟 Ver Porções", actionText: "Quais porções vocês têm?" },
          ],
        };
      } else {
        // RESPOSTA DE NÃO-DISPONIBILIDADE INTELIGENTE (Ex: "Vcs vendem sopa?")
        const storeTitle = settings?.storeName || RESTAURANT_INFO.name;
        return {
          reply: `No momento não trabalhamos com *${queriedItem}*! 🍲❌\n\nO nosso cardápio no *${storeTitle}* é especializado em:\n🍔 *Burgers Artesanais & Smashes Grelhados*\n🌭 *Hot Dogs Prensados Potiguares*\n🥟 *Pastéis Crocantes Fritos na Hora*\n🍕 *Pizzas Brotinho de Fermentação Lenta*\n🍟 *Porções & Petiscos*\n🥤 *Bebidas Geladinhas*\n\nQue tal dar uma olhada em nossas opções mais pedidas? Posso te sugerir um de nossos lanches da casa!`,
          chips: [
            { label: "🍔 Ver Burgers Artesanais", actionText: "Quais os hambúrgueres artesanais da casa?" },
            { label: "🥟 Ver Pastéis Crocantes", actionText: "Olá.. Vcs tem Pastel de Queijo?" },
            { label: "🌭 Ver Hot Dogs", actionText: "Quais os hot dogs?" },
            { label: "🍕 Ver Pizzas Brotinho", actionText: "Quais pizzas brotinho vocês têm?" },
            { label: "🎁 Combos Promocionais", actionText: "Quais combos promocionais vocês têm?" },
          ],
        };
      }
    }

    // 4.2.2 Consulta Geral de Cardápio / Menu Completo (100% Dinâmico a partir do Catálogo Real)
    const isMenuQuery =
      cleanQ === "cardapio" ||
      cleanQ === "cardápio" ||
      cleanQ === "menu" ||
      cleanQ.includes("o que vcs vendem") ||
      cleanQ.includes("o que voces vendem") ||
      cleanQ.includes("o que tem pra comer") ||
      cleanQ.includes("quais as opcoes") ||
      cleanQ.includes("quais as opções") ||
      cleanQ.includes("ver cardapio") ||
      cleanQ.includes("ver cardápio") ||
      cleanQ.includes("cardapio completo") ||
      cleanQ.includes("cardápio completo") ||
      cleanQ.includes("manda o cardapio") ||
      cleanQ.includes("manda o cardápio");

    if (isMenuQuery) {
      const store = settings?.storeName || RESTAURANT_INFO.name;
      const avail = products.filter((p) => p.isAvailable !== false);
      const minPrice = (cat: string) => {
        const items = avail.filter((p) => normalize(p.category).includes(cat));
        if (items.length === 0) return null;
        return Math.min(...items.map((i) => i.price)).toFixed(2);
      };

      const lines = [
        minPrice("burger") && `🍔 *Burgers & Smashes Artesanais:* a partir de R$ ${minPrice("burger")}`,
        minPrice("hotdog") && `🌭 *Hot Dogs Prensados Potiguares:* a partir de R$ ${minPrice("hotdog")}`,
        minPrice("paste") && `🥟 *Pastéis Crocantes Fritos na Hora:* a partir de R$ ${minPrice("paste")}`,
        minPrice("tapioca") && `🌮 *Tapiocas Recheadas na Hora:* a partir de R$ ${minPrice("tapioca")}`,
        minPrice("pizza") && `🍕 *Pizzas Brotinho & Calzones:* a partir de R$ ${minPrice("pizza")}`,
        minPrice("porc") && `🍟 *Porções & Petiscos:* a partir de R$ ${minPrice("porc")}`,
        minPrice("combo") && `🎁 *Combos Promocionais:* a partir de R$ ${minPrice("combo")}`,
        minPrice("bebida") && `🥤 *Bebidas & Sucos Gelados:* a partir de R$ ${minPrice("bebida")}`,
        minPrice("sobremesa") && `🍨 *Sobremesas & Açaí:* a partir de R$ ${minPrice("sobremesa")}`,
      ].filter(Boolean);

      return {
        reply: `Aqui está o resumo atualizado do cardápio do *${store}*! 📋✨\n\n${lines.join("\n")}\n\nToque nos botões abaixo para ver os itens de cada categoria ou me diga o que você quer saborear hoje! 👇`,
        chips: [
          { label: "🍔 Ver Burgers", actionText: "Quais os hambúrgueres artesanais da casa?" },
          { label: "🥟 Ver Pastéis", actionText: "Quais os pastéis?" },
          { label: "🌭 Ver Hot Dogs", actionText: "Quais os hot dogs?" },
          { label: "🌮 Ver Tapiocas", actionText: "Quais tapiocas vocês têm?" },
          { label: "🍕 Ver Pizzas", actionText: "Quais pizzas brotinho vocês têm?" },
          { label: "🍨 Ver Açaí & Doces", actionText: "Quais sobremesas vocês têm?" },
        ],
      };
    }

    // 4.3 Hambúrgueres & Smashes Artesanais
    if (
      q.includes("hamburguer") ||
      q.includes("hambúrguer") ||
      q.includes("burger") ||
      q.includes("burgers") ||
      q.includes("artesanal") ||
      q.includes("smash")
    ) {
      const burgers = products.filter(
        (p) => p.isAvailable !== false && (normalize(p.category).includes("burger") || normalize(p.category).includes("hamburguer"))
      );
      const list = (burgers.length > 0 ? burgers : products.slice(0, 4))
        .map((b) => `• *${b.name}* — R$ ${b.price.toFixed(2)}\n  _${b.description}_`)
        .join("\n\n");

      const dynamicChips = burgers.slice(0, 2).map((b) => ({
        label: `🍔 1x ${b.name.split("(")[0].trim().slice(0, 20)}`,
        actionText: `Quero 1 ${b.name}`,
      }));

      return {
        reply: `Nossos Burgers são grelhados no ponto certo com blend artesanal 100% bovino: 🍔🔥\n\n${list}\n\nQual desses você vai querer saborear? Pode me dizer a quantidade ou tocar nos botões abaixo!`,
        chips: [
          ...dynamicChips,
          { label: "🥤 Ver Bebidas", actionText: "Quais refrigerantes vocês têm?" },
          { label: "🍟 Ver Porções", actionText: "Quais porções vocês têm?" },
        ],
      };
    }

    // 4.4 Pizzas Brotinho & Calzones
    if (q.includes("pizza") || q.includes("pizzas") || q.includes("brotinho") || q.includes("calabresa") || q.includes("calzone")) {
      const pizzas = products.filter((p) => p.isAvailable !== false && normalize(p.category).includes("pizza"));
      const list = pizzas
        .map((p) => `• *${p.name}* — R$ ${p.price.toFixed(2)}\n  _${p.description}_`)
        .join("\n\n");
      const dynamicChips = pizzas.slice(0, 2).map((p) => ({
        label: `🍕 1x ${p.name.split("(")[0].trim().slice(0, 20)}`,
        actionText: `Quero 1 ${p.name}`,
      }));
      return {
        reply: `Nossas Pizzas Brotinho e Calzones têm massa artesanal de fermentação lenta e muito queijo: 🍕✨\n\n${list}\n\nQuantas você gostaria de pedir hoje?`,
        chips: [
          ...dynamicChips,
          { label: "🥤 Ver Bebidas", actionText: "Quais refrigerantes vocês têm?" },
        ],
      };
    }

    // 4.5 Pastéis Crocantes (100% Dinâmico pelo Catálogo)
    if (q.includes("pastel") || q.includes("pastéis") || q.includes("pasteis") || (q.includes("queijo") && !q.includes("tapioca") && !q.includes("calzone"))) {
      const pasteis = products.filter((p) => p.isAvailable !== false && normalize(p.category).includes("paste"));
      const list = pasteis
        .map((p) => `• *${p.name}* — R$ ${p.price.toFixed(2)}\n  _${p.description}_`)
        .join("\n\n");
      const dynamicChips = pasteis.slice(0, 3).map((p) => ({
        label: `🥟 1x ${p.name.split("(")[0].trim().slice(0, 20)}`,
        actionText: `Quero 1 ${p.name}`,
      }));

      return {
        reply: `Temos sim, e os nossos pastéis são fritos na hora com massa sequinha e super crocante! 🥟✨\n\n${list}\n\nQuantos você gostaria que eu separasse para você? É só me falar a quantidade ou tocar nos botões abaixo! 👇`,
        chips: [
          ...dynamicChips,
          { label: "🥤 Ver Bebidas", actionText: "Quais refrigerantes vocês têm?" },
        ],
      };
    }

    // 4.6 Hot Dogs
    if (q.includes("hot dog") || q.includes("hotdog") || q.includes("cachorro quente") || (q.includes("nata") && !q.includes("tapioca"))) {
      const hds = products.filter((p) => p.isAvailable !== false && normalize(p.category).includes("hotdog"));
      const list = hds.map((p) => `• *${p.name}* — R$ ${p.price.toFixed(2)}\n  _${p.description}_`).join("\n\n");
      const dynamicChips = hds.slice(0, 2).map((p) => ({
        label: `🌭 1x ${p.name.split("(")[0].trim().slice(0, 20)}`,
        actionText: `Quero 1 ${p.name}`,
      }));
      return {
        reply: `Nosso carro-chefe potiguar! Pão prensado na chapa com crosta dourada de manteiga: 🌭🔥\n\n${list}\n\nQual desses você vai querer hoje? É só me dizer a quantidade!`,
        chips: dynamicChips,
      };
    }

    // 4.6.1 Tapiocas Recheadas
    if (q.includes("tapioca") || q.includes("tapiocas") || q.includes("cartola")) {
      const tapiocas = products.filter((p) => p.isAvailable !== false && normalize(p.category).includes("tapioca"));
      const list = tapiocas.map((t) => `• *${t.name}* — R$ ${t.price.toFixed(2)}\n  _${t.description}_`).join("\n\n");
      const dynamicChips = tapiocas.slice(0, 3).map((t) => ({
        label: `🌮 1x ${t.name.split("(")[0].trim().slice(0, 20)}`,
        actionText: `Quero 1 ${t.name}`,
      }));
      return {
        reply: `Nossas Tapiocas são peneiradas na hora com goma fresca e recheios regionais caprichados: 🌮✨\n\n${list}\n\nQual delas você gostaria de pedir hoje?`,
        chips: dynamicChips,
      };
    }

    // 4.6.2 Sobremesas & Açaí
    if (q.includes("sobremesa") || q.includes("sobremesas") || q.includes("doce") || q.includes("doces")) {
      const sobremesas = products.filter(
        (p) => p.isAvailable !== false && (normalize(p.category).includes("sobremesa") || normalize(p.name).includes("doce") || normalize(p.name).includes("acai"))
      );
      const list = sobremesas.map((s) => `• *${s.name}* — R$ ${s.price.toFixed(2)}\n  _${s.description}_`).join("\n\n");
      const dynamicChips = sobremesas.slice(0, 3).map((s) => ({
        label: `🍨 1x ${s.name.split("(")[0].trim().slice(0, 20)}`,
        actionText: `Quero 1 ${s.name}`,
      }));
      return {
        reply: `Nossas opções de Sobremesas e Açaí são de dar água na boca: 🍨🍫\n\n${list}\n\nQual você gostaria de adicionar ao seu pedido?`,
        chips: dynamicChips,
      };
    }

    // 4.7 Combos Promocionais
    if (q.includes("combo") || q.includes("casal") || q.includes("família") || q.includes("promocao") || q.includes("promoção")) {
      const combos = products.filter((p) => p.isAvailable !== false && normalize(p.category).includes("combo"));
      const list = combos.map((c) => `• *${c.name}* (R$ ${c.price.toFixed(2)}): ${c.description}`).join("\n\n");
      const dynamicChips = combos.slice(0, 2).map((c) => ({
        label: `🎁 1x ${c.name.split("(")[0].trim().slice(0, 20)}`,
        actionText: `Quero 1 ${c.name}`,
      }));
      return {
        reply: `Nossos combos são perfeitos para economizar e comer muito bem! 🎁🌭\n\n${list}\n\nGostaria de pedir algum deles?`,
        chips: dynamicChips,
      };
    }

    // 4.8 Porções e Batatas
    if (
      q.includes("porcao") ||
      q.includes("porção") ||
      q.includes("porcoes") ||
      q.includes("porções") ||
      q.includes("batata") ||
      q.includes("fritas") ||
      q.includes("macaxeira") ||
      q.includes("cebola")
    ) {
      const porcoes = products.filter((p) => p.isAvailable !== false && normalize(p.category).includes("porc"));
      const list = porcoes
        .map((p) => `• *${p.name}* — R$ ${p.price.toFixed(2)}\n  _${p.description}_`)
        .join("\n\n");
      const dynamicChips = porcoes.slice(0, 2).map((p) => ({
        label: `🍟 1x ${p.name.split("(")[0].trim().slice(0, 20)}`,
        actionText: `Quero 1 ${p.name}`,
      }));
      return {
        reply: `Nossas Porções são bem servidas e perfeitas para petiscar: 🍟🧅\n\n${list}\n\nDeseja adicionar alguma porção ao seu pedido?`,
        chips: [
          ...dynamicChips,
          { label: "🥤 Ver Bebidas", actionText: "Quais refrigerantes vocês têm?" },
        ],
      };
    }

    // 4.9 Bebidas e Refrigerantes
    if (q.includes("bebida") || q.includes("refrigerante") || q.includes("coca") || q.includes("guarana") || q.includes("suco") || q.includes("agua")) {
      const bebidas = products.filter((p) => p.isAvailable !== false && normalize(p.category).includes("bebida"));
      const list = bebidas.map((b) => `• *${b.name}* — R$ ${b.price.toFixed(2)} (${b.description})`).join("\n");
      const dynamicChips = bebidas.slice(0, 3).map((b) => ({
        label: `🥤 1x ${b.name.split("(")[0].trim().slice(0, 20)}`,
        actionText: `Quero 1 ${b.name}`,
      }));
      return {
        reply: `Temos bebidas geladinhas para acompanhar seus lanches! 🥤❄️\n\n${list}\n\nQuantas você gostaria de adicionar?`,
        chips: dynamicChips,
      };
    }

    // 4.10 Formas de Pagamento
    if (
      q.includes("aceita cartao") ||
      q.includes("aceita cartão") ||
      q.includes("aceita pix") ||
      q.includes("aceita dinheiro") ||
      q.includes("formas de pagamento") ||
      q.includes("forma de pagamento") ||
      q.includes("como posso pagar")
    ) {
      const pixKey = settings?.pixKey || RESTAURANT_INFO.pixKey;
      const store = settings?.storeName || RESTAURANT_INFO.name;
      return {
        reply: `Aceitamos as seguintes formas de pagamento: 💳💵\n\n• 🔑 *Pix Instantâneo:* Chave \`${pixKey}\` (${store} / A2i Solutions)\n• 💳 *Cartões de Crédito e Débito:* Levamos a maquininha Smart POS até você na entrega ou no balcão (aproximação e chip).\n• 💵 *Dinheiro:* Levamos troco se necessário (basta avisar o valor).\n\nQual forma você prefere para o seu pedido?`,
        chips: [
          { label: "🍔 Ver Cardápio", actionText: "Quais os hambúrgueres artesanais da casa?" },
          { label: "🛵 Taxa de Entrega", actionText: "Qual a taxa de entrega para o meu bairro?" },
        ],
      };
    }

    // 4.11 Informações Gerais: Bairros e Frete
    if (q.includes("entrega") || q.includes("frete") || q.includes("bairro") || q.includes("taxa")) {
      const neighborhoods =
        settings?.neighborhoods && settings.neighborhoods.length > 0
          ? settings.neighborhoods
          : [
              { neighborhood: "Ponta Negra", fee: 5.0, estimatedMinutes: "25-40 min", active: true },
              { neighborhood: "Capim Macio", fee: 7.0, estimatedMinutes: "30-45 min", active: true },
              { neighborhood: "Neópolis / Pirangi", fee: 8.0, estimatedMinutes: "35-50 min", active: true },
              { neighborhood: "Candelária", fee: 10.0, estimatedMinutes: "40-55 min", active: true },
              { neighborhood: "Lagoa Nova", fee: 10.0, estimatedMinutes: "45-60 min", active: true },
              { neighborhood: "Tirol / Petrópolis", fee: 12.0, estimatedMinutes: "45-60 min", active: true },
            ];

      // Verifica se o usuário mencionou um bairro específico
      for (const n of neighborhoods) {
        const normN = normalize(n.neighborhood);
        if (cleanQ.includes(normN) || normN.split("/").some((part) => cleanQ.includes(part.trim()))) {
          return {
            reply: `Entregamos sim em *${n.neighborhood}*! 🛵💨\n\n• 📍 Bairro: *${n.neighborhood}*\n• 💵 Taxa de entrega: *R$ ${n.fee.toFixed(2)}*\n• ⏱️ Previsão média: *${n.estimatedMinutes}*\n• 📦 Embalagem térmica lacrada direto na sua porta!\n\nDeseja que eu anote o seu pedido agora?`,
            chips: [
              { label: "🍔 Ver Cardápio", actionText: "Quais os hambúrgueres artesanais da casa?" },
              { label: "🥟 Ver Pastéis", actionText: "Olá.. Vcs tem Pastel de Queijo?" },
              { label: "🎁 Ver Combos", actionText: "Quais combos promocionais vocês têm?" },
            ],
          };
        }
      }

      const list = neighborhoods
        .filter((n) => n.active)
        .map((n) => `• *${n.neighborhood}:* R$ ${n.fee.toFixed(2)} (${n.estimatedMinutes})`)
        .join("\n");

      const chips = neighborhoods.slice(0, 3).map((n) => ({
        label: `📍 ${n.neighborhood} (R$ ${n.fee.toFixed(2)})`,
        actionText: `Qual a taxa para ${n.neighborhood}?`,
      }));

      return {
        reply: `🛵 Entregamos com motoboy próprio e embalagem térmica lacrada:\n\n${list}\n\n💡 *Dica:* Para retirada no nosso balcão a taxa é *R$ 0,00 (Grátis)*!\nQual o seu bairro para entrega?`,
        chips: [
          ...chips,
          { label: "🏬 Retirar no Balcão (Grátis)", actionText: "Vou retirar no balcão" },
        ],
      };
    }

    // 4.12 Chave Pix
    if (q.includes("pix") || q.includes("chave") || q.includes("pagar")) {
      const store = settings?.storeName || RESTAURANT_INFO.name;
      const pix = settings?.pixKey || RESTAURANT_INFO.pixKey;
      return {
        reply: `Nossa chave Pix oficial é: *${pix}* (${store} / A2i Solutions). Aceitamos também cartões de crédito e débito na maquininha na entrega! 💳`,
        chips: [
          { label: "🍔 Fazer um Pedido", actionText: "Quais os hambúrgueres artesanais da casa?" },
          { label: "🥟 Ver Pastéis", actionText: "Olá.. Vcs tem Pastel de Queijo?" },
        ],
      };
    }

    // 4.13 Cupons de Desconto
    if (q.includes("cupom") || q.includes("desconto")) {
      const coupons = settings?.coupons || [
        { code: "PRIMEIRACOMPRA", discountPercent: 10, active: true },
        { code: "FRETEGRATIS", freeDelivery: true, active: true },
        { code: "QUERO10", discountPercent: 10, active: true },
      ];
      const list = coupons
        .filter((c) => c.active)
        .map((c) => `• *${c.code}* — ${c.freeDelivery ? "Frete Grátis na entrega" : `${c.discountPercent}% de Desconto no pedido`}`)
        .join("\n");

      return {
        reply: `Temos cupons especiais ativos hoje! 🎟️\n\n${list}\n\nPara aplicar, basta me informar o código ao fechar seu pedido!`,
        chips: [
          { label: "🍔 Fazer Pedido", actionText: "Quais os hambúrgueres artesanais da casa?" },
        ],
      };
    }

    // 4.14 Busca Dinâmica por Produto Específico no Cardápio (Inclusive cadastrados/importados via Excel)
    const specificProd = findProductByAlias(cleanQ);
    if (specificProd && !isOrderIntent) {
      const emoji = getCategoryEmoji(specificProd.category, specificProd.name);
      const shortName = specificProd.name.split("(")[0].trim().slice(0, 22);
      return {
        reply: `Temos sim! ${emoji}✨\n\nO nosso *${specificProd.name}* sai por *R$ ${specificProd.price.toFixed(2)}*!\n_${specificProd.description}_\n\nQuantos você gostaria que eu separasse para você?`,
        chips: [
          { label: `🛒 Pedir 1x ${shortName}`, actionText: `Quero 1 ${specificProd.name}` },
          { label: `🛒 Pedir 2x ${shortName}`, actionText: `Quero 2 ${specificProd.name}` },
          { label: "🥤 Ver Bebidas", actionText: "Quais bebidas vocês têm?" },
          { label: "🍟 Ver Porções", actionText: "Quais porções vocês têm?" },
        ],
      };
    }

    // 4.15 FAQs: Opções Vegetarianas / Sem Carne (Dinâmico sobre o Catálogo)
    if (
      cleanQ.includes("vegetariano") ||
      cleanQ.includes("vegetariana") ||
      cleanQ.includes("sem carne") ||
      cleanQ.includes("veggie")
    ) {
      const meatWords = ["carne", "bacon", "frango", "calabresa", "camarao", "presunto", "salsicha", "smash", "hot dog"];
      const veggieItems = products.filter((p) => {
        if (p.isAvailable === false || normalize(p.category).includes("bebida")) return false;
        const fullText = normalize(`${p.name} ${p.description}`);
        return !meatWords.some((mw) => fullText.includes(mw));
      });

      const list = veggieItems
        .map((v) => `• ${getCategoryEmoji(v.category, v.name)} *${v.name}* — R$ ${v.price.toFixed(2)}`)
        .join("\n");

      const dynamicChips = veggieItems.slice(0, 3).map((v) => ({
        label: `${getCategoryEmoji(v.category, v.name)} 1x ${v.name.split("(")[0].trim().slice(0, 18)}`,
        actionText: `Quero 1 ${v.name}`,
      }));

      return {
        reply: `Temos deliciosas opções sem carne em nosso cardápio! 🌱✨\n\n${list}\n\nGostaria de pedir alguma dessas opções hoje?`,
        chips: dynamicChips,
      };
    }

    // 4.16 FAQs: Vale Refeição (VR / Sodexo / Alelo / Ticket)
    if (
      cleanQ.includes("vr") ||
      cleanQ.includes("vale refeicao") ||
      cleanQ.includes("vale refeição") ||
      cleanQ.includes("sodexo") ||
      cleanQ.includes("alelo") ||
      cleanQ.includes("ticket")
    ) {
      return {
        reply: `No momento não estamos aceitando Vale Refeição (VR / Sodexo / Alelo / Ticket). 💳\n\nAceitamos:\n• 🔑 *Pix Instantâneo*\n• 💳 *Cartão de Débito ou Crédito* (o motoboy leva a maquininha Smart POS até você)\n• 💵 *Dinheiro* (levamos troco facilitado)\n\nQual dessas formas você prefere para fechar o pedido?`,
        chips: [
          { label: "🔑 Pagar no Pix", actionText: "Vou pagar no Pix" },
          { label: "💳 Cartão na Entrega", actionText: "Vou pagar no Cartão (motoboy leva a maquininha)" },
          { label: "🍔 Ver Cardápio", actionText: "Quais os hambúrgueres artesanais da casa?" },
        ],
      };
    }

    // 4.17 FAQs: Tempo de Entrega / Previsão
    if (
      cleanQ.includes("tempo de entrega") ||
      cleanQ.includes("demora quanto") ||
      cleanQ.includes("quanto tempo demora") ||
      cleanQ.includes("previsao de entrega") ||
      cleanQ.includes("previsão de entrega") ||
      cleanQ.includes("tempo de espera")
    ) {
      return {
        reply: `Nosso tempo médio de entrega é de *30 a 45 minutos* a partir da confirmação do pedido! 🛵💨\n\nNossos pedidos saem em embalagens térmicas lacradas para garantir máxima qualidade. Deseja pedir agora?`,
        chips: [
          { label: "🍔 Ver Burgers Artesanais", actionText: "Quais os hambúrgueres artesanais da casa?" },
          { label: "🥟 Ver Pastéis Crocantes", actionText: "Olá.. Vcs tem Pastel de Queijo?" },
          { label: "🛵 Taxas por Bairro", actionText: "Qual a taxa de entrega para o meu bairro?" },
        ],
      };
    }

    // 4.18 FAQs: Salão Físico, Mesas e Atendimento no Local
    if (
      cleanQ.includes("mesa") ||
      cleanQ.includes("comer no local") ||
      cleanQ.includes("espaco kids") ||
      cleanQ.includes("espaço kids") ||
      cleanQ.includes("salao") ||
      cleanQ.includes("salão") ||
      cleanQ.includes("presencial")
    ) {
      const storeAddress = settings?.address || RESTAURANT_INFO.address;
      return {
        reply: `Temos sim! Nosso espaço físico conta com salão aconchegante, mesas confortáveis e ambiente climatizado para você saborear seus lanches com a família e amigos! 🏬🍽️\n\nTambém operamos com retirada rápida no balcão e delivery para toda a região.\n📍 *Endereço:* ${storeAddress}\n\nEsperamos sua visita!`,
        chips: [
          { label: "🍔 Ver Cardápio", actionText: "Quais os hambúrgueres artesanais da casa?" },
          { label: "🛵 Pedir Delivery", actionText: "Quero fazer um pedido para entrega" },
        ],
      };
    }

    // 4.19 FAQs: Contato Humano / Telefone / Suporte
    if (
      cleanQ.includes("telefone") ||
      cleanQ.includes("contato") ||
      cleanQ.includes("whatsapp") ||
      cleanQ.includes("falar com atendente") ||
      cleanQ.includes("falar com humano") ||
      cleanQ.includes("atendente humano") ||
      cleanQ.includes("humano")
    ) {
      const phone = settings?.phone || RESTAURANT_INFO.phone;
      return {
        reply: `Você pode falar diretamente com nossa equipe no telefone/WhatsApp: 📞\n*${phone}*\n\nMas se quiser economizar tempo, eu mesmo posso anotar seu pedido completo e enviar direto para a chapa da cozinha agora! O que gostaria de comer hoje?`,
        chips: [
          { label: "🍔 Fazer Pedido Aqui", actionText: "Quais os hambúrgueres artesanais da casa?" },
          { label: "🛵 Ver Taxas de Entrega", actionText: "Qual a taxa de entrega para o meu bairro?" },
        ],
      };
    }

    // 4.20 Agradecimentos e Respostas de Cortesia
    if (
      cleanQ === "obrigado" ||
      cleanQ === "obrigada" ||
      cleanQ === "valeu" ||
      cleanQ === "show" ||
      cleanQ === "perfeito" ||
      cleanQ === "beleza" ||
      cleanQ === "blz" ||
      cleanQ === "maravilha" ||
      cleanQ === "joia" ||
      cleanQ === "ok" ||
      cleanQ === "tudo certo"
    ) {
      return {
        reply: `Por nada! É sempre um enorme prazer atender você. 😊🌭🍔\n\nSe precisar de mais alguma coisa ou quiser pedir algo a mais, é só me chamar por aqui!`,
        chips: [
          { label: "🍔 Ver Cardápio", actionText: "Quais os hambúrgueres artesanais da casa?" },
          { label: "🥟 Ver Pastéis", actionText: "Olá.. Vcs tem Pastel de Queijo?" },
        ],
      };
    }

    // Resposta Padrão Amigável e Inteligente (Nunca mais texto robótico ou surdo)
    const storeTitle = settings?.storeName || RESTAURANT_INFO.name;
    return {
      reply: `Compreendi a sua mensagem! 😊\n\nSou o atendente virtual inteligente do *${storeTitle}* e posso te ajudar a escolher seus lanches no cardápio, calcular a entrega por bairro, chave Pix ou fechar seu pedido direto por aqui!\n\nVocê gostaria de ver nosso cardápio ou consultar alguma informação?`,
      chips: [
        { label: "📋 Cardápio Completo", actionText: "Qual o cardápio completo?" },
        { label: "🍔 Burgers Artesanais", actionText: "Quais os hambúrgueres artesanais da casa?" },
        { label: "🥟 Pastéis Crocantes", actionText: "Olá.. Vcs tem Pastel de Queijo?" },
        { label: "🛵 Taxas de Entrega", actionText: "Qual a taxa de entrega para o meu bairro?" },
        { label: "🕒 Horário / Aberto?", actionText: "Vcs estão atendendo ainda?" },
      ],
    };
  };

  // Finalização do Pedido Oficial e Roteamento para KDS / PDV
  const handleFinalizeOrder = (): NLUResult => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const grandTotal = subtotal + (deliveryType === "delivery" ? deliveryFee : 0.0);

    const nextOrderNumber = Math.floor(100 + Math.random() * 899);

    const cartItemsMapped: CartItem[] = cart.map((i, idx) => ({
      id: `wpp-item-${Date.now()}-${idx}`,
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      optionsSelected: i.optionsSelected || [],
      notes: i.notes,
    }));

    const newOrder: Order = {
      id: `ord-wpp-${Date.now()}`,
      orderNumber: nextOrderNumber,
      type: deliveryType,
      channel: "whatsapp" as OrderChannel,
      customerName: customerName || "Cliente WhatsApp",
      customerPhone: settings?.phone || RESTAURANT_INFO.phone,
      items: cartItemsMapped,
      subtotal,
      deliveryFee: deliveryType === "delivery" ? deliveryFee : 0.0,
      discount: 0,
      total: grandTotal,
      status: "pendente",
      createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      deliveryAddress: deliveryAddress || (settings?.address || RESTAURANT_INFO.address),
      deliveryNeighborhood,
      paymentMethod,
    };

    setLastCreatedOrder(newOrder);
    setCheckoutStep("finished");

    // Dispara para o Gestor e KDS de forma atômica sem sobrescrever pedidos existentes
    if (onOrderCreated) {
      onOrderCreated(newOrder);
    } else {
      try {
        fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "append_order",
            order: newOrder,
            notification: `🔔 Novo Pedido #${newOrder.orderNumber} via WhatsApp Bot (${newOrder.customerName})!`,
          }),
        }).catch((e) => console.log("Sync error:", e));
      } catch (err) {
        console.error(err);
      }
    }

    // Limpa o carrinho para a próxima venda
    setCart([]);

    return {
      reply: `🎉 *PEDIDO CONFIRMADO COM SUCESSO!* 🍔🔥\n\nNúmero do Pedido: *#${newOrder.orderNumber} (WhatsApp)*\nCliente: *${newOrder.customerName}*\nStatus atual: 👨‍🍳 *Em Preparo na Cozinha*\nTempo estimado de entrega: *30 a 45 minutos*\nForma de Pagamento: *${paymentMethod.toUpperCase()}*\nTotal: *R$ ${grandTotal.toFixed(2)}*\n\nO pedido já foi enviado diretamente para o visor da nossa chapa (KDS) e para o painel do caixa! Muito obrigado pela preferência e bom apetite! 💛`,
      chips: [
        { label: "📍 Como tá meu pedido?", actionText: "Como tá meu pedido?" },
        { label: "🍔 Fazer Novo Pedido", actionText: "Olá! Gostaria de fazer um novo pedido" },
      ],
      orderReceipt: {
        orderNumber: newOrder.orderNumber,
        status: "Em Preparo na Cozinha",
        total: grandTotal,
        deliveryAddress: newOrder.deliveryAddress || (settings?.address || RESTAURANT_INFO.address),
        estimatedMinutes: "30-45 min",
      },
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Tempo de digitação natural da IA (simulando atendimento humanizado no WhatsApp)
    setTimeout(async () => {
      // 1. Executa o motor semântico de catálogo e máquina de estados (carrinho, checkout, suporte, itens do Excel)
      const nluResult = processMessageNLU(text);
      const isGenericFallback = nluResult.reply.startsWith("Compreendi a sua mensagem!");

      let result: NLUResult = nluResult;

      // 2. Se a pergunta for aberta / conversacional fora dos fluxos de carrinho ou se o motor de IA puder enriquecer
      if (isGenericFallback) {
        try {
          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: text,
              apiKey: apiKey.trim(),
              cart,
              storeKnowledge: {
                storeName: settings?.storeName || RESTAURANT_INFO.name,
                address: settings?.address || RESTAURANT_INFO.address,
                phone: settings?.phone || RESTAURANT_INFO.phone,
                openingHours: settings?.openingHours || RESTAURANT_INFO.openingHours,
                isOpen: settings?.isOpen ?? RESTAURANT_INFO.isOpen,
                pixKey: settings?.pixKey || RESTAURANT_INFO.pixKey,
                neighborhoods: settings?.neighborhoods,
                products: products.map((p) => ({
                  id: p.id,
                  name: p.name,
                  category: p.category,
                  price: p.price,
                  description: p.description,
                  isAvailable: p.isAvailable,
                })),
              },
            }),
          });
          const data = await res.json();
          if (data && data.reply) {
            result = {
              reply: data.reply,
              chips: nluResult.chips,
            };
          }
        } catch {
          // Mantém o resultado do motor nativo
        }
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: result.reply,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        actionChips: result.chips,
        orderReceipt: result.orderReceipt,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const currentSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#EFEAE2] rounded-3xl max-w-xl w-full h-[640px] shadow-2xl border border-neutral-300 flex flex-col overflow-hidden animate-in zoom-in-95 my-auto">
        {/* Topo Oficial WhatsApp Verde */}
        <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white text-[#075E54] flex items-center justify-center font-bold text-lg shadow-sm">
              🍔
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black tracking-tight">
                  {settings?.storeName || RESTAURANT_INFO.name}
                </h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  IA Atendente
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Atendente Virtual • Online</span>
              </p>
            </div>
          </div>

          {/* Abas e Fechar */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "chat" ? "bg-white/20 text-white" : "text-emerald-100 hover:bg-white/10"
              }`}
            >
              Simulador
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "config" ? "bg-white/20 text-white" : "text-emerald-100 hover:bg-white/10"
              }`}
              title="Configurações de IA e Prompt (Estilo Consumer / ChatGPT / Gemini)"
            >
              <Sliders className="w-3.5 h-3.5 inline mr-1" />
              Prompt IA
            </button>
            <button
              onClick={() => setActiveTab("qrcode")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "qrcode" ? "bg-white/20 text-white" : "text-emerald-100 hover:bg-white/10"
              }`}
              title="Conectar WhatsApp Oficial"
            >
              <QrCode className="w-3.5 h-3.5 inline mr-1" />
              Conexão
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner do Carrinho Ativo se houver itens */}
        {cart.length > 0 && activeTab === "chat" && (
          <div className="bg-[#DCF8C6] border-b border-emerald-300 px-3.5 py-1.5 flex items-center justify-between text-xs text-emerald-950 font-bold shadow-2xs">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <span>
                Carrinho Ativo: {cart.reduce((a, b) => a + b.quantity, 0)} itens • R${" "}
                {currentSubtotal.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSendMessage("Pode fechar para entrega!")}
              className="bg-[#075E54] hover:bg-[#128C7E] text-white text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
            >
              <span>Fechar Pedido</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Conteúdo Aba 1: Chat Simulador em Tempo Real */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#ECE5DD] bg-opacity-95">
            {/* Mensagens do WhatsApp */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              <div className="text-center my-1">
                <span className="text-[10px] font-bold bg-white/80 text-neutral-600 px-3 py-1 rounded-full shadow-2xs">
                  🔒 Criptografia ponta a ponta • IA integrada ao KDS e PDV
                </span>
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed whitespace-pre-wrap ${
                      m.sender === "user"
                        ? "bg-[#E7FFDB] text-neutral-900 rounded-tr-xs"
                        : "bg-white text-neutral-900 rounded-tl-xs"
                    }`}
                  >
                    <p>{m.text}</p>

                    {/* Comprovante de Pedido Confirmado dentro do WhatsApp */}
                    {m.orderReceipt && (
                      <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-neutral-900 space-y-1">
                        <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5 mb-1.5">
                          <span className="font-black text-emerald-800 text-xs flex items-center gap-1">
                            <Check className="w-4 h-4 text-emerald-600" />
                            Pedido #{m.orderReceipt.orderNumber}
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                            {m.orderReceipt.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-700 flex justify-between">
                          <span>Tempo Estimado:</span>
                          <span className="font-bold">{m.orderReceipt.estimatedMinutes}</span>
                        </div>
                        <div className="text-[11px] text-neutral-700 flex justify-between">
                          <span>Entrega:</span>
                          <span className="font-bold truncate max-w-[170px]">{m.orderReceipt.deliveryAddress}</span>
                        </div>
                        <div className="text-[11px] text-neutral-900 font-black flex justify-between pt-1 border-t border-emerald-200">
                          <span>Total:</span>
                          <span className="text-emerald-700">R$ {m.orderReceipt.total.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* Pílulas de Ação Rápida (Interactive Buttons do WhatsApp) */}
                    {m.actionChips && m.actionChips.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-neutral-100 flex flex-wrap gap-1.5">
                        {m.actionChips.map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(chip.actionText)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer shadow-2xs active:scale-95 ${
                              chip.variant === "primary"
                                ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                                : chip.variant === "success"
                                ? "bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800"
                                : chip.variant === "danger"
                                ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                                : "bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-neutral-400">
                      <span>{m.time}</span>
                      {m.sender === "user" && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 bg-white text-neutral-500 px-3.5 py-2 rounded-2xl w-28 text-xs shadow-xs animate-pulse">
                  <Bot className="w-3.5 h-3.5 text-[#075E54]" />
                  <span className="text-[11px] font-bold">Digitando...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Pílulas de Atalho Rápido para Demonstração */}
            <div className="px-3 pt-2 pb-1 bg-[#F0F2F5] border-t border-neutral-200 overflow-x-auto flex gap-1.5 scrollbar-none">
              <button
                type="button"
                onClick={() => handleSendMessage("Vcs vendem sopa?")}
                className="flex-shrink-0 text-[10px] font-black bg-amber-50 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                title="Testar a inteligência do bot para itens fora do cardápio"
              >
                🍲 Vcs vendem sopa?
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Quais os hambúrgueres artesanais da casa?")}
                className="flex-shrink-0 text-[10px] font-bold bg-white text-neutral-700 px-2.5 py-1 rounded-full border border-neutral-300 hover:border-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                🍔 Burgers Artesanais
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Vcs estão atendendo ainda?")}
                className="flex-shrink-0 text-[10px] font-bold bg-white text-neutral-700 px-2.5 py-1 rounded-full border border-neutral-300 hover:border-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                🕒 Vcs estão atendendo ainda?
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Quero dois pasteis de dois queijos e uma coca de 1l")}
                className="flex-shrink-0 text-[10px] font-black bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                🥟 + 🥤 Pedir 2 Pastéis e Coca
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Vocês entregam em Ponta Negra?")}
                className="flex-shrink-0 text-[10px] font-bold bg-white text-neutral-700 px-2.5 py-1 rounded-full border border-neutral-300 hover:border-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                🛵 Entrega em Ponta Negra?
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Pode fechar para entrega!")}
                className="flex-shrink-0 text-[10px] font-bold bg-white text-neutral-700 px-2.5 py-1 rounded-full border border-neutral-300 hover:border-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                ✅ Fechar Pedido
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Como tá meu pedido?")}
                className="flex-shrink-0 text-[10px] font-bold bg-white text-neutral-700 px-2.5 py-1 rounded-full border border-neutral-300 hover:border-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                ⏱️ Status do Pedido
              </button>
            </div>

            {/* Input de Mensagem Estilo WhatsApp */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-2.5 bg-[#F0F2F5] border-t border-neutral-300 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Digite como um cliente no WhatsApp (ex: Vcs estão atendendo ainda? / Quero 2 burgers)..."
                className="flex-1 bg-white text-neutral-800 text-xs px-4 py-2.5 rounded-full border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-full bg-[#075E54] hover:bg-[#128C7E] disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm flex-shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        )}

        {/* Conteúdo Aba 2: Configurações de IA e Prompt (Estilo Consumer / ChatGPT / Gemini) */}
        {activeTab === "config" && (
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-white text-xs text-neutral-800">
            <div>
              <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Treinamento do Motor de IA do WhatsApp
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Configure como a IA do restaurante responde, anota pedidos e sincroniza com a cozinha.
              </p>
            </div>

            {/* Base de Conhecimento Dinâmica da Loja (Estudo Contínuo) */}
            <div className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-[#1F2421] flex items-center gap-1.5">
                  <span>🧠</span> Base de Conhecimento Dinâmica (Estudo da Loja)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-500 font-medium">
                    Sincronizado: {lastSyncTime}
                  </span>
                  <button
                    type="button"
                    onClick={handleReindexKnowledge}
                    disabled={isReindexing}
                    className="text-[11px] font-bold bg-[#075E54] hover:bg-[#128C7E] text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    title="Forçar a IA a re-estudar todos os dados da loja, cardápio e planilhas"
                  >
                    <RefreshCw className={`w-3 h-3 ${isReindexing ? "animate-spin" : ""}`} />
                    <span>{isReindexing ? "Estudando..." : "Re-estudar Dados Agora"}</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-neutral-500">
                A IA estuda e atualiza seu conhecimento de tempos em tempos conforme produtos, preços e configurações são alterados ou importados via Excel. Se o cliente perguntar por itens não cadastrados (ex: <em>&quot;sopa&quot;</em>), a IA reconhece o item e informa gentilmente a especialidade da casa:
              </p>
              {reindexSuccess && (
                <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Base de conhecimento re-indexada com sucesso! Todos os {products.length} itens, fretes e dados da loja sincronizados.</span>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-white p-2 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block font-bold">Cardápio</span>
                  <span className="text-xs font-black text-neutral-900">{products.length} itens ativos</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block font-bold">Entrega</span>
                  <span className="text-xs font-black text-neutral-900">{settings?.neighborhoods?.length || 6} bairros</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block font-bold">Expediente</span>
                  <span className="text-xs font-black text-emerald-700">{settings?.isOpen ? "Aberto Agora" : "Em Intervalo"}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-neutral-200">
                  <span className="text-[10px] text-neutral-400 block font-bold">Chave Pix</span>
                  <span className="text-xs font-black text-neutral-900 truncate block">{settings?.pixKey || RESTAURANT_INFO.pixKey}</span>
                </div>
              </div>

              {/* Botões de Teste Rápido no Simulador */}
              <div className="pt-2 border-t border-neutral-200 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-neutral-500">Testar no chat:</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("chat");
                    handleSendMessage("Vcs vendem sopa?");
                  }}
                  className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Testar resposta de não-disponibilidade para sopa"
                >
                  🍲 Vcs vendem sopa? (Fora)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("chat");
                    handleSendMessage("Tem pastel de queijo?");
                  }}
                  className="text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Testar resposta para item que existe no cardápio"
                >
                  🥟 Tem pastel de queijo? (Existe)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("chat");
                    handleSendMessage("Vocês entregam em Ponta Negra?");
                  }}
                  className="text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-300 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                  title="Testar cálculo de frete específico"
                >
                  🛵 Entrega em Ponta Negra?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("chat");
                    handleSendMessage("Qual o cardápio completo?");
                  }}
                  className="text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-md hover:bg-purple-100 transition-colors cursor-pointer"
                  title="Testar resumo completo do cardápio"
                >
                  📋 Cardápio Completo
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Seleção de Motor: Nativo vs Externo */}
              <div>
                <label className="font-bold block mb-1">Motor de Processamento Inteligente:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiEngine("native")}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      aiEngine === "native"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs">⚡</span>
                      <span>IA Tá na Mesa (Nativa)</span>
                    </div>
                    <p className="text-[10px] font-normal text-neutral-500">
                      Zero custo por token, resposta instantânea, treinada nos 34 produtos reais.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiEngine("external")}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      aiEngine === "external"
                        ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs">🤖</span>
                      <span>Google Gemini / ChatGPT</span>
                    </div>
                    <p className="text-[10px] font-normal text-neutral-500">
                      Suporte a chave de API externa (como no artigo da Consumer).
                    </p>
                  </button>
                </div>
              </div>

              {aiEngine === "external" && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <label className="font-bold block text-amber-900">
                    Chave de API (Google AI Studio Gemini ou OpenAI ChatGPT):
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Cole sua chave: AIzaSy... ou sk-proj-..."
                    className="w-full p-2 bg-white rounded-lg border border-amber-300 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-700">
                    Se deixado em branco, o sistema usa o motor semântico nativo integrado com taxa de acerto de 100%.
                  </p>
                </div>
              )}

              {/* Tom de Voz */}
              <div>
                <label className="font-bold block mb-1">Tom de Voz da IA:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBotTone("amigavel")}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      botTone === "amigavel"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600"
                    }`}
                  >
                    😊 Amigável & Empático
                  </button>
                  <button
                    type="button"
                    onClick={() => setBotTone("vendedor")}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      botTone === "vendedor"
                        ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600"
                    }`}
                  >
                    🚀 Vendedor & Sugestivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setBotTone("formal")}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      botTone === "formal"
                        ? "bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600"
                    }`}
                  >
                    👔 Rápido & Direto
                  </button>
                </div>
              </div>

              {/* Upselling Checkbox */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-200 cursor-pointer">
                <div>
                  <span className="font-bold text-neutral-800 block">
                    Sempre oferecer Bebida ou Sobremesa (Upselling)
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    O bot sugere automaticamente refrigerante de 1L ou pastel doce de Nutella ao montar o pedido.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={alwaysOfferDessert}
                  onChange={(e) => setAlwaysOfferDessert(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                />
              </label>

              {/* Instruções do Prompt */}
              <div>
                <label className="font-bold block mb-1">System Prompt (Instruções da Loja):</label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Base de Conhecimento Treinada */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Base de Conhecimento Ativa:</span>
                  <span className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full text-[10px]">
                    Sincronizado
                  </span>
                </div>
                <p>
                  • <strong>{products.length} itens do cardápio</strong> indexados (Pastéis, Hot Dogs, Smashes, Bebidas).
                </p>
                <p>• <strong>Taxas de entrega</strong> configuradas para bairros e regiões de Natal/RN.</p>
                <p>• <strong>Chave Pix:</strong> {settings?.pixKey || RESTAURANT_INFO.pixKey} ({settings?.storeName || RESTAURANT_INFO.name} / A2i Solutions).</p>
                <p>• <strong>Roteamento KDS:</strong> Pedidos criados caem direto na tela de chapa e PDV.</p>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Aba 3: Conexão Oficial WhatsApp */}
        {activeTab === "qrcode" && (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-white text-xs">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-[#075E54] flex items-center justify-center text-3xl mb-3 shadow-xs">
              📲
            </div>
            <h3 className="text-base font-black text-neutral-900 mb-1">
              Conexão com WhatsApp Oficial (Business API)
            </h3>
            <p className="text-neutral-500 max-w-sm mb-4">
              Escaneie este QR Code com o WhatsApp Business do restaurante para ativar as respostas automáticas e fechamento de pedidos no número da loja.
            </p>

            <div className="p-3 bg-white border-2 border-neutral-300 rounded-2xl shadow-sm mb-4">
              <QrCode className="w-36 h-36 text-neutral-800" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Webhook Conectado: /api/integrations/webhook
              </span>
              <p className="text-[10px] text-neutral-400">
                Compatível com Z-API, Evolution API, Baileys e Meta Cloud API.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
