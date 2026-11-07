# Memorial Base do Tá na Mesa

**Versão:** 1.0  
**Atualizado em:** 02/11/2026  
**Projeto:** A2i Solutions  
**Responsável pelo produto:** Fábio Barbosa  
**Status:** conceito e protótipos visuais em exploração. Não há implementação funcional confirmada neste memorial.

## 1. Para que serve este documento

Este memorial reúne a visão atual do Tá na Mesa, decisões expressas por Fábio, fluxos descritos nas conversas e referências visuais vistas no Google Stitch. Ele serve como base de continuidade para produto, design e desenvolvimento.

O documento separa a visão definida de ideias ainda abertas. As telas do Stitch são protótipos: não tornam cores, logotipo, telas ou funcionalidades decisões finais, nem comprovam que algo já esteja implementado.

## 2. Definição do produto

O Tá na Mesa é uma plataforma para organizar a operação de estabelecimentos de alimentação e oferecer ao cliente uma experiência de atendimento transparente e conectada.

No salão, o cliente poderá acompanhar o próprio atendimento e o preparo do pedido em tempo real. O serviço básico continua funcionando mesmo que ele não instale o aplicativo: o garçom usa o Tá na Mesa na operação normal. Se o cliente optar por instalar o aplicativo, ele escaneia o QR Code aberto pelo garçom e entra na sessão ativa da mesa. Assim, pode ver os itens que já foram lançados, acompanhar o andamento e falar diretamente com o garçom.

A proposta combina experiência de atendimento e ferramentas de operação para o comerciante. O Tá na Mesa não deve reter pagamentos nem controlar o dinheiro das vendas. O estabelecimento recebe diretamente e mantém autonomia financeira.

## 3. Objetivos e valor esperado

### Para o cliente

- Saber quais itens foram lançados na comanda e acompanhar o estado de cada pedido.
- Receber atualizações em tempo real, como pedido recebido, em preparo e pronto para ser levado à mesa.
- Ser avisado quando o pedido estiver a caminho da mesa.
- Falar diretamente com o garçom pelo aplicativo, quando estiver usando essa experiência.
- Conferir a conta antes de pagar e avaliar o atendimento após o fechamento.
- Conseguir ser atendido normalmente sem instalar o aplicativo.

A experiência deve transmitir cuidado e previsibilidade. O cliente não precisa ficar tentando descobrir se o pedido foi recebido ou em que etapa está.

### Para o estabelecimento

- Operar mesas, pedidos, comandas e atendimento em um só sistema.
- Conectar salão, cozinha e caixa com atualizações sobre o mesmo pedido.
- Oferecer uma experiência melhor sem entregar para uma plataforma o controle dos recebimentos.
- Ter uma solução simples de implantar e manter, com custo acessível para negócios locais.

## 4. Princípios atuais do produto

1. **O processo deve ficar visível ao cliente.** O aplicativo deve mostrar o que está acontecendo com o pedido e com a conta da mesa.
2. **O aplicativo do cliente é opcional para o atendimento básico.** O garçom consegue abrir a mesa, lançar os pedidos e conduzir o atendimento usando o sistema.
3. **A entrada do cliente deve aproveitar a sessão existente.** Ao escanear o QR Code da mesa ativa, ele deve ver as informações lançadas antes de instalar ou abrir o aplicativo.
4. **As atualizações precisam ser em tempo real.** Ações do garçom, da cozinha e do caixa devem refletir na visão do cliente e nas telas internas.
5. **O dinheiro das vendas fica com o estabelecimento.** O Tá na Mesa não deve receber, reter ou repassar o valor dos pedidos.
6. **A cobrança do produto deve ser simples e acessível.** A direção atual é cobrar uma implantação inicial e uma mensalidade fixa acessível, sem uma estrutura que deixe o comerciante dependente de grandes projetos.
7. **A operação deve continuar simples para o pequeno negócio.** Configuração, cardápio, treinamento e uso diário precisam ser padronizáveis.
8. **O visual ainda está em aberto.** Nenhuma cor, logo ou tela vista no Stitch está aprovada como identidade final.

## 5. Fluxo principal no salão

Este é o fluxo desejado descrito por Fábio. Os nomes finais dos estados e quem altera cada um ainda precisam ser definidos.

