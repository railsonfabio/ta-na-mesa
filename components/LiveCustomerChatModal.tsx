"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Utensils,
  Bot,
  User,
  ShieldCheck,
} from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "cliente" | "loja" | "sistema";
  senderName: string;
  text: string;
  timestamp: string;
}

interface LiveCustomerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  customerName?: string;
  tableNumber?: number;
  orderNumber?: number;
}

export function LiveCustomerChatModal({
  isOpen,
  onClose,
  storeName = "Tá na Mesa",
  customerName = "Cliente",
  tableNumber,
  orderNumber,
}: LiveCustomerChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "msg-1",
      sender: "loja",
      senderName: storeName,
      text: `Olá ${customerName}! Como podemos te ajudar hoje? Nossa equipe está online.`,
      timestamp: "Agora mesmo",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "cliente",
      senderName: customerName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Resposta inteligente da loja ou garçom após 1.2s
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "Recebemos sua mensagem e já estamos cuidando disso!";

      const lower = text.toLowerCase();
      if (lower.includes("status") || lower.includes("pedido") || lower.includes("demora")) {
        replyText = orderNumber
          ? `O seu Pedido #${orderNumber} está sendo preparado com todo carinho pela nossa cozinha!`
          : "Seus itens já foram enviados para a linha de preparo da cozinha!";
      } else if (lower.includes("garçom") || lower.includes("atendente") || lower.includes("mesa")) {
        replyText = tableNumber
          ? `Um garçom já foi notificado e está se dirigindo para a Mesa ${tableNumber}!`
          : "Um atendente já foi chamado para te atender!";
      } else if (lower.includes("conta") || lower.includes("fechar") || lower.includes("pagar")) {
        replyText =
          "Você pode fechar sua conta direto pelo botão 'Dividir & Pagar Conta' via Pix instantâneo, ou solicitar a maquininha do garçom!";
      } else if (lower.includes("obrigado") || lower.includes("valeu")) {
        replyText = "Sempre um prazer te atender! Bom apetite! 🍔✨";
      }

      const botMsg: ChatMessage = {
        id: `store-${Date.now()}`,
        sender: "loja",
        senderName: storeName,
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-neutral-300 shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[620px]">
        {/* Mobile handle */}
        <div className="flex h-3 w-full items-center justify-center pt-2 sm:hidden flex-shrink-0">
          <div className="h-1.5 w-10 rounded-full bg-neutral-300"></div>
        </div>

        {/* Header do Chat (conforme Stitch chat_ao_vivo_cliente_loja_2) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7DCD0] bg-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="size-10 rounded-full bg-[#CA000A] text-white flex items-center justify-center font-black text-sm">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400"></span>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1F2421] leading-tight">
                {storeName}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                  <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Atendimento Online
                </span>
                {tableNumber && <span>• Mesa {tableNumber}</span>}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF8F5]">
          <div className="text-center my-2">
            <span className="inline-block text-[10px] font-bold text-neutral-400 bg-white border border-[#E7DCD0] px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
              Chat em Tempo Real com a Loja
            </span>
          </div>

          {messages.map((msg) => {
            const isMe = msg.sender === "cliente";
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
              >
                {!isMe && (
                  <div className="size-8 rounded-full bg-red-100 text-[#CA000A] flex items-center justify-center font-bold text-xs flex-shrink-0 border border-red-200">
                    <Utensils className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[78%] flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-baseline gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-bold text-neutral-600">
                      {isMe ? "Você" : msg.senderName}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {msg.timestamp}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-2xs ${
                      isMe
                        ? "bg-[#CA000A] text-white rounded-br-xs"
                        : "bg-white text-neutral-900 border border-[#E7DCD0] rounded-bl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator (conforme Stitch) */}
          {isTyping && (
            <div className="flex items-end gap-2.5">
              <div className="size-8 rounded-full bg-red-100 text-[#CA000A] flex items-center justify-center font-bold text-xs flex-shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div className="bg-white border border-[#E7DCD0] p-3 rounded-2xl rounded-bl-xs flex items-center gap-1.5 shadow-2xs">
                <span className="size-2 rounded-full bg-neutral-400 animate-pulse"></span>
                <span className="size-2 rounded-full bg-neutral-400 animate-pulse [animation-delay:0.15s]"></span>
                <span className="size-2 rounded-full bg-neutral-400 animate-pulse [animation-delay:0.3s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chips de Ação Rápida */}
        <div className="px-3 py-2 bg-white border-t border-[#E7DCD0] flex gap-1.5 overflow-x-auto scrollbar-none">
          {[
            "Status do Pedido",
            "Chamar Garçom",
            "Como pagar a conta?",
            "Preciso de talheres",
            "Água com gelo e limão",
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSend(chip)}
              className="text-[11px] font-bold bg-[#FAF8F5] hover:bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-full border border-[#E7DCD0] flex-shrink-0 transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Footer com Input & Envio (conforme Stitch chat_ao_vivo_cliente_loja_2) */}
        <div className="p-3 bg-white border-t border-[#E7DCD0] flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Digite sua mensagem para a loja..."
            className="flex-1 bg-[#FAF8F5] border border-neutral-300 rounded-full px-4 py-2.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#CA000A] focus:outline-none"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="size-10 rounded-full bg-[#CA000A] hover:bg-[#b00009] disabled:bg-neutral-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
