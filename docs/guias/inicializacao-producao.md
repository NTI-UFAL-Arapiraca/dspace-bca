# Inicializar ou atualizar a produção

Execute no servidor, na raiz de `dspace-bca`. Este roteiro usa o projeto
`d10` e a imagem compilada pelo GitHub Actions e publicada no GHCR.

## 1. Conferir os pré-requisitos

- Docker Compose instalado e porta 80 disponível para o proxy interno.
- Proxy institucional configurado para `/dspace/` e `/dspace-server/`, com TLS.
- Pasta SAF e arquivo GeoLite2 City existentes no servidor.
- Banco e assetstore com backup consistente e restauração testada, se já houver dados.
- Rede `172.23.0.0/24` disponível, sem conflito com o host ou VPN.

Se houver relações virtuais entre entidades, planeje sua conversão antes de
aplicar esta configuração acadêmica. Um banco migrado pelo DSpace 11 exige
backup compatível para voltar ao 10.

## 2. Publicar a interface e atualizar o checkout

Faça commit e push pelo fluxo habitual. Aguarde **Build and publish Angular
image** concluir com sucesso no GitHub Actions. No servidor:

```bash
git pull --ff-only
```

## 3. Configurar o ambiente

Somente em uma instalação nova, sem `.env`:

```bash
cp .env.production.example .env
chmod 600 .env
```

Edite as senhas, caminhos, SMTP e URLs públicas. Mantenha:

```dotenv
DSPACE_ANGULAR_IMAGE=ghcr.io/nti-ufal-arapiraca/dspace-bca-angular
DSPACE_ANGULAR_TAG=dspace-10.1
```

Use o domínio real em `DSPACE_PUBLIC_ORIGIN`, `DSPACE_UI_URL`,
`DSPACE_SERVER_URL` e `DSPACE_REST_HOST`. A interface usa `/dspace` e o
backend `/dspace-server`. Confira os significados na
[referência de URLs](../referencia/implantacao.md#urls-públicas-e-proxy-institucional).
Não sobrescreva senhas existentes com os valores do exemplo.

## 4. Validar, baixar as imagens e iniciar

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  config --quiet

docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  pull dspace dspace-angular dspacedb dspacesolr dspace-proxy

docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  up -d --no-build
```

## 5. Conferir serviços e rotas

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml ps

docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  logs --tail=80 dspace dspace-angular dspace-proxy

curl --fail -H 'Host: repo.interno.example.org' \
  -H 'X-Forwarded-Proto: https' http://localhost:80/dspace-server/api
```

Substitua o domínio ilustrativo. Confira também as URLs públicas da interface
e da API. Somente o proxy deve publicar a porta 80.

## 6. Registrar metadados antes de criar o administrador

O DSpace exige que os metadados usados nos formulários de usuário estejam no
registro antes de salvar a conta. Isso inclui `dc.contributor.coadvisor`,
adicionado pela configuração acadêmica deste projeto. Carregue o registro no
banco depois de atualizar/recriar o backend e antes de criar o administrador:

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec dspace /dspace/bin/dspace registry-loader \
  -m /dspace/config/registries/academic-metadata.xml
```

O comando pode ser repetido; os campos que já existem são reutilizados.

## 7. Criar o administrador, se necessário

O cadastro público de contas está desativado. Crie a conta administrativa
diretamente no backend com o comando abaixo; contas existentes continuam
podendo fazer login.

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec dspace /dspace/bin/dspace create-administrator
```

Teste login, upload e envio de e-mail. Guarde as credenciais administrativas
no `.env` da migração quando for executar a importação.

## 8. Continuar conforme a tarefa

- [Preparar campos e pessoas](preparacao-academica.md).
- [Executar a migração](../../../dspace-migration/docs/guias/migracao-producao.md).
- [Operar e verificar a instalação](operacao.md).

A preparação e a migração têm roteiros próprios. A publicação da imagem
continua pelo GitHub/GHCR.
