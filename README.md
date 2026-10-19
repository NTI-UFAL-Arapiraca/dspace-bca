# DSpace da Biblioteca

Este projeto mantém a implantação e as personalizações do **DSpace 10.1**:
backend, PostgreSQL, Solr, interface Angular e proxy Nginx. A extração e a
importação do legado pertencem ao projeto irmão `dspace-migration`.

## Guias de execução

Os comandos de inicialização e operação estão em arquivos próprios:

- [Inicializar o ambiente local](docs/guias/inicializacao-local.md).
- [Inicializar ou atualizar a produção](docs/guias/inicializacao-producao.md).
- [Preparar metadados e a coleção Pessoas](docs/guias/preparacao-academica.md).
- [Operar e verificar a instalação](docs/guias/operacao.md).
- [Executar a migração](../dspace-migration/docs/guias/migracao-producao.md).

## Funcionamento

Em produção, o proxy institucional termina TLS e encaminha HTTP para o
`dspace-proxy`. Esse proxy atende `/dspace/` pela interface Angular e
`/dspace-server/` pelo backend. Apenas ele publica a porta 80; PostgreSQL,
Solr, interface e backend permanecem na rede interna Docker.

A interface é compilada pelo GitHub Actions após o push e publicada no GHCR.
As configurações de backend e de runtime são montadas a partir deste checkout.
O ambiente local usa o projeto Compose `d10dev`, com volumes próprios, e
expõe interface e API somente em loopback.

Os trabalhos recebem campos de curso e campus e referências a pessoas por
UUID. `Person` representa o cadastro bibliográfico; `EPerson` representa a
conta de acesso. Os perfis de pessoas mostram os trabalhos por papel.

## Referência

- [Arquitetura, URLs e configurações](docs/referencia/implantacao.md).
- [Modelo acadêmico, pessoas e metadados](docs/referencia/modelo-academico.md).
- [Levantamento e decisões sobre metadados](docs/referencia/relatorio-metadados-e-pessoas.md).
- [Configuração do backend](backend/README.md) e [tema customizado](frontend/themes/custom/README.md).
- [Decisões registradas nas RFCs](rfc/README.md).
- [Índice da documentação](docs/README.md).

## Arquivos principais

| Arquivo ou pasta | Responsabilidade |
| --- | --- |
| `docker-compose-rest.yml` | Backend, PostgreSQL, Solr, rede e volumes. |
| `docker-compose-dist.yml` | Interface Angular. |
| `docker-compose-prod.yml` | Contrato de produção e proxy interno. |
| `docker-compose-dev.yml` | Ambiente local com atualização automática do tema. |
| `docker-compose-local.yml` | Publicação opcional de portas para uso local. |
| `docker-compose-migration.yml` | SAF gravável durante a importação em produção. |
| `proxy/nginx.conf` | Roteamento HTTP e cabeçalhos de proxy. |
| `.env.production.example` e `.env.development.example` | Modelos de configuração sem credenciais reais. |
| `Dockerfile.angular` e `.github/workflows/deploy.yml` | Compilação e publicação da interface no GHCR. |
| `Dockerfile.angular.dev` e `frontend/dev/` | Servidor de desenvolvimento e sincronização do tema. |
| `backend/config/` | Formulários, autoridades, registro de campos e Discovery. |
| `frontend/themes/custom/` | Estilos, assets, traduções e componentes. |
| `frontend/config/` | Configuração de runtime da interface. |
| `scripts/prepare-academic.sh` | Preparação dos campos, tipos e coleção Person. |
| `cli.yml` | Serviço administrativo conectado à rede e ao assetstore da instalação. |
