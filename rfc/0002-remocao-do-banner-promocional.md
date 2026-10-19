# RFC 0002 — Remoção do banner promocional

- Status: aceita; composição da abertura atualizada pela RFC 0015
- Escopo: frontend

## Contexto

O componente `home-news` oficial exibe o texto promocional “DSpace is the world
leading open source repository platform...”, inadequado para a página inicial
institucional.

## Decisão

Sobrescrever somente o componente `HomeNewsComponent` no tema `custom`,
mantendo seu registro oficial e usando um template vazio. A página inicial
oficial não é copiada.

A [RFC 0015](0015-experiencia-visual-do-repositorio.md) substitui o template
vazio por uma introdução institucional traduzida. A decisão de suprimir a
publicidade da plataforma e manter a home oficial continua válida.

## Implementação

`dspace-docker/frontend/themes/custom/app/home-page/home-news/home-news.component.ts`.

## Consequências e validação

Outras seções da home continuam herdadas do DSpace. A validação atual usa a
compilação Angular e a inspeção visual descritas na RFC 0015; a antiga
verificação de template vazio não faz parte da suíte atual.
