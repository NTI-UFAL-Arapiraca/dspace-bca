# RFC 0025 — Faceta de ano de publicação para agregados

- Status: aceita
- Escopo: configuração Discovery do backend

## Contexto

A interface precisa de contagens de trabalhos por ano de publicação para
histogramas na página inicial, na busca e nas coleções. A faceta oficial
`dateIssued` é do tipo `date` e devolve intervalos: no DSpace 10.1,
`FacetYearRange.getYearGap` arredonda o passo para múltiplos de 10, e o passo
só é 1 quando o intervalo consultado tem um único ano. Uma consulta por ano
multiplicaria os pedidos no SSR.

A decisão foi resolver isso por configuração, sem código Java nem imagem de
backend própria.

## Decisão

Acrescentar a `academic-discovery.xml`:

- `academicFilter_publicationYear`: faceta de texto (`indexFieldName`
  `publicationYear`) sobre `dc.date.issued`, com `facetLimit` 100 e ordenação
  por valor. Cada valor armazenado vira uma entrada com sua contagem.
- `academic_works_aggregates`: configuração Discovery com `indexAlways`, os
  mesmos filtros padrão da `academic_works_search` e as facetas de ano
  (intervalo e lista), tipo, curso e campus. Nenhuma página de busca usa este
  id. Por isso, a faceta nova não aparece na barra lateral pública. O endpoint
  `/api/discover/facets/{nome}` só atende facetas que estejam em
  `sidebarFacets`, e por isso a faceta precisa de uma configuração própria.

A busca pública, os perfis e as demais configurações não mudam.

## Uso

```
GET /server/api/discover/facets/publicationYear?configuration=academic_works_aggregates&size=100
GET /server/api/discover/facets/publicationYear?configuration=academic_works_aggregates&scope=<uuid-da-coleção>&size=100
```

A resposta traz `label` e `count` por ano. O link de cada barra pode filtrar
a busca pública pelo intervalo oficial, com
`f.dateIssued=[AAAA TO AAAA],equals` na `academic_works_search`.

## Consequências e limites

- A migração grava `dc.date.issued` como `AAAA` (`standardize_publication_year`
  no `dspace-migration`). Valores que a normalização não reconhece são
  preservados como vieram e aparecem como entradas próprias.
- O campo de data do formulário aceita ano, mês e dia. Um depósito com data
  completa gera uma entrada `AAAA-MM-DD` separada. O componente que consome a
  faceta deve somar os valores pelos quatro primeiros dígitos e ignorar os que
  não começam por um ano.
- Os totais incluem os mesmos registros que a `academic_works_search`,
  inclusive itens Person. Isso não afeta as contagens por ano, curso ou tipo
  dos trabalhos, porque Person não tem esses campos.
- `facetLimit` 100 cobre até cem anos distintos. O tamanho por página do
  endpoint segue limitado por `rest.search.max.results`.

## Implementação e operação

- `backend/config/spring/api/academic-discovery.xml`;
- `tests/backend/AcademicConfigurationCheck.java` verifica o registro, o tipo,
  o campo, o limite, a ordenação e a ausência da faceta na busca pública;
- `backend/README.md` e `docs/referencia/modelo-academico.md`.

Recrie o serviço `dspace` para carregar o XML e reconstrua o índice com
`index-discovery -b`, conforme o [guia de operação](../docs/guias/operacao.md).
Até a reindexação, a faceta retorna vazia. A reconstrução deixa a busca
parcial enquanto roda, então deve ser feita fora do horário de uso.
