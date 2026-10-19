# Revisão de UX/UI do repositório

Revisão de 19 de outubro de 2026, sobre o tema customizado do DSpace 10.1.
A decisão de implementação está na [RFC 0015](../../rfc/0015-experiencia-visual-do-repositorio.md).

## Base examinada

Foram lidos README, AGENTS, documentação de implantação, desenvolvimento local
e modelo acadêmico, RFCs do tema, apresentação de itens, idioma e pessoas.
O código oficial foi consultado na imagem local `dspace-10.1`: composição da
home, extensão `home-news`, componentes e comandos de build. Também foram
inspecionados registros eager/listable, Dockerfiles, workflow de publicação,
configuração runtime, watcher, overrides e patches existentes.

O tema e as traduções entram na imagem antes da compilação; o YAML runtime
fica montado separadamente. Em desenvolvimento, o watcher sincroniza o tema
e mescla traduções. Alterações desta revisão exigem nova imagem em produção.

Uma revisão independente por subagente examinou navegação, acessibilidade,
responsividade e o diff, somente em leitura. Os achados foram incorporados
antes da validação final.

## Problemas e oportunidades observáveis

- A home começava no campo de busca sem h1 ou explicação própria do acervo.
- Os rótulos dos botões de busca e ferramentas desapareciam abaixo de 768 px.
- O contexto da busca mobile encostava na borda inferior do campo: margem
  negativa combinada com a margem zerada da barra na home.
- O cabeçalho usava quebra em 576 px e controles mobile até 768 px. Acrescentar
  rótulos visíveis exigiu rever a disposição para evitar uma terceira linha.
- O item usava colunas 4 + 6 da grade de 12, deixando espaço de leitura ocioso.
  No mobile, autores, orientação, banca e demais dados precediam o resumo.
- Os cartões de atividade dos perfis pareciam indicadores estáticos apesar
  de navegar para resultados; o link de registro completo declarava botão.
- Curso e campus usavam h5 após h2 dos demais campos.
- O foco branco de todo o rodapé também alcançava uma superfície clara.

A base já possuía aspectos preservados: cores institucionais, modo escuro,
foco visível, alvos de toque, busca modal, filtros reativos, fontes locais,
autoridades e perfis com consultas por papel.

## Brainstorm priorizado antes da implementação

| Prioridade | Ideia e benefício | Complexidade | Sustentabilidade / decisão |
| --- | --- | --- | --- |
| Alta | Abertura institucional com título e caminhos de descoberta: orientar estudantes e visitantes. | Baixa | Implementada em `home-news`, sem copiar toda a home. |
| Alta | Textos visíveis nos controles mobile e contexto com respiro: facilitar busca, escopo e filtros. | Baixa | Implementada nos templates e estilos existentes; mantém serviços de busca. |
| Alta | Reorganizar arquivos, leitura e dados acadêmicos: facilitar consulta ao trabalho em desktop e celular. | Média | Implementada no template compartilhado com Publication; mantém componentes oficiais. |
| Alta | Links reconhecíveis, com sublinhado e seta quando útil: tornar exploração previsível. | Baixa | Implementada em links de conteúdo, caminhos da home, registro completo e atividade. |
| Média | Harmonizar comunidades, resultados, filtros e perfis: dar continuidade visual. | Baixa | Reutiliza os tokens existentes; altera superfícies da home, espaçamento e links, sem novos componentes de dados. |
| Média | Copiar citação pronta: apoiar escrita acadêmica. | Média | Adiada: exige definir formatos, fallback e fidelidade dos metadados. |
| Baixa | Salvar pesquisas e favoritos: apoiar retornos frequentes. | Média/alta | Adiada: envolve estado pessoal, conta, persistência e fluxos adicionais. |
| Baixa | Recomendações, métricas em destaque e integrações externas. | Alta | Adiadas: exigem critérios de relevância, fontes e manutenção além do benefício demonstrado. |

## Implementação e limites de responsabilidade

