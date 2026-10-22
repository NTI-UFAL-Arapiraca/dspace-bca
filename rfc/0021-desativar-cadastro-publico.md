# RFC 0021 — Desativar o cadastro público de contas

## Contexto

O DSpace permite que visitantes solicitem a criação de uma conta EPerson
informando um e-mail. A confirmação por e-mail não é necessária para acessar o
acervo público e não deve ser confundida com os cadastros bibliográficos
`Person`.

## Decisão

Definir `user.registration=false` no serviço REST. O backend bloqueia a criação
de contas por auto cadastro, inclusive pela API. Login de EPersons existentes
e criação de contas por administradores permanecem disponíveis. O primeiro
administrador é criado pela CLI.

O Compose REST é compartilhado entre produção e desenvolvimento, portanto a
política vale nos dois ambientes. Uma futura mudança deve atualizar esta RFC e
a configuração do serviço.

## Arquivos e operação

- `docker-compose-rest.yml`: envia a propriedade `user.registration=false` ao
  backend.
- `backend/README.md` e `docs/referencia/implantacao.md`: descrevem o efeito da
  opção e como criar contas.
- `docs/guias/inicializacao-producao.md`: esclarece que o administrador inicial
  continua sendo criado diretamente pelo comando oficial da CLI.

Após atualizar o checkout, recrie o serviço `dspace` para carregar a
configuração. Nenhuma conta existente é removida ou alterada.

## Validação

Validar a configuração Compose de produção e revisar o diff. A validação do
Compose não substitui uma tentativa de cadastro contra o backend em execução.
