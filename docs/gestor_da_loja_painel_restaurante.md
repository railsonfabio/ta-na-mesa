# Especificação: O Gestor da Loja (Painel do Restaurante / PDV)

**Documento de Engenharia e Operação**  
**Data:** 03/11/2026  
**Projeto:** Tá na Mesa (A2i Solutions)  
**Módulo:** 2. Gestor de Pedidos, Mapa de Mesas e Painel Operacional

---

## 1. Visão Geral do Painel

O **Gestor da Loja** é o coração operacional do comerciante. Inspirado nas melhores práticas do gestor do iFood e do InstaDelivery, ele foi desenhado para rodar diretamente no navegador do computador, notebook ou tablet do balcão/caixa, sem exigir instalações complexas.

Ele unifica duas operações que antes ficavam separadas:
1. **Pedidos de Delivery e Retirada:** pedidos que chegam de clientes em casa via link do cardápio ou Alô Classificados.
2. **Pedidos de Salão e Mesas:** comandas abertas pelos garçons ou clientes nas mesas físicas do restaurante.

```
+--------------------------------------------------------------------------------------------------+
|  [LOGO] TÁ NA MESA  -  HOT DOG & CIA       Status: [ 🟢 LOJA ABERTA ]   🔔 Som: ATIVO            |
+--------------------------------------------------------------------------------------------------+
|  Abas: [ 📋 Pedidos & KDS ]   [ 🍽️ Mapa de Mesas ]   [ 🍔 Cardápio Rápido ]   [ ⚙️ Configurações ] |
+--------------------------------------------------------------------------------------------------+
|  NOVOS (2)              |  EM PREPARO (3)         |  PRONTOS / EXPEDIÇÃO (1)|  FINALIZADOS (14)  |
|  (Alerta sonoro ativo)  |                         |                         |                    |
|                         |                         |                         |                    |
|  +--------------------+ |  +--------------------+ |  +--------------------+ |  +---------------+ |
|  | #108 - DELIVERY    | |  | #106 - MESA 04     | |  | #105 - RETIRADA    | |  | #104 - MESA 02| |
|  | João Silva • 2 min | |  | 2x Smash Burger    | |  | 1x Combo Família   | |  | R$ 78,00      | |
|  | 2x Hot Dog Especial| |  | Tempo: 12 min      | |  | Cliente: Marcos    | |  | [Pago]        | |
|  | Total: R$ 36,00    | |  +--------------------+ |  +--------------------+ |  +---------------+ |
|  | [ACEITAR E IMPRIMIR| |  | [PRONTO P/ SERVIR] | |  | [CONCLUIR ENTREGA] | |                    |
|  +--------------------+ |  +--------------------+ |  +--------------------+ |                    |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. O Fluxo de Pedidos em Quadro Kanban (*Sistema Visual de Cartões*)

O painel organiza a produção em 4 colunas principais:

### 2.1. Coluna 1: Novos Pedidos (Pendentes de Aceite)
* **Alerta Sonoro Contínuo (Sino de Pedido):** Quando entra um novo pedido (seja delivery ou da mesa), o sistema toca um som contínuo até que o atendente clique em **"Aceitar"**.
* **Visualização do Cartão:** 
  * Identificação imediata: tag azul para `🛵 Delivery`, tag roxa para `🛍️ Retirada` e tag verde para `🍽️ Mesa`.
  * Tempo decorrido desde o envio (ex: *"Recebido há 1 min"*).
  * Lista resumida dos itens e valor total.
* **Ações Rápidas:**
  * **Botão [ACEITAR]:** Move o pedido para a coluna "Em Preparo", dispara a impressão automática e envia para a cozinha.
  * **Botão [REJEITAR / CANCELAR]:** Abre modal para justificar o motivo (ex: *"Produto esgotado"*, *"Fora da área de entrega"*).

### 2.2. Coluna 2: Em Preparo (KDS - *Kitchen Display System*, ou Sistema de Cozinha)
* Cronômetro progressivo: exibe há quantos minutos o prato está sendo produzido (com cores de alerta: verde até 15 min, amarelo até 25 min, vermelho acima de 30 min).
* Permite à cozinha ou ao atendente sinalizar quando o prato está pronto.

### 2.3. Coluna 3: Prontos / Expedição
* **Se for Delivery:** o operador clica em **"Despachar com Motoboy"** e seleciona o entregador cadastrado.
* **Se for Mesa (Salão):** ao clicar em **"Pronto"**, o sistema dispara automaticamente a mensagem para o celular do cliente e do garçom: *"Seu pedido está a caminho da sua mesa!"*.

### 2.4. Coluna 4: Finalizados do Dia
* Histórico dos pedidos concluídos na data, com filtro rápido de busca por número da comanda ou nome do cliente.

---

## 3. O Módulo de Salão: Mapa Visual de Mesas

Para estabelecimentos com salão físico, o lojista conta com uma aba dedicada de **Mapa de Mesas**:

```
+------------------------------------------------------------------------------------+
|  MAPA DO SALÃO                                  Ocupação: 6 / 12 Mesas (50%)       |
+------------------------------------------------------------------------------------+
|  [ MESA 01 ]        [ MESA 02 ]        [ MESA 03 ]        [ MESA 04 ]              |
|  🟢 LIVRE           |  🔴 OCUPADA      |  🔴 OCUPADA      |  🟡 PEDINDO A CONTA    |
|  --                 |  Consumo: R$ 85  |  Consumo: R$ 42  |  Total: R$ 130,00      |
|  [Abrir Mesa]       |  3 pessoas       |  Tempo: 20 min   |  [DIVIDIR / RECEBER]   |
+---------------------+------------------+------------------+------------------------+
|  [ MESA 05 ]        [ MESA 06 ]        [ MESA 07 ]        [ MESA 08 ]              |
|  🟢 LIVRE           |  🔔 CHAMANDO     |  🔴 OCUPADA      |  🟢 LIVRE              |
|  --                 |  Garçom Solicit. |  Consumo: R$ 64  |  --                    |
|  [Abrir Mesa]       |  [ATENDER]       |  Tempo: 45 min   |  [Abrir Mesa]          |
+------------------------------------------------------------------------------------+
```

### Indicadores por Cores das Mesas:
1. 🟢 **Verde (Livre):** Mesa pronta para receber novos clientes. O garçom pode abrir na hora.
2. 🔴 **Vermelha (Ocupada):** Há clientes consumindo, com valor acumulado visível no cartão.
3. 🔔 **Laranja Pulsante (Chamando Atendimento):** O cliente apertou o botão "Chamar Garçom" ou "Pedir Gelo" no celular.
4. 🟡 **Amarela (Aguardando Fechamento / Conta):** O cliente ou o garçom solicitaram o encerramento da conta.

---

## 4. Impressão Térmica Automática

Assim como no InstaDelivery, os restaurantes dependem da impressão de tickets em bobina térmica (padrões de largura **58mm** ou **80mm**):

### Como funciona no Tá na Mesa:
1. **Impressão sem diálogo de tela:** O sistema se conecta com as impressoras térmicas locais (conectadas via cabo USB, Rede Ethernet ou Bluetooth) e imprime no instante em que o pedido é aceito.
2. **Divisão de Vias de Impressão:**
   * **Via de Cozinha (Comanda de Produção):** Imprime apenas os itens de comida com fonte grande, destacando observações como *"SEM CEBOLA"* ou *"PONTO BEM PASSADO"*.
   * **Via de Bar / Balcão:** Imprime os pedidos de bebidas, sucos e sobremesas.
   * **Via de Entrega / Conferência:** Imprime a comanda com dados do cliente, endereço completo, valor da entrega, troco necessário e chave Pix da loja.

---

## 5. Fechamento de Caixa e Baixa de Pagamento

Reforçando o princípio sagrado do Tá na Mesa: **não retemos dinheiro nem cobramos porcentagem**. O pagamento é 100% recebido pelo restaurante.

### O Processo de Baixa no Caixa / Gestor:
1. O cliente confere o valor da conta.
2. O operador no caixa (ou o garçom com a maquininha física) seleciona o método de pagamento real utilizado:
   * `[ Cartão de Crédito ]` (Maquininha do próprio restaurante)
   * `[ Cartão de Débito ]`
   * `[ Dinheiro ]` (com cálculo de troco automático)
   * `[ Pix Direto ]` (conferência do comprovante na conta bancária do lojista)
3. **Divisão da Conta:** Conforme especificado, o operador pode clicar em **"Dividir Conta"**, registrar os pagamentos parciais e abater o saldo progressivamente até zerar.
4. **Botão Final [DAR BAIXA E LIBERAR]:**
   * A mesa volta a ficar 🟢 Livre no mapa.
   * O cliente recebe a confirmação em seu celular.
   * O valor entra nos relatórios de vendas do dia do restaurante.

---

## 6. Controle Rápido de Cardápio (Pausar Itens)

Durante a correria de uma sexta-feira ou sábado à noite, ingredientes acabam. O painel traz um botão de atalho chamado **"Cardápio Rápido"**:
* O atendente digita *"Bacon"* ou *"Coca-Cola Lata"*.
* Com **um único clique em uma chave (liga/desliga)**, o produto fica marcado como **"Esgotado hoje"**.
* No mesmo segundo, o item fica indisponível para pedidos tanto no cardápio de Delivery quanto nas mesas do salão, evitando reclamações de clientes.


---

## 7. Módulo de Mesas com Múltiplas Comandas (Gestão & Garçom)

No painel do restaurante e no aplicativo do garçom, o mapa de mesas não limita uma mesa física a apenas um pedido.

### 7.1. Visualização de Subcomandas na Mesa
Ao clicar sobre uma mesa ocupada (ex: Mesa 04), o operador visualiza as comandas ativas daquela mesma mesa:
* [Mesa 04] Total Acumulado: R$ 112,00
  * 📋 **Comanda A - Fábio:** 2x Cerveja Original + 2x Espetinho Picanha = R$ 68,00 [Receber]
  * 📋 **Comanda B - Cunhada:** 2x Suco de Laranja + 1x Espetinho Frango = R$ 44,00 [Receber]

### 7.2. Encerramento Parcial sem Liberar a Mesa
* Se uma das comandas for encerrada antes (ex: a Cunhada quer ir embora primeiro):
  1. O operador clica em [Receber Comanda B].
  2. Seleciona o método (Cartão/Pix) e confirma a baixa de R$ 44,00.
  3. A Comanda B fica marcada como Paga e Concluída.
  4. A **Mesa 04 permanece 🔴 Ocupada** com a Comanda A ativa.
  5. Apenas quando a última comanda for quitada é que a Mesa 04 volta automaticamente para o status 🟢 Livre no salão.
