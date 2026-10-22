# RFC 0016 — Preview integrado de PDFs

- Status: aceita
- Escopo: frontend e build Angular 10.1

## Contexto e prioridades

A página do trabalho exigia abrir o PDF para começar a leitura. A prioridade
é oferecer leitura integrada abaixo dos metadados, com abas quando houver
vários PDFs. Uma incorporação direta da API é bloqueada por seu cabeçalho
`X-Frame-Options: DENY`; o leitor nativo também apresentou uma área vazia no
navegador integrado. Um serviço externo de visualização enviaria o documento
a outro domínio e não atenderia arquivos autorizados com a sessão atual.

## Decisão

Adicionar `PdfPreviewComponent`, importado diretamente por UntypedItem e
Publication. O template compartilhado carrega o componente com `@defer (on
viewport)` depois da grade de descrição e dados acadêmicos. A área ocupa a
largura disponível. Não há novo override listable/eager a registrar.

`PdfPreviewService` usa os serviços DSpace para percorrer todas as páginas do
bundle ORIGINAL e resolver os formatos. Somente `application/pdf` participa.
O PDF principal configurado no bundle aparece primeiro e recebe um selo;
sem principal ou quando ele não é PDF, preserva-se a ordem do bundle. As abas
usam NgbNav, com papéis, associação aos painéis e navegação por teclado.
Importar as diretivas standalone, como o DSpace 10.1; o módulo completo
também exporta a diretiva base e duplica o host directive no Angular 20.
Um único PDF não recebe uma barra de abas. Sem PDFs, a seção não aparece.

Antes de buscar o conteúdo, verificar `FeatureID.CanDownload`. O HttpClient
preserva os interceptores de autenticação do DSpace em cada pedido parcial.
O visualizador local usa `PDFDataRangeTransport`: pede intervalos ao componente,
que os busca pelo link HAL de conteúdo. Apenas callbacks e bytes atravessam a
ponte entre janelas de mesma origem; URLs da API e tokens não entram no iframe.
Copiar cada trecho para um buffer do iframe antes de entregá-lo ao worker,
pois o PDF.js valida o realm de `ArrayBuffer`. Não há Blob do arquivo completo.
Trocar de aba, fechar a visualização ou sair da página cancela os pedidos e o leitor.
Conforme a [RFC 0019](0019-cache-de-intervalos-dos-pdfs.md), os trechos completos
permanecem em memória entre trocas de aba e ao fechar/reabrir na mesma visita.
Não se alteram políticas, cabeçalhos, exposição de metadados ou contratos REST.
Arquivos restritos continuam usando o fluxo oficial de download/solicitação de
cópia por `ThemedFileDownloadLinkComponent`. Autorizações especiais de cópia
não são reproduzidas no preview: o link oficial permanece disponível.

Servir a distribuição **legacy do PDF.js 6.4.299**, da Mozilla, junto aos
assets. `frontend/patches/install-pdf-viewer.mjs` baixa o ZIP oficial durante
o build, verifica o SHA-256 publicado na release e configura o viewer pela
API `AppOptions` antes de iniciá-lo. O viewer conserva worker, fontes, idiomas,
camada de texto, busca, paginação e zoom oficiais. Desabilitar execução de
scripts dos PDFs, edição/anotações, preferências persistentes e download de
modelos de texto alternativo. Remover o documento de exemplo e conservar a
licença. A origem do iframe deriva do `baseURI`, incluindo `/dspace/` em
produção; nenhum documento ou token vai para a Mozilla ou outro serviço.
O caminho de assets inclui a versão para evitar misturar viewer e worker
de releases diferentes no cache do navegador. A integração por intervalos usa
o sufixo `-range-2`, também alterado quando mudar o contrato ou a configuração
da ponte.
A leitura usa o endpoint de conteúdo normal. No DSpace 10.1,
`BitstreamRestController` registra o evento de acesso somente em requisições
sem `Range`. Por isso a visualização parcial não gera um download nas
estatísticas; o download explícito segue o fluxo oficial e sua contagem.
Não emitir pedidos extras de conteúdo apenas para produzir eventos de uso.

Os títulos do tema usam peso 500; o cabeçalho do leitor usa 18 px e espaçamento
compacto, seguindo o pedido de uma apresentação menos pesada.

As ações de cancelar/fechar a visualização e baixar o PDF ficam no cabeçalho
“Leia o trabalho”, junto à descrição introdutória. A faixa com o nome do arquivo
selecionado é removida; a aba ativa identifica a seleção. O nome completo
permanece acessível na aba, no iframe e no link de download. No celular, as
ações podem ocupar outra linha dentro do mesmo cabeçalho. Os dois controles
usam o mesmo tamanho e estilo de botão contornado. O tamanho do arquivo aparece
na abertura opcional para apoiar a escolha de carregar o arquivo.

Recriar o link oficial de download ao mudar de PDF: o componente DSpace 10.1
define URL e autorização em `ngOnInit`. No cabeçalho, a troca de aba não destrói
esse componente automaticamente como ocorria dentro do painel anterior.

### PDFs grandes e economia de dados

