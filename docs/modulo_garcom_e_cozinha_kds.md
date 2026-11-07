# Especificação: Módulo do Garçom & Tela da Cozinha (KDS)

**Documento de Operação e Usabilidade**  
**Data:** 03/11/2026  
**Projeto:** Tá na Mesa (A2i Solutions)  
**Módulo:** 3. Aplicativo Operacional do Garçom e KDS (*Kitchen Display System*, ou Sistema de Cozinha)

---

## 1. Princípio Fundamental: "Democratização e Fricção Zero"

O cliente **NUNCA** é obrigado a escanear QR Code (*Código de Resposta Rápida*), usar celular ou ter intimidade com tecnologia para ser bem atendido.

* **Se o cliente quiser usar o celular:** Ele tem a experiência completa e transparente (cardápio digital, comanda em tempo real, chamar garçom pelo botão).
* **Se o cliente não quiser ou não souber usar celular:** O garçom conduz 100% do atendimento com total agilidade através do seu próprio dispositivo, garantindo que a noite do cliente seja acolhedora, humana e sem complicação.

---

## 2. O Aplicativo do Garçom (Comanda Mobile / Smart POS)

Desenhado para ser ultra-leve, funcionando no celular do garçom ou em maquininhas Smart POS (*Terminais de Pagamento Inteligentes* com tela sensível ao toque, como Stone, PagBank ou Cielo).

### 2.1. Abertura Rápida de Comandas na Mesa (Sem depender do cliente)
Quando o garçom chega à Mesa 04 com 2 casais:
1. O garçom toca na `Mesa 04`.
2. O sistema pergunta: *"Comanda única ou separada?"*.
3. O garçom seleciona: **"Comandas Separadas"**.
4. Ele pergunta os nomes na maior simpatia e digita apenas:
   * `[+ Nova Comanda]` $\rightarrow$ Nome: **Fábio** (Comanda 01)
   * `[+ Nova Comanda]` $\rightarrow$ Nome: **Cunhada** (Comanda 02)
5. Pronto! Em menos de 5 segundos, a Mesa 04 tem duas comandas ativas e personalizadas, sem exigir nada dos clientes.

```
+-------------------------------------------------------------+
|  MESA 04 - SALÃO                   [ + Adicionar Comanda ]  |
+-------------------------------------------------------------+
|  [ Comanda 01: FÁBIO ]             [ Comanda 02: CUNHADA ]  |
|  Total: R$ 0,00                    Total: R$ 0,00           |
|  Itens: (Vazio)                    Itens: (Vazio)           |
|  [ + LANÇAR ITENS ]                [ + LANÇAR ITENS ]       |
+-------------------------------------------------------------+
```

### 2.2. Lançamento Rápido em 3 Toques
Para a operação do bar/restaurante ser rápida em noites cheias:
1. O garçom toca em `[+ Lançar]` na comanda do Fábio.
2. Abre a grade com fotos e botões grandes dos mais pedidos:
   * Toca em `[Cerveja Original]` $\rightarrow$ Quantidade `[2]`.
   * Toca em `[Espetinho Picanha]` $\rightarrow$ Ponto: `[Ao Ponto]` $\rightarrow$ Adicional: `[Com Farofa]`.
3. Clica em **[CONFIRMAR PEDIDO]**.
4. O pedido é transmitido instantaneamente para a tela da cozinha (KDS) e para a impressora do bar.

### 2.3. Notificações de Chamadas de Mesas
Se algum cliente da mesa optar por usar o celular e apertar o botão de socorro:
* O celular/maquininha do garçom vibra e exibe uma notificação amigável:  
  🔔 *"Mesa 04 (Fábio) está solicitando atendimento / Mais gelo"*.

---

## 3. A Tela da Cozinha (KDS - *Kitchen Display System*)

Em vez da cozinha depender apenas de papeizinhos amassados ou perdidos perto da chapa, um tablet ou monitor de computador fica fixado na parede da cozinha.

