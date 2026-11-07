# Estudo Comparativo: Plataforma Consumer vs. Tá na Mesa (A2i Solutions)

> **Documento Estratégico & Benchmarking de Engenharia de Produto**  
> **Plataforma:** Tá na Mesa  
> **Proprietária:** A2i Solutions (Product Lead: Fábio Barbosa) em parceria com Alô Classificados  
> **Operação Piloto:** Hot Dog & Cia (Redinha, Natal/RN)  
> **Referência Analisada:** Programa Consumer (Portal de Treinamentos e Artigos Populares: `ajuda.programaconsumer.com.br`)

---

## 1. Visão Geral da Análise

O Programa Consumer é um dos principais sistemas de gestão para food service no Brasil. A análise do portal de onboarding e treinamento (`ajuda.programaconsumer.com.br`) revela a arquitetura do sistema concorrente, seus diferenciais e suas dores operacionais (fricções de instalação local).

Abaixo está o estudo completo das **9 Categorias de Treinamento** e dos **Artigos Populares** mais acessados pelos clientes da Consumer, comparando cada item com o que foi implementado no **Tá na Mesa**.

---

## 2. Análise Detalhada das 9 Categorias de Treinamento

| # | Categoria Consumer | O que o Consumer ensina / executa | Como o Tá na Mesa implementou & diferenciais |
|---|---|---|---|
| **1** | **Lançamento de Pedidos** | Lançamento em Mesas, Comandas Individuais, Balcão (Takeaway) e Delivery com taxas de entrega. | ✅ **Implementado:** Terminal do Garçom (`/garcom`), PDV Gestor (`/gestor`), Comandas individuais por cliente (ex: Fábio, Cunhada), transferências de mesa com 1 toque e prioridade de preparo para a cozinha. |
| **2** | **Cardápio Digital** | Publicação no MenuDino, QR Code na mesa para autoatendimento e personalização de itens. | ✅ **Implementado:** Módulos `/delivery` e `/mesa/[numero]` com QR Code 2D dinâmico, autoatendimento sem garçom, totem de personalização (retirada de ingredientes e adicionais) e sugestão inteligente de bebidas (*Upselling*). |
| **3** | **Cadastro de Produtos** | Criação de categorias, adicionais obrigatórios e opcionais, regras de remoção (sem cebola, sem picles), variações de tamanho e precificação. | ✅ **Implementado:** 34 itens reais do cardápio do Hot Dog & Cia cadastrados em 9 categorias autênticas, com edição rápida de preço e pausa instantânea de produto esgotado no Gestor. |
| **4** | **Controle de Estoque** | Ficha técnica de produtos com baixa automática de insumos (ao vender 1 lanche, baixa pão, salsicha, queijo e milho), perdas e estoque mínimo. | 🔄 **Base Estruturada:** Módulo de Relatórios e Giro de Estoque com indicadores visuais de criticidade (verde, amarelo e vermelho) e histórico de saídas. |
| **5** | **Fiscal** | Emissão de NFC-e (*Nota Fiscal de Consumidor Eletrônica*), SAT fiscal (SP/CE), contingência offline e integração com SEFAZ. | 📋 **Fase 10 / Roadmap:** Arquitetura pronta para plugar API fiscal padrão Focus NFe / PlugNotas sem exigir hardware SAT físico local. |
| **6** | **Financeiro** | Abertura e fechamento de caixa cego, Sangria (retirada), Suprimento (troco), conciliação por Pix, Cartão Crédito, Débito e Dinheiro, e DRE (*Demonstrativo do Resultado do Exercício*). | ✅ **Implementado:** Modal de Caixa e Turno diário (`CashRegisterModal.tsx`) com Sangria, Suprimento, conciliação e impressão de Relatório Z de fechamento. |
| **7** | **Impressoras e Hardwares** | Impressão térmica ESC/POS em bobinas de 58mm e 80mm, roteamento por setor (impressora da chapa vs impressora da copa/bar) e Smart POS Android (Sunmi, Cielo LIO, PagBank). | ✅ **Implementado:** Visualização de comanda térmica de 80mm (`ReceiptModal.tsx`), roteamento multi-setor no KDS (`KitchenView.tsx`) e Modo dedicado para Maquininhas Smart POS (`/pos`). |
| **8** | **Configurações** | Taxa de serviço de 10% do garçom (opcional), horários da loja, raio de entrega e permissões por usuário. | ✅ **Implementado:** Toggle opcional de taxa de 10% do garçom na quitação de comandas (`CloseComandaModal.tsx`) e configurações da loja em `StoreSettingsTab.tsx`. |
| **9** | **Outras Soluções** | Robô de WhatsApp com IA ChatGPT, Painel de Senhas para retirada de balcão e Totem de Autoatendimento. | ✅ **Implementado:** Simulador interativo do Bot de WhatsApp com NLP e IA (`WhatsAppBotModal.tsx`), KDS Cozinha em tempo real e Totem de Mesa. |

---

## 3. Análise dos Artigos Populares do Consumer

### Artigo 1: *"Como configurar um IP fixo no Computador Servidor?"*
- **A dor no Consumer:** O Consumer roda como um programa `.exe` legado instalado no Windows. Para que celulares e tablets funcionem no salão, o dono do restaurante precisa entrar nas configurações do Windows e do roteador Wi-Fi, definir um IP fixo manual (ex: `192.168.1.100`), abrir portas no Firewall e, frequentemente, contratar um técnico de TI.
- **A superação no Tá na Mesa:** **Zero configuração de rede ou IP fixo!** O Tá na Mesa é uma plataforma Web moderna (PWA). Ele roda na nuvem ou na rede local automaticamente. Qualquer aparelho (celular do garçom, tablet, maquininha Smart POS ou computador) só precisa abrir o link ou ler o QR Code para conectar imediatamente com sincronização em tempo real via SSE (*Server-Sent Events*).

