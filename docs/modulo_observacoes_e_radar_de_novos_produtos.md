# Módulo de Substituições Inteligentes & Radar de Novos Produtos (Leads de Cardápio)

**Especificação Funcional e Estudo de Caso de Laboratório**  
**Data:** 03/11/2026  
**Projeto:** Tá na Mesa • Uma Solução A2i Solutions  
**Responsável pelo Produto:** Fábio Barbosa  

---

## 1. O Problema Real de Campo (Caso de Laboratório)

Em visitas frequentes a lanchonetes e pastelarias (como o case do Hot Dog & Cia), ocorre com frequência o seguinte cenário:
* A cliente solicita um **Pastel de Camarão com Cream Cheese**.
* No cardápio oficial, o estabelecimento possui camarão puro, com catupiry, com cheddar ou com mussarela, mas **não possui a opção com cream cheese**.
* Da mesma forma, em um **Pastel de Queijo tradicional** (mussarela), a cliente solicita misturar com **queijo de coalho**.
* O garçom precisa intervir manualmente. No entanto, os sistemas convencionais (como iFood ou PDVs legados) tratam qualquer inclusão como **"Adicional Pago"** (+ R$ 4,00 a R$ 6,00).

### O Atrito do "Adicional" versus "Substituição":
* **Adicional:** O cliente consome o ingrediente base + um novo insumo. Há custo extra real de insumo para o restaurante.
* **Substituição:** O cliente está **abrindo mão** de um ingrediente nobre (ex: Catupiry) para receber outro equivalente (ex: Cream Cheese). O estabelecimento economiza o catupiry na chapa/recheio. Cobrar como adicional gera atrito, sensação de injustiça e constrangimento no atendimento.

---

## 2. A Inovação do Tá na Mesa: Duas Soluções Integradas

O Tá na Mesa resolve essa dor com uma abordagem dupla: **Operacional** (na ponta do pedido) e **Estratégica** (na inteligência de negócios do proprietário).

### Solução A: Mecanismo de Troca e Preferência no Pedido (Cliente & Garçom)
1. **Substituição Sem Fricção (R$ 0,00):** O cliente ou garçom seleciona:
   * *"Trocar Catupiry por Cream Cheese"* (Sem cobrança duplicada abusiva).
2. **Chips de Ponto e Preferência:**
   * `[Pastel bem clarinho]` | `[Pastel bem tostado]` | `[Sem cebola]` | `[Sem milho]` | `[Molho à parte]`.
3. **Observação Clara para a Cozinha:**
   * O KDS (*Kitchen Display System*) da cozinha exibe o destaque em caixa alta e fundo âmbar para o chapeiro não errar.
   * O cupom térmico imprime a observação entre asteriscos destacados.

---

### Solução B: "Radar de Demandas Especiais" (Leads de Novos Produtos para o Dono)

Nos sistemas tradicionais de food-tech, a caixa de observação é uma "lata de lixo digital": o chapeiro lê, frita o pastel e a informação é deletada para sempre.

No **Tá na Mesa**, toda observação e substituição é indexada pelo motor de inteligência:
* O sistema contabiliza a recorrência de pedidos customizados durante o mês.
* No painel do Gestor (**Relatórios & BI**), cria-se o relatório: **"Radar de Demandas Especiais & Tendências Não Atendidas"**.
* O comerciante visualiza claramente:
  * *"7 clientes pediram Pastel de Camarão com Cream Cheese este mês!"*
  * *"5 clientes pediram Pastel de Queijo com Queijo de Coalho misturado!"*
  * *"12 clientes pediram pastel 'bem clarinho'!"*

### O Botão Mágico: `[➕ Transformar em Novo Produto no Cardápio]`
Com apenas 1 clique no relatório, o proprietário do restaurante:
1. Oficializa o **"Pastel de Camarão com Cream Cheese"** como um item oficial do cardápio com seu respectivo preço de tabela.
2. Cria o seletor permanente de **Ponto de Fritura** (*Clarinho* / *Dourado* / *Crocante*).
3. Transforma um atrito de atendimento em **crescimento de ticket médio e expansão inteligente de mix de produtos baseada no desejo real dos clientes**.
