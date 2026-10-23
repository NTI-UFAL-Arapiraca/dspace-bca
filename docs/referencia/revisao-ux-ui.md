# Revisão de UX/UI do repositório

Revisão de 19 de outubro de 2026, sobre o tema customizado do DSpace 10.1.
A decisão de implementação está na [RFC 0015](../../rfc/0015-experiencia-visual-do-repositorio.md).

## Textura de fundo

Em 22/10/2026, o tema recebe um SVG repetível com contornos sutis de páginas
abertas. Após a aprovação da aplicação inicial na home, o padrão passa a
ocupar a área principal de todas as páginas, por meio de `#main-content` nos
estilos globais. A máscara usa a cor dos links com 11% de opacidade, atrás das
superfícies opacas. Abaixo de 768 px, usa uma composição própria de 480 × 1120 px
com quatro posições, inclinações alternadas e pequenas variações de escala,
mantendo o espaçamento vertical de 280 px. Isso evita a repetição da mesma
coluna do módulo desktop de 720 × 560 px nos recortes estreitos. O fundo é
decorativo, não captura cliques e é ocultado em cores forçadas. Cabeçalho,
breadcrumb e rodapé mantêm seus fundos.

Validação: SVG bem formado, recompilação de desenvolvimento DSpace 10.1
concluída e `git diff --check` sem erros. Inspeção visual em modos claro e
escuro, com larguras de 320, 390, 768 e 1440 px, sem overflow horizontal.
A aplicação global também foi conferida na pesquisa, na lista de comunidades,
em uma comunidade, no perfil Person e na página de um trabalho; os cartões de
resumo e dados acadêmicos continuam opacos. O modo claro foi restaurado após a
inspeção. Não foi repetido o build otimizado de produção/SSR nem emulado o modo
de cores forçadas. Produção exige nova imagem Angular.

A composição mobile foi conferida na rolagem da home em 390 px nos dois modos.
SVG e recompilação local aprovados; verificação de layout em 320, 430, 767, 768
e 1440 px sem overflow horizontal. A máscara específica entra abaixo de 768 px;
a partir desse limite, o módulo desktop e sua escala permanecem iguais.

## Breadcrumb no mobile

Em 22/10/2026, o tema passa a compactar o caminho de navegação abaixo de
768 px. Início e página atual ficam em uma linha; níveis intermediários são
omitidos e representados por reticências decorativas somente quando existem.
O título atual pode ser truncado visualmente, preservando o texto completo
para tecnologias assistivas e no atributo `title`. No desktop, todos os níveis
e links são mantidos.

A extensão `app/breadcrumbs/` reutiliza os observables do componente oficial
DSpace 10.1 e entra no registro eager do tema. O CSS define a apresentação por
largura, sem medir a janela em JavaScript nem alterar rotas. A publicação
requer uma nova imagem Angular.

Validação: recompilação de desenvolvimento DSpace 10.1 e lint oficial dos
TS/HTML alterados aprovados; `git diff --check` sem erros. Inspeção no navegador
integrado em 320 e 390 px com comunidade, coleção e título extenso de trabalho
fictício: breadcrumb em uma linha e sem overflow horizontal. Em 768 e 1440 px,
todos os níveis reaparecem. A lista de comunidades, com apenas início e página
atual, não recebe indicador de omissão. O link Início retorna à home, que
continua sem breadcrumb. Não foi repetido o build otimizado de produção/SSR;
a verificação visual usa emulação de viewport, sem teste em aparelho físico.

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

## Leitor integrado de PDF e tipografia compacta

Extensão posterior à revisão acima, solicitada para a página da publicação.
Esta seção registra a integração inicial; a evolução para carregamento parcial
e abertura opcional está descrita na seção seguinte.
O leitor ocupa uma seção própria abaixo da descrição e dos dados acadêmicos.
Prioridades e alternativas avaliadas:

