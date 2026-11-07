# Especificação: Perfis de Acesso & Isolamento por Dispositivo

**Documento de Segurança, Arquitetura e Permissões (RBAC - *Role-Based Access Control*, ou Controle de Acesso Baseado em Funções)**  
**Data:** 03/11/2026  
**Projeto:** Tá na Mesa (A2i Solutions)  
**Cenário Real de Teste:** 1 Notebook (Gestão Master) + 1 Tablet (Cozinha KDS) + 1 Celular (Cliente na Mesa ou Garçom)

---

## 1. Princípio Fundamental de Isolamento

Cada dispositivo no restaurante cumpre **um papel estrito**. Nenhum perfil deve enxergar dados ou botões que não façam parte da sua função:

```
[ DISPOSITIVO 1: NOTEBOOK ] ──> /gestor  ──> Gestor Master & Caixa
                                            (Acesso Total: Relatórios, Estoque, Financeiro, Fechamento de Caixa)

[ DISPOSITIVO 2: TABLET ]   ──> /cozinha ──> Monitor KDS da Cozinha
                                            (Modo Quiosque: Apenas cartões da chapa em tela cheia com botão PRONTO)

[ DISPOSITIVO 3: CELULAR ]  ──> /mesa/4  ──> Cliente na Mesa 04
                                            (100% Salão: Comanda viva, cardápio da mesa, chamar garçom, sem delivery)
                                      OU
                            ──> /garcom  ──> Terminal do Garçom
                                            (Apenas salão: Lançamento de itens, sem acesso a relatórios financeiros)

[ CLIENTE EM CASA ]        ──> /delivery──> Delivery & Retirada
                                            (Vindo do Alô Classificados: Endereço, taxa por bairro, motoboy)
```

---

## 2. Matriz de Permissões por Papel (*Roles*)

| Funcionalidade / Tela | 👑 Dono / Gestor Master | 🤵 Garçom | 👨‍🍳 Cozinha (KDS) | 📱 Cliente na Mesa | 🛵 Cliente Delivery |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Relatórios Financeiros & Faturamento** | ✅ Acesso Total | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| **Alerta de Estoque & Compras Fornecedor** | ✅ Acesso Total | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| **Quadro Kanban de Pedidos Gerais** | ✅ Sim | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| **Mapa Geral de Mesas do Salão** | ✅ Sim | ✅ Sim | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| **Lançar Itens na Mesa** | ✅ Sim | ✅ Sim (2 toques) | ❌ Bloqueado | ✅ Sim (Na sua mesa) | ❌ Não |
| **Marcar Prato como "Pronto"** | ✅ Sim | ❌ Não | ✅ Sim (Touch KDS) | ❌ Bloqueado | ❌ Bloqueado |
| **Acompanhar Produção do seu Prato** | ❌ Não precisa | ❌ Não precisa | ❌ Não precisa | ✅ Sim (Tempo real) | ✅ Sim (Rastreio) |
| **Chamar Garçom / Pedir a Conta** | ❌ Não precisa | ❌ Não precisa | ❌ Não precisa | ✅ Sim (Botão direto) | ❌ Não |

---

## 3. O Cliente na Mesa: 100% Salão (Sem Misturar Delivery)

Quando o cliente escaneia o QR Code da **Mesa 04**:
1. Ele entra diretamente na URL de salão: `/mesa/4` (ou `/hotdogecia?mesa=4`).
2. A tela **não tem abas de entrega em domicílio nem cálculo de frete**, pois ele já está sentado fisicamente no salão.
3. **Opção "Para Levar" (Takeaway):**
   * Ao escolher um lanche no cardápio da mesa, o cliente tem apenas uma caixinha de seleção sutil:  
     `[ ] Embalar este item para viagem (levar para casa)`.
   * Dessa forma, a cozinha já coloca na sacolinha térmica sem que o cliente precise sair da mesa ou abrir outra sessão.
