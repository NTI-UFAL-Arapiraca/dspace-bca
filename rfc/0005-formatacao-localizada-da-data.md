# RFC 0005 — Formatação localizada da data

- Status: aceita
- Escopo: frontend

## Contexto

Datas completas chegavam em ISO e eram mostradas dessa forma mesmo quando a
interface estava em português do Brasil. A RFC 0020 define `dc.date.issued`
como ano de publicação e mantém a data completa de defesa em
`local.date.defense`.

## Decisão

Substituir o campo de data genérico por um componente que formata valores de
data completos `YYYY-MM-DD` como `DD/MM/YYYY` e valores `YYYY-MM` como
`MM/YYYY` somente em `pt-BR`. O ano de publicação é exibido como ano isolado;
outros idiomas e datas inválidas permanecem inalterados.

## Implementação

`frontend/themes/custom/app/item-page/simple/item-types/untyped-item/date/` e o
registro do componente em `untyped-item.component.ts`.

## Consequências e validação

O valor persistido continua ISO; a mudança é apenas de apresentação. A data de
defesa usa a formatação localizada; o ano de publicação não ganha mês ou dia.