| Ideia | Benefício | Custo / decisão |
| --- | --- | --- |
| Leitor integrado com PDF principal e abas | Iniciar a leitura sem perder o contexto do trabalho | Prioridade alta; componente e serviço locais, reutilizados em UntypedItem e Publication. |
| Incorporação nativa do PDF da API | Pouco código adicional | Descartada após inspeção: `X-Frame-Options: DENY` e área vazia no navegador com Blob nativo. Cabeçalhos preservados. |
| PDF.js oficial servido junto à interface | Texto selecionável, pesquisa, zoom e paginação consistentes | Implementado com versão e SHA-256 fixos; arquivos grandes exigem transferir o conteúdo completo. |
| Serviço externo de visualização | Evitaria distribuir o leitor | Descartado: envio do documento a terceiros e incompatibilidade com a autorização da sessão. |
| Cabeçalhos e faixa de abas compactos | Menos peso visual e mais espaço útil para leitura | Implementado conforme feedback: títulos em peso 500; metadados de 16 px; título do leitor de 18 px; abas com altura mínima de 40 px. |

O componente carrega quando entra no viewport. PDFs são identificados pelo
formato registrado, sem confiar na extensão do nome. O principal configurado
vem primeiro; sem principal PDF, mantém-se a ordem original. O serviço percorre
a paginação e verifica `CanDownload` antes de buscar o conteúdo. Um arquivo
restrito preserva o link oficial para acesso/solicitação de cópia. Erros têm
estado próprio e nova tentativa; sem PDFs, a seção desaparece. A troca cancela
pedidos anteriores e libera a URL temporária. Desabilitar a animação do NgbNav
evita manter dois iframes durante a transição de abas.

Arquivos criados:

- `frontend/themes/custom/app/item-page/simple/pdf-preview/pdf-documents.ts`;
- `frontend/themes/custom/app/item-page/simple/pdf-preview/pdf-preview.service.ts` e seu spec;
- `frontend/themes/custom/app/item-page/simple/pdf-preview/pdf-preview.component.ts`, HTML, SCSS e spec;
- `frontend/patches/install-pdf-viewer.mjs`;
- `tests/frontend/pdf-documents.test.mjs`;
- [RFC 0016](../../rfc/0016-preview-integrado-de-pdfs.md).

Arquivos modificados: os dois Dockerfiles Angular, os componentes UntypedItem
e Publication, template/SCSS compartilhados, catálogos pt-BR/en, estilos globais
e variáveis Sass, SCSS da introdução da home, README do tema, índice das RFCs e
este relatório. A lógica de citação, configurações acadêmicas e políticas de
acesso não foram modificadas.

Validações desta extensão:

| Verificação | Resultado |
| --- | --- |
| `node --test tests/frontend/*.test.mjs` | 12 testes passaram: seleção/ordem/formato, configuração do viewer, contrato de versão/namespace e os cinco testes de cor existentes. |
| `npm test -- --include='src/themes/custom/app/item-page/simple/pdf-preview/*.spec.ts'` | 9 testes Angular passaram; executados no navegador integrado conectado ao Karma via proxy temporário em loopback. Abrangem abas, um único iframe, paginação, ausência de PDFs, permissão negada sem pedido de conteúdo, erros/retry e cancelamento. |
| ESLint oficial direcionado aos TS/HTML alterados | Sem erros; aviso existente sobre configuração ESLint legada. |
| Instalador do PDF.js executado no container local | Distribuição 6.4.299 baixada, SHA-256 verificado e assets instalados; instalação repetida com sucesso. |
| `node --check frontend/patches/install-pdf-viewer.mjs` | Sem erro de sintaxe. |
| Visualização real do PDF | Desktop 1440 × 1000 e mobile 390 × 844; conteúdo e controles renderizados, texto presente na árvore acessível e zoom mobile funcional. Documento sem transbordamento horizontal. |
| `npm run build:prod` em container temporário DSpace 10.1 | Navegador e SSR concluíram com código 0 na retomada de 20/10/2026; um worker, heap de 5 GiB e servidor de desenvolvimento parado durante a compilação. |
| Execução do artefato de produção com o backend local | Página do trabalho respondeu HTTP 200 com título e resumo no HTML SSR; o preview permaneceu adiado. Viewer, worker e tradução pt-BR responderam HTTP 200. PDF renderizado novamente em 1440 × 1000 e 390 × 844, sem transbordamento horizontal do documento. |
| `git diff --check` | Sem erros de whitespace após atualizar o relatório. |