O limite inicial de abertura automática é **20 MiB** (`20 * 1024 * 1024` bytes),
centralizado em `pdf-preview-policy.ts`. É uma escolha de produto ajustável
após medir o acervo, não um limite do DSpace. A partir desse tamanho, mostrar
o tamanho, a explicação, “Carregar visualização” e o download oficial, sem
buscar conteúdo nem iniciar o iframe até a escolha explícita.

Quando disponível, `navigator.connection` também exige essa escolha se houver
`saveData`, `effectiveType` slow-2g/2g/3g ou estimativa positiva de `downlink`
inferior a 1 Mbps. Esses sinais são estimativas e não identificam franquia
contratada. Não inferir limitação pelo tamanho da tela ou pela rede celular;
não fazer teste ativo de velocidade. Aplicar a política antes da primeira
abertura de cada arquivo; a escolha fica preservada durante a visita,
conforme a RFC 0019.
Sem essa API, usar o tamanho do PDF. Sem tamanho válido, oferecer apenas o
download, evitando iniciar um transporte parcial com comprimento desconhecido.

O leitor usa blocos de 64 KiB e desativa a antecipação de bytes e o streaming
com as opções `disableAutoFetch: true` e `disableStream: true`, impedindo que
o PDF.js antecipe especulativamente os trechos restantes. A leitura da própria
estrutura do PDF ainda pode exigir todos os bytes. O tamanho efetivo dos
pedidos depende dessa estrutura e das operações do leitor.
O ajuste de 256 para 64 KiB evita transferir blocos grandes ao buscar pequenos
objetos espalhados pelo PDF, ao custo de mais requisições. No PDF local de
968.109 bytes e 41 páginas, a abertura passou de quatro pedidos cobrindo o
arquivo inteiro para onze pedidos somando 705.965 bytes com a primeira página
renderizada. O PDF não é linearizado e seus dicionários de página estão
espalhados pelo arquivo; a validação inicial do PDF.js já precisa de vários deles.
Blocos menores reduzem a leitura excedente, sem alterar o original nem remover
as verificações do parser. Não se garante a mesma economia para outros PDFs.
Busca textual, impressão e download podem exigir o documento completo.
Mostrar bytes efetivamente transferidos, sem uma porcentagem que sugira que
o arquivo inteiro precisa ser carregado. Cancelar/fechar desmonta o iframe
e aborta os pedidos HTTP. Reabrir inicia outro leitor, reutilizando os trechos
completos guardados no cache da página, conforme a RFC 0019.

Exigir HTTP 206 e conferir o comprimento de cada resposta. Se `Content-Range`
estiver exposto, validar também seus limites e o tamanho total. O DSpace local
não expõe esse cabeçalho por CORS, então o transporte não depende dessa exposição.
Com HTTP 200 inesperado, abortar já no evento de cabeçalhos; não fazer fallback
silencioso para baixar o PDF inteiro. Erros mantêm nova tentativa e download.
Preservar CORS, `X-Frame-Options`, autenticação e políticas do backend.

## Arquivos e operação

- `frontend/themes/custom/app/item-page/simple/pdf-preview/`;
- os dois componentes listable e o template/SCSS compartilhado do item;
- traduções e estilos do tema;
- instalador e ambos os Dockerfiles Angular;
- testes em `tests/frontend/pdf-documents.test.mjs` e specs Angular locais.

É necessário reconstruir as imagens de desenvolvimento e produção para
instalar os assets. O watcher continua suficiente para mudanças posteriores
no componente. O build precisa de acesso à release oficial do GitHub e falha
se o hash ou a inicialização esperada do viewer mudar. Atualizações devem
revisar versão, hash, opções e os testes do instalador em conjunto.

## Limites e validação

A integração inicial por Blob foi substituída pelo transporte parcial descrito
acima. Apenas o documento selecionado fica ativo. O viewer oficial administra
as páginas visíveis, sem manter um canvas próprio por página no tema.
PDFs grandes ou digitalizados ainda podem consumir memória significativa;
intervalos reduzem a transferência inicial, sem prometer um pedido por página
ou economia fixa. “Baixar PDF” conserva o fluxo oficial de acesso/cópia.

Validar build de navegador e SSR, lint, seleção de PDFs, paginação da API,
permissão negada sem pedido de conteúdo, erros/retry, cancelamento de pedidos,
política de tamanho/conexão, respostas parciais inválidas, ausência de PDFs
e troca de abas. Inspecionar PDF realmente renderizado e
controles em desktop e mobile. Os resultados executados estão registrados na
[revisão de UX/UI](../docs/referencia/revisao-ux-ui.md).

Fontes: [release e hashes da Mozilla](https://github.com/mozilla/pdf.js/releases/tag/v6.4.299)
e [API do PDF.js](https://mozilla.github.io/pdf.js/api/draft/),
[transporte por intervalos](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFDataRangeTransport.html)
e [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation).
O comportamento das estatísticas foi conferido no
[BitstreamRestController do DSpace 10.1](https://github.com/DSpace/DSpace/blob/dspace-10.1/dspace-server-webapp/src/main/java/org/dspace/app/rest/BitstreamRestController.java).
