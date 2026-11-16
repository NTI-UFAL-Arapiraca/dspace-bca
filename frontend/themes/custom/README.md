# Tema customizado

Este diretório é sobreposto a `/app/src/themes/custom` da imagem oficial antes
da compilação. O DSpace Angular já registra o tema chamado `custom`; não é
necessário alterar `angular.json` para usar os arquivos SCSS abaixo.

Os registros mantidos um nível acima, em `frontend/themes/*.ts`, habilitam os
componentes eager e listable do tema. Eles são necessários para que overrides
de componentes e páginas entrem no bundle final, além do CSS do tema.

Arquivos mantidos inicialmente:

- `styles/_theme_sass_variable_overrides.scss`: cores, fontes e variáveis Sass;
- `styles/_theme_css_variable_overrides.scss`: variáveis CSS dos componentes;
- `styles/_global-styles.scss`: regras CSS globais adicionais;
- `assets/`: logotipos, favicons, fontes e traduções próprias. Os arquivos em
  `assets/i18n/` são mesclados aos idiomas oficiais antes do build;
- `app/header/`: cabeçalho institucional com o brasão da UFAL e identificação
  do Campus Arapiraca;
- `app/item-page/simple/item-types/untyped-item/`: página usada pelos itens
  migrados, incluindo ano de publicação, data de defesa, orientador e membros
  avaliadores abaixo dos autores.
- `app/item-page/simple/item-types/publication/`: reutiliza a apresentação
  acadêmica para trabalhos com tipo Publication;
- `app/entity-groups/research-entities/item-pages/person/`: perfis com abas
  de autoria, orientação, coorientação e banca.

Os campos de pessoas mostram links a partir de seus UUIDs de autoridade.
Curso e campus usam os novos campos locais e aparecem como links para uma busca
pública filtrada pelo valor. O componente `academic-metadata-link.component.ts`
aponta para a configuração `academic_works_search` em
`backend/config/spring/api/academic-discovery.xml`. As abas dependem das buscas
configuradas nesse arquivo e da reindexação Discovery;
`item.showAuthorityRelations` está ativado no YAML.
O detalhe de UntypedItem e Publication também mostra os valores de
`local.cnpq.area` com o rótulo “Grande área CNPq”, preservando código e nome.
O campo é descritivo e pode conter mais de uma categoria.

O `assets/site.webmanifest` fornece o nome, as cores e os ícones para instalação da interface como atalho no Android. A configuração de runtime declara o manifesto, mantém o `apple-touch-icon` para iOS/iPadOS e define a cor do navegador. Os ícones PNG de 192 e 512 px usam `images/ufal_logo.png`; o arquivo maskable
também deriva dessa imagem, com fundo branco e margem segura para recortes Android. O
manifesto usa `/dspace/` como `start_url` e escopo, conforme o caminho público
documentado.

Os títulos de páginas e abas do navegador usam as traduções
`repository.title` e `repository.title.prefix` em `assets/i18n/`. O nome público
do backend (`DSPACE_NAME`) continua sendo a fonte para os títulos das
estatísticas. Alterações nos catálogos do tema exigem uma nova imagem Angular
em produção.

O componente `app/home-page/home-news/` usa a extensão oficial para a abertura
da home: eyebrow institucional, título, descrição, a busca do repositório como
ação principal e os números do acervo (`overview/home-stats.component.ts`).
Os números vêm da busca e das facetas da configuração `academic_works_aggregates`
(RFC 0025); nada é inventado no tema e falhas resultam em blocos ocultos.

Desde a RFC 0026 não há fotografia de fundo nem textura decorativa nas páginas:
o conteúdo fica sobre o fundo `--ufal-paper`. Publicar alterações do tema exige
uma nova imagem Angular.

## VLibras

O tema carrega ativamente o VLibras Widget oficial, sem token, por
`app/root/root.component.ts`, mantendo o template raiz do DSpace 10.1.
`app/accessibility/vlibras.service.ts` executa após render somente no navegador,
fora da zona Angular; `vlibras-widget.ts` conserva um único script/widget ao
navegar entre rotas. A posição documentada `R` deixa o botão flutuante à direita,
40 px acima da altura padrão, sem reservar coluna no celular nem mudar o
prefixo `/dspace`.

Produção exige nova imagem Angular. Consulte a
[referência da integração](../../../docs/referencia/vlibras.md) e a
[RFC 0022](../../../rfc/0022-vlibras-widget.md) para CSP, limites de idioma/PDF,
disponibilidade do serviço e verificações. Os resumos estrangeiros continuam
visíveis; a tradução documentada pelo VLibras é de português para Libras.