| Etapa | Ação | Resultado esperado |
|---|---|---|
| 1. Abrir atendimento | O garçom abre a mesa ou comanda no Tá na Mesa. | A sessão da mesa fica ativa. |
| 2. Gerar QR Code | O sistema apresenta um QR Code ligado àquela sessão. | O cliente consegue entrar na sessão correta, sem criar outro pedido independente. |
| 3. Atender sem aplicativo | Se o cliente não instalar o app, o garçom segue o atendimento normal e registra os itens. | O estabelecimento usa o Tá na Mesa sem exigir instalação do cliente. |
| 4. Entrar pelo aplicativo | Se o cliente instalar o app, escaneia o QR Code que o garçom abriu. | O cliente passa a ver os itens já lançados e os estados atuais da comanda. |
| 5. Interagir | O cliente pode chamar ou conversar diretamente com o garçom pelo app. | A solicitação chega à operação do estabelecimento. O formato exato dessa comunicação ainda será definido. |
| 6. Preparar o pedido | A cozinha recebe o pedido e atualiza o andamento, por exemplo, para “em preparo”. | O estado muda nas telas internas e na tela do cliente. |
| 7. Levar à mesa | Quando a cozinha libera o pedido para o garçom buscar, o cliente recebe um aviso de que o pedido está chegando à mesa. | O cliente entende que o preparo terminou e que o serviço está a caminho. |
| 8. Conferir a conta | O cliente confere os itens e confirma que está de acordo com o total apresentado. | A conta fica pronta para pagamento direto ao estabelecimento. |
| 9. Pagar no estabelecimento | O cliente paga no caixa ou ao garçom, usando a maquininha ou outro meio aceito pelo comerciante. | O dinheiro é recebido diretamente pelo estabelecimento. |
| 10. Dar baixa e avaliar | Após o pagamento, a conta aparece como paga no app e o cliente pode avaliar a experiência. | A comanda é fechada e o ciclo termina. |

### Ponto importante sobre a baixa do pagamento

A intenção é que o cliente veja a conta baixada no próprio aplicativo depois de pagar no estabelecimento. Como o Tá na Mesa não deve processar nem reter o dinheiro, ainda é necessário definir como essa confirmação chega ao sistema. As opções a avaliar são uma confirmação pelo caixa ou garçom, ou uma integração informativa com o terminal de pagamento. Em qualquer opção, o Tá na Mesa não deve guardar valores para repasse.

A confirmação do cliente de que concorda com a conta não deve ser tratada como pagamento concluído.

## 6. QR Code, sessão e acesso

O QR Code deve apontar para um atendimento ativo da mesa. O cenário central é o cliente entrar depois que o garçom já abriu a comanda e já lançou itens.

Essa experiência exige definir:

- Como o QR Code é criado, renovado e encerrado com a sessão da mesa.
- Se todas as pessoas da mesa veem a mesma comanda ou se cada cliente vê somente os próprios itens.
- Como impedir que alguém fora da mesa acesse a conta ao fotografar ou compartilhar o QR Code.
- Como tratar divisão da conta, troca de mesa, encerramento e reabertura de atendimento.
- Se o acesso será por aplicativo nativo, aplicativo instalável/PWA ou outra solução.

Esses pontos são requisitos de produto e segurança. Não devem ser resolvidos com suposições durante a implementação.

## 7. Áreas e perfis previstos

A visão reúne diferentes partes da operação. As responsabilidades abaixo são uma organização inicial para orientar o levantamento, não uma especificação final de permissões.

### Cliente

Consulta o cardápio, entra na sessão da mesa pelo QR Code, acompanha pedidos e conta, recebe avisos, interage com o garçom e avalia a experiência. A instalação do app oferece a experiência ampliada, mas não deve ser uma condição para receber atendimento.

### Garçom

Abre mesas ou comandas, lança itens, acompanha o que precisa ser servido, atualiza os estados sob sua responsabilidade e recebe solicitações do cliente. Deve continuar conseguindo operar mesmo quando o cliente não usa o app.

### Cozinha

Recebe os pedidos, acompanha a fila e informa estados de preparo e liberação. Os eventos da cozinha devem chegar às telas do garçom e do cliente.

### Caixa

Confere o total, recebe o pagamento diretamente para o estabelecimento e registra a baixa no sistema. O método exato de confirmação da baixa ainda está em aberto.

### Gestão do estabelecimento

Configura o negócio, cardápio, mesas, equipe e permissões; acompanha a operação; e consulta informações de gestão. O escopo de estoque e relatórios precisa ser priorizado para o MVP.

## 8. Tá na Mesa Restaurante e Tá na Mesa Delivery

O nome-base escolhido atualmente é **Tá na Mesa**. A ideia de marca é separar as vertentes em:

- **Tá na Mesa Restaurante**, para a experiência no estabelecimento.
- **Tá na Mesa Delivery**, para pedidos entregues ao cliente.

A expressão “Tá na Mesa” também funciona para o delivery porque o pedido pode chegar à mesa do cliente em casa. A divisão entre vertentes está indicada como direção de produto, mas ainda faltam decisões sobre se serão áreas de um único aplicativo, produtos separados ou fases diferentes de lançamento.

