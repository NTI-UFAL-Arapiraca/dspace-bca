# RFC 0023 — Grande área CNPq dos trabalhos

- Status: aceita
- Escopo: registro de metadados, formulário acadêmico, página do trabalho e migração

## Contexto

No banco legado, publicações se vinculam a categorias CNPq pela tabela
`categoria_cnpq_ids`. As categorias encontradas são grandes áreas e possuem
código e nome. A importação completa será executada novamente; cada pacote
SAF deve levar as categorias associadas ao trabalho.

## Decisão

Registrar `local.cnpq.area` como metadado repetível, com um valor por categoria
vinculada e o código seguido do nome, por exemplo
`1.00.00.00-3 Ciências exatas e da terra`. Preservar `dc.subject` para as
palavras-chave de origem. Exibir a classificação no detalhe público de
UntypedItem e Publication e permitir sua edição na seção Dados acadêmicos.

## Implementação

- `backend/config/registries/academic-metadata.xml` registra o campo. O mesmo
  tipo deve constar em `dspace-migration/config/registries/migration-metadata.xml`.
- `backend/config/submission-forms.xml` aceita múltiplos valores na submissão
  e na edição acadêmica.
- `frontend/themes/custom/app/item-page/simple/item-types/untyped-item/`
  exibe os valores; Publication reutiliza esse template.
- O projeto `dspace-migration` extrai as associações e grava os valores em
  `metadata_local.xml` dos novos pacotes SAF.

## Consequências e verificação

Registrar o campo no destino antes de importar os pacotes SAF. O XML já é
montado em REST e CLI e carregado por `scripts/prepare-academic.sh`.
Reiniciar o backend para carregar o formulário e reconstruir a imagem Angular
para publicar o rótulo e a exibição.

Na migração completa, conferir uma publicação com múltiplas categorias e outra
sem vínculo: comparar origem, `metadata_local.xml`, resposta REST e página do
trabalho. A página deve omitir o rótulo quando o campo estiver ausente.
