# RFC 0015 — Experiência visual do repositório

- Status: aceita
- Escopo: frontend, apresentação e acessibilidade

## Contexto

O tema já possuía identidade institucional, modos claro/escuro e perfis por
autoridade. A home começava diretamente em um campo de pesquisa; no celular,
os controles ocultavam seus textos e o contexto da pesquisa encostava no campo.
A página simples do trabalho ocupava apenas dez das doze colunas e colocava
todos os dados acadêmicos antes do resumo no mobile. Links de atividade se
assemelhavam a contagens estáticas.

## Decisão

Usar `home-news`, já registrado no tema, para uma introdução institucional com
um h1, descrição curta e dois links: busca `academic_works_search` e
`/community-list`. Isso atualiza o template vazio da RFC 0002 sem reintroduzir
publicidade da plataforma. A home oficial mantém a busca e os carregamentos.

Preservar rótulos visíveis na pesquisa mobile e permitir ao seletor de escopo
ocupar uma linha própria. Manter o modal existente, com foco e Escape fornecidos
pelo NgbModal. O SCSS do formulário sobrescreve localmente o limite oficial de
150 px do seletor para permitir uma linha completa no mobile. O cabeçalho
reorganiza marca, menu e ferramentas abaixo de 768 px.

Organizar a página simples em uma grade de arquivos, conteúdo e dados acadêmicos.
No desktop, arquivos e metadados ficam na lateral; abaixo de 992 px, aparecem na
ordem arquivos, conteúdo, metadados, igual ao DOM. Publication continua usando
o mesmo template e SCSS. O resumo permanece justificado conforme a RFC 0006.
As condições e componentes de download, anexos, mídia e campos são preservados.

O cartão de arquivos recebe uma fotografia decorativa do corredor da biblioteca,
com baixa saturação e opacidade sobre a superfície azul do tema. A imagem fica
restrita a esse cartão para dar contexto institucional à página sem competir
com título, resumos e dados acadêmicos. Miniaturas e controles de acesso
permanecem em primeiro plano; o fundo não representa a capa do trabalho.

Usar sublinhados persistentes nos links de conteúdo e setas decorativas após
os rótulos de navegação institucional, registro completo e atividade dos perfis.
O link de registro completo deixa de declarar `role="button"`. Os títulos de
curso e campus passam de h5 para h2, coerentes com os demais campos.

## Implementação

- `frontend/themes/custom/app/home-page/home-news/`;
- `frontend/themes/custom/app/header/`;
- `frontend/themes/custom/app/shared/search-form/search-form.component.html`;
- `frontend/themes/custom/app/item-page/simple/item-types/untyped-item/`;
- templates e SCSS dos perfis Person;
- estilos globais e traduções `pt-BR`/`en` do tema.

Não há novos serviços, dependências, patches ou registros de componentes.
Campos, consultas preexistentes, idiomas de metadados, políticas, configurações
de implantação e dados persistidos conservam seus contratos.

## Consequências operacionais e validação

Produção exige uma nova imagem Angular pelo workflow existente; trocar apenas
o YAML de runtime não publica estas mudanças. O watcher local sincroniza tema
e traduções. Não é necessária reindexação nem migração de banco.

Compilar com DSpace Angular 10.1, verificar os testes existentes de inicialização
do tema e revisar foco, links, busca, perfis e página do trabalho em larguras
mobile, tablet e desktop. Resultados e limites da execução estão na
[revisão de UX/UI](../docs/referencia/revisao-ux-ui.md).

## Evolução da home — 22/10/2026

A abertura `home-news` fica integralmente preservada. A composição passa a usar
uma extensão `HomePageComponent`, com três prioridades: pesquisar, descobrir
registros recentes e navegar por comunidades. Busca ocupa uma seção própria;
recentes e comunidades ficam lado a lado a partir de 992 px e em coluna abaixo
disso. A home pesquisa todo o repositório, sem seletor de escopo; o refinamento
continua disponível na página de resultados.

`HomeRecentRecordsComponent` herda a consulta, ordenação, tamanho configurado e
navegação para mais resultados do componente oficial `RecentItemListComponent`.
A prévia mostra título completo, distinção entre perfil de pessoa e registro do
acervo, e curso quando disponível. O título usa a resolução oficial de rotas de
entidades. Não mostra miniaturas vazias nem resumos longos. A consulta inclui
Person; por isso o texto fala em registros, sem apresentar todos como trabalhos.

A extensão `TopLevelCommunityListComponent` herda o carregamento oficial e mostra
uma prévia da página de comunidades retornada, com nomes e links. Descrições,
contagem de paginação e RSS deixam de ocupar a home; o link “Ver todas as
comunidades” leva ao catálogo completo. Não há promessa de exibir toda a árvore
na prévia. As duas listas possuem estados de carregamento, erro e vazio.

Os registros eager incluem a home e a lista de comunidades; o componente de
recentes é importado diretamente pela home. CMS, COAR, sugestões e o ramo
`showDiscoverFilters` são mantidos. Novos textos têm versões pt-BR e inglês,
e as superfícies usam os tokens existentes para temas claro e escuro.

Esta evolução substitui a afirmação anterior de que não há novos registros de
componentes. Não muda consultas REST, políticas, metadados persistidos ou
implantação. Produção exige nova imagem Angular; o watcher aplica os arquivos
em desenvolvimento. Validação e limites estão na revisão de UX/UI.