As tentativas anteriores de compilar SSR junto ao servidor de desenvolvimento
foram interrompidas por falta de memória. A execução isolada completou as duas
etapas em aproximadamente 3,4 minutos. O build emitiu os avisos conhecidos de
CommonJS, componentes herdados não usados e orçamento inicial: 3,57 MB para
limite de aviso de 3 MB. O orçamento não foi alterado. A revisão independente
de autorização, seleção, cancelamento e semântica das abas não encontrou
problemas relevantes. O servidor temporário foi removido após a inspeção e o
ambiente normal de desenvolvimento foi restaurado.

No desktop, o cabeçalho do leitor mede aproximadamente 72 px e o iframe 650 px
no viewport de 1000 px. No mobile, o iframe mede 506 px no viewport de 844 px;
a barra de arquivo quebra para acomodar o link visível. A inspeção usa o
registro fictício com um PDF; os casos com múltiplos PDFs e restrições foram
validados com fixtures nos testes Angular, sem modificar dados do acervo.

Limites: não foram testados aparelhos físicos, PDFs protegidos por senha,
documentos extensos nem um registro Publication com arquivos reais. O Blob
carrega o documento inteiro antes de exibir. Download por autorização especial
de solicitação de cópia continua disponível pelo fluxo oficial; não foi
reimplementado no preview. A instalação do viewer exige reconstruir a imagem
Angular, conforme a RFC 0016.

## Carregamento parcial e abertura opcional de PDFs

O preview inicial baixava o arquivo inteiro em um Blob. A melhoria solicitada
combina duas prioridades: abrir por partes e deixar o visitante escolher o
carregamento quando o arquivo for grande ou houver indicação de conexão limitada.
Ambas usam extensões locais do tema e o transporte oficial do PDF.js; não há
novo serviço, conversão de arquivos ou mudança nas políticas do backend.

| Prioridade | Benefício e implementação |
| --- | --- |
| Transporte parcial autenticado | `PDFDataRangeTransport` pede trechos ao HttpClient do Angular. Tokens e URLs da API permanecem na página principal. HTTP 206 e comprimento da resposta são verificados; um HTTP 200 inesperado é abortado, sem fallback silencioso para o arquivo inteiro. |
| Abertura opcional | PDFs a partir de 20 MiB aguardam “Carregar visualização”. O mesmo ocorre com `saveData`, estimativa slow-2g/2g/3g ou velocidade positiva inferior a 1 Mbps, quando a API do navegador está disponível. Sem ela, aplica-se apenas o tamanho. |
| Clareza e controle | Tamanho do arquivo, link “Baixar PDF”, volume transferido e controle de cancelar/fechar. Ícones decorativos acompanham texto visível. O iframe permanece visível durante a preparação para permitir interações próprias do leitor, como senha de PDF. |
| Manutenção | Política em helper puro, ponte de mesma origem em módulo pequeno e versão dos assets com sufixo `-range-1`. Configurações e pontos de registro das páginas permanecem os existentes. |

Não há teste ativo de velocidade, inferência por tela mobile ou identificação
de franquia contratada. Os sinais da conexão são estimativas, reavaliadas a
cada seleção de documento. Uma escolha explícita carrega o leitor mesmo na
conexão limitada; não inicia um download completo como alternativa automática.
Sem tamanho válido, o download oficial fica disponível sem iniciar o transporte.

