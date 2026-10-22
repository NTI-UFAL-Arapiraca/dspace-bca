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
