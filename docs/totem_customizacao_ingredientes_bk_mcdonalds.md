# Tá na Mesa • Módulo de Customização de Ingredientes & Operação de Salão (v1.2)

> **Solução Desenvolvida e Mantida por:** **A2i Solutions** (Liderança de Produto: Fábio Barbosa)  
> **Parceiro Comercial & Estratégico:** **Alô Classificados**  
> **Caso Piloto Real:** Operação da lanchonete **Hot Dog & Cia** (Redinha, Natal/RN)  

---

## 1. Visão Geral da Funcionalidade de Customização

Em operações gastronômicas ágeis (como lanchonetes de hot dog prensado, hamburguerias e pastelarias), o cliente frequentemente possui preferências ou restrições alimentares específicas (ex: *"sem cebola"*, *"sem picles"*, *"sem milho"*, *"sem salsicha"*, *"massa clarinha"*).

O **Tá na Mesa** conta com um **Módulo de Customização Detalhada de Ingredientes** integrado tanto na visão do cliente (`/mesa/[numero]`) quanto no terminal do garçom (`/garcom`), com redação 100% autoral, elegante e profissional:

```mermaid
flowchart TD
    A["Mix de Produtos (34 Itens)"] --> B["Toque no Card do Lanche"]
    B --> C["Modal: Ingredientes da Receita"]
    C --> D["🍔 Ingredientes Padrão (Contador 1x)"]
    D -->|Toque em [-] Retirar| E["Contador 0x • ❌ SEM CEBOLA / SEM PICLES"]
    C --> F["✨ Turbinar com Adicionais (+ Bacon, + Cheddar)"]
    C --> G["🧀 Substituições Sem Custo (Ex: Catupiry por Cream Cheese)"]
    C --> H["✍️ Observação Livre (Ex: Carne bem passada)"]
    E & F & G & H --> I["Preview do Cupom da Cozinha"]
    I --> J["Lançamento na Comanda & Cozinha KDS"]
    J --> K["👨‍🍳 Cozinha KDS: ⚠️ ESPECIAL: SEM CEBOLA, SEM PICLES"]
    K --> L["🖊️ Chapeiro Marca Embalagem com Caneta"]
```

---

## 2. Detalhamento da Experiência do Usuário (UX)

### 2.1. Lista de Ingredientes com Setinha Expansível (Accordion)
- **Título Limpo:** `Ingredientes da Receita`.
- **Subtítulo:** `Toque em (-) para retirar o que não deseja`.
- Cada ingrediente possui um contador inteligente:
  - **Quantidade 1x (Padrão):** O ingrediente está presente no sanduíche (`✓ Incluído no lanche (Padrão)`).
  - **Toque em `[-] Retirar` (Quantidade 0x):** O card do ingrediente ganha contorno avermelhado, texto tachado e vira `❌ RETIRADO (SEM CEBOLA)`, `❌ RETIRADO (SEM PICLES)`, etc.
  - **Toque em `[+] Restaurar`:** Retorna o ingrediente para 1x instantaneamente.

### 2.2. Preview do Cupom da Cozinha (Alerta Especial)
- Conforme o usuário ou garçom remove ingredientes ou digita observações, uma caixa destacada em tom âmbar/dourado exibe em tempo real:
  > `⚠️ ESPECIAL: SEM CEBOLA, SEM PICLES • Obs: Carne bem passada`  
  > *\* O chapeiro e garçom recebem este destaque para marcar à caneta na embalagem do lanche.*

### 2.3. Lançamento Rápido em 1-Toque vs Personalização
- **Toque no corpo do card:** Abre o modal completo de ingredientes da receita.
- **Botão `[⚡ 1-Toque]`:** Para bebidas geladas ou pedidos sem alterações, o garçom lança em menos de 0,5 segundo diretamente para a comanda ativa.

---

## 3. Terminal do Garçom: Salão Centralizado & Cores Padrão Gestor

### 3.1. Grade Centralizada com Ícone Minimalista de Mesa
- A barra de mesas foi **centralizada horizontalmente**, utilizando o ícone minimalista de mesa `🍽️ M1`, `🍽️ M2`, etc.
- Ao clicar em *"Todas (10)"*, as mesas quebram em linhas centralizadas e fluidas (`flex-wrap`), garantindo que tanto no computador quanto no celular todas as mesas fiquem 100% visíveis sem barras de rolagem ocultas.
- A mesa atualmente selecionada recebe um anel de destaque em Carvão (`ring-3 ring-[#231F1C] scale-105 shadow-md`).

### 3.2. Regra Unificada de Cores com o Gestor do Salão
O garçom visualiza o status exato das mesas em tempo real utilizando o mesmo código de cores do painel gestor:
- **🟢 Verde (`bg-emerald-50 text-emerald-800 border-emerald-300`):** Mesa **Livre**, pronta para sentar novos clientes.
- **🔴 Terracota (`bg-[#BD4D2D] text-white border-[#A33F23]`):** Mesa **Ocupada**, com clientes e pedidos ativos.
- **🟡 Amarelo Pulsante (`bg-amber-400 text-neutral-950 font-black animate-pulse`):** Mesa **Chamando Garçom**.
- **🔵 Azul (`bg-blue-600 text-white border-blue-700`):** Mesa que **Pediu a Conta** com a maquininha.

---

## 4. Cancelamento & Estorno Operacional de Itens na Comanda

Caso o cliente mude de ideia ou o garçom lance um item por engano antes de ser servido:
- Cada item na lista de consumo da comanda ativa agora possui um **botão de cancelamento rápido** com ícone de lixeira (`Trash2`).
- Ao clicar, o sistema solicita confirmação:  
  `Deseja estornar/cancelar 1x "[Nome do Produto]" da comanda de [Cliente]?`
- Confirmado o cancelamento:
  1. A quantidade é reduzida (ou o item é removido se for unitário).
  2. O valor total da comanda e o consumo da mesa são recalculados instantaneamente.
  3. O pedido correspondente na Cozinha KDS é atualizado/cancelado para evitar desperdício de insumos.
  4. Um evento em tempo real via SSE (*Server-Sent Events*) é emitido notificando a equipe:  
     `🗑️ Garçom cancelou 1x [Produto] da comanda de [Cliente] (Mesa [N])`.

---

## 5. Arquivos e Componentes Atualizados

| Arquivo | Responsabilidade |
| :--- | :--- |
| `components/ProductDetailModal.tsx` | Redação limpa ("Ingredientes da Receita"), remoção de menções a marcas externas e contadores `1x/0x`. |
| `components/WaiterView.tsx` | Centralização das mesas, ícone `🍽️ M[N]`, cores idênticas ao gestor e botão de lixeira para estornar item. |
| `app/garcom/page.tsx` | Handler `handleRemoveItemFromComanda` com estorno da comanda, cancelamento no KDS e sincronização SSE. |
| `components/KitchenView.tsx` | Exibição das personalizações e cancelamento automático de itens não preparados. |
