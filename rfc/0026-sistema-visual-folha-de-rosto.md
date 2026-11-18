# RFC 0026 — Sistema visual Folha de Rosto

- Status: aceita
- Escopo: tema Angular, configuração de runtime e configuração Discovery
- Revisa parcialmente as RFCs [0006](0006-alinhamento-justificado-do-resumo.md)
  e [0015](0015-experiencia-visual-do-repositorio.md)

## Contexto

A proposta de redesign (canvas “Redesign Repositório UFAL Arapiraca”) mostrou
que a página do trabalho não dizia, à primeira vista, que trabalho era, quem o
escreveu e orientou e como baixá-lo. Também mostrou que a home listava perfis
de pessoa como novidades, que não havia descoberta por curso, tipo ou ano e
que texturas, fotos e cartões davam o mesmo peso a tudo. A biblioteca aprovou a
direção “Folha de Rosto” e as decisões D1, D2, D6, D7, D8 e D12 do plano de
adoção. Os nomes continuam na forma catalográfica (D3). Citação gerada (D4) e
solicitação de cópia explícita (D5) ficam fora desta RFC.

## Decisão

### Sistema visual

- Source Serif 4 marca títulos de página e conteúdo acadêmico (títulos de
  trabalhos, resumos). Inter é a fonte da interface. As duas são variáveis,
  auto-hospedadas em `assets/fonts/` (SIL OFL 1.1, licenças ao lado) e
  divididas nos subconjuntos latin e latin-ext por `unicode-range`.
- Tokens `--ufal-*` para papel, tinta, texto secundário, linhas, campos e
  estados (aberto, embargo, restrito), com valores próprios no modo escuro.
  O azul do brasão e o vermelho ficam restritos a detalhes decorativos; o
  filete vermelho do eyebrow é o único ornamento.
- As fotos do corredor e da abertura são removidas (revisão da RFC 0015). A
  textura de páginas abertas, sem as lâmpadas, fica restrita à abertura da
  home; as demais páginas usam o fundo liso. O foco passa a 3 px com
  afastamento de 2 px.

### Moldura

- Cabeçalho com busca sempre visível em telas largas; a tecla `/` leva o foco
  à busca, sem interceptar digitação em campos. Tema e idioma têm rótulo.
- Menu público com “Trabalhos” (`academic_works_search`) e “Pessoas”
  (configuração oficial `person`) antes das seções do DSpace; “Comunidades e
  coleções” passa a “Cursos e coleções” (D12).
- Rodapé institucional em texto, sem a logo provisória da Biblioteca, com
  links para coleta OAI-PMH (RFC 0011), mapa do site (RFC 0012) e políticas.

### Página do trabalho (UntypedItem e Publication)

- Ordem do DOM e da leitura: contexto (tipo, curso, campus, ano), título,
  autoria, orientação e coorientação, e o cartão de acesso.
- O cartão de acesso usa o arquivo principal (ou o primeiro do ORIGINAL) e o
  componente oficial de download, com sua autorização e solicitação de cópia.
  Mostra o estado em palavras quando o arquivo é restrito ou inexistente, o
  selo de acesso oficial (D6: `item.showAccessStatuses: true` no YAML), copiar
  link permanente e compartilhar. No celular, uma barra fixa de download
  aparece quando o cartão sai da tela.
- Resumos em serifa com medida de 68 caracteres. O justificado com hifenização
  vale a partir de 768 px; abaixo disso o texto é alinhado à esquerda
  (revisão da RFC 0006, D7). A prévia de 10 linhas da RFC 0018 é mantida.
- “Dados do trabalho” reúne curso, campus, grande área, datas, idioma do
  documento (por nome, independente dos resumos) e banca; “Registro” reúne
  URI, coleções, licença e relações. O registro completo continua só para
  administradores (RFC 0017).

### Listas, home, perfis e coleções

- A linha de resultado de item mostra tipo e ano, título, autoria com
  orientação, curso e campus. O resumo é exibido na página do trabalho.
  A listagem dispensa miniaturas.
- A busca `academic_works_search` exclui Person (D2) e ganha a faceta
  “Grande área CNPq” (`cnpq`, D1). Facetas e filtros ativos são reestilizados
  sem override.
- A home mostra números do acervo, exploração por curso, tipo e ano (facetas
  da configuração `academic_works_aggregates`, RFC 0025) e os trabalhos
  recém-adicionados, que também excluem Person.
- O perfil Person tem cabeçalho bibliográfico com iniciais quando não há foto,
  nota de que não é conta de acesso e papéis como abas com contagem. O e-mail
  segue aparecendo apenas quando a API o entrega.
- A página de coleção mostra total de trabalhos, período e barras por ano.
- Submissão e edição recebem apenas estilo (rótulos, dicas, erros, seções).

## Fora do escopo

- Passo a passo lateral da submissão e histograma de ano na barra lateral da
  busca: exigem override de componentes oficiais não temáveis.
- Citação gerada (D4), solicitação de cópia explícita (D5), nomes em ordem
  natural (D3), listas controladas de curso e área (D11) e conteúdo
  institucional de “Sobre” e “Como depositar” (D9).

## Implementação

- Tema: `styles/` (`_fonts`, `_work-page`, `_search`, `_home`, `_submission` e
  tokens), `app/header/`, `app/navbar/`, `app/footer/`,
  `app/item-page/simple/work/`, item pages, `app/home-page/`,
  `app/collection-page/`, perfil Person, linha de resultado em
  `app/shared/object-list/…/item-search-result-list-element.component.ts` e
  registros eager/listable.
- Runtime: `frontend/config/config.prod.yml` (`item.showAccessStatuses`).
- Discovery: `backend/config/spring/api/academic-discovery.xml` (faceta `cnpq`,
  exclusão de Person e ordenação por data de entrada nos agregados).
- Testes: `tests/frontend/folha-de-rosto-helpers.test.mjs` e
  `tests/backend/AcademicConfigurationCheck.java`.

## Consequências operacionais

Produção exige nova imagem Angular pelo workflow, recriação do serviço
Angular para o YAML e recriação do serviço `dspace` seguida de
`index-discovery -b` para as facetas novas. Até a reindexação, a faceta
`cnpq` e as contagens por ano retornam vazias e a home mostra apenas o que
estiver indexado. Os totais da home e a ausência de Person nos resultados
dependem da configuração recarregada.

O build de produção passou nesta mudança, mas não houve inspeção visual com
dados reais nem teste com leitor de tela; o ambiente local não tinha backend.