```
+-----------------------------------------------------------------------------------------+
|  TÁ NA MESA - COZINHA (KDS)                                             Horário: 21:45  |
+-----------------------------------------------------------------------------------------+
|  PEDIDO #112            |  PEDIDO #114             |  PEDIDO #115                       |
|  MESA 04 (FÁBIO)        |  DELIVERY #52 (JOÃO)     |  MESA 04 (CUNHADA)                 |
|  Tempo: 04 min 🟢       |  Tempo: 11 min 🟡        |  Tempo: 01 min 🟢                  |
|  ---------------------  |  ----------------------  |  --------------------------------  |
|  2x Espetinho Picanha   |  1x Smash Burger         |  1x Espetinho Frango com Bacon     |
|  * Obs: Ponto p/ mal    |  * Obs: Sem cebola       |  * Obs: Bem passado                |
|  * Com farofa e vinagr. |  1x Batata Frita Média   |                                    |
|                         |                          |                                    |
|  [ TOCAR: PRONTO ]      |  [ TOCAR: PRONTO ]       |  [ TOCAR: PRONTO ]                 |
+-----------------------------------------------------------------------------------------+
```

### 3.1. Clareza Absoluta na Cozinha
* O cozinheiro vê com destaque para quem é o prato:  
  **MESA 04 (FÁBIO)** vs. **MESA 04 (CUNHADA)**.
* Isso garante que, quando o garçom vier buscar na bandeja, ele já sabe exatamente na mão de quem entregar, sem ter que ficar perguntando na mesa: *"Quem foi que pediu a picanha?"*.

### 3.2. Disparo do Aviso "A Caminho da Mesa"
* Quando o cozinheiro termina de assar o espetinho, ele apenas toca com o dedo na tela em **[PRONTO]**.
* Nesse exato segundo:
  1. O pedido some da fila de preparo da cozinha;
  2. O garçom recebe o aviso no bolso: *"Espetinho da Mesa 04 pronto para servir"*;
  3. Se o Fábio estiver olhando o celular dele na mesa, a tela dele atualiza automaticamente:  
     🟢 *"Seu pedido está pronto e a caminho da sua mesa!"*.

---

## 4. Fechamento da Conta pelo Garçom

Quando a noite termina (ou quando um dos casais vai embora mais cedo):
1. O garçom abre a Mesa 04.
2. Toca na comanda de quem vai pagar (ex: *Cunhada*).
3. Mostra o valor na tela da maquininha: R$ 44,00.
4. Passa o cartão ou apresenta o Pix.
5. Clica em **[Confirmar Pagamento]**.
6. A comanda da cunhada é encerrada. Se ela quiser cupom fiscal ou recibo, o garçom imprime na hora na maquininha.
7. A comanda do Fábio continua aberta normalmente.

---

## 5. Resumo da Harmonia Operacional

| Perfil do Cliente | Como é a Experiência |
| :--- | :--- |
| **Cliente Tradicional** (sem traquejo com celular) | Senta, é atendido pelo garçom pelo nome, pede tudo com fala humana, confere a conta com o garçom e paga na maquininha. Fricção zero. |
| **Cliente Conectado** (gosta de acompanhar tudo) | Escaneia o QR Code, vê tudo o que o garçom lançou, acompanha a cozinha em tempo real, pede complementos pelo celular e confere os centavos da conta. |


---

## 6. Sincronização e Conexão de Comandas com o Garçom

Quando o garçom abre a Mesa 04 com comandas presenciais (ex: *Fábio* e *Cunhada*), o aplicativo do garçom exibe o estado de conexão de cada uma:

* 📱 **Comanda 01: Fábio** [ Conectado ao Celular 🟢 ] (Significa que o Fábio escaneou o QR Code da mesa e vinculou seu próprio aplicativo).
* 📋 **Comanda 02: Cunhada** [ Apenas Garçom / Presencial ⚪ ] (Significa que a cunhada ainda está sendo atendida apenas pelo garçom de forma tradicional).

### 6.1. Ação de Conexão Rápida pela Maquininha Smart POS
Se o cliente pedir ajuda ao garçom para conectar:
* O garçom clica no ícone de QR Code ao lado da comanda da Cunhada.
* A maquininha gera um QR Code temporário na tela.
* A cunhada aponta a câmera do celular dela e a vinculação acontece no mesmo segundo!