---

### Artigo 2: *"Como utilizar o Bot para WhatsApp da Consumer?"*
- **O que é no Consumer:** Um assistente virtual que atende clientes no WhatsApp, envia o cardápio e responde dúvidas sobre horários e pedidos. No Consumer, exige a contratação do plano "MenuDino Completo" e configurações avançadas.
- **Como implementamos no Tá na Mesa:** Desenvolvemos o **Assistente Virtual de WhatsApp do Tá na Mesa** (`WhatsAppBotModal.tsx`), que já simula uma interface idêntica ao WhatsApp, compreende perguntas de clientes em linguagem natural (NLP), informa ingredientes autênticos do Hot Dog & Cia, calcula taxas de entrega por bairro em Natal/RN, envia a chave Pix (`84998668082`) e permite configurar o tom de voz da IA.

---

### Artigo 3: *"Quanto custa para utilizar a API do ChatGPT?"*
- **O esclarecimento no Consumer:** A Consumer esclarece que a assinatura comum do "ChatGPT Plus" (US$ 20/mês da OpenAI voltada para uso pessoal no site) **não serve** para integrar sistemas. É obrigatório criar uma conta de desenvolvedor na plataforma da OpenAI, cadastrar um cartão de crédito internacional e pagar por volume de uso de tokens (`gpt-3.5-turbo` ou `gpt-4o-mini`), com custo médio de frações de centavos de dólar por mensagem.
- **Vantagem do Tá na Mesa:** O Tá na Mesa foi construído com arquitetura híbrida: possui regras locais embutidas (que funcionam instantaneamente a custo zero de IA para o dono do restaurante) e suporta inserção de chaves da OpenAI ou Google Gemini diretamente pelo painel do gestor quando desejar atendimento conversacional avançado.

---

### Artigo 4: *"Como publicar seu cardápio online e receber pedidos pela internet"*
- **O que é no Consumer:** Guia de como o restaurante cria seu próprio site no MenuDino para fugir das comissões abusivas do iFood (que variam de 12% a 27% do faturamento).
- **Como o Tá na Mesa aborda:** O módulo `/delivery` do Tá na Mesa já é uma plataforma de delivery direto sem comissões (*zero-fee*), com cardápio dinâmico, opções de retirada ou tele-entrega, seleção de forma de pagamento, cálculo de troco e envio de comprovante estruturado direto para o WhatsApp do restaurante com 1 clique.

---

### Artigo 5: *"Como configurar o Consumer para funcionar com celulares e tablets?"*
- **A dor no Consumer:** O lojista é obrigado a assinar módulos adicionais pagos ("Consumer Rede" + "Consumer Mobile"), baixar APKs nos celulares Android dos garçons e garantir que nenhum cliente conecte no mesmo Wi-Fi dos aparelhos.
- **A superação no Tá na Mesa:** **Totalmente agnóstico de hardware e sem taxas extras por dispositivo!** Não exige instalação de loja de aplicativos (Google Play ou App Store). O garçom acessa `/garcom` no navegador de qualquer smartphone (Android ou iPhone) e já tem seu terminal pronto. O cliente acessa `/mesa/[numero]` apontando a câmera para o QR Code da mesa.

---

### Artigo 6: *"Primeiros passos no Consumer"*
- **O que é no Consumer:** Passo a passo para cadastrar as primeiras 10 mesas, cadastrar os primeiros produtos e realizar a primeira venda teste.
- **Como o Tá na Mesa entrega:** O sistema já inicia configurado com o salão limpo de 10 mesas, 34 itens reais do Hot Dog & Cia e botões no Gestor de **`[🧹 Zerar Salão]`** (para deixar o salão 100% livre) e **`[🧪 Simulação Demo]`** (para carregar um salão cheio e testar o fechamento de contas em 1 segundo).

---

## 4. Matriz Comparativa Resumida

| Funcionalidade / Aspecto | Programa Consumer | Tá na Mesa (A2i Solutions) |
|---|:---:|:---:|
| **Arquitetura Base** | Desktop Windows (.exe local) | Web PWA Moderna / Nuvem (Next.js Turbopack) |
| **Exigência de Servidor Local / IP Fixo** | ⚠️ Sim (Exige configurar IP e portas) | 🚀 Não (Funciona direto pelo navegador em qualquer rede) |
| **Terminal do Garçom** | App Android pago à parte ("Consumer Mobile") | PWA responsivo em qualquer celular sem custo de licença |
| **Autoatendimento na Mesa (QR Code)** | MenuDino QR Code (Módulo contratado) | Integrado nativamente com subcomandas individuais |
| **Customização no Estilo BK / Mc** | Seleção básica de adicionais | Totem com controle de remoção (-) e inclusão (+) |
| **Monitor KDS de Preparo** | Módulo separado | Integrado com filtro multi-setor (Chapa vs Bar) |
| **Smart POS (Maquininha de Cartão)** | Comanda na Maquininha (Sunmi/Stone/Cielo) | Rota dedicada `/pos` compatível com qualquer navegador POS |
| **Assistente de WhatsApp** | Plugin ChatGPT pago com chave OpenAI | Simulador e motor integrado com inteligência de cardápio |
| **Facilidade de Início (Onboarding)** | Complexo (requer instalação e suporte técnico) | Instantâneo (abrir link, sem instaladores) |