## Estatísticas

`app/statistics-page/` substitui a apresentação das quatro páginas oficiais de
estatísticas (repositório, item, coleção e comunidade). A busca dos relatórios,
as rotas e a restrição administrativa continuam sob responsabilidade do DSpace.
O relatório do repositório é exibido como ranking de registros, incluindo
trabalhos e perfis quando retornados pela API; seus pontos não são somados para
criar um total global. Um número de visualizações para item,
coleção ou comunidade aparece somente quando o relatório contém um ponto do
mesmo tipo e UUID do objeto consultado. O cartão de arquivos soma apenas os
pontos de bitstream retornados em `TotalDownloads` para o item; como o relatório
pode limitar a lista, o rótulo deixa claro que não é necessariamente um total de
todos os arquivos. Aceita `downloads` e o `views` usado pelo backend local, nessa
ordem. Meses com valor zero são mantidos, e localização aparece somente quando
houver dados.

As barras incluem números legíveis e os relatórios completos ficam disponíveis
em tabelas expansíveis. Tipos futuros de relatório recebem a tabela mesmo sem
visualização própria. Os valores indicam eventos de uso, não visitantes únicos.
Os rótulos são mesclados nos catálogos pt-BR e en existentes. Como essa extensão
é compilada no tema, a produção requer uma nova imagem Angular.

## Identidade visual

Na navegação por data, os seletores sem valor exibem “Ano” e “Mês” em telas
abaixo de 576 px, usando o breakpoint XS do DSpace. Os nomes acessíveis completos
e as opções selecionadas são preservados. A extensão em
`app/shared/starts-with/date/` herda a lógica oficial de filtragem e registra-se
no carregador de filtros por data pelo bundle eager. Produção exige nova imagem
Angular.

O sistema visual Folha de Rosto (RFC 0026) usa Source Serif 4 para títulos de
página e conteúdo acadêmico (títulos de trabalhos, resumos) e Inter para a
interface. As fontes variáveis ficam em `assets/fonts/`, com as licenças OFL, e
são declaradas em `styles/_fonts.scss` com os subconjuntos latin e latin-ext.

O azul institucional (`#006da5`) identifica links e ações principais. O azul do
brasão (`#0994dc`) e o vermelho (`#ed1c24`) são decorativos: o vermelho aparece
no filete de 24 px do eyebrow (`.ufal-eyebrow`). Os tokens `--ufal-*` em
`_theme_css_variable_overrides.scss` e `_color-modes.scss` definem papel, tinta,
texto secundário, linhas, campos e estados de acesso (aberto, embargo,
restrito) nos modos claro e escuro. Essas derivações são escolhas de interface,
não uma nova especificação oficial da marca. O brasão do cabeçalho é oficial;
a logo da Biblioteca é provisória e não é usada.

Links e botões não têm sublinhado permanente. Os links de texto usam uma linha
que se expande no hover ou foco de teclado; a transição respeita a preferência
por movimento reduzido. A regra global também remove os sublinhados dos
componentes oficiais, mantendo os indicadores de foco e os estados de superfície.
Nos nomes de pessoas da página do item, o fundo usa `box-decoration-break: slice`
em um span inline: o sublinhado percorre a primeira linha antes de continuar na
seguinte, mantendo uma única animação de 220 ms e o ícone fora do efeito.
Atalhos com superfície própria, como “Caminhos para descobrir”, comunidades e
cartões de novidades e atividade, usam o destaque de fundo/borda em hover e foco,
sem acrescentar sublinhado. Links de texto, como “Ver mais registros” e
“Ver todas as comunidades”, mantêm a linha animada.

Os controles de usuário do cabeçalho usam um grupo nomeado, com navegação
nativa por Tab e Shift+Tab. A classe `institution-header__tools` preserva o
alinhamento e o espaçamento independentemente do papel acessível do grupo.

No menu móvel, `#header-navbar-wrapper` fornece o bloco de referência para a
navegação posicionada de forma absoluta. Isso evita que o Safari, inclusive no
modo de design responsivo, calcule largura zero a partir do host inline do
componente oficial. O estado e a animação do menu continuam sob responsabilidade
do DSpace. Produção exige uma nova imagem Angular.

O breadcrumb usa a extensão oficial em `app/breadcrumbs/`, registrada no bundle
eager. Abaixo de 768 px, mantém início e página atual em uma única linha;
quando há níveis intermediários, oculta seus links e indica a omissão com
reticências decorativas. Títulos longos usam o espaço restante com truncamento
visual, preservando o texto completo no DOM e no título nativo da página atual.
A partir de 768 px, todos os níveis e links continuam visíveis. O componente
herda o serviço e a visibilidade oficiais; produção exige nova imagem Angular.

