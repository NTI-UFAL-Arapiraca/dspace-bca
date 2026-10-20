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
preserva os interceptores de autenticação do DSpace. O conteúdo autorizado é
carregado como Blob e entregue ao visualizador local por uma URL temporária.
Trocar de aba ou sair da página cancela o pedido em andamento e libera a URL.
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
de releases diferentes no cache do navegador. A leitura usa o endpoint de
conteúdo normal e pode ser contabilizada nas estatísticas de acesso ao arquivo.

Os títulos do tema usam peso 500; o cabeçalho do leitor usa 18 px e espaçamento
compacto, seguindo o pedido de uma apresentação menos pesada.

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

O Blob exige transferir o PDF inteiro antes da leitura, somente quando o leitor
entra na tela; não há streaming por intervalos. Apenas o documento selecionado
fica carregado. O viewer oficial administra as páginas visíveis, sem manter
um canvas próprio por página no tema. PDFs grandes ainda consomem memória do
navegador. O link “Abrir arquivo” permanece disponível para leitura externa.

Validar build de navegador e SSR, lint, seleção de PDFs, paginação da API,
permissão negada sem pedido de conteúdo, erros/retry, liberação de recursos,
ausência de PDFs e troca de abas. Inspecionar PDF realmente renderizado e
controles em desktop e mobile. Os resultados executados estão registrados na
[revisão de UX/UI](../docs/referencia/revisao-ux-ui.md).

Fontes: [release e hashes da Mozilla](https://github.com/mozilla/pdf.js/releases/tag/v6.4.299)
e [API do PDF.js](https://mozilla.github.io/pdf.js/api/draft/).
