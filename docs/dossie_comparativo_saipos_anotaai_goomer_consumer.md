# Dossiê de Inteligência Competitiva: Saipos vs. Anota AI vs. Goomer vs. Consumer

> **Documento Estratégico de Engenharia & Arquitetura de Produto**  
> **Plataforma:** Tá na Mesa  
> **Proprietária:** A2i Solutions (Product Lead: Fábio Barbosa) em parceria com Alô Classificados  
> **Operação Piloto:** Hot Dog & Cia (Redinha, Natal/RN)  
> **Objetivo:** Benchmarking minucioso dos 4 gigantes de food service no Brasil para consolidar a homologação do Tá na Mesa e elevar a experiência visual e funcional a um padrão de aplicativo moderno internacional.

---

## 1. O Ponto de Inflexão Tecnológica: Web Moderna vs. Sistemas Legados de Windows

Um dos maiores problemas relatados por donos de restaurantes no Brasil é a **obsolescência dos sistemas legados baseados em Windows (arquitetura desktop `.exe`)**, como as versões tradicionais do Programa Consumer, Colibri e MisterChef.

### As Dores dos Sistemas Legados de Windows:
1. **Exigência de Computador Servidor Físico:** Se o computador do caixa der tela azul ou queimar a fonte, todo o restaurante para: os garçons não conseguem lançar mesas e a cozinha não recebe tickets.
2. **Fricção de IP Fixo e Redes Locais:** Exigem que o lojista configure IPs estáticos no Windows (`192.168.1.100`), abra portas no Firewall e contrate técnicos de TI para manter os tablets dos garçons conectados.
3. **Instaladores e Licenças por Máquina:** Para colocar uma tela na cozinha ou uma maquininha extra, o lojista precisa comprar licenças adicionais ("Consumer Rede", "Módulo Mobile").
4. **Interface Pesada e Antiga:** Telas cinzas, cheias de botões pequenos e formulários densos que lembram softwares do início dos anos 2000, gerando alta taxa de erro dos funcionários.

### A Ruptura com o Tá na Mesa (A2i Solutions):
- **100% Web / Nuvem PWA (*Progressive Web App*):** Roda direto em qualquer navegador moderno (Chrome, Safari, Edge) em qualquer hardware: smartphone dos garçons, tablets do salão, Smart POS (Sunmi, Cielo LIO, PagBank), computadores do caixa e telas de TV da cozinha.
- **Zero Instalação & Zero IP Fixo:** Funciona automaticamente na nuvem ou na rede local com sincronização instantânea em milissegundos via SSE (*Server-Sent Events*).
- **Design Moderno Mobile-First:** Inspirado nos padrões de usabilidade da Apple, Uber Eats e Toast POS, com botões de toque confortáveis, tipografia expressiva e código de cores intuitivo.

---

## 2. Raio-X Minucioso dos 4 Grandes Players do Mercado

---

### 🏆 PLAYER 1: SAIPOS (Líder em Franquias e Gestão de Delivery)

A Saipos se consolidou como o ERP de maior volume de processamento de delivery para franquias no Brasil (operando marcas como Subway, Oakberry e lanchonetes de grande porte).

#### Principais Recursos & Forças:
1. **Gestão e Roteirização de Motoboys:**
   - Módulo dedicado de despacho de entregas.
   - Agrupamento inteligente de múltiplos pedidos que seguem para a mesma região/bairro em uma única saída de motoboy.
   - Controle de taxas pagas aos entregadores (por corrida fixa ou por quilômetro rodado).
2. **KDS com Cronômetro de Preparo (Timer):**
   - O monitor da cozinha exibe contadores em tempo real para cada pedido. Quando o pedido ultrapassa o tempo limite configurado (ex: 20 minutos), o ticket muda de cor (amarelo para vermelho piscante), alertando o chapeiro.
3. **Ficha Técnica com Controle de CMV (*Custo da Mercadoria Vendida*):**
   - Baixa automática no miligrama de cada ingrediente ao vender lanches e cálculo do lucro bruto unitário de cada prato.

#### Fraquezas da Saipos:
- **Interface Corporativa Densa:** Visual complexo, voltado para operadores experientes em desktop. Pouco amigável para uso rápido pelo garçom no salão em dias lotados.
- **Custo Elevado:** Planos mensais caros com cobrança por volume de pedidos e módulos contratados separadamente.

#### 💡 O que absorvemos no Tá na Mesa:
- **Módulo de Despacho de Motoboy:** Atribuição do motoboy no PDV em 1 toque com cálculo da taxa de entrega.
- **Timer de Espera no KDS:** Visualização do tempo decorrido de preparo no ticket da cozinha.