- `HomeNewsComponent`: novo template e SCSS de apresentação institucional,
  com h1 e dois links reais para pesquisa no acervo e comunidades. Continua no registro eager existente.
- Cabeçalho e modal: descritor traduzido, textos para pesquisar, tema, menu
  e fechar; reorganização responsiva. Nomes acessíveis incluem os rótulos.
- Formulário: escopo em linha própria no mobile, textos preservados e contexto
  sem margem negativa. Mantém parâmetros, consultas e estado de filtros.
- Página do item: grade local com arquivos e dados na lateral a partir de
  992 px; abaixo disso, arquivos → conteúdo → dados, em ordem de DOM.
  Publication recebe a apresentação por reutilização, sem cópia adicional.
- Perfis: cartões de atividade com sublinhado e seta; Lattes com ícone após
  o texto; navegação ao registro completo com semântica de link.
- Estilos: links de conteúdo identificáveis, espaços de leitura e foco do
  rodapé restrito à superfície apropriada. Reutiliza paleta clara e escura.
- Traduções: textos novos em pt-BR e inglês, mesclados pelo fluxo existente.

O catálogo pt-BR também corrige “Direitos e licenciamento”.

Nenhuma alteração de contrato REST, metadados, negociação de idiomas,
autoridades, políticas, URLs públicas, serviços externos, dependências ou
registros de componentes. Mantidos os componentes de arquivos/anexos e suas
condições de autorização. A ausência de miniatura usa uma imagem padrão SVG
local de 48 px pelo próprio componente oficial. O resumo continua justificado conforme a RFC 0006.

## Arquivos alterados

Os caminhos abaixo são relativos à raiz:

- `frontend/themes/custom/app/home-page/home-news/home-news.component.ts`
- `frontend/themes/custom/app/home-page/home-news/home-news.component.html` (novo)
- `frontend/themes/custom/app/home-page/home-news/home-news.component.scss` (novo)
- `frontend/themes/custom/app/header/header.component.html`
- `frontend/themes/custom/app/header/mobile-search.component.html`
- `frontend/themes/custom/app/shared/search-form/search-form.component.html`
- `frontend/themes/custom/app/shared/search-form/search-form.component.ts`
- `frontend/themes/custom/app/shared/search-form/search-form.component.scss` (novo)
- `frontend/themes/custom/app/item-page/simple/item-types/untyped-item/untyped-item.component.html`
- `frontend/themes/custom/app/item-page/simple/item-types/untyped-item/untyped-item.component.scss`
- `frontend/themes/custom/app/item-page/simple/item-types/untyped-item/academic-metadata-link.component.ts`
- `frontend/themes/custom/app/entity-groups/research-entities/item-pages/person/person.component.html`
- `frontend/themes/custom/app/entity-groups/research-entities/item-pages/person/person-activity.component.html`
- `frontend/themes/custom/app/entity-groups/research-entities/item-pages/person/person-profile.scss`
- `frontend/themes/custom/styles/_global-styles.scss`
- `frontend/themes/custom/styles/_color-modes.scss`
- `frontend/themes/custom/assets/images/document-placeholder.svg` (novo)
- `frontend/themes/custom/assets/i18n/pt-BR.json5`
- `frontend/themes/custom/assets/i18n/en.json5`
- `frontend/themes/custom/README.md`
- `docs/README.md`
- `docs/referencia/revisao-ux-ui.md` (este arquivo, novo)
- `rfc/README.md`
- `rfc/0002-remocao-do-banner-promocional.md`
- `rfc/0015-experiencia-visual-do-repositorio.md` (novo)

## Validações

