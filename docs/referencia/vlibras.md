# VLibras na interface Angular

O tema `custom` carrega ativamente o VLibras Widget oficial em todas as rotas,
sem token, conforme a [integração oficial](https://www.vlibras.gov.br/doc/widget/installation/webpageintegration.html).
O serviço traduz
português para Libras.

## Inicialização e posição

`frontend/themes/custom/app/root/root.component.ts` estende o componente raiz
oficial do DSpace 10.1 e conserva seu template, estilos, animações e imports.
O registro está em `frontend/themes/custom/eager-theme-components.ts`.
O serviço singleton `app/accessibility/vlibras.service.ts` usa `afterNextRender`,
que não executa no SSR, e carrega o widget fora da zona Angular. Não há scripts
remotos no HTML renderizado pelo servidor nem inicialização em cada página.

`vlibras-widget.ts` insere uma única tag assíncrona, identificada por
`ufal-vlibras-script`, com URL absoluta
`https://vlibras.gov.br/app/vlibras-plugin.js`. O evento `load` chama o construtor
documentado com `rootPath: 'https://vlibras.gov.br/app'` e `position: 'R'`.
O loader oficial atual também inicia automaticamente; seu construtor compartilha
a proteção interna contra instâncias duplicadas. O projeto verifica ainda o
botão oficial existente e a tag pendente antes de carregar ou construir.
Falhas de rede/CSP geram aviso no console e liberam a tag para uma futura
tentativa de inicialização, sem polling nem bloqueio da navegação.

A posição documentada `R` mantém o botão à direita. O botão oficial mede 40 px
e fica a 10 px da borda. O loader usa a referência pública `VLibrasWidget.initBtn`
para elevar seu contêiner de acesso em 40 px (`top: calc(50vh - 60px)`), mantendo
o rótulo de hover junto ao botão. O ajuste só se aplica se o pai ainda tiver o
ID oficial `vlibras-access`; não substitui a estrutura do widget. Na home móvel
de referência (390 × 844 px), ele começa pouco acima de “Caminhos para descobrir”,
entre o parágrafo introdutório e os links. **Não se reserva
coluna, margem ou largura do conteúdo**, inclusive no celular. Uma pequena
sobreposição é esperada; a rolagem permite acessar o trecho coberto. O painel
aberto ocupa mais espaço e pode ser fechado pelo controle oficial. A altura é
um ajuste localizado no loader, sem folha de estilos dentro do shadow DOM.

O widget e seu estado permanecem no documento ao navegar entre home, busca,
trabalhos e perfis. Não há listener de Router para destruir/recriar instâncias.
O widget oficial captura cliques no corpo do documento, incluindo textos
renderizados depois da navegação. O prefixo `/dspace` permanece sob controle
do DSpace; as URLs absolutas do VLibras não dependem do `base href`.

## Idiomas e PDF

Os resumos mantêm o texto integral e os atributos `lang="pt"` e `lang="en"`
(ou o qualifier disponível), sem modificar metadados ou a consulta
`allLanguages`. Um texto estrangeiro pode ser selecionado pelo widget atual,
mas isso não estabelece suporte de tradução desse idioma. Não foi encontrada
opção documentada de exclusão por idioma na API de instalação atual; não se
injeta interceptação de cliques nem se altera o conteúdo para contornar isso.
O resumo português é o conteúdo destinado à tradução para Libras.

O leitor local PDF.js continua em seu iframe de mesma origem, com sua camada
de texto e seus controles próprios. O widget é carregado no documento Angular,
sem cópia do script no iframe e sem ponte de tradução para o PDF. **A integração
não oferece nem anuncia tradução do conteúdo interno do PDF.** Abrir o leitor,
renderizar texto selecionável e traduzir os metadados da página são operações
diferentes. Arquivos e tokens continuam no fluxo do leitor/DSpace; esta mudança
não envia PDFs ao VLibras.

## CSP e proxy institucional

Não há CSP definida no Nginx, nos Compose, no YAML do tema ou em meta tags
versionadas. O servidor Angular local consultado também não retornou
`Content-Security-Policy`. Não se adiciona uma nova política parcial ao proxy:
isso poderia bloquear recursos já usados pelo Angular ou pelo PDF.js.

Se o proxy institucional definir CSP, a equipe que o administra deve incorporar
à **política existente** as permissões abaixo, preservando as demais origens,
nonces e diretivas. Consulte a [orientação oficial de CSP](https://www.vlibras.gov.br/doc/widget/installation/content-security-policy.html).

| Diretiva | Origem necessária |
| --- | --- |
| `script-src` e `script-src-elem`, se definida | `https://vlibras.gov.br` e `https://cdn.jsdelivr.net`, destino dos redirecionamentos dos módulos oficiais observados. |
| `frame-src` | `https://vlibras.gov.br` para o avatar; conservar `'self'` para o iframe local PDF.js. |
| `font-src` | `https://vlibras.gov.br` e `https://cdn.jsdelivr.net`, inclusive o destino final dos redirects das fontes. |

Políticas restritivas de `connect-src`, `img-src` e `style-src` também devem ser
verificadas no navegador com o painel aberto e uma tradução solicitada. O
aplicativo remoto injeta estilos e consulta seus próprios serviços; na versão
observada, a tradução usa `https://traducao2.vlibras.gov.br/translate`.
Não copiar a tabela como um cabeçalho completo nem liberar curingas globais
para silenciar erros. A documentação e os endpoints do serviço podem mudar
independentemente da imagem Angular.

Em 23/10/2026, `http://ds.arap/dspace/`, endereço informado para o proxy
institucional, não resolveu por DNS no ambiente de validação. Portanto, não
foi possível confirmar presença ou ausência de CSP externa. Conferir os
cabeçalhos da resposta HTML real (`Content-Security-Policy` e
`Content-Security-Policy-Report-Only`) e violações no console nesse ambiente;
um header local ausente não prova ausência no proxy institucional.

## Publicação e verificações

Produção exige uma nova imagem pelo `Dockerfile.angular`/workflow existente e
recriação do frontend conforme o [guia de operação](../guias/operacao.md).
O `COPY frontend/themes/` de produção e o watcher de desenvolvimento já
contemplam a integração; não há dependência npm, patch do upstream, alteração de
URLs ou opção secreta em YAML. Alterações no
aviso de privacidade, copiado como override, exigem reconstruir também a imagem
de desenvolvimento.

Execute na raiz, com Node 22.18 ou posterior:

```bash
node --test tests/frontend/*.test.mjs
git diff --check
```

Os seis casos em `tests/frontend/vlibras-widget.test.mjs` verificam carga
concorrente pendente, construtor único, API pré-carregada, auto-inicialização
oficial, nova tentativa após erro e independência do prefixo `/dspace`.
Esses testes usam doubles do DOM/API e não provam disponibilidade ou qualidade
do serviço remoto. Complemente com TypeScript e build Angular de navegador/SSR.

Na revisão no navegador, percorra links Angular entre home, busca, trabalho e
perfil, abra/feche o painel, selecione o resumo português após a navegação e
confira uma única tag `#ufal-vlibras-script`, um `#vlibras-access-wrapper` e,
após abrir, um `#vlibras-app-root`. Em desktop e celular, verifique busca,
menu, idioma, abas de perfis, expansão dos resumos e controles do PDF com o
painel fechado e aberto. O painel aberto pode cobrir conteúdo temporariamente.

### Observações da validação em 23/10/2026

- `node --test tests/frontend/*.test.mjs`: 45 testes passaram, incluindo os seis
  novos casos do loader. `tsc --noEmit -p tsconfig.app.json` passou no container
  Angular; `git diff --check` passou.
- `docker build -f Dockerfile.angular -t dspace-bca-angular:vlibras-check .`
  compilou navegador e SSR. Houve avisos de CommonJS, imports/arquivos TS não usados
  e orçamento do bundle inicial (3,70 MB para aviso de 3 MB), sem erro de build.
  A imagem da integração inicial respondeu HTTP 200 para `/dspace/home`, com conteúdo renderizado,
  `base href="/dspace/"` e nenhuma tag remota/instância VLibras no HTML do servidor.
  No navegador da origem temporária `localhost:4100`, a API local recusou CORS
  com HTTP 403 (`Invalid CORS request`); esse teste não comprovou a navegação
  completa do cliente sob o prefixo. O backend não foi alterado para o teste.
- O botão e o painel oficial carregaram, com avatar visível. A navegação Angular
  em `localhost:4000` por home, busca, trabalho e perfil conservou uma tag de
  carga, um botão e um painel, sem recarga manual e sem multiplicação de instâncias.
- Os resumos português e inglês continuaram presentes com seus idiomas e foram
  capturados pelo widget após navegar até o trabalho. A API oficial retornou
  `500 {"error":"Translation Core Unavailable"}` também para uma frase portuguesa
  fictícia curta. O widget registrou erro e animou o avatar com seu fallback;
  **não foi validada tradução bem-sucedida ou qualidade linguística** em nenhum
  dos dois idiomas. Não se adicionou token como contorno.
- O PDF fictício abriu e renderizou no leitor local. Não foi confirmada captura
  de seu texto pelo VLibras: a automação de clique no iframe foi impedida por
  coordenadas fracionárias, e não há integração de tradução entre os documentos.
  Não se atribui esse limite da ferramenta ao leitor PDF.
- As larguras de 320, 390 e 1440 px foram verificadas por emulação no navegador.
  A home não apresentou overflow horizontal; o menu móvel abriu/fechou. O layout
  conserva a largura original: o botão flutua sobre uma pequena parte do conteúdo,
  sem coluna reservada. O painel maior é fechado antes de usar controles que ele
  possa sobrepor. Não foi um teste em aparelho físico.
- Após mover o botão para a direita e elevá-lo em 40 px, os 45 testes Node,
  TypeScript e compilação de desenvolvimento passaram novamente. A home foi
  reinspecionada em 390 × 844 e 1440 × 900 px; no celular de referência, o botão
  ficou acima dos links e à direita de “Caminhos para descobrir”. Não se repetiu
  o build completo de produção para esse ajuste de posição.

Esses resultados locais não substituem a verificação após publicação atrás do
proxy institucional, especialmente DNS, TLS, CSP e disponibilidade do tradutor.