Conversas anteriores consideraram cardápio e pedidos por link, retirada local e delivery do próprio estabelecimento, sem frota de entrega do Tá na Mesa no MVP. Como agora o delivery está sendo tratado como outra vertente, essa decisão antiga precisa ser confirmada antes de entrar no escopo.

Para a vertente delivery ainda faltam definir a jornada de pedido fora do salão, área atendida, taxa, pedido mínimo, previsão, retirada, responsável pela entrega e estados visíveis ao cliente.

## 9. Relação com o Alô Classificados

O Alô Classificados é pensado como um canal gratuito para atrair e cadastrar negócios locais. Muitos comerciantes podem precisar de um sistema de cardápio e gestão além da divulgação. O Tá na Mesa pode atender essa necessidade.

A relação de produto é:

1. O comerciante encontra o Alô Classificados e anuncia gratuitamente.
2. Quando precisar organizar cardápio, pedidos e atendimento, conhece o Tá na Mesa.
3. O Tá na Mesa oferece as ferramentas de operação com implantação e mensalidade acessível.

Essa relação é uma estratégia de prospecção e crescimento. Uma integração técnica entre os produtos não está confirmada. A proposta anterior de levar anúncios do Alô ao cardápio do Tá na Mesa pode ser avaliada, mas não deve ser tratada como funcionalidade pronta.

## 10. Modelo de cobrança e autonomia financeira

A direção atual é cobrar:

- Uma taxa única de implantação, relacionada ao trabalho inicial de configurar o estabelecimento.
- Uma mensalidade fixa e acessível pelo uso do sistema.

Os valores, o conteúdo da implantação, limites de uso, suporte e eventuais planos ainda não foram definidos. A implantação precisa ser padronizada para não depender de um projeto caro e personalizado para cada comerciante.

O Tá na Mesa não deve centralizar os pagamentos dos pedidos, reter o dinheiro, fazer repasses ou deixar o comerciante esperando a liquidação de vendas. O comerciante recebe no próprio caixa, maquininha ou meio de pagamento escolhido por ele. O sistema pode registrar o total e o status da conta, sem ser o responsável pelo fluxo financeiro da venda.

## 11. Referências do Google Stitch

O projeto acessado no Stitch tem o título visível **“Tela de Entrada Global”** e reúne várias telas e explorações visuais. A referência está em:

https://stitch.google.com/projects/4400156484921244637

Na exploração visual observada aparecem:

- Uma entrada com opções para escanear o QR Code da mesa, entrar como cliente ou entrar como restaurante.
- Um fluxo de cadastro do estabelecimento com identidade visual, logo, paleta de cores, fontes e fotos.
- Telas para cadastro e gestão de garçons, permissões e mesas.
- Telas de comandas divididas, pedidos por mesa e movimentação de itens.
- Telas relacionadas a recebimento, conta bancária, Pix, retiradas e histórico de retiradas.
- Uma configuração visual de taxa de serviço de 10% com opção para direcioná-la ao garçom.
- Explorações com paleta verde escura e outras com fundo claro, vermelho e branco.

Esses elementos ajudam a entender a amplitude imaginada, mas continuam sendo referências visuais. A identidade, a taxa de serviço e cada função precisam de decisão explícita antes de serem implementadas.

### Telas financeiras e a regra de não intermediar pagamentos

Há telas no Stitch que mostram dados de conta, Pix e retiradas. O propósito delas ainda não está definido. Elas podem sugerir uma gestão financeira ou repasse que conflita com a regra atual de que o comerciante mantém o próprio dinheiro. Não implementar movimentação, retenção ou retirada de valores com base nessas telas. Primeiro esclarecer se a intenção era apenas registrar informações, administrar gorjetas ou explorar uma hipótese descartada.

## 12. Escopo funcional candidato

A lista abaixo reúne capacidades discutidas ou visualizadas. Ela é um inventário para priorização, não uma promessa de que tudo fará parte do primeiro lançamento.

- Cadastro do estabelecimento e configuração básica.
- Cardápio com produtos, fotos, descrições, preços, ingredientes, combos e informações alimentares.
- Mesas, sessões ativas, QR Codes e comandas.
- Lançamento de pedidos pelo garçom e, se definido, pelo cliente.
- Fila e painel da cozinha.
- Estados do pedido e notificações em tempo real.
- Comunicação entre cliente e garçom.
- Conta, divisão de comanda, conferência e fechamento.
- Registro de pagamento confirmado pelo estabelecimento.
- Avaliação após o atendimento.
- Cadastro de equipe e permissões.
- Controle simples de estoque e relatórios, caso confirmados para o escopo inicial.
- Jornada de delivery, retirada e acompanhamento em fase a definir.

## 13. Proposta de sequência de trabalho