Nas buscas com filtros laterais — pesquisa global, comunidades, coleções e
resultados nos perfis de pessoas, além da home quando exibe filtros Discovery —,
a partir de 768 px, apenas os filtros têm rolagem vertical independente, com a
barra de rolagem oculta e sem rolagem horizontal. A altura máxima fica limitada
à janela, com espaço de 2 rem. A lateral permanece visível durante a rolagem da
página, que inclui os resultados. Em telas menores, permanece o painel de
filtros móvel oficial. A regra identifica o componente de faceta `ds-search-filter`
no layout com lateral e fica em `styles/_global-styles.scss`; produção exige uma
nova imagem Angular.

As cores e medidas do Bootstrap são definidas no arquivo de variáveis Sass;
as variáveis `--ds-*` integram os componentes do DSpace e as `--ufal-*`
compartilham os tokens próprios com os estilos dos perfis. Os ajustes globais
entram depois dos estilos base para preservar a precedência do tema.

Em telas abaixo de 768 px, o controle “Pesquisar” do cabeçalho abre uma janela
de pesquisa com foco no campo e fechamento por botão, Escape ou envio da busca. Ela consulta
todo o repositório, sem herdar filtros da página atual nem expandir sobre os
outros controles. As barras de pesquisa preservam os textos dos controles.
No celular, o seletor de escopo ocupa uma linha própria, deixando espaço para a consulta e o botão
“Pesquisar”. O botão de ferramentas também mantém seu texto visível. No desktop,
a expansão original da busca do cabeçalho é preservada.

Abaixo da barra, no mobile, um resumo informa a comunidade/coleção selecionada
e os filtros aplicados, usando os rótulos fornecidos pelo Discovery. Sem
restrições, mostra “Pesquisando em todo o repositório”. O resumo acompanha as
mudanças da busca; os controles existentes continuam permitindo remover filtros.
Enquanto o Discovery carrega os rótulos, informa “Pesquisa com filtros aplicados”,
sem apresentar uma busca restrita como se fosse em todo o repositório.
Na página `/search`, retirar o escopo consulta novamente todo o repositório,
sem reutilizar a coleção inicial como valor padrão da paginação. Essa extensão
não altera os escopos fixos das pesquisas em comunidades, coleções ou perfis.

A página simples do trabalho, compartilhada com Publication pelo mesmo
template e por `work/academic-item-imports.ts`, segue a folha de rosto:
`work/work-context.component.ts` mostra tipo, curso, campus e ano; depois vêm o
título, a autoria e a orientação, e o cartão `work/work-access.component.ts`.
O cartão usa o arquivo principal (ou o primeiro do ORIGINAL) com o componente
oficial de download, o selo oficial de acesso (`item.showAccessStatuses`),
mensagens para arquivo restrito ou ausente, copiar link permanente e
compartilhar; no celular, uma barra fixa de download aparece quando o cartão
sai da tela. “Dados do trabalho” reúne curso, campus, grande área, datas,
idioma do documento (`work/work-language.component.ts`) e banca; “Registro”
reúne URI, coleções, licença e relações. Os estilos ficam em
`styles/_work-page.scss`, porque alcançam a marcação interna de componentes
oficiais. Os links e a rota de metadados completos exigem o privilégio de
administrador; isso não altera as respostas da API REST nem as regras
`metadata.hide.*` do backend.

Na área de informações, `app/item-page/simple/abstracts/` consulta o item com
`projection=allLanguages` e usa somente os valores de `dc.description.abstract`.
Assim, todos os resumos disponíveis aparecem sem trocar o idioma da página:
português primeiro (Resumo), inglês depois (Abstract), seguidos dos demais na
ordem original. Espanhol, francês, alemão e italiano usam títulos próprios;
outros idiomas usam “Resumo (Língua)”, com o nome obtido por `Intl.DisplayNames`
e fallback para o qualifier. Valores sem idioma usam “Resumo”. Nenhum idioma é
deduzido de `dc.language.iso`.

Cada texto tem uma prévia de até **10 linhas**, no desktop e no celular, e
“Ver mais”/“Ver menos” independente quando há transbordamento real. A medição
acompanha mudanças de largura. O conteúdo completo permanece no HTML, com
Markdown sanitizado e atributo `lang`, e pode ser lido integralmente por
tecnologias assistivas. Os botões alteram somente o recorte visual, sem anunciar
um estado de conteúdo recolhido por `aria-expanded`. Em falha de rede, o resumo
já disponível permanece visível, acompanhado de aviso e botão para tentar
novamente. Os demais campos e as buscas continuam usando a resposta localizada.
Essa mudança requer nova imagem Angular em produção; o watcher local sincroniza o tema.
Consulte a [RFC 0018](../../../rfc/0018-resumos-publicos-em-todos-os-idiomas.md).