Arquivos desta mudança:

- `frontend/themes/custom/app/item-page/simple/pdf-preview/pdf-preview-policy.ts` e `pdf-viewer-source.ts` (novos);
- componente `pdf-preview.component.ts`, template, SCSS e spec;
- serviço `pdf-preview.service.ts` e spec, e `pdf-documents.ts`;
- `frontend/overrides/pdf-range-viewer.mjs` (novo);
- `frontend/patches/install-pdf-viewer.mjs` e ambos os Dockerfiles Angular;
- traduções `frontend/themes/custom/assets/i18n/{pt-BR,en}.json5`;
- `tests/frontend/pdf-preview-policy.test.mjs` e `pdf-range-viewer.test.mjs` (novos), e `pdf-documents.test.mjs`;
- README do tema, RFC 0016 e este relatório.

Validação funcional e visual em 20/10/2026:

| Verificação | Resultado |
| --- | --- |
| `node --test tests/frontend/pdf*.test.mjs` | 15 testes passaram: seleção, política de tamanho/conexão, limites de intervalos, opções do leitor, falhas e buffers de janelas diferentes. |
| Specs Angular do leitor | 19 testes passaram na versão final: HTTP parcial, rejeição de resposta integral/truncada, autorização, paginação, abas, abertura opcional, cancelamento, callbacks antigos e visibilidade do iframe durante a preparação. |
| ESLint oficial do DSpace nos TS/HTML do leitor | Passou após `npm run build:lint` preparar os plugins oficiais ausentes na imagem base; somente aviso existente de configuração ESLint legada. |
| Sintaxe dos módulos e `git diff --check` | Sem erros nas verificações executadas. |
| PDF público do backend local | HTTP 206 confirmado, com 1.024 bytes para `Range: bytes=0-1023`; o documento publicado também renderizou no leitor integrado. |
| Desktop 1440 × 1000 | PDF sintético de 140 páginas / 28.717.241 bytes: nenhum conteúdo antes do clique; primeira página abriu com 667.833 bytes (cerca de 652 KiB, 2,33%) em três pedidos, sem continuar transferindo enquanto a leitura ficou parada. |
| Mobile 390 × 844 | Economia de dados/conexão lenta simulada apenas em proxy de QA em loopback: zero bytes de conteúdo antes do clique; PDF renderizado após a escolha, com 929.977 bytes (cerca de 908 KiB) em quatro pedidos nessa amostra. Documento com largura de scroll 375 px, sem overflow horizontal da página. |
| `npm run build:prod` final, em container isolado | Navegador e SSR concluídos: aproximadamente 90 s e 99 s. Um worker e heap de 5 GiB; avisos existentes de CommonJS, fontes herdadas não usadas e orçamento inicial de 3,62 MB para aviso de 3 MB. Nenhum orçamento foi alterado. |
| Execução do artefato final de produção | HTTP 200 com título e resumo no HTML SSR, placeholder adiado presente e sem leitor renderizado no servidor. Viewer, ponte e worker responderam HTTP 200 e módulos com MIME JavaScript. PDF publicado renderizado em 1440 × 1000 e 390 × 844; iframe de 650 px e 506 px, respectivamente, sem overflow horizontal da página. |
| Imagem de desenvolvimento | `docker compose … build dspace-angular` concluiu com o instalador verificado e todos os patches. |

O cenário de arquivo grande foi servido por um proxy temporário, com tamanho
e conteúdo sintéticos, preservando as verificações reais de autorização.
Nenhum registro ou arquivo do banco/assetstore foi modificado. Desktop e
mobile foram emulados no navegador integrado; não equivalem a aparelhos físicos.

