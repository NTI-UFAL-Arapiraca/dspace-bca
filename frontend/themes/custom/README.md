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
Curso e campus usam os novos campos locais. As abas dependem das buscas
configuradas em `backend/config/spring/api/academic-discovery.xml` e da
reindexação Discovery; `item.showAuthorityRelations` está ativado no YAML.

O componente `app/home-page/home-news/home-news.component.ts` mantém a extensão
oficial registrada, mas usa um template vazio para remover da página inicial o
banner promocional padrão do DSpace.

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