| Verificação | Resultado |
| --- | --- |
| `git diff --check` | Sem erros de whitespace. |
| Watcher / compilação de desenvolvimento DSpace 10.1 | Recompilação de componentes, estilos e catálogos concluída. |
| `docker exec -e NG_BUILD_MAX_WORKERS=2 d10dev-dspace-angular npm run build:prod` | Build final de navegador e SSR, com todos os refinamentos, concluído com código 0. Asset SVG confirmado no bundle de produção. |
| Plugins oficiais: `npm run build:lint`; ESLint direcionado aos TS/HTML alterados | Plugins compilados; componentes e templates passam após ajustes de formatação. |
| `node --test tests/frontend/color-mode-init.test.mjs` | 5 testes passaram. |
| Suíte Python existente em ambiente temporário `uv run --with python-dotenv --with dspace-rest-client python -m unittest discover -s tests -p 'test_*.py'` | 4 testes passaram; 1 erro por ausência de `../dspace-migration/config/registries/migration-metadata.xml`. Não foram alterados testes nem criado um arquivo substituto. |

O build de produção emitiu avisos de módulos CommonJS, componentes herdados
não usados e orçamento inicial: 3,55 MB para limite de aviso de 3 MB. O comando
terminou com sucesso; esta rodada não muda dependências nem a configuração de
orçamentos. O ESLint 9 avisa sobre o formato legado de configuração do DSpace.

### Inspeção visual e funcional

| Página / fluxo | Mobile | Telas maiores | Resultado |
| --- | --- | --- | --- |
| Home | 390 px | 768 e 1440 px | Título, atalhos e busca legíveis; sem rolagem horizontal. |
| Busca do acervo | 390 px | 1440 px | Escopo em linha própria no celular; filtros laterais no desktop; ferramentas mobile abrem e retornam à lista. |
| Trabalho sem tipo | 320 e 390 px | 1024, 1280 e 1440 px | Arquivos, resumo e dados reorganizados; links visíveis; fallback SVG compacto; rótulo de licenciamento correto. |
| Perfil Person | 320/390 px | 1440 px | Cartões e abas responsivos; cartão Orientações seleciona a aba e retorna dois trabalhos no conjunto fictício. |
| Coleção | 390 px | 1440 px | Navegação, lista e pesquisa mantêm a organização e o escopo; “Biblioteca” retorna um trabalho no conjunto fictício. |
| Tema escuro | 390 px | 1440 px | Perfil, controles, resultados e filtros legíveis; tema claro restaurado ao terminar. |
| Pesquisa modal | 390 px | Expansão desktop preservada | Foco inicial no campo, Escape fecha e foco retorna ao acionador. |

As larguras foram aplicadas ao viewport do navegador integrado. O documento
não apresentou largura horizontal maior que o viewport nas medições realizadas.
As capturas registram dados fictícios e não demonstram validação de dados reais,
URLs de produção ou comportamento de leitores de tela.

A automação perdeu a sincronização em algumas navegações durante recompilações;
nesses casos o resultado foi conferido novamente na página renderizada. Uma
tentativa de acessar diretamente `thumbnail.payload` foi rejeitada pelo Angular
por tipagem `unknown` e substituída pelo input oficial `defaultImage`, com
recompilação e inspeção visual posteriores sem esse erro.

## Melhorias futuras e cobertura

A inspeção usa dados fictícios locais. A apresentação Publication foi compilada,
mas os fluxos de anexos, mídia e arquivos restritos não foram exercitados com
registros específicos nesta sessão. Não equivale a testes com usuários,
auditoria completa WCAG, teste de leitor de tela ou certificação em todos os
navegadores/dispositivos. Recomenda-se testar Safari/iOS e Chrome/Android em
aparelhos reais, incluindo teclado virtual, zoom e downloads restritos.

A configuração `academic_works_search` existente retornou pessoas e coleções
no ambiente local e mostrou as facetas padrão, sem curso/campus. Por isso o novo
atalho foi nomeado “Pesquisar no acervo”, sem prometer resultados exclusivos de
trabalhos. A configuração por papéis funcionou nos perfis; a resolução da configuração
pública `academic_works_search` merece uma verificação operacional independente; o XML e os contratos não foram alterados.

O rodapé institucional, novas formas de explorar pessoas e eventual catálogo
de cursos merecem uma etapa editorial própria: exigem destinos e conteúdo
institucional confirmados. Novos recursos de citação e personalização ficaram
fora desta rodada para manter apresentação e lógica de domínio separadas.