A avaliação, as prioridades e a matriz de validação estão na
[revisão de UX/UI](../../../docs/referencia/revisao-ux-ui.md); a decisão de
composição está na [RFC 0015](../../../rfc/0015-experiencia-visual-do-repositorio.md).

## Rodapé institucional

`app/footer/` personaliza o componente oficial do rodapé. Identifica a
Biblioteca em texto, agrupa os links por público (repositório, pesquisadores,
acessibilidade e privacidade), oferece a coleta OAI-PMH (RFC 0011) e o mapa do
site (RFC 0012) e mantém cookies, privacidade, acordo de usuário e COAR quando
habilitados. A logo da GTI em Arapiraca continua no rodapé. O conteúdo da rota
`info/privacy` substitui o modelo genérico do DSpace por um aviso em português
do Brasil; o override está em `frontend/overrides/` e é aplicado nos
Dockerfiles de desenvolvimento e produção.

## Leitura integrada de PDFs

`app/item-page/simple/pdf-preview/` adiciona uma área de leitura abaixo dos
metadados de UntypedItem e Publication. O componente é importado diretamente
pelas duas páginas e carregado quando entra na tela. PDFs do bundle ORIGINAL
usam o principal configurado ou a ordem existente, com abas para arquivos
adicionais. A permissão de download é verificada antes de buscar o conteúdo;
restrições e solicitações de cópia continuam com o link oficial do DSpace.
Em telas a partir de 768 px, as abas reservam três espaços e dividem a mesma
linha igualmente entre todos os arquivos quando houver mais de três. Os títulos
ficam centralizados. Abaixo de 768 px, um seletor HTML nativo substitui as abas:
o toque abre a lista do navegador/sistema com a indicação de principal. Os nomes
têm no máximo 48 caracteres, com reticências no meio e o final/extensão
preservados; nomes menores permanecem inteiros. O nome completo continua no
rótulo acessível e no título nativo. O campo fechado adapta as reticências à
largura disponível, preservando o final/extensão como nas abas. O primeiro PDF,
principal quando configurado, continua selecionado por padrão. Os dois controles
compartilham a seleção e um único leitor; mudar
a largura da tela preserva o documento aberto. Com apenas um PDF, nenhum seletor
é exibido. Nas abas, os nomes ocupam uma linha, com reticências no meio e
final/extensão preservados. O helper `pdf-filename.ts`
separa o texto sem modificar o nome do arquivo. O nome completo permanece no
rótulo acessível, no título nativo da aba e no título acessível do iframe.
A seleção usa abas segmentadas sobre uma faixa neutra, com a aba ativa em azul
e texto branco, sem as bordas vermelhas superior e inferior. O cursor de mão
indica que as abas são clicáveis; hover e foco de teclado têm estados próprios.
A aba ativa ou o seletor nativo identifica o PDF selecionado.
Cancelar/fechar visualização e “Baixar PDF” ficam junto à introdução “Leia o
trabalho”, no cabeçalho, com botões de mesmo tamanho e formato: vermelho para
cancelar/fechar e azul para baixar. Os controles quebram linha em telas pequenas.
O link de download é recriado por arquivo para manter URL e autorização
correspondentes à seleção.
O tamanho do arquivo aparece na abertura opcional, antes de carregar o conteúdo.

Os dois Dockerfiles instalam o PDF.js 6.4.299 em `src/assets/pdfjs`, com versão
e hash verificados por `frontend/patches/install-pdf-viewer.mjs`. Worker, fontes
e traduções são locais. Scripts dos PDFs e edição ficam desativados. Nenhum
serviço externo recebe o documento. `frontend/overrides/pdf-range-viewer.mjs`
conecta o transporte oficial por intervalos ao HttpClient do Angular, mantendo
autorização e tokens na página principal. Apenas os trechos necessários são
pedidos em blocos de 64 KiB, sem antecipar o arquivo restante. A estrutura interna
do PDF também pode exigir muitos trechos, até o arquivo completo; não há garantia
de um pedido por página. Busca textual, impressão ou download
podem exigir o PDF inteiro. Fechar ou trocar o arquivo cancela os pedidos
pendentes e desmonta o leitor, preservando os trechos completos já recebidos.
Ao voltar para um PDF, o serviço reaproveita esses bytes e pede somente os
intervalos que faltam, sem somá-los novamente ao contador de transferência.
Pedidos simultâneos de um mesmo intervalo compartilham a requisição HTTP.