Uma segunda distribuição dos mesmos objetos, intercalando metadados e streams
por todo o PDF, exigiu todos os bytes para a leitura inicial. Isso confirma que
carregamento parcial depende da estrutura do documento, não só do seu tamanho.
Busca textual, impressão e download também podem precisar do arquivo inteiro.
Não se promete economia fixa ou um pedido por página. Otimização/linearização
de PDFs e derivadas para digitalizações ficam de fora para preservar originais
e evitar uma nova cadeia de processamento nesta entrega.

No DSpace 10.1, pedidos com `Range` não geram o evento de download do
`BitstreamRestController`. O preview parcial deixa, portanto, de contar como
download; a ação explícita continua no fluxo oficial. Essa consequência está
documentada na RFC 0016, sem emitir pedidos artificiais para alterar métricas.
O proxy institucional de produção, sessões autenticadas reais, aparelhos
físicos e documentos com senha não foram validados de ponta a ponta.

Ao concluir, os containers temporários de build, SSR, proxy e QA foram
encerrados. O ambiente `d10dev` foi restaurado com a imagem de desenvolvimento
reconstruída: compilação local aprovada, publicação e ponte do leitor em HTTP
200, backend/banco/Solr preservados.

## Abas de PDFs com nomes extensos

A apresentação mobile descrita nesta seção foi substituída pelo seletor nativo
registrado abaixo; a disposição das abas continua válida a partir de 768 px.

Em 22/10/2026, reservar três espaços para arquivos e, acima dessa quantidade,
dividir a mesma linha igualmente entre todas as abas, inclusive no mobile.
Títulos pequenos ficam centralizados no espaço disponível. Cada nome fica em
uma linha, com reticências no meio e o final do nome/extensão preservado,
seguindo a referência do Finder. Abaixo de 768 px, ícone e selo de principal
ficam apenas na identificação do arquivo selecionado, liberando espaço nas abas.

`pdf-filename.ts` separa o nome em duas partes para apresentação, sem alterar
o arquivo, extensão, metadados ou links. O rótulo acessível e o título nativo
da aba mantêm o nome completo; o selo de principal integra o rótulo acessível
quando presente. O nome completo também permanece na identificação do PDF
selecionado, inclusive no mobile.

Arquivos: componente do preview (TS, HTML e SCSS), helper `pdf-filename.ts`,
`tests/frontend/pdf-filename.test.mjs`, README do tema e este relatório.
Validação: 28 testes Node (incluindo três do helper), 19 testes Angular existentes,
lint oficial e compilação local aprovados. Conferência visual com os quatro
PDFs disponíveis no registro local, incluindo um nome extenso:
1440 × 1000 (quatro espaços de 318 px) e 390 × 844 (quatro de aproximadamente
84 px), além de 320 × 780 (quatro de 70 px). Sem overflow horizontal da página.
Nome completo presente nos rótulos
acessíveis e na identificação do PDF selecionado. Nenhum dado do acervo foi alterado.

### Seleção nativa de PDFs no celular

Abaixo de 768 px, a seleção usa um `select` HTML, cujo toque abre a lista nativa
do navegador/sistema. As opções limitam o nome a 48 caracteres, com reticências
no meio e final/extensão preservados. O campo fechado usa os mesmos spans das
abas para adaptar o truncamento à largura disponível. Nomes completos ficam
nos rótulos acessíveis e títulos nativos. O principal continua primeiro e
selecionado por padrão; sem principal PDF, mantém-se a ordem original.
Um único PDF não recebe seletor. As abas a partir de 768 px e o controle mobile
compartilham seleção, leitor e download oficial.

Validação: 39 testes Node, 28 testes Angular do preview/serviço e lint oficial
dos arquivos alterados aprovados. Compilação de desenvolvimento aprovada.
Conferência no navegador com quatro PDFs, incluindo nome extenso, em 320 px,
390 px e 768 px: seletor no celular e abas no iPad, sem overflow horizontal da
página. A mudança de largura preservou a seleção. PDF real de 41 páginas
renderizado pelo leitor integrado. A apresentação do menu em aparelhos físicos
iOS/Android não foi testada.

