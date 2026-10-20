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
  migrados, incluindo orientador e membros avaliadores abaixo dos autores.
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

O componente `app/home-page/home-news/` usa a extensão oficial para apresentar
o acervo institucional, com título, descrição e links para pesquisa no acervo
e comunidades. Busca, comunidades e adições recentes continuam herdadas da home
oficial; nenhum total ou conteúdo do acervo é inventado no tema.

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

O azul institucional (`#006da5`) identifica links e ações principais. O vermelho
do brasão (`#ed1c24`) aparece como acento na aba selecionada; ações secundárias
usam cinza azulado para não competir com a navegação. Cores de sucesso, alerta e
erro mantêm o significado definido pelo DSpace.

Fundos claros, superfícies brancas e títulos em azul profundo organizam a
leitura. A tipografia usa fontes do sistema, sem downloads externos. Busca,
comunidades, listas, filtros e cartões dos perfis compartilham espaçamentos,
bordas e raios. O cabeçalho se reorganiza em telas pequenas e os controles
mantêm indicação de foco para uso por teclado.

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

A página simples do trabalho, compartilhada com Publication, usa uma grade
local: arquivos e metadados na lateral, conteúdo na área de leitura. Abaixo de
992 px, a ordem é arquivos, conteúdo e dados acadêmicos, igual à ordem do DOM.
Os componentes oficiais continuam responsáveis por autorização, download,
mídia, licenças e exibição condicional de campos. O resumo permanece justificado
conforme a RFC 0006. Links de registro completo usam semântica de navegação;
cartões de atividade dos perfis exibem rótulos sublinhados e setas decorativas.

A avaliação, as prioridades e a matriz de validação estão na
[revisão de UX/UI](../../../docs/referencia/revisao-ux-ui.md); a decisão de
composição está na [RFC 0015](../../../rfc/0015-experiencia-visual-do-repositorio.md).

## Rodapé institucional

`app/footer/` personaliza o componente oficial do rodapé. A versão local mantém
os links de acessibilidade, cookies, privacidade, acordo de usuário e COAR
quando habilitados, remove o crédito/copyright de DSpace e LYRASIS e o link de
envio de feedback. As logos da Biblioteca UFAL e do NTI ficam alinhadas à direita
no desktop e centralizadas em telas pequenas. Elas são servidas dos assets do
tema; alterações exigem recompilar a imagem Angular de produção.

## Leitura integrada de PDFs

`app/item-page/simple/pdf-preview/` adiciona uma área de leitura abaixo dos
metadados de UntypedItem e Publication. O componente é importado diretamente
pelas duas páginas e carregado quando entra na tela. PDFs do bundle ORIGINAL
usam o principal configurado ou a ordem existente, com abas para arquivos
adicionais. A permissão de download é verificada antes de buscar o conteúdo;
restrições e solicitações de cópia continuam com o link oficial do DSpace.

Os dois Dockerfiles instalam o PDF.js 6.4.299 em `src/assets/pdfjs`, com versão
e hash verificados por `frontend/patches/install-pdf-viewer.mjs`. Worker, fontes
e traduções são locais. Scripts dos PDFs e edição ficam desativados. Nenhum
serviço externo recebe o documento. `frontend/overrides/pdf-range-viewer.mjs`
conecta o transporte oficial por intervalos ao HttpClient do Angular, mantendo
autorização e tokens na página principal. Apenas os trechos necessários são
pedidos, sem antecipar o arquivo restante. Busca textual, impressão ou download
podem exigir o PDF inteiro. Fechar, trocar o arquivo ou sair cancela os pedidos.

A partir de 20 MiB, ou quando o navegador sinaliza economia de dados/conexão
lenta, o leitor aguarda “Carregar visualização”. O download oficial permanece
visível. A política está em `pdf-preview-policy.ts`; a API de conexão é opcional,
não identifica franquias e não está disponível em todos os navegadores.
O caminho de assets inclui o sufixo `-range-1` para invalidar a integração anterior.

Reconstrua a imagem de desenvolvimento para instalar o viewer inicialmente;
os componentes e estilos seguintes continuam sincronizados pelo watcher.
Produção exige nova imagem. A decisão está na
[RFC 0016](../../../rfc/0016-preview-integrado-de-pdfs.md). Os títulos usam peso
500 e o cabeçalho do leitor tem tamanho e espaçamento compactos.

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
