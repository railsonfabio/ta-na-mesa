"use client";

import React, { useState } from "react";
import {
  RESTAURANT_INFO,
  CATEGORIES,
  PRODUCTS,
} from "../lib/mock-data";
import { ProductItem, CartItem, Table, Order } from "../lib/types";
import {
  Utensils,
  Bike,
  Bell,
  Receipt,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Tag,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  QrCode,
  Search,
  MapPin,
  Loader2,
  ChefHat,
  Copy,
  Check,
} from "lucide-react";
import { ProductDetailModal } from "./ProductDetailModal";
import { ProductImageModal } from "./ProductImageModal";
import { BillSplitModal } from "./BillSplitModal";
import { StoreSettings, DeliverySetting } from "../lib/server-db";
import { generatePixBrCode } from "../lib/pix-brcode";
import { subscribeToCustomerOrderRealtime } from "../lib/store";

interface CustomerViewProps {
  mode: "mesa" | "delivery";
  table: Table;
  orders?: Order[];
  customerName?: string;
  customerPhone?: string;
  products?: ProductItem[];
  settings?: StoreSettings;
  reorderItems?: CartItem[] | null;
  onClearReorder?: () => void;
  onCallWaiter: (tableNumber: number, reason: string) => void;
  onPlaceOrder: (order: Partial<Order>) => void;
  onAddSubcomanda: (tableNumber: number, name: string) => void;
  onRegisterPayment?: (
    tableNumber: number,
    comandaId: string | undefined,
    amount: number,
    method: string
  ) => void;
  isAloReferral?: boolean;
}

const DEFAULT_NEIGHBORHOODS: DeliverySetting[] = [
  { neighborhood: "Ponta Negra", fee: 5.0, estimatedMinutes: "25-40 min", active: true },
  { neighborhood: "Capim Macio", fee: 7.0, estimatedMinutes: "30-45 min", active: true },
  { neighborhood: "Neópolis / Pirangi", fee: 8.0, estimatedMinutes: "35-50 min", active: true },
  { neighborhood: "Candelária", fee: 10.0, estimatedMinutes: "40-55 min", active: true },
  { neighborhood: "Lagoa Nova", fee: 10.0, estimatedMinutes: "45-60 min", active: true },
  { neighborhood: "Tirol / Petrópolis", fee: 12.0, estimatedMinutes: "45-60 min", active: true },
  { neighborhood: "Retirada no Balcão (Takeaway)", fee: 0.0, estimatedMinutes: "20-30 min", active: true },
];