---

### 🤖 PLAYER 2: ANOTA AI (Líder em Automação e IA no WhatsApp)

A Anota AI revolucionou o mercado ao transformar o WhatsApp no principal canal de vendas diretas para delivery no Brasil.

#### Principais Recursos & Forças:
1. **Atendente Virtual com IA no WhatsApp:**
   - Responde clientes no WhatsApp em 2 segundos, interpretando dúvidas, enviando o cardápio e compreendendo mensagens de áudio dos clientes.
2. **Recuperador de Vendas Automático (Gatilhos de Retenção):**
   - **Carrinho Abandonado:** Se o cliente monta o pedido no cardápio online e não finaliza a compra em 15 minutos, o bot envia uma mensagem amigável no WhatsApp: *"Oi Fábio, vi que você deixou um Hot Dog na Nata no carrinho! Quer que a gente já mande para a chapa com frete grátis?"*.
   - **Clientes Sumidos (Inativos há 15/30 dias):** Disparo de cupom promocional exclusivo para reativar clientes que pararam de pedir.
3. **Pix Automatizado com Confirmação em Tempo Real:**
   - Gera o QR Code Pix com chave copia-e-cola direto na conversa do WhatsApp e confirma o recebimento automaticamente sem exigir envio de comprovante bancário.

#### Fraquezas da Anota AI:
- **Operação Quase Nula no Salão Físico:** Praticamente não possui ferramentas para mesas, subcomandas presenciais, atendimento de garçons ou comanda eletrônica no salão. É uma ferramenta focada em delivery por mensagem.

#### 💡 O que absorvemos no Tá na Mesa:
- **Robô de WhatsApp com Conhecimento do Cardápio:** Já implementado em `WhatsAppBotModal.tsx` com as receitas reais do Hot Dog & Cia e taxas de bairros de Natal/RN.
- **Disparo de Mensagens de Fidelidade:** Botões de envio de status formatado no WhatsApp do cliente com 1 toque no PDV.

---

### 📱 PLAYER 3: GOOMER (Líder em Autoatendimento Presencial, QR Code & Totem)

A Goomer é a referência máxima no Brasil em autoatendimento físico no salão de restaurantes (presente em redes como Outback, Madero e hamburguerias artesanais).

#### Principais Recursos & Forças:
1. **Goomer na Mesa (Cardápio Digital por QR Code):**
   - O cliente senta à mesa, aponta a câmera do celular para a plaquinha de acrílico com QR Code e abre o cardápio instantaneamente sem baixar aplicativo.
   - Permite que várias pessoas na mesma mesa façam pedidos individuais em suas próprias comandas digitais.
2. **Upselling Sugestivo Automatizado ("Vendedor Silencioso"):**
   - A plataforma foi desenhada psicologicamente para aumentar o ticket médio. Ao selecionar um lanche salgado, ela sugere: *"Que tal adicionar uma Coca-Cola geladinha ou uma Porção de Batata Frita Crocante por apenas mais R$ 8?"*.
3. **Pesquisa NPS de Satisfação Após o Pagamento:**
   - Quando a conta é paga, o sistema abre uma avaliação rápida de 1 a 5 estrelas. Se a avaliação for 5 estrelas, convida o cliente com 1 clique a avaliar no **Google Meu Negócio**, atraindo centenas de avaliações orgânicas positivas para o restaurante.

#### Fraquezas da Goomer:
- **Dependência de ERPs Terceiros:** A Goomer foca na experiência do cliente (mesa e totem), mas depende de integrar com outros sistemas (como Saipos ou Linx) para a parte fiscal de balcão e retaguarda de estoque pesado.

#### 💡 O que absorvemos no Tá na Mesa:
- **Totem de Customização e Retirada de Ingredientes:** Implementado estilo BK/Mc Donald's (retirar cebola, picles, maionese).
- **Subcomandas por Nome na Mesma Mesa:** Permite que Fábio, Cunhada e amigos dividam a mesa e peçam individualmente.
- **Upselling Sugestivo de Bebidas:** Já integrado nativamente no carrinho do cliente.

---

### 🏢 PLAYER 4: PROGRAMA CONSUMER (Líder em Gestão Tradicional para PMEs)

O Programa Consumer é o concorrente mais conhecido entre lanchonetes e pizzarias de bairro, atendendo mais de 30 mil estabelecimentos.

#### Principais Recursos & Forças:
1. **Ecossistema Completo e Amplo:**
   - Reúne PDV, KDS, financeiro, emissão de NFC-e, Comanda na Maquininha Smart POS e integração com iFood.
