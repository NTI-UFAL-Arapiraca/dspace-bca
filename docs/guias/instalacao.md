# Instalação

Roteiro único: ambiente local, servidor de produção, metadados, administrador
e coleção Pessoas. Execute um comando por vez, na raiz de `dspace-bca`, e pare
se algum falhar. A importação dos trabalhos fica na
[migração](../../../dspace-migration/docs/guias/migracao.md).

**Ambientes.** Local usa o projeto `d10dev` (`.env.development`,
`docker-compose-rest.yml` + `docker-compose-dev.yml`); produção usa `d10`
(`.env`, `dist` + `rest` + `prod`). Nos passos comuns, rode só o comando do
ambiente escolhido.

## Local

Requer Docker Compose 2.24.4 ou posterior, um arquivo GeoLite2 City e as
portas 4000 e 8080 livres.

```bash
cp .env.development.example .env.development   # só se ainda não existir
```

Preencha `POSTGRES_PASSWORD`, `GEOLITE2_CITY_DB_PATH` e
`DSPACE_SAF_HOST_DIR` (crie a pasta antes). Confira se a rede
`172.27.0.0/24` não conflita com redes do host ou VPN.

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml up -d --build
```

A primeira compilação da interface leva alguns minutos. Verifique:

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml ps
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml logs --tail=80 dspace
curl --fail http://localhost:8080/server/api
```

Com a API respondendo, abra `http://localhost:4000/` e siga para
[Metadados e administrador](#metadados-e-administrador).

Para encerrar preservando os dados:

```bash
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml down
```

## Produção

Execute no servidor. A interface usa a imagem compilada pelo GitHub Actions e
publicada no GHCR.

Antes:

- [ ] Porta 80 livre para o proxy interno; proxy institucional com TLS
      encaminhando `/dspace/` e `/dspace-server/`.
- [ ] Pasta SAF e arquivo GeoLite2 City existentes no servidor.
- [ ] Rede `172.23.0.0/24` sem conflito com o host ou VPN.
- [ ] Backup consistente de banco e assetstore, com restauração testada, se
      já houver dados.
- [ ] Relações virtuais entre entidades, se existirem, com conversão
      planejada. Um banco migrado pelo DSpace 11 exige backup compatível para
      voltar ao 10.

### 1. Publicar a interface e atualizar o checkout

Faça commit e push pelo fluxo habitual e aguarde **Build and publish Angular
image** concluir no GitHub Actions. No servidor:

```bash
git pull --ff-only
```

### 2. Configurar o ambiente

Somente numa instalação nova, sem `.env`:

```bash
cp .env.production.example .env && chmod 600 .env
```

Edite senhas, caminhos, SMTP e URLs públicas, sem sobrescrever senhas
existentes com os valores do exemplo. Mantenha:

```dotenv
DSPACE_ANGULAR_IMAGE=ghcr.io/nti-ufal-arapiraca/dspace-bca-angular
DSPACE_ANGULAR_TAG=dspace-10.1
```

Use o domínio real em `DSPACE_PUBLIC_ORIGIN`, `DSPACE_UI_URL`,
`DSPACE_SERVER_URL` e `DSPACE_REST_HOST`; a interface usa `/dspace` e o
backend `/dspace-server`. Significados na
[referência de URLs](../referencia/implantacao.md#urls-públicas-e-proxy-institucional).

### 3. Validar, baixar as imagens e iniciar

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

### 4. Conferir serviços e rotas

```bash
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml ps

docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  logs --tail=80 dspace dspace-angular dspace-proxy

curl --fail -H 'Host: repo.interno.example.org' \
  -H 'X-Forwarded-Proto: https' http://localhost:80/dspace-server/api
```

Troque o domínio ilustrativo e confira também as URLs públicas da interface e
da API. Somente o proxy deve publicar a porta 80.

## Metadados e administrador

Comum aos dois ambientes. Registre os metadados acadêmicos **antes** de criar
o administrador: os formulários de conta usam campos como
`dc.contributor.coadvisor`, que precisam existir no registro do banco.

```bash
# local
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml \
  exec dspace /dspace/bin/dspace registry-loader \
  -m /dspace/config/registries/academic-metadata.xml
# produção
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec dspace /dspace/bin/dspace registry-loader \
  -m /dspace/config/registries/academic-metadata.xml
```

O comando pode ser repetido; campos existentes são reutilizados, sem
alterar metadados dos itens (mas suas notas de escopo não são atualizadas:
revise-as pela administração). Este registro é a única fonte dos campos que
o `dspace-migration` escreve
([significado de cada campo](../../../dspace-migration/docs/referencia/metadados-customizados.md)).
Se o administrador já existe e um campo não estiver registrado, rode-o antes
de continuar.

O cadastro público está desativado; crie a conta administrativa pela CLI:

```bash
# local
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml \
  exec dspace /dspace/bin/dspace create-administrator
# produção
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  exec dspace /dspace/bin/dspace create-administrator
```

Em produção, teste login, upload e envio de e-mail. Guarde e-mail e senha
dessa conta no `.env` da migração (`DSPACE_API_USER`, `DSPACE_API_PASSWORD`).

## Coleção Pessoas

Registra campos e autoridades e cria a coleção bibliográfica `Person`. Não
importa trabalhos nem cria contas.

Requer `uv` e `dspace-migration` com sua
[preparação](../../../dspace-migration/docs/guias/migracao.md#preparação)
concluída. No `.env` da migração, confira `DSPACE_API_URL`,
`DSPACE_API_USER` e `DSPACE_API_PASSWORD` do destino escolhido; deixe
`DSPACE_PERSON_COLLECTION_UUID` vazio na primeira preparação ou informe uma
coleção Person existente nesse mesmo destino.

```bash
# local
bash scripts/prepare-academic.sh --development --project-name d10dev \
  --env-file .env.development --migration-env-file ../dspace-migration/.env
# produção
bash scripts/prepare-academic.sh --project-name d10 \
  --env-file .env --migration-env-file ../dspace-migration/.env
```

O script espera os dois projetos lado a lado. Em outro caminho, informe
`--migration-dir` (ou `DSPACE_MIGRATION_DIR`):

```bash
bash scripts/prepare-academic.sh --project-name d10 \
  --env-file .env --migration-dir /srv/dspace-migration \
  --migration-env-file /srv/dspace-migration/.env
```

Confira `DSPACE_PERSON_COLLECTION_UUID` no `.env` da migração e a coleção
Pessoas na administração. Repetir a preparação reutiliza a coleção.

Reinicie o backend para renovar o cache dos formulários e aguarde a API:

```bash
# local
docker compose --env-file .env.development -p d10dev \
  -f docker-compose-rest.yml -f docker-compose-dev.yml \
  restart dspace
# produção
docker compose --env-file .env -p d10 \
  -f docker-compose-dist.yml -f docker-compose-rest.yml -f docker-compose-prod.yml \
  restart dspace
```

Siga para o
[piloto local](../../../dspace-migration/docs/guias/migracao.md#piloto-local)
ou a [migração em produção](../../../dspace-migration/docs/guias/migracao.md#produção).
Campos, plugins e entidades: [modelo acadêmico](../referencia/modelo-academico.md).
Atualizações e verificação: [operação](operacao.md).