export function CustomerView({
  mode,
  table,
  orders = [],
  customerName,
  customerPhone,
  products = PRODUCTS,
  settings,
  reorderItems,
  onClearReorder,
  onCallWaiter,
  onPlaceOrder,
  onAddSubcomanda,
  onRegisterPayment,
  isAloReferral,
}: CustomerViewProps) {
  const [selectedCategory, setSelectedCategory] = useState("destaques");
  const [activeCategory, setActiveCategory] = useState("destaques");
  const [searchQuery, setSearchQuery] = useState("");
  const categoryNavRef = React.useRef<HTMLDivElement>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [activeComandaId, setActiveComandaId] = useState<string>(
    table.comandas[0]?.id || ""
  );

  // States for new comanda
  const [isAddingComanda, setIsAddingComanda] = useState(false);
  const [newComandaName, setNewComandaName] = useState("");

  // Neighborhoods and delivery settings
  const availableNeighborhoods: DeliverySetting[] =
    settings?.neighborhoods && settings.neighborhoods.length > 0
      ? settings.neighborhoods.filter((n) => n.active)
      : DEFAULT_NEIGHBORHOODS;

  const [selectedNeighborhood, setSelectedNeighborhood] = useState(
    availableNeighborhoods[0]?.neighborhood || "Ponta Negra"
  );

  // Campos estruturados de Endereço do Cliente (NUNCA pré-definidos com o endereço da loja)
  const [customerCep, setCustomerCep] = useState("");
  const [customerStreet, setCustomerStreet] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerComplement, setCustomerComplement] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Carrega o endereço salvo do próprio cliente (se ele já tiver preenchido antes neste aparelho)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedAddr = localStorage.getItem("tanamesa_customer_delivery_address_v1");
        if (savedAddr) {
          const parsed = JSON.parse(savedAddr);
          if (parsed.cep) setCustomerCep(parsed.cep);
          if (parsed.street) setCustomerStreet(parsed.street);
          if (parsed.number) setCustomerNumber(parsed.number);
          if (parsed.complement) setCustomerComplement(parsed.complement);
          if (parsed.neighborhood) setSelectedNeighborhood(parsed.neighborhood);
        }
      } catch {}
    }
  }, []);

  // Rastreamento dos pedidos feitos por este cliente + Notificações de avanço de etapa
  const [trackedOrderNumbers, setTrackedOrderNumbers] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tanamesa_tracked_orders_v1");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [dismissedOrderIds, setDismissedOrderIds] = useState<string[]>([]);
  const [statusUpdateBanner, setStatusUpdateBanner] = useState<string | null>(null);
  const [liveTrackedOrdersMap, setLiveTrackedOrdersMap] = useState<Record<string, Order>>({});
  const prevOrderStatusesRef = React.useRef<Record<string, Order["status"]>>({});

  const playCustomerStatusChime = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.14); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.28); // G5
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.65);
    } catch {}
  };

  // Identifica os pedidos pertencentes a este cliente (por número rastreado, WhatsApp logado, nome logado ou mesa atual)
  // e mescla em tempo real com os eventos WebSocket recebidos pelo Rastreador Seguro (Bloco 4)
  const myActiveOrders = React.useMemo(() => {
    const cleanMyPhone = (customerPhone || "").replace(/\D/g, "");
    const baseFiltered = orders.filter((o) => {
      if (dismissedOrderIds.includes(o.id)) return false;
      const isTracked = trackedOrderNumbers.includes(o.orderNumber);
      const isMyPhone =
        cleanMyPhone.length >= 8 &&
        (o.customerPhone || "").replace(/\D/g, "").endsWith(cleanMyPhone.slice(-8));
      const isMyName =
        customerName &&
        customerName !== "Cliente" &&
        o.customerName.toLowerCase() === customerName.toLowerCase();
      const isMyTable = mode === "mesa" && o.type === "mesa" && o.tableNumber === table.number;

      if (mode === "delivery") {
        return o.type === "delivery" && (isTracked || isMyPhone || isMyName);
      }
      return isMyTable || isTracked || isMyPhone;
    });

    return baseFiltered.map((ord) => {
      const liveByOrderNumber = Object.values(liveTrackedOrdersMap).find(
        (lo) => lo.id === ord.id || lo.orderNumber === ord.orderNumber
      );
      return liveByOrderNumber ? { ...ord, ...liveByOrderNumber } : ord;
    });
  }, [
    orders,
    trackedOrderNumbers,
    customerName,
    customerPhone,
    mode,
    table.number,
    dismissedOrderIds,
    liveTrackedOrdersMap,
  ]);

  // Bloco 4: Inscreve o Rastreador ao Vivo nos canais WebSocket de cada pedido ativo do cliente
  // utilizando a política RLS `orders_customer_track_select` (`id` + `customer_phone`)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const cleanPhone = (customerPhone || "").replace(/\D/g, "");
    let uuidMap: Record<string, string> = {};
    try {
      const rawMap = localStorage.getItem("tanamesa_tracked_order_uuids_v1");
      if (rawMap) uuidMap = JSON.parse(rawMap);
    } catch {}

    const unsubscribers: Array<() => void> = [];

    myActiveOrders.forEach((ord) => {
      const targetOrderId = uuidMap[String(ord.orderNumber)] || ord.id;
      const targetPhone = cleanPhone || (ord.customerPhone || "").replace(/\D/g, "");

      if (targetOrderId && targetPhone) {
        const unsub = subscribeToCustomerOrderRealtime(
          targetOrderId,
          targetPhone,
          (updatedCloudOrder) => {
            setLiveTrackedOrdersMap((prev) => ({
              ...prev,
              [updatedCloudOrder.id]: updatedCloudOrder,
            }));
          }
        );
        unsubscribers.push(unsub);
      }
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [trackedOrderNumbers, customerPhone, orders.length]);

  // Detecta avanço de status nos pedidos do cliente e dispara notificação visual + sonora
  React.useEffect(() => {
    let latestBanner: string | null = null;
    myActiveOrders.forEach((ord) => {
      const prev = prevOrderStatusesRef.current[ord.id];
      if (prev && prev !== ord.status) {
        if (ord.status === "em_preparo") {
          latestBanner = `👨‍🍳 Seu Pedido #${ord.orderNumber} foi ACEITO pelo restaurante e já está em preparo na cozinha!`;
        } else if (ord.status === "a_caminho") {
          latestBanner =
            ord.type === "mesa"
              ? `🍽️ Oba! Seu Pedido #${ord.orderNumber} ficou pronto e está indo para sua Mesa ${ord.tableNumber}!`
              : `🛵 Oba! Seu Pedido #${ord.orderNumber} ficou pronto e acabou de SAIR PARA ENTREGA!`;
        } else if (ord.status === "entregue") {
          latestBanner =
            ord.type === "mesa"
              ? `✅ Pedido #${ord.orderNumber} servido na Mesa ${ord.tableNumber}! Bom apetite!`
              : `✅ Pedido #${ord.orderNumber} entregue no seu endereço! Bom apetite!`;
        }
      }
      prevOrderStatusesRef.current[ord.id] = ord.status;
    });

    if (latestBanner) {
      playCustomerStatusChime();
      setStatusUpdateBanner(latestBanner);
      const timer = setTimeout(() => setStatusUpdateBanner(null), 9000);
      return () => clearTimeout(timer);
    }
  }, [myActiveOrders]);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(
    availableNeighborhoods[0]?.fee || 5.0
  );
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [customizingProduct, setCustomizingProduct] = useState<ProductItem | null>(null);
  const [productForImageModal, setProductForImageModal] = useState<ProductItem | null>(null);

  // Split bill states
  const [splitMode, setSplitMode] = useState<"igual" | "flexivel">("igual");
  const [splitPeopleCount, setSplitPeopleCount] = useState(2);

  const [pixCopied, setPixCopied] = useState(false);

  // Auto-aplicação de cupom e benefício caso venha do Alô Classificados (Respeitando pedido mínimo e teto de subsídio do lojista)
  const aloMinOrder = settings?.aloPartnerMinOrder ?? 35;
  const aloMaxSubsidy = settings?.aloPartnerMaxSubsidy ?? 8;

  React.useEffect(() => {
    if (isAloReferral && mode === "delivery") {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (subtotal >= aloMinOrder) {
        const coveredFee = Math.min(deliveryFee, aloMaxSubsidy);
        setCouponApplied(true);
        setCouponCode("PARCERIA_ALO");
        setCouponDiscount(coveredFee);
      } else {
        setCouponApplied(false);
        setCouponDiscount(0);
      }
    }
  }, [isAloReferral, mode, deliveryFee, cart, aloMinOrder, aloMaxSubsidy]);

  // Scrollspy: detecta a categoria visível ao rolar a página
  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    setSelectedCategory(catId);
    const element = document.getElementById(`cat-section-${catId}`);
    if (element) {
      const yOffset = -120;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (const cat of CATEGORIES) {
        const section = document.getElementById(`cat-section-${cat.id}`);
        if (section) {
          const top = section.offsetTop;
          const height = section.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveCategory(cat.id);
            const tabBtn = document.getElementById(`cat-tab-${cat.id}`);
            if (tabBtn && categoryNavRef.current) {
              tabBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Escuta itens de recompra (1-clique) enviados pelo OrderHistoryModal
  React.useEffect(() => {
    if (reorderItems && reorderItems.length > 0) {
      setCart((prev) => [...prev, ...reorderItems]);
      setIsCartOpen(true);
      if (onClearReorder) onClearReorder();
    }
  }, [reorderItems, onClearReorder]);

  const activeComanda = table.comandas.find((c) => c.id === activeComandaId) || table.comandas[0];
  const totalTableConsumption = table.comandas.reduce((sum, c) => sum + c.total, 0);

  // Filter products by category using dynamic products list
  const filteredProducts =
    selectedCategory === "destaques"
      ? products.filter((p) => p.popular)
      : products.filter((p) => p.category === selectedCategory);

  // Formas de Pagamento Delivery
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState<"pix" | "cartao" | "dinheiro">("pix");
  const [changeForAmount, setChangeForAmount] = useState<string>("");

  const handleConfirmCustomization = (
    product: ProductItem,
    quantity: number,
    selectedSubstitution?: string,
    removals?: string[],
    notes?: string,
    unitPriceWithExtras?: number,
    extrasDetails?: string[]
  ) => {
    const noteParts: string[] = [];
    if (selectedSubstitution) noteParts.push(selectedSubstitution);
    if (extrasDetails && extrasDetails.length > 0) noteParts.push(`Extras: ${extrasDetails.join(", ")}`);
    if (removals && removals.length > 0) noteParts.push(`Tirar: ${removals.join(", ")}`);
    if (notes) noteParts.push(`Obs: ${notes}`);
    const combinedNotes = noteParts.join(" | ");

    const finalPrice = unitPriceWithExtras !== undefined ? unitPriceWithExtras : product.price;

    setCart([
      ...cart,
      {
        id: `cart-${Date.now()}-${Math.random()}`,
        productId: product.id,
        name: product.name,
        price: finalPrice,
        quantity,
        optionsSelected: [
          ...(selectedSubstitution ? [selectedSubstitution] : []),
          ...(extrasDetails || []),
          ...(removals || []),
        ],
        notes: combinedNotes || undefined,
        assignedToComandaId: activeComanda?.id,
      },
    ]);
    setCustomizingProduct(null);
  };

  const addToCart = (product: ProductItem) => {
    setCustomizingProduct(product);
  };

  const handleQuickAddDrink = (drink: ProductItem) => {
    setCart((prev) => [
      ...prev,
      {
        id: `cart-${Date.now()}-${Math.random()}`,
        productId: drink.id,
        name: drink.name,
        price: drink.price,
        quantity: 1,
        optionsSelected: [],
        assignedToComandaId: activeComanda?.id,
      },
    ]);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.id === cartItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    setCart(updated);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleNeighborhoodChange = (neighborhoodName: string) => {
    setSelectedNeighborhood(neighborhoodName);
    const found = availableNeighborhoods.find((n) => n.neighborhood === neighborhoodName);
    if (found) {
      setDeliveryFee(found.fee);
      // Recalcula desconto de cupom respeitando rigorosamente o teto máximo de subsídio de frete (ex: R$ 8,00)
      if (couponApplied) {
        const cleanCode = couponCode.trim().toUpperCase();
        const storeCoupon = settings?.coupons?.find(
          (c) => c.code.toUpperCase() === cleanCode && c.active
        );
        if (storeCoupon?.freeDelivery) {
          const maxSub = storeCoupon.maxDeliverySubsidy ?? aloMaxSubsidy;
          setCouponDiscount(Math.min(found.fee, maxSub));
        } else if (
          isAloReferral ||
          cleanCode === "PARCERIA_ALO" ||
          cleanCode === "FRETEALO" ||
          cleanCode === "REDINHAGRATIS"
        ) {
          setCouponDiscount(cartTotal >= aloMinOrder ? Math.min(found.fee, aloMaxSubsidy) : 0);
        }
      }
    }
  };

  // Busca automática de endereço via CEP (ViaCEP + Mapeamento de Bairros e Taxas de Natal/RN)
  const matchNeighborhoodFromBairro = (bairroRaw: string) => {
    const cleanB = bairroRaw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const matched = availableNeighborhoods.find((nb) => {
      const nbClean = nb.neighborhood
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return (
        nbClean.includes(cleanB) ||
        cleanB.includes(nbClean.split("/")[0].trim()) ||
        (nbClean.includes("pirangi") && cleanB.includes("pirangi")) ||
        (nbClean.includes("petropolis") && (cleanB.includes("petropolis") || cleanB.includes("tirol")))
      );
    });
    if (matched) {
      handleNeighborhoodChange(matched.neighborhood);
      return matched;
    }
    return null;
  };

  const handleCepChange = async (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setCustomerCep(formatted);
    setCepFeedback(null);

    if (digits.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (data && !data.erro) {
          if (data.logradouro) setCustomerStreet(data.logradouro);
          const matchedNb = data.bairro ? matchNeighborhoodFromBairro(data.bairro) : null;
          setCepFeedback({
            type: "ok",
            msg: `✓ ${data.logradouro || "CEP localizado"}${data.bairro ? ` (${data.bairro})` : ""}${
              matchedNb ? ` • Taxa: R$ ${matchedNb.fee.toFixed(2)}` : ""
            }`,
          });
        } else {
          setCepFeedback({
            type: "err",
            msg: "CEP não encontrado automaticamente. Preencha sua rua e número abaixo.",
          });
        }
      } catch {
        setCepFeedback({
          type: "err",
          msg: "Não foi possível consultar o CEP agora. Preencha sua rua e número abaixo.",
        });
      } finally {
        setCepLoading(false);
      }
    }
  };

  const applyCoupon = () => {
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    // 1. Verifica cupons ativos cadastrados pelo estabelecimento (com Trava de Pedido Mínimo e Teto de Subsídio)
    const storeCoupon = settings?.coupons?.find(
      (c) => c.code.toUpperCase() === clean && c.active
    );

    if (storeCoupon) {
      if (storeCoupon.minOrderValue && cartTotal < storeCoupon.minOrderValue) {
        const missing = storeCoupon.minOrderValue - cartTotal;
        alert(
          `⚠️ Este cupom exige um pedido mínimo de R$ ${storeCoupon.minOrderValue.toFixed(
            2
          )} em produtos.\n\nAdicione mais R$ ${missing.toFixed(2)} ao carrinho para ativar o benefício!`
        );
        return;
      }

      if (storeCoupon.freeDelivery) {
        const maxSub = storeCoupon.maxDeliverySubsidy ?? 8;
        const discount = Math.min(deliveryFee, maxSub);
        setCouponApplied(true);
        setCouponDiscount(discount);
        if (deliveryFee > maxSub) {
          alert(
            `🎉 Cupom "${storeCoupon.code}" aplicado! Abatimento de R$ ${discount.toFixed(
              2
            )} na taxa de entrega (diferença restante: R$ ${(deliveryFee - discount).toFixed(2)}).`
          );
        } else {
          alert(`🎉 Cupom "${storeCoupon.code}" aplicado! Frete Grátis ativado.`);
        }
        return;
      } else if (storeCoupon.discountFixed) {
        const discount = Math.min(cartTotal, storeCoupon.discountFixed);
        setCouponApplied(true);
        setCouponDiscount(discount);
        alert(
          `🎉 Cupom "${storeCoupon.code}" aplicado! Desconto fixo de R$ ${discount.toFixed(2)}.`
        );
        return;
      } else if (storeCoupon.discountPercent) {
        const discount = (cartTotal * storeCoupon.discountPercent) / 100;
        setCouponApplied(true);
        setCouponDiscount(discount);
        alert(
          `🎉 Cupom "${storeCoupon.code}" aplicado! Desconto de ${
            storeCoupon.discountPercent
          }% (R$ ${discount.toFixed(2)}).`
        );
        return;
      }
    }

    // 2. Cupons exclusivos de campanha de parceria (respeitando pedido mínimo e teto configurados pelo lojista)
    if (clean === "FRETEALO" || clean === "REDINHAGRATIS" || clean === "PARCERIA_ALO") {
      if (cartTotal < aloMinOrder) {
        alert(
          `⚠️ O benefício de entrega da Parceria Alô Classificados exige pedido mínimo de R$ ${aloMinOrder.toFixed(
            2
          )} em produtos (faltam R$ ${(aloMinOrder - cartTotal).toFixed(2)}).`
        );
        return;
      }
      const discount = Math.min(deliveryFee, aloMaxSubsidy);
      setCouponApplied(true);
      setCouponDiscount(discount);
      alert(
        `🎉 Benefício Alô Classificados aplicado! Desconto de R$ ${discount.toFixed(2)} na entrega.`
      );
    } else {
      alert("⚠️ Código promocional inválido, inativo ou expirado para este estabelecimento.");
    }
  };

  const finalDeliveryTotal = Math.max(0, cartTotal + deliveryFee - couponDiscount);
  const isBelowMinimum =
    mode === "delivery" &&
    settings?.minOrderValue !== undefined &&
    settings.minOrderValue > 0 &&
    cartTotal < settings.minOrderValue;
  const isStoreClosed = settings !== undefined && !settings.isOpen;

  const isPickupSelected =
    mode === "delivery" &&
    (selectedNeighborhood.toLowerCase().includes("retirada") ||
      selectedNeighborhood.toLowerCase().includes("balcão"));

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (isStoreClosed) {
      alert("🔴 O restaurante está fechado para pedidos no momento. Tente novamente mais tarde!");
      return;
    }

    if (isBelowMinimum && settings?.minOrderValue) {
      alert(
        `⚠️ O pedido mínimo é de R$ ${settings.minOrderValue.toFixed(2)}. Faltam R$ ${(
          settings.minOrderValue - cartTotal
        ).toFixed(2)} para completar o pedido.`
      );
      return;
    }

    if (mode === "delivery" && !isPickupSelected) {
      if (!customerStreet.trim() || !customerNumber.trim()) {
        alert(
          "📍 Por favor, informe seu CEP (ou o nome da sua Rua) e o Número da residência para a entrega!"
        );
        return;
      }
    }

    const itemsToSubmit = isTakeaway
      ? cart.map((i) => ({ ...i, notes: i.notes ? `${i.notes} (Para Viagem)` : "Para Viagem" }))
      : cart;

    const paymentInfo =
      mode === "delivery"
        ? deliveryPaymentMethod === "pix"
          ? "Pagamento: Pix"
          : deliveryPaymentMethod === "cartao"
          ? "Pagamento: Cartão (Levar Maquininha)"
          : `Pagamento: Dinheiro (${changeForAmount ? `Troco p/ ${changeForAmount}` : "Sem troco"})`
        : undefined;

    if (mode === "delivery" && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "tanamesa_customer_delivery_address_v1",
          JSON.stringify({
            cep: customerCep,
            street: customerStreet,
            number: customerNumber,
            complement: customerComplement,
            neighborhood: selectedNeighborhood,
          })
        );
      } catch {}
    }

    const formattedCustomerAddress = isPickupSelected
      ? "Retirada no Balcão pelo Cliente"
      : `${customerStreet.trim()}, Nº ${customerNumber.trim()}${
          customerComplement.trim() ? ` (${customerComplement.trim()})` : ""
        } - ${selectedNeighborhood}${customerCep ? ` [CEP: ${customerCep}]` : ""}`;

    const nextExpectedOrderNum = Math.max(...orders.map((o) => o.orderNumber || 0), 100) + 1;
    const updatedTracked = Array.from(new Set([nextExpectedOrderNum, ...trackedOrderNumbers]));
    setTrackedOrderNumbers(updatedTracked);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tanamesa_tracked_orders_v1", JSON.stringify(updatedTracked));
      } catch {}
    }

    onPlaceOrder({
      type: mode,
      channel: mode === "delivery" ? "site_proprio" : undefined,
      tableNumber: mode === "mesa" ? table.number : undefined,
      comandaName: mode === "mesa" ? activeComanda?.customerName : undefined,
      customerName:
        mode === "mesa"
          ? activeComanda?.customerName
          : customerName || "Cliente Delivery",
      items: itemsToSubmit,
      subtotal: cartTotal,
      deliveryFee: mode === "delivery" ? deliveryFee : 0,
      discount: mode === "delivery" ? couponDiscount : 0,
      total: mode === "delivery" ? finalDeliveryTotal : cartTotal,
      deliveryAddress:
        mode === "delivery"
          ? `${formattedCustomerAddress} ${paymentInfo ? `• [${paymentInfo}]` : ""}`
          : undefined,
      deliveryNeighborhood: mode === "delivery" ? selectedNeighborhood : undefined,
      paymentMethod: mode === "delivery" ? deliveryPaymentMethod : undefined,
      pixTxid:
        mode === "delivery" && deliveryPaymentMethod === "pix"
          ? `PEDIDO${nextExpectedOrderNum}`
          : undefined,
    });

    setCart([]);
    setIsTakeaway(false);
    setIsCartOpen(false);
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponCode("");
    setStatusUpdateBanner(
      `⏳ Pedido #${nextExpectedOrderNum} enviado ao restaurante! Aguarde o aceite do caixa (PDV) e acompanhe cada etapa ao vivo no topo da tela.`
    );
  };

  const handleCreateSubcomanda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComandaName.trim()) return;
    onAddSubcomanda(table.number, newComandaName.trim());
    setNewComandaName("");
    setIsAddingComanda(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      {/* Banner de Identificação do Restaurante */}
      <div className="bg-white border-b border-[#EFE9DF] shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Logo Oficial do Restaurante Cliente */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-xs border border-[#EFE9DF] overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                <img
                  src={settings?.logoUrl || RESTAURANT_INFO.logoUrl || "/hotdogecia_logo.png"}
                  alt={settings?.storeName || RESTAURANT_INFO.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1F2421] tracking-tight">
                    {settings?.storeName || RESTAURANT_INFO.name}
                  </h1>
                  {isStoreClosed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Fechado agora
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Aberto agora
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  ⭐ {RESTAURANT_INFO.rating} ({RESTAURANT_INFO.reviewsCount} avaliações) • {settings?.address || RESTAURANT_INFO.address}
                </p>
              </div>
            </div>

            {/* Informações de Tempo e Canal */}
            <div className="flex items-center gap-2 text-xs font-medium bg-[#F9F6F0] p-2 rounded-xl border border-[#EFE9DF]">
              {mode === "mesa" ? (
                <div className="flex items-center gap-2 text-[#C83E2B] font-bold">
                  <Utensils className="w-4 h-4" />
                  <span>Você está no Salão: Mesa {table.number}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-neutral-700 font-bold">
                  <Bike className="w-4 h-4 text-[#C83E2B]" />
                  <span>Tempo de Entrega: {RESTAURANT_INFO.deliveryTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Destaque Salão: Barra de Múltiplas Comandas na Mesma Mesa Física */}
          {mode === "mesa" && (
            <div className="mt-5 pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                  <Users className="w-4 h-4 text-[#C83E2B]" />
                  <span>Comandas Abertas na Mesa {table.number}:</span>
                </div>
                <div className="text-xs text-neutral-500 font-medium">
                  Total da Mesa: <strong className="text-[#C83E2B]">R$ {totalTableConsumption.toFixed(2)}</strong>
                </div>
              </div>

              {/* Lista de Subcomandas */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {table.comandas.map((comanda) => {
                  const isCurrent = comanda.id === activeComanda?.id;
                  return (
                    <button
                      key={comanda.id}
                      onClick={() => setActiveComandaId(comanda.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer border ${
                        isCurrent
                          ? "bg-[#C83E2B] text-white border-[#C83E2B] shadow-xs"
                          : "bg-white text-neutral-700 border-[#EFE9DF] hover:bg-neutral-50"
                      }`}
                    >
                      <span>👤 {comanda.customerName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isCurrent
                            ? "bg-white/20 text-white"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        R$ {comanda.total.toFixed(2)}
                      </span>
                      {comanda.isConnectedViaPhone && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Celular conectado" />
                      )}
                    </button>
                  );
                })}

                {/* Botão de abrir nova comanda (para novo casal / amigos chegando) */}
                {isAddingComanda ? (
                  <form onSubmit={handleCreateSubcomanda} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Nome do cliente/casal..."
                      value={newComandaName}
                      onChange={(e) => setNewComandaName(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-[#C83E2B] bg-white outline-none w-36"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-[#C83E2B] text-white text-xs px-2.5 py-1.5 rounded-lg font-bold"
                    >
                      Abrir
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingComanda(false)}
                      className="text-neutral-400 text-xs px-1 hover:text-neutral-600"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingComanda(true)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-[#C83E2B] bg-[#FDF2F0] border border-[#FADCD7] hover:bg-[#FCEAE7] transition-all flex-shrink-0 cursor-pointer"
                    title="Ex: Um novo casal de amigos ou seu filho chegou para sentar na mesma mesa"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Nova Comanda</span>
                  </button>
                )}
              </div>

              {/* Botões Rápidos de Atendimento de Mesa */}
              <div className="flex items-center gap-2 mt-3 text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => onCallWaiter(table.number, "Atendimento na mesa")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#EFE9DF] text-neutral-700 hover:border-[#C83E2B] hover:text-[#C83E2B] transition-colors cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-[#C83E2B]" />
                  <span>Chamar Garçom</span>
                </button>
                <button
                  onClick={() => onCallWaiter(table.number, "Mais gelo e copos")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#EFE9DF] text-neutral-700 hover:border-[#C83E2B] hover:text-[#C83E2B] transition-colors cursor-pointer"
                >
                  <span>🧊 Pedir Gelo/Copos</span>
                </button>
                <button
                  onClick={() => setIsSplitModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF6EC] border border-[#FBD9B0] text-[#D97706] hover:bg-[#FDEEDC] transition-colors cursor-pointer ml-auto"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Conferir & Dividir Conta</span>
                </button>
              </div>
            </div>
          )}

          {/* Destaque Delivery: Parceria Alô Classificados (Aparece apenas quando veio pelo link de parceria do Alô) */}
          {mode === "delivery" && isAloReferral && (
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow-xs text-base">
                  ✨
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-950">
                      Parceria Alô Classificados Ativada!
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                      Frete Grátis Aplicado
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {cartTotal >= aloMinOrder ? (
                      <>
                        Benefício ativo! Abatimento de{" "}
                        <strong>R$ {Math.min(deliveryFee, aloMaxSubsidy).toFixed(2)}</strong> na sua entrega!
                      </>
                    ) : (
                      <>
                        Adicione <strong>R$ {aloMinOrder.toFixed(2)}</strong> em produtos para destravar até{" "}
                        <strong>R$ {aloMaxSubsidy.toFixed(2)} OFF</strong> na taxa de entrega!
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-emerald-900 bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                  Cupom: FRETEGRATIS ✓
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navegação de Categorias + Barra de Busca Rápida Sticky (Estilo InstaDelivery & App do Garçom) */}
      <div className="sticky top-16 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#EFE9DF] shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 pt-2.5 pb-1.5">
          {/* Barra de Busca Instantânea de Produtos */}
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar lanche, pastel, bebida ou ingrediente no cardápio..."
              className="w-full pl-9 pr-9 py-2 rounded-2xl border border-[#EFE9DF] bg-white text-xs font-semibold text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-[#C83E2B] focus:ring-2 focus:ring-[#C83E2B]/15 shadow-2xs"
            />
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 p-0.5 rounded-full hover:bg-neutral-100 cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (categoryNavRef.current) {
                  categoryNavRef.current.scrollBy({ left: -240, behavior: "smooth" });
                }
              }}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-[#EFE9DF] hover:border-[#C83E2B] hover:text-[#C83E2B] text-neutral-600 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="Rolar categorias para a esquerda"
              aria-label="Rolar categorias para a esquerda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              ref={categoryNavRef}
              onWheel={(e) => {
                if (categoryNavRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  categoryNavRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="overflow-x-auto flex items-center gap-2 pb-1.5 scroll-smooth flex-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-neutral-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 hover:[&::-webkit-scrollbar-thumb]:bg-[#C83E2B]/60 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id && !searchQuery.trim();
                return (
                  <button
                    key={cat.id}
                    id={`cat-tab-${cat.id}`}
                    onClick={() => {
                      setSearchQuery("");
                      scrollToCategory(cat.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#C83E2B] text-white shadow-xs scale-102"
                        : "bg-white text-neutral-600 border border-[#EFE9DF] hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                if (categoryNavRef.current) {
                  categoryNavRef.current.scrollBy({ left: 240, behavior: "smooth" });
                }
              }}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-[#EFE9DF] hover:border-[#C83E2B] hover:text-[#C83E2B] text-neutral-600 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="Rolar categorias para a direita"
              aria-label="Rolar categorias para a direita"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Notificação de Avanço do Pedido em Tempo Real */}
      {statusUpdateBanner && (
        <div className="max-w-4xl mx-auto px-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-[#1F2421] text-white p-4 rounded-2xl shadow-lg border border-emerald-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
              <span>{statusUpdateBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusUpdateBanner(null)}
              className="text-neutral-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Painel de Acompanhamento ao Vivo do Pedido do Cliente (Order Tracker 4 Etapas) */}
      {myActiveOrders.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pt-4 space-y-3">
          {myActiveOrders.slice(0, 2).map((ord) => {
            const stepIdx =
              ord.status === "pendente"
                ? 1
                : ord.status === "em_preparo"
                ? 2
                : ord.status === "a_caminho"
                ? 3
                : ord.status === "entregue"
                ? 4
                : 0;

            if (stepIdx === 0) return null;

            return (
              <div
                key={ord.id}
                className="bg-white rounded-2xl p-4 border-2 border-[#C83E2B]/30 shadow-xs transition-all"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#1F2421] bg-[#FDF2F0] px-2.5 py-1 rounded-lg border border-[#FADCD7]">
                      Pedido #{ord.orderNumber}
                    </span>
                    <span className="text-xs font-extrabold text-[#C83E2B]">
                      {stepIdx === 1 && "⏳ Aguardando Confirmação do Restaurante (PDV)"}
                      {stepIdx === 2 && "👨‍🍳 Pedido Aceito • Em Preparo na Cozinha"}
                      {stepIdx === 3 &&
                        (ord.type === "mesa"
                          ? `🍽️ Pedido Pronto • Indo para sua Mesa ${ord.tableNumber}`
                          : "🛵 Pedido Pronto • Saiu para Entrega!")}
                      {stepIdx === 4 &&
                        (ord.type === "mesa"
                          ? `✅ Pedido Servido na Mesa ${ord.tableNumber} (Concluído)`
                          : "✅ Pedido Entregue no seu Endereço (Concluído)")}
                    </span>
                  </div>

                  {stepIdx === 4 && (
                    <button
                      type="button"
                      onClick={() => setDismissedOrderIds((prev) => [...prev, ord.id])}
                      className="text-[11px] font-bold text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      Ocultar ✕
                    </button>
                  )}
                </div>

                {/* Linha do Tempo Visual de 4 Etapas */}
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {[
                    { s: 1, title: "1. Recebido", sub: "No Caixa" },
                    { s: 2, title: "2. Aceito", sub: "Na Cozinha" },
                    {
                      s: 3,
                      title: ord.type === "mesa" ? "3. Pronto" : "3. Saiu",
                      sub: ord.type === "mesa" ? "Indo p/ Mesa" : "Em Rota",
                    },
                    { s: 4, title: "4. Entregue", sub: "Finalizado" },
                  ].map((st) => {
                    const reached = stepIdx >= st.s;
                    const isCurrent = stepIdx === st.s && stepIdx < 4;
                    return (
                      <div
                        key={st.s}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          reached
                            ? stepIdx === 4
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                              : isCurrent
                              ? "bg-[#FDF2F0] border-[#C83E2B] text-[#C83E2B] shadow-2xs"
                              : "bg-amber-50/70 border-amber-200 text-amber-900"
                            : "bg-neutral-50 border-neutral-200 text-neutral-400"
                        }`}
                      >
                        <div className="text-[11px] font-black">{st.title}</div>
                        <div className="text-[10px] font-medium opacity-80">{st.sub}</div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-neutral-600 font-medium">
                  {stepIdx === 1 &&
                    "Seu pedido foi enviado ao caixa do restaurante. Assim que o operador confirmar, nossa cozinha iniciará o preparo e você será avisado aqui na tela!"}
                  {stepIdx === 2 &&
                    "O restaurante já aceitou seu pedido e nossa equipe está preparando seus itens na chapa agora mesmo."}
                  {stepIdx === 3 &&
                    (ord.type === "mesa"
                      ? "Seu pedido acabou de ficar pronto na cozinha e está sendo levado até sua mesa!"
                      : `Seu pedido já foi conferido, embalado e nosso entregador${
                          ord.courierName ? ` (${ord.courierName})` : ""
                        } está a caminho do seu endereço!`)}
                  {stepIdx === 4 &&
                    "Etapa de entrega concluída com sucesso. Muito obrigado pela preferência e bom apetite!"}
                </p>

                {ord.courierName && ord.type === "delivery" && (
                  <div className="mt-2.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <span>🛵 Entregador Designado:</span>
                      <strong className="text-emerald-950">{ord.courierName}</strong>
                    </span>
                    <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                      Rota Rastreada
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Itens já lançados na mesa (Acompanhamento em Tempo Real) */}
      {mode === "mesa" && activeComanda && activeComanda.items.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pt-5">
          <div className="bg-white rounded-2xl p-4 border border-[#EFE9DF] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C83E2B]" />
                Itens Ativos na sua comanda ({activeComanda?.customerName || "Comanda"}):
              </h2>
              <span className="text-xs font-bold text-[#C83E2B]">
                Subtotal: R$ {activeComanda?.total?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="space-y-2">
              {activeComanda?.items?.map((item, idx) => {
                const matchingOrder = orders.find(
                  (o) =>
                    o.type === "mesa" &&
                    o.tableNumber === table.number &&
                    o.items.some((i) => i.name === item.name)
                );
                const itemStatus = matchingOrder?.status || "em_preparo";

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-100 last:border-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FDF2F0] text-[#C83E2B] flex items-center justify-center font-bold text-[11px]">
                        {item.quantity}x
                      </span>
                      <div>
                        <span className="font-semibold text-neutral-800">{item.name}</span>
                        {item.notes && (
                          <p className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      {itemStatus === "pendente" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Aguardando Caixa
                        </span>
                      ) : itemStatus === "a_caminho" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          <Utensils className="w-3 h-3 text-blue-600" />
                          Pronto • Indo p/ Mesa
                        </span>
                      ) : itemStatus === "entregue" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Servido na Mesa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                          <ChefHat className="w-3 h-3 text-[#C83E2B]" />
                          Em Preparo na Cozinha
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Resultados da Busca Rápida (quando o cliente digita na barra de busca) */}
      {searchQuery.trim().length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-4">
          {(() => {
            const q = searchQuery.toLowerCase().trim();
            const searchResults = products.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            );
            return (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE9DF] shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                  <h2 className="text-sm sm:text-base font-black text-[#1F2421] flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#C83E2B]" />
                    <span>Resultados para &ldquo;{searchQuery}&rdquo;</span>
                    <span className="text-xs font-semibold text-neutral-400">
                      ({searchResults.length})
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-bold text-[#C83E2B] hover:underline cursor-pointer"
                  >
                    Limpar busca
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-6 text-center">
                    Nenhum item encontrado com esse termo. Tente buscar por outro nome ou ingrediente.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {searchResults.map((product) => {
                      const isPaused = product.isAvailable === false;
                      return (
                        <div
                          key={`search-${product.id}`}
                          className={`bg-[#FDFBF7] rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                            isPaused
                              ? "opacity-60 border-neutral-200"
                              : "border-[#EFE9DF] hover:border-[#C83E2B]/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-[#1F2421]">{product.name}</h3>
                              <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                                {product.description}
                              </p>
                            </div>
                            <div
                              onClick={() => setProductForImageModal(product)}
                              className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#EFE9DF] cursor-pointer"
                            >
                              {product.image &&
                              (product.image.startsWith("http") || product.image.startsWith("/")) ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl">{product.image}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-200/70">
                            <span className="text-sm font-black text-[#1F2421]">
                              R$ {product.price.toFixed(2)}
                            </span>
                            {isPaused ? (
                              <span className="text-xs font-bold text-neutral-400">Esgotado</span>
                            ) : (
                              <button
                                onClick={() => addToCart(product)}
                                className="flex items-center gap-1 bg-[#C83E2B] hover:bg-[#B03221] text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Adicionar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Cardápio Contínuo com Scrollspy de Categorias (Estilo InstaDelivery & iFood) */}
      <div className="max-w-4xl mx-auto px-4 pb-12 space-y-8 pt-4">
        {CATEGORIES.map((category) => {
          const categoryProducts =
            category.id === "destaques"
              ? products.filter((p) => p.popular)
              : products.filter((p) => p.category === category.id);

          if (categoryProducts.length === 0) return null;

          return (
            <section
              key={category.id}
              id={`cat-section-${category.id}`}
              className="pt-2 scroll-mt-28"
            >
              <div className="flex items-center justify-between mb-3 border-b border-[#EFE9DF] pb-2">
                <h2 className="text-base sm:text-lg font-black text-[#1F2421] flex items-center gap-2">
                  <span>{category.label}</span>
                  <span className="text-xs font-semibold text-neutral-400">
                    ({categoryProducts.length})
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {categoryProducts.map((product) => {
                  const isPaused = product.isAvailable === false;
                  return (
                    <div
                      key={product.id}
                      className={`bg-white rounded-2xl p-4 border shadow-xs transition-all flex flex-col justify-between ${
                        isPaused
                          ? "opacity-60 bg-neutral-50/80 border-neutral-200"
                          : "border-[#EFE9DF] hover:border-[#C83E2B]/40 hover:shadow-sm"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm font-bold text-[#1F2421]">
                                {product.name}
                              </h3>
                              {product.popular && !isPaused && (
                                <span className="text-[10px] font-bold bg-[#FEF6EC] text-[#D97706] px-1.5 py-0.2 rounded border border-[#FBD9B0]">
                                  Favorito
                                </span>
                              )}
                              {isPaused && (
                                <span className="text-[10px] font-bold bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-300">
                                  Esgotado por hoje
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
                              {product.description}
                            </p>
                          </div>

                          {/* Foto Real do Produto com Abertura de Zoom / Lightbox */}
                          <div
                            onClick={() => setProductForImageModal(product)}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#F9F6F0] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[#EFE9DF] cursor-pointer group relative shadow-2xs hover:shadow-md transition-all"
                            title="Toque para ampliar a foto do lanche"
                          >
                            {product.image && (product.image.startsWith("http") || product.image.startsWith("/")) ? (
                              <>
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-white text-[10px] font-black bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                                    🔍
                                  </span>
                                </div>
                              </>
                            ) : (
                              <span className="text-3xl">{product.image}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                        <span className="text-sm font-black text-[#1F2421]">
                          R$ {product.price.toFixed(2)}
                        </span>
                        {isPaused ? (
                          <span className="text-xs font-bold text-neutral-400 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200 cursor-not-allowed">
                            Esgotado
                          </span>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="flex items-center gap-1 bg-[#C83E2B] hover:bg-[#B03221] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Barra Flutuante de Carrinho / Comanda no Rodapé */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 inset-x-0 z-40 px-4">
          <div className="max-w-md mx-auto bg-[#1F2421] text-white rounded-2xl p-3.5 shadow-xl border border-neutral-800 flex items-center justify-between animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C83E2B] flex items-center justify-center font-bold text-white relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-white text-[#C83E2B] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <div>
                <p className="text-xs text-neutral-300">Total a lançar</p>
                <p className="text-base font-black text-white">R$ {cartTotal.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-[#C83E2B] hover:bg-[#B03221] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver Pedido</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal / Gaveta de Finalização do Carrinho */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE9DF]">
                <h3 className="text-base font-black text-[#1F2421]">
                  {mode === "mesa" ? `Lançar na Comanda (${activeComanda?.customerName || "Sua Comanda"})` : "Finalizar Pedido Delivery"}
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista dos Itens no Carrinho */}
              <div className="py-4 space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-neutral-100">
                    <div>
                      <p className="font-bold text-neutral-800 text-sm">{item.name}</p>
                      <p className="text-neutral-500">R$ {item.price.toFixed(2)} un.</p>
                      {item.notes && (
                        <p className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 mt-1">
                          📝 {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center font-bold text-neutral-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-[#C83E2B] text-white flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upselling Inteligente Sugestivo: Sugere Bebida ou Sobremesa se o carrinho só tiver comida */}
              {cart.length > 0 &&
                !cart.some((ci) => {
                  const prod = products.find((p) => p.id === ci.productId);
                  return prod?.category === "bebidas" || prod?.category === "sobremesas";
                }) && (
                  <div className="my-3 p-3 bg-[#FEF6EC] border border-[#FBD9B0] rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-[#D97706] flex items-center gap-1">
                        <span>🥤 Que tal uma bebida geladinha?</span>
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        Sugestão da Casa
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {products
                        .filter((p) => p.category === "bebidas")
                        .slice(0, 3)
                        .map((drink) => (
                          <button
                            key={drink.id}
                            type="button"
                            onClick={() => handleQuickAddDrink(drink)}
                            className="flex-shrink-0 flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-amber-200 hover:border-[#BD4D2D] transition-colors text-left cursor-pointer shadow-xs"
                          >
                            <span className="text-base">{drink.image}</span>
                            <div>
                              <p className="text-[11px] font-bold text-neutral-800 leading-tight">
                                {drink.name.split(" ")[0]} {drink.name.split(" ")[1]}
                              </p>
                              <p className="text-[10px] font-extrabold text-[#BD4D2D]">
                                + R$ {drink.price.toFixed(2)}
                              </p>
                            </div>
                            <Plus className="w-3.5 h-3.5 text-[#BD4D2D] ml-1" />
                          </button>
                        ))}
                    </div>
                  </div>
                )}

              {/* Se for Delivery: dados de endereço, bairro e cupom */}
              {mode === "delivery" && (
                <div className="pt-2 pb-4 space-y-3 text-xs">
                  {/* Alerta de Estabelecimento Fechado */}
                  {isStoreClosed && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-bold text-center">
                      🔴 Restaurante fechado no momento para novos pedidos.
                    </div>
                  )}

                  {/* Busca de Endereço do Cliente via CEP (ViaCEP) */}
                  <div className="p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#EFE9DF] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-black text-neutral-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C83E2B]" />
                        <span>Endereço de Entrega do Cliente:</span>
                      </label>
                      <span className="text-[10px] font-bold text-neutral-400">
                        Busca automática por CEP
                      </span>
                    </div>

                    {/* Linha 1: CEP + Seleção de Bairro/Taxa */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                          📮 CEP:
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={customerCep}
                            onChange={(e) => handleCepChange(e.target.value)}
                            placeholder="00000-000"
                            maxLength={9}
                            className="w-full px-3 py-2 rounded-xl border border-[#EFE9DF] bg-white text-neutral-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C83E2B]"
                          />
                          {cepLoading && (
                            <Loader2 className="w-3.5 h-3.5 text-[#C83E2B] animate-spin absolute right-2.5 top-2.5" />
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                          📍 Bairro / Região (Taxa de Entrega):
                        </label>
                        <select
                          value={selectedNeighborhood}
                          onChange={(e) => handleNeighborhoodChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#EFE9DF] bg-white text-neutral-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#C83E2B]"
                        >
                          {availableNeighborhoods.map((nb) => (
                            <option key={nb.neighborhood} value={nb.neighborhood}>
                              {nb.neighborhood} — Taxa: R$ {nb.fee.toFixed(2)} ({nb.estimatedMinutes})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {cepFeedback && (
                      <p
                        className={`text-[11px] font-bold ${
                          cepFeedback.type === "ok" ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {cepFeedback.msg}
                      </p>
                    )}

                    {/* Linha 2: Rua / Logradouro + Número + Complemento (Apenas se não for retirada no balcão) */}
                    {!isPickupSelected && (
                      <>
                        <div>
                          <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                            🏠 Rua / Avenida / Logradouro: *
                          </label>
                          <input
                            type="text"
                            value={customerStreet}
                            onChange={(e) => setCustomerStreet(e.target.value)}
                            placeholder="Digite o nome da sua rua ou informe o CEP acima"
                            className="w-full px-3 py-2 rounded-xl border border-[#EFE9DF] bg-white text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#C83E2B]"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                              🔢 Número: *
                            </label>
                            <input
                              type="text"
                              value={customerNumber}
                              onChange={(e) => setCustomerNumber(e.target.value)}
                              placeholder="Ex: 142"
                              className="w-full px-3 py-2 rounded-xl border border-[#EFE9DF] bg-white text-neutral-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#C83E2B]"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                              🏢 Apto / Bloco / Ponto de Referência:
                            </label>
                            <input
                              type="text"
                              value={customerComplement}
                              onChange={(e) => setCustomerComplement(e.target.value)}
                              placeholder="Opcional (Ex: Apto 202, próx. à praça)"
                              className="w-full px-3 py-2 rounded-xl border border-[#EFE9DF] bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#C83E2B]"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Cupom Promocional (Sem exibir códigos de cupons reais no placeholder) */}
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      🎟️ Possui um Cupom Promocional?
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Digite seu código promocional"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#EFE9DF] bg-[#FDFBF7] text-neutral-800 font-extrabold tracking-wider uppercase placeholder:font-normal placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-[#C83E2B]"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        className="px-4 py-2 bg-[#1F2421] hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponApplied && couponDiscount > 0 && (
                      <p className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                        <span>✅ Cupom aplicado: - R$ {couponDiscount.toFixed(2)} de desconto!</span>
                      </p>
                    )}
                  </div>

                  {/* Linha de Taxa de Entrega (Exibe cobrança da diferença quando o frete ultrapassa o teto do cupom) */}
                  <div className="flex justify-between items-center text-neutral-600 pt-2 border-t border-neutral-100 font-medium">
                    <span>Taxa de Entrega ({selectedNeighborhood}):</span>
                    <span>
                      {(() => {
                        const cleanCode = couponCode.trim().toUpperCase();
                        const storeCoupon = settings?.coupons?.find(
                          (c) => c.code.toUpperCase() === cleanCode && c.active
                        );
                        const isFreeDeliveryCoupon =
                          Boolean(storeCoupon?.freeDelivery) ||
                          Boolean(isAloReferral) ||
                          cleanCode === "PARCERIA_ALO" ||
                          cleanCode === "FRETEALO" ||
                          cleanCode === "REDINHAGRATIS";

                        if (couponApplied && isFreeDeliveryCoupon && couponDiscount > 0) {
                          const remainingFee = Math.max(0, deliveryFee - couponDiscount);
                          if (remainingFee === 0) {
                            return (
                              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                GRÁTIS (Subsídio R$ {couponDiscount.toFixed(2)})
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="line-through text-neutral-400 text-[11px]">
                                R$ {deliveryFee.toFixed(2)}
                              </span>
                              <span className="text-amber-900 font-black bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-300">
                                R$ {remainingFee.toFixed(2)} (Restante após teto de R$ {couponDiscount.toFixed(2)})
                              </span>
                            </span>
                          );
                        }

                        return (
                          <span className="font-bold text-neutral-800">
                            R$ {deliveryFee.toFixed(2)}
                          </span>
                        );
                      })()}
                    </span>
                  </div>

                  {/* Alerta de Pedido Mínimo */}
                  {isBelowMinimum && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-semibold text-center">
                      ⚠️ O pedido mínimo da loja é R$ {settings?.minOrderValue?.toFixed(2)}. Faltam R$ {(
                        (settings?.minOrderValue || 0) - cartTotal
                      ).toFixed(2)} no carrinho.
                    </div>
                  )}

                  {/* Forma de Pagamento no Delivery */}
                  <div className="pt-2 border-t border-neutral-100">
                    <label className="font-bold text-neutral-700 block mb-1.5">
                      💳 Como você prefere pagar ao receber?
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDeliveryPaymentMethod("pix")}
                        className={`p-2 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                          deliveryPaymentMethod === "pix"
                            ? "bg-[#1F2421] text-white border-[#1F2421] shadow-2xs"
                            : "bg-white text-neutral-700 border-[#EFE9DF] hover:bg-neutral-50"
                        }`}
                      >
                        📱 Pix
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryPaymentMethod("cartao")}
                        className={`p-2 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                          deliveryPaymentMethod === "cartao"
                            ? "bg-[#1F2421] text-white border-[#1F2421] shadow-2xs"
                            : "bg-white text-neutral-700 border-[#EFE9DF] hover:bg-neutral-50"
                        }`}
                      >
                        💳 Cartão
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryPaymentMethod("dinheiro")}
                        className={`p-2 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                          deliveryPaymentMethod === "dinheiro"
                            ? "bg-[#1F2421] text-white border-[#1F2421] shadow-2xs"
                            : "bg-white text-neutral-700 border-[#EFE9DF] hover:bg-neutral-50"
                        }`}
                      >
                        💵 Dinheiro
                      </button>
                    </div>

                    {deliveryPaymentMethod === "pix" && (() => {
                      const nextOrderNum =
                        Math.max(...orders.map((o) => o.orderNumber || 0), 100) + 1;
                      const pixBrCode = generatePixBrCode({
                        pixKey: settings?.pixKey || RESTAURANT_INFO.pixKey,
                        merchantName: settings?.storeName || RESTAURANT_INFO.name,
                        merchantCity: "NATAL",
                        amount: finalDeliveryTotal,
                        txid: `PEDIDO${nextOrderNum}`,
                      });
                      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=6&data=${encodeURIComponent(
                        pixBrCode
                      )}`;

                      return (
                        <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-emerald-950 flex items-center gap-1.5">
                              <QrCode className="w-4 h-4 text-emerald-700" />
                              <span>Pix Oficial (Padrão Banco Central BRCode)</span>
                            </span>
                            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-black">
                              VALOR EXATO: R$ {finalDeliveryTotal.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2.5 rounded-xl border border-emerald-200">
                            <img
                              src={qrImageUrl}
                              alt="QR Code Pix Oficial"
                              className="w-28 h-28 rounded-lg border border-neutral-200 flex-shrink-0"
                            />
                            <div className="flex-1 w-full space-y-1.5">
                              <p className="text-[11px] text-neutral-600 leading-snug">
                                Escaneie o QR Code no app do seu banco ou copie o código <strong>Pix Copia e Cola</strong> já preenchido com <strong>R$ {finalDeliveryTotal.toFixed(2)}</strong>:
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(pixBrCode);
                                  setPixCopied(true);
                                  setTimeout(() => setPixCopied(false), 3500);
                                }}
                                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                              >
                                {pixCopied ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    <span>Código Pix Copia e Cola Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copiar Pix Copia e Cola (R$ {finalDeliveryTotal.toFixed(2)})</span>
                                  </>
                                )}
                              </button>
                              <p className="text-[10px] text-neutral-500 font-mono truncate">
                                Chave: {settings?.pixKey || RESTAURANT_INFO.pixKey}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {deliveryPaymentMethod === "cartao" && (
                      <div className="mt-2 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600">
                        O entregador levará a maquininha sem fio (Crédito, Débito e Vale Refeição aceitos).
                      </div>
                    )}

                    {deliveryPaymentMethod === "dinheiro" && (
                      <div className="mt-2">
                        <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                          Precisa de troco para quanto?
                        </label>
                        <input
                          type="text"
                          value={changeForAmount}
                          onChange={(e) => setChangeForAmount(e.target.value)}
                          placeholder="Ex: R$ 50,00 ou Não preciso"
                          className="w-full px-3 py-1.5 rounded-xl border border-[#EFE9DF] bg-white text-neutral-800 font-medium"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Opção Para Viagem quando na Mesa */}
              {mode === "mesa" && (
                <div className="pt-2 pb-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer bg-[#F9F6F0] p-2.5 rounded-xl border border-[#EFE9DF] hover:bg-[#F5F0E6] transition-colors">
                    <input
                      type="checkbox"
                      checked={isTakeaway}
                      onChange={(e) => setIsTakeaway(e.target.checked)}
                      className="w-4 h-4 accent-[#C83E2B] rounded cursor-pointer"
                    />
                    <span>🛍️ Embalar este pedido para viagem (levar para casa)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Total e Botão de Confirmação */}
            <div className="pt-4 border-t border-[#EFE9DF]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-neutral-600">Total do Pedido:</span>
                <div className="text-right">
                  <span className="text-xl font-black text-[#C83E2B]">
                    R$ {(mode === "delivery" ? finalDeliveryTotal : cartTotal).toFixed(2)}
                  </span>
                  {couponApplied && couponDiscount > 0 && (
                    <p className="text-[10px] text-emerald-700 font-bold">
                      (Economia de R$ {couponDiscount.toFixed(2)})
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isStoreClosed || isBelowMinimum}
                className={`w-full font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition-all ${
                  isStoreClosed || isBelowMinimum
                    ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                    : "bg-[#C83E2B] hover:bg-[#B03221] text-white cursor-pointer active:scale-98"
                }`}
              >
                {isStoreClosed
                  ? "Loja Fechada"
                  : isBelowMinimum
                  ? `Pedido Mínimo R$ ${settings?.minOrderValue?.toFixed(2)}`
                  : mode === "mesa"
                  ? "Enviar Pedido para a Cozinha"
                  : "Confirmar e Enviar Pedido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Avançado de Divisão de Conta & Comandas Personalizadas (Inspirado no Stitch) */}
      {isSplitModalOpen && (
        <BillSplitModal
          table={table}
          settings={settings}
          activeComandaId={activeComandaId}
          onClose={() => setIsSplitModalOpen(false)}
          onCallWaiter={onCallWaiter}
          onAddSubcomanda={onAddSubcomanda}
          onRegisterPayment={onRegisterPayment}
        />
      )}

      {/* Modal de Personalização do Produto / Substituições e Observações */}
      {customizingProduct && (
        <ProductDetailModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={handleConfirmCustomization}
        />
      )}

      {/* Modal de Zoom da Foto do Produto (Lightbox) */}
      {productForImageModal && (
        <ProductImageModal
          product={productForImageModal}
          onClose={() => setProductForImageModal(null)}
          onAdd={(prod) => {
            setProductForImageModal(null);
            addToCart(prod);
          }}
        />
      )}
    </div>
  );
}