## Ajuste dos blocos após medir um PDF real

O arquivo de 945,42 KiB (968.109 bytes, 41 páginas) apontado pelo usuário
realmente era transferido inteiro na abertura: o parser solicitava os quatro
blocos de 256 KiB para ler objetos espalhados pelo PDF. O backend respondia
HTTP 206 corretamente; não era um fallback para HTTP 200 nem streaming.

Reduzir o bloco para 64 KiB, mantendo `disableAutoFetch` e `disableStream`.
Na medição isolada, a abertura do documento pediu 640.429 bytes e a preparação
da primeira página elevou o total a 705.965 bytes. No viewer real, desktop e
mobile renderizaram a primeira página com os mesmos 705.965 bytes (689,42 KiB),
em onze pedidos: redução inicial de 262.144 bytes, aproximadamente 27,1%.
O total permaneceu estável sem navegação. A estrutura ainda exige cerca de
73% deste arquivo na abertura; economia maior dependeria de sua organização.
Navegar para a página 20 pediu mais um bloco de 65.536 bytes, elevando a
transferência a 771.501 bytes (753,42 KiB). A última página também foi renderizada.
Blocos de 32 KiB também foram medidos isoladamente, mas 64 KiB mantém um
compromisso entre leitura excedente e quantidade de pedidos HTTP.

O sufixo de assets mudou para `-range-2` para evitar reaproveitar o script antigo
em cache. A correção altera a ponte, o instalador, o caminho do viewer e o teste
de contrato. Não altera o PDF original, autorização ou políticas de acesso.
Otimização/linearização permanece fora do escopo porque requer uma derivada e
um fluxo de processamento próprio. O tamanho do bloco não é limite do total
transferido nem limite rígido de uma resposta: PDF.js pode reunir vários blocos.

Arquivos deste ajuste, além dos arquivos de abas listados acima:
`frontend/overrides/pdf-range-viewer.mjs`,
`frontend/patches/install-pdf-viewer.mjs`, `pdf-preview/pdf-documents.ts`,
`tests/frontend/pdf-range-viewer.test.mjs` e `rfc/0016-preview-integrado-de-pdfs.md`.
O build da imagem de desenvolvimento executou o instalador com SHA-256
verificado. Não foi repetido o build otimizado de produção/SSR para este ajuste:
a lógica Angular foi compilada na suíte direcionada e no servidor local; a
alteração da ponte usa a API e o transporte já validados anteriormente.

## Fotografia discreta na página do trabalho

A foto fornecida do corredor da biblioteca passa a compor o fundo do cartão
de arquivos, junto à miniatura e aos links de acesso. Esse ponto associa o
documento ao acervo físico sem ocupar a área de leitura ou aumentar a altura
da página. UntypedItem e Publication compartilham o template e o SCSS existentes.

O asset `biblioteca-corredor.webp` tem 800 × 600 px e 61.216 bytes, sem
metadados da câmera. A derivada anterior (1200 × 900 px, 152.420 bytes) foi
reduzida após revisar o uso: a coluna desktop tem 19 rem, a imagem é decorativa,
usa `cover` e carrega sob demanda, reduzindo o asset em 60%. A imagem tem
alternativa vazia, `aria-hidden`, recorte central e sem eventos de ponteiro.
Saturação de 20%, contraste de 85% e opacidade de 16% são aplicados apenas à
fotografia. Os links do cartão usam a cor de hover do tema, que oferece mais
contraste nos dois modos. Considerando os extremos preto/branco da imagem
antes dos filtros e da composição, o contraste calculado dos links fica
acima de 5,9:1 nos temas claro e escuro.