2. **Hub de Integrações Delivery:**
   - Centraliza o MenuDino (canal próprio), iFood, 99Food e Keeta na mesma tela do caixa.
3. **Portal de Treinamento Rico:**
   - Central de ajuda com vídeos divididos em 9 categorias e manuais passo a passo para novos empresários.

#### Fraquezas do Consumer:
- **Arquitetura Antiga Windows `.exe`:** Conforme analisado, força o restaurante a ter uma máquina ligada o tempo todo como servidor local, configurar IP fixo no roteador e pagar módulos extras para cada celular de garçom conectado.

#### 💡 O que absorvemos e superamos no Tá na Mesa:
- Reproduzimos os melhores recursos operacionais do Consumer (Hub de Canais Delivery, KDS Multi-Setor, Comanda na Maquininha Smart POS e Controle de Caixa diário), **mas com a tecnologia moderna, limpa e ágil da nuvem PWA do Tá na Mesa**.

---

## 3. Matriz Comparativa Definitiva (Os 4 Players vs. Tá na Mesa)

| Funcionalidade / Aspecto | Consumer | Saipos | Anota AI | Goomer | Tá na Mesa (A2i Solutions) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Arquitetura Base** | Desktop Windows (`.exe`) | Nuvem / Híbrido | Nuvem / Web | Nuvem / Web | **🚀 100% Web PWA (Next.js Turbopack)** |
| **Exige Servidor Físico / IP Fixo** | ⚠️ Sim (Obrigatório) | ❌ Não | ❌ Não | ❌ Não | **✅ Não (Acesso imediato de qualquer aparelho)** |
| **Terminal do Garçom** | App Android pago à parte | App móvel | ❌ Muito limitado | Tablet na mesa | **✅ Terminal PWA moderno em qualquer celular** |
| **Subcomandas Individuais na Mesa** | Sim | Sim | ❌ Não | Sim (Forte) | **✅ Sim (Comandas por cliente com divisão de conta)** |
| **Customização de Ingredientes** | Básica | Básica | Básica | Boa | **✅ Completa (Estilo Totem BK/Mc com remoção de itens)** |
| **KDS de Produção Multi-Setor** | Separado | Com Timer | Básico | Integração | **✅ Integrado com divisão Chapa vs Bar em tempo real** |
| **Hub Delivery (iFood / 99 / Keeta)** | Sim | Sim (Forte) | Apenas iFood | Não integrado | **✅ Sim (Módulo completo com badges oficiais e Webhook)** |
| **Comanda na Maquininha Smart POS** | Sim (Sunmi/Stone) | Sim | ❌ Não | ❌ Não | **✅ Sim (Rota `/pos` para qualquer Smart POS Android)** |
| **Bot de WhatsApp com IA** | Plugin ChatGPT | Integração | Nativo (Líder) | ❌ Não | **✅ Simulador e motor integrado com inteligência local** |
| **Autonomia do Garçom no Salão** | Baixa (chama caixa) | Média | ❌ Nula | Alta | **✅ Alta (Muda de mesa, urgência e cancelamento próprio)** |
| **Custo de Licença por Dispositivo** | Cobrado à parte | Cobrado por plano | Cobrado por plano | Cobrado por mesa | **✅ Ilimitado (Zero taxa por aparelho conectado)** |

---

## 4. Plano de Ação para a Fase de Homologação & Acabamento Visual

Com a absorção dos pontos fortes dos 4 líderes de mercado, o **Tá na Mesa** reúne a combinação de:
1. **A robustez de PDV e KDS da Saipos**;
2. **A automação inteligente e comunicação de WhatsApp da Anota AI**;
3. **A experiência fluida de autoatendimento na mesa e upselling da Goomer**;
4. **A amplitude de canais de delivery do Consumer**;
5. **Com a arquitetura moderna, rápida e 100% Web da A2i Solutions**.

### Próximos Passos de Engenharia para Homologação:
- **Passo 1 (Despacho Rápido de Motoboy):** Adicionar no pedido do PDV a opção de selecionar o entregador (ex: *Motoboy 1*, *Motoboy 2*) e calcular a saída da rota.
- **Passo 2 (Avaliação NPS do Cliente):** Exibir após o pagamento no celular a tela de avaliação de 5 estrelas com botão de compartilhar elogio no Google Meu Negócio.
- **Passo 3 (Polimento Visual Moderno):** Refinar o visual das telas para eliminar qualquer aspecto de formulário antigo, trazendo cantos suavemente arredondados, micro-interações fluídas, estados de hover claros e contraste visual de alto nível.