Esta sequência é uma sugestão para transformar a ideia em implementação sem tentar entregar todas as áreas ao mesmo tempo.

### Etapa 1: inventariar o protótipo

Listar todas as telas do Stitch, organizar por perfil e fluxo, separar variações visuais e registrar o que parece ser só exploração. Apontar telas que precisam de decisão, principalmente pagamentos, retiradas, gorjetas, entrega e identidade visual.

### Etapa 2: fechar o fluxo mínimo do salão

Desenhar o caminho completo: abrir mesa, gerar QR, lançar pedido, cliente entrar depois, cozinha atualizar, pedido chegar à mesa, conferir conta, pagar diretamente ao comerciante, baixar a conta e avaliar.

### Etapa 3: definir regras de acesso e eventos

Definir o que o cliente vê ao entrar por QR Code, como as telas se atualizam em tempo real e quem registra cada mudança de estado. Definir também como a sessão termina e como o pagamento fica marcado como concluído.

### Etapa 4: construir uma primeira fatia funcional

Implementar um fluxo demonstrável de ponta a ponta para restaurante, com dados de teste e sem processar pagamentos reais. Confirmar as permissões e sincronização entre cliente, garçom e cozinha antes de ampliar para outros módulos.

### Etapa 5: expandir para gestão e delivery

Depois de validar o fluxo do salão, priorizar gestão de equipe, relatórios, estoque e a vertente Tá na Mesa Delivery. A ordem final deve ser decidida conforme os parceiros-piloto e o esforço de implantação.

## 14. Pontos em aberto

1. O cliente precisa instalar um aplicativo nativo ou a experiência pode funcionar por PWA?
2. O QR Code dá acesso à comanda completa, a uma pessoa ou a um conjunto de pedidos compartilhados?
3. O cliente poderá lançar itens pelo app ou apenas acompanhar e falar com o garçom na primeira versão?
4. Quais estados exatos do pedido existem e quem os altera?
5. A mensagem “pedido chegando à mesa” será disparada quando a cozinha marcar como pronto ou quando o garçom retirar o pedido?
6. Quem confirma a baixa do pagamento depois que o cliente paga no caixa ou na maquininha?
7. A divisão da conta será por pessoa, por item ou apenas em comandas separadas?
8. Como será o chat ou chamada do garçom e quais solicitações podem ser feitas?
9. Delivery entra no primeiro MVP, numa fase seguinte ou num produto separado?
10. A entrega será sempre responsabilidade do estabelecimento na primeira fase?
11. Estoque, relatórios, taxas de serviço e gorjetas entram no MVP?
12. Qual é o valor da implantação e da mensalidade, e o que cada uma inclui?
13. Quais logo, cores, tipografia e estilo visual serão escolhidos?
14. Quais limites de suporte e manutenção cabem na mensalidade acessível?

## 15. Orientações para continuidade técnica

- Usar este memorial como referência da visão do produto, preservando a separação entre decisões, protótipos e propostas.
- Inspecionar o projeto do Stitch antes de redesenhar telas ou assumir que uma tela representa a versão final.
- Não copiar automaticamente a paleta verde, a paleta vermelha e branca ou qualquer logo como identidade aprovada.
- Não implementar pagamento integrado, custódia de saldo, repasse ou retirada de dinheiro sem uma nova decisão explícita do responsável pelo produto.
- Tratar a baixa do pagamento como uma confirmação de que o comerciante recebeu, não como prova de que o Tá na Mesa movimentou o valor.
- Usar dados fictícios em demonstrações e não apresentar telas de protótipo como funcionalidades em produção.
- Priorizar a sessão da mesa e a sincronização em tempo real como eixo do primeiro fluxo.
- Manter um registro de mudanças com data, telas ou arquivos afetados, decisões tomadas, testes realizados e pendências.

## 16. Resumo para abertura de uma nova sessão

“Vamos iniciar o desenvolvimento do Tá na Mesa com base neste Memorial Base. A proposta é uma experiência completa para restaurantes e clientes, com atendimento normal pelo garçom e acompanhamento opcional em tempo real pelo aplicativo do cliente, conectado à sessão da mesa por QR Code. O Tá na Mesa deve organizar pedidos, cozinha, comandas e atendimento, enquanto o comerciante recebe diretamente e mantém o controle do dinheiro. O Alô Classificados gratuito pode prospectar estabelecimentos para o Tá na Mesa. O nome-base é Tá na Mesa, com as vertentes Restaurante e Delivery em planejamento. As telas do Stitch são protótipos e não definem a identidade visual nem confirmam funcionalidades implementadas. Primeiro inventarie as telas, organize os fluxos e aponte as decisões pendentes. Preserve como prioridade a experiência em tempo real, a implantação simples, a mensalidade acessível e a autonomia financeira do comerciante.”
