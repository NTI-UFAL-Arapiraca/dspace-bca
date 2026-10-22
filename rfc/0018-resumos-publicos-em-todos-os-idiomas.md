# RFC 0018 — Resumos públicos em todos os idiomas

- Status: aceita
- Escopo: frontend e contrato de consulta REST
- Substitui parcialmente a RFC 0007 na página simples do trabalho

## Contexto

A aba de informações deve apresentar o resumo em português e todos os resumos
em língua estrangeira cadastrados. O idioma estrangeiro não é necessariamente
inglês. A resposta REST localizada omitia essas traduções antes da renderização.
Os textos extensos também precisam permitir acesso aos outros campos sem
deixar a área de leitura excessivamente pequena em relação à coluna acadêmica.

## Decisão

- Manter a negociação por `Accept-Language` na busca, nos cards e nos demais
  campos da página.
- Consultar adicionalmente o endpoint canônico do item com
  `projection=allLanguages` para a área de resumos de UntypedItem e Publication.
  A API oficial já oferece essa projeção; não é necessário alterar o backend.
  Consumir apenas `dc.description.abstract` dessa resposta, sem substituir o
  item localizado fornecido pelo resolver. Usar `DspaceRestService`, com os
  interceptadores oficiais de autorização e idioma, sem inserir a projeção
  multilíngue no cache compartilhado de objetos DSpace.
- Mostrar todos os valores não vazios, inclusive vários no mesmo idioma.
  Ordenar português, inglês e os demais na ordem recebida. Não inferir idioma
  a partir de `dc.language.iso` nem transformar qualifiers persistidos.
- Usar Resumo, Abstract, Resumen, Résumé, Zusammenfassung e Riassunto nos idiomas
  correspondentes. Para os demais, usar “Resumo (Língua)” com nome localizado;
  na ausência do nome, usar o qualifier. Sem qualifier, usar “Resumo”.
- Limitar cada prévia a 10 linhas em todas as larguras, com “Ver mais” e
  “Ver menos” individuais somente quando o conteúdo exceder a altura disponível.
  Conservar o texto integral no HTML e o alinhamento justificado da RFC 0006,
  renderizando com a diretiva Markdown sanitizada oficial e atributo `lang`.
- Manter os resumos já disponíveis em caso de falha da consulta adicional e
  apresentar aviso com opção de tentar novamente.

O editor administrativo e suas respostas de PATCH continuam solicitando
`allLanguages`. Políticas de acesso, níveis de segurança e `metadata.hide.*`
continuam aplicados pelo backend; a projeção não é uma autorização adicional.

## Implementação

- `frontend/themes/custom/app/item-page/simple/abstracts/`: consulta REST,
  títulos por idioma e componentes de apresentação/expansão;
- páginas UntypedItem e Publication: importação direta do componente no tema;
- catálogos `pt-BR.json5` e `en.json5`: ações, avisos e rótulos acessíveis.

## Consequências e validação

A página faz uma consulta adicional ao item; não consulta listas inteiras em
`allLanguages`. Há mais dados transferidos nesse endpoint, pois a projeção
oficial inclui todos os idiomas dos metadados autorizados. O componente usa
somente os resumos. A mudança exige recompilar a imagem Angular de produção;
em desenvolvimento, os arquivos são sincronizados pelo watcher do tema.

Os testes Node cobrem títulos, variantes regionais, valores repetidos, idiomas
desconhecidos e preservação do texto. Os specs Angular verificam consulta com
projeção, preservação dos parâmetros, falha com fallback, controles acessíveis
e medição de transbordamento. A validação visual deve verificar textos curtos e
longos, expansão independente e larguras de desktop e celular.
