# RFC 0017 — Registro completo somente para administradores

- Status: aceita
- Escopo: apresentação Angular

## Contexto

As páginas de trabalhos e perfis Person oferecem um link para `/full`, onde o
DSpace lista todos os metadados do registro. Essa visualização não é necessária
para visitantes e usuários comuns.

## Decisão

Exibir os links para o registro completo somente quando o usuário tiver a
permissão global `AdministratorOf` do DSpace. A mesma permissão condiciona a
lista completa na rota `/full`; um acesso direto por outro usuário recebe um
aviso com retorno à página pública do item. Administradores conservam a
visualização atual.

Esta decisão controla a interface. A API REST continua obedecendo às políticas
e propriedades `metadata.hide.*` já configuradas. A página simples e seus
metadados públicos não mudam; esta RFC não declara confidencialidade para dados
que o backend já disponibiliza publicamente.

## Implementação

- `frontend/themes/custom/app/item-page/full/` sobrescreve o componente temável
  oficial da rota `/full`;
- as páginas customizadas de itens e Person ocultam os links para usuários sem
  `AdministratorOf`;
- os avisos para acessos diretos são traduzidos em pt-BR e inglês.

## Consequências operacionais

É necessária uma nova imagem Angular em produção; o YAML de runtime não muda.
Não há alteração no backend, nos registros, no índice ou em políticas REST.
Valide a rota com uma sessão administrativa e outra sem privilégio, inclusive
abrindo `/full` diretamente. A resposta REST continua fora do escopo desta
restrição de interface.