Validação: recompilação do tema no DSpace Angular 10.1 e lint oficial do
template concluídos; `git diff --check` sem erros. Inspeção com o registro local
de teste, miniatura real e quatro arquivos, em 1440 × 1000 e 390 × 844 nos dois
modos de cor. Foto carregada com dimensões corretas e sem overflow horizontal.
O lint mantém o aviso de configuração ESLint legada; o build local mantém o
aviso preexistente de `RouterLink` não usado na página de privacidade.

Não foi repetido o build otimizado de produção/SSR para essa alteração de
apresentação. Publicar o fundo exige uma nova imagem Angular pelo workflow.

## Redesign da composição da home — 22/10/2026

Análise do componente oficial DSpace 10.1, tema e página local: a busca não tinha
orientação própria; comunidades e seus controles de listagem
precediam a descoberta; adições recentes traziam miniaturas vazias e cadastros
de pessoas. A abertura “Explore o conhecimento produzido em Arapiraca.” foi
preservada integralmente a pedido do usuário.

Plano implementado:

1. Busca com título e orientação por título, autor ou assunto, sem seletor de
   escopo na entrada; os filtros ficam disponíveis nos resultados.
2. Novidades com cartões compactos, título completo, indicação de perfil/registro
   e curso quando disponível. O cartão inteiro é um link e tem estado de foco.
3. Comunidades em painel secundário, com nomes, ícones decorativos e acesso ao
   catálogo completo. A prévia mantém o tamanho configurado, sem controles de
   paginação ou RSS na home.
4. Duas colunas a partir de 992 px e fluxo único em telas menores, respeitando
   a ordem do DOM. Superfícies, bordas e cores usam os tokens claro/escuro.

A implementação mantém serviços oficiais, configurações de tamanho/ordenação,
CMS, COAR e sugestões; não modifica backend nem filtra pessoas silenciosamente.
A seção foi nomeada “Novidades no acervo” e explica que inclui trabalhos e perfis.
O refinamento editorial para uma seção exclusivamente de trabalhos depende da
consulta acadêmica já apontada como pendência operacional nesta revisão.
A decisão e os novos pontos de extensão estão na RFC 0015.

Verificações desta rodada: `git diff --check` sem erros; 37 testes Node do
frontend aprovados; lint oficial dos novos TS/HTML e registro eager aprovado.
A recompilação de desenvolvimento passou. A busca “Biblioteca” enviada pela home
levou a `/search?spc.page=1&query=Biblioteca` e retornou o trabalho fictício esperado.
A inspeção em 320, 390, 768 e 1440 px não identificou overflow horizontal; modos
claro e escuro foram conferidos. Abaixo de 576 px, o botão de busca ocupa uma
linha própria para ampliar o espaço de digitação.

Limites: dados fictícios locais, sem testes em aparelho físico ou leitor de tela.
Estados de erro/vazio, CMS/COAR e a opção `showDiscoverFilters=true` foram
preservados no código e compilados, mas não exercitados com cenários dedicados.
Não houve publicação em produção; é necessária uma nova imagem Angular.

O comando `docker exec -e NG_BUILD_MAX_WORKERS=2 d10dev-dspace-angular npm run
build:prod` concluiu navegador e SSR com código 0. Emitiu avisos de CommonJS,
arquivos não usados e orçamento inicial (3,68 MB para aviso de 3 MB). Durante
essa execução foram feitos os últimos ajustes de CSS mobile, formatação Sass
e troca do contêiner de título de `span` por `div`; esses ajustes finais foram
validados pela recompilação de desenvolvimento e inspeção visual, sem repetir
o build otimizado inteiro. O lint final inclui a correção semântica do template.

Navegação adicional conferida: cartão de pessoa abre o perfil correto; “Ver mais
registros” mantém `dc.date.accessioned` em ordem descendente na pesquisa;
“Ver todas as comunidades” abre o catálogo. Tema claro e viewport padrão foram
restaurados após os testes. O componente `home-news` não possui alterações no diff.