O cache fica apenas na memória do componente, separado por UUID, URL de conteúdo,
tamanho e checksum do arquivo. O limite compartilhado entre os PDFs do item é
64 MiB; ao excedê-lo, os trechos menos usados são descartados e podem precisar
ser baixados novamente. Sair da página, recarregar o catálogo ou mudar de usuário
limpa o cache. A autorização continua sendo verificada pelo serviço oficial do
DSpace, que possui seu próprio cache. A escolha de abrir um PDF grande vale
durante a visita, evitando pedir confirmação novamente a cada troca de aba.

A partir de 20 MiB, ou quando o navegador sinaliza economia de dados/conexão
lenta, o leitor aguarda “Carregar visualização”. O download oficial permanece
visível. A política está em `pdf-preview-policy.ts`; a API de conexão é opcional,
não identifica franquias e não está disponível em todos os navegadores.
O caminho de assets inclui o sufixo `-range-2` para invalidar a configuração anterior.

Reconstrua a imagem de desenvolvimento para instalar o viewer inicialmente;
os componentes e estilos seguintes continuam sincronizados pelo watcher.
Produção exige nova imagem. A decisão está na
[RFC 0016](../../../rfc/0016-preview-integrado-de-pdfs.md). Os títulos usam peso
500 e o cabeçalho do leitor tem tamanho e espaçamento compactos.
O reaproveitamento de bytes entre abas está descrito na
[RFC 0019](../../../rfc/0019-cache-de-intervalos-dos-pdfs.md) e não exige mudar os
assets do PDF.js; o watcher aplica os ajustes locais do tema.

Testes rápidos (Node 22.18 ou posterior, com remoção nativa de tipos TS):

```bash
node --test tests/frontend/*.test.mjs
```

Na árvore Angular preparada, os specs direcionados podem ser executados com:

```bash
npm test -- --include='src/themes/custom/app/item-page/simple/pdf-preview/*.spec.ts'
```

## Tema claro e escuro

O botão de lua/sol no cabeçalho alterna entre os dois modos. Uma primeira
visita sempre usa o tema claro, independentemente da preferência do sistema.
A escolha explícita fica no `localStorage`, na chave `ufal.color-mode`, e é
compartilhada entre abas do mesmo navegador. Sem acesso ao armazenamento,
a troca continua funcionando durante a visita.

`app/color-mode/color-mode.service.ts` mantém a preferência e o estado do botão,
sem acessar APIs do navegador durante SSR. `_color-modes.scss` contém a paleta
escura e as adaptações dos componentes. A transição de cores dura 240 ms e
respeita `prefers-reduced-motion`; a restauração inicial não é animada.

Os dois Dockerfiles aplicam `frontend/patches/apply-color-mode-init.mjs` ao
`src/index.html` oficial, incluindo `frontend/overrides/color-mode-init.js`
antes das folhas de estilo. Isso restaura a preferência antes de Angular
carregar, evitando um clarão claro no modo escuro. Mudanças nesse inicializador
exigem reconstruir a imagem de desenvolvimento, além da imagem de produção.

Para verificar a inicialização e o patch, execute na raiz do repositório:

```bash
node --test tests/frontend/color-mode-init.test.mjs
```

Para substituir um componente, crie neste diretório o mesmo caminho existente
em `src/themes/custom` da versão `dspace-10.1`. Por exemplo, um cabeçalho pode
ser sobrescrito em `app/header/`. O caminho e as importações devem acompanhar a
mesma versão definida por `DSPACE_ANGULAR_TAG`.

O fluxo de desenvolvimento está no [guia de inicialização local](../../../docs/guias/inicializacao-local.md).
A publicação da imagem pelo GitHub/GHCR e a recriação dos containers ficam no
[guia de operação](../../../docs/guias/operacao.md). O YAML de runtime é
montado separadamente da imagem compilada.

## Composição da home

A extensão `app/home-page/home-page.component.*` organiza a abertura
(`home-news`), a exploração por curso, tipo e ano
(`overview/home-explore.component.ts`) e os trabalhos recém-adicionados. As
facetas `course`, `itemtype` e `publicationYear` e os recentes consultam a
configuração `academic_works_aggregates`, que exclui Person (RFC 0026). As
barras de ano somam valores pelo ano (`overview/year-series.ts`) e cada barra
leva à busca filtrada por aquele ano. Os estilos dos blocos ficam em
`styles/_home.scss`. CMS, COAR, sugestões e a opção de filtros Discovery
continuam na composição. Produção exige nova imagem Angular. A decisão está na RFC 0026.
