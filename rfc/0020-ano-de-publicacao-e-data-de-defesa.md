# RFC 0020 — Ano de publicação e data de defesa

- Status: aceita
- Escopo: metadados, migração e frontend

## Contexto

A página simples apresentava `dc.date.issued` com o rótulo genérico “Data”. Na
migração, esse campo recebia `data_defesa`, embora a origem também contenha
`ano_pub`. Isso confundia a data de defesa com publicação e com a entrada do
registro no DSpace.

## Decisão

`dc.date.issued` representa o ano de publicação (`ano_pub`) e `local.date.defense`
representa a data de defesa (`data_defesa`). A página apresenta os valores
separadamente como “Ano de publicação” e “Data de defesa”. A data de defesa é
metadado descritivo do trabalho; não altera as datas internas de acesso,
submissão ou criação mantidas pelo DSpace.

## Implementação

O registro do campo local e o formulário acadêmico definem
`local.date.defense`. O projeto de migração produz `dc.date.issued` em
`dublin_core.xml` e a data local em `metadata_local.xml`. O tema lê os dois
campos em componente compartilhado por UntypedItem e Publication e aplica
formatação brasileira à data completa.

## Consequências operacionais

O registro do campo deve ser carregado antes da importação, pelo fluxo de
preparação acadêmica. Alterações do tema exigem nova imagem Angular. Pacotes
gerados pela versão anterior e itens já importados não são atualizados por esta
mudança de código; a correção desses registros requer uma migração de metadados
in-place, pois repetir a importação completa pode criar duplicatas.
