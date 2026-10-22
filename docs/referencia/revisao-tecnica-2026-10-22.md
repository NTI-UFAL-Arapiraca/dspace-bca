# Revisão técnica do repositório — 22/10/2026

- **Status:** relatório para revisão; correções não implementadas.
- **Escopo:** implantação e personalizações do DSpace 10.1 da Biblioteca da UFAL — Campus Arapiraca.
- **Base da análise:** diretório de trabalho, incluindo alterações locais ainda não commitadas. As linhas citadas correspondem ao estado inspecionado.
- **Método:** inspeção cruzada dos arquivos, leitura das bibliotecas oficiais instaladas e verificações sem alteração de serviços ou dados. Este documento foi salvo posteriormente, por solicitação do usuário.

## Resumo executivo

O projeto apresenta boa coerência entre implantação, modelo acadêmico e personalizações Angular. Porém, a preparação operacional ainda possui pendências: há dois achados de alta severidade, relacionados à publicação da imagem e à primeira inicialização em produção, além de lacunas em recuperação, redirects e validação da integração com a migração.

Não foi identificado problema crítico confirmado nem credenciais reais versionadas nos arquivos inspecionados. Isso não equivale a uma auditoria completa do histórico Git ou do ambiente institucional. Durante a revisão técnica não foram implementadas correções, criados commits ou alterados serviços e dados.

## 1. Problemas confirmados

Os achados estão ordenados por severidade.

### 1.1. Qualquer branch pode sobrescrever a imagem consumida pela produção

- **Severidade:** alta.
- **Local:** [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml), linhas 4 e 42; [`docker-compose-prod.yml`](../../docker-compose-prod.yml), linha 25.
- **Problema:** o workflow publica a mesma tag `dspace-10.1` em execuções de qualquer branch.
- **Evidência:** `push` não possui filtro de branches; a tag `type=raw,value=${{ env.DSPACE_ANGULAR_TAG }}` é incondicional. O Compose de produção consome essa tag por padrão.
- **Impacto:** um push em branch de desenvolvimento pode substituir o artefato instalado no próximo `pull` de produção. O checkout atualizado por `git pull` também pode deixar de corresponder à imagem baixada.
- **Correção sugerida:** permitir a atualização da tag de produção somente pela branch de publicação definida pelo projeto. Preferir, na implantação, a tag `sha-*` já emitida pelo workflow, vinculando imagem e revisão do checkout. Impedir também que execuções antigas sobrescrevam uma publicação mais recente.

### 1.2. O guia de produção cria o administrador antes de registrar os campos necessários

- **Severidade:** alta.
- **Local:** [`docs/guias/inicializacao-producao.md`](../guias/inicializacao-producao.md), linha 82; [`docs/guias/inicializacao-local.md`](../guias/inicializacao-local.md), linha 41; [`docs/guias/preparacao-academica.md`](../guias/preparacao-academica.md), linha 3.
- **Problema:** a instalação nova de produção segue uma ordem incompatível com os overrides de autoridade.
- **Evidência:** o guia local exige `registry-loader` antes de `create-administrator`. O guia de produção omite esse registro e encaminha à preparação acadêmica somente depois de criar o administrador. Essa preparação, por sua vez, pressupõe uma conta administrativa existente. Na biblioteca oficial 10.1 inspecionada, `MetadataAuthorityServiceImpl.init()` lança exceção quando um campo configurado como controlado ainda não existe no registro.
- **Impacto:** a criação do primeiro administrador pode falhar em banco novo, interrompendo o roteiro documentado.
- **Correção sugerida:** inserir no guia de produção o registro de `academic-metadata.xml` antes da criação do administrador, usando os três Compose de produção. Depois, manter a preparação de entidades e da coleção Pessoas.

A pré-condição foi confirmada por inspeção; não foi executada a criação de administrador em banco vazio.

### 1.3. Os redirects de normalização usam o protocolo HTTP interno

- **Severidade:** média.
- **Local:** [`proxy/nginx.conf`](../../proxy/nginx.conf), linhas 25 e 50.
- **Problema:** os redirects de `/dspace` e `/dspace-server`, sem barra final, não consideram o protocolo público.
- **Evidência:** ambos usam `return 301 /.../;` em um servidor HTTP. O mapa `$dspace_public_scheme` é usado nos cabeçalhos encaminhados, mas não nesses redirects. Com `absolute_redirect` habilitado por padrão, o Nginx produz redirects absolutos. Consulte a [referência oficial do Nginx](https://nginx.org/en/docs/http/ngx_http_core_module.html#absolute_redirect).
- **Impacto:** um acesso público por HTTPS pode receber `Location: http://...`, causando uma passagem desnecessária por HTTP ou um ciclo, dependendo da configuração institucional.
- **Correção sugerida:** usar redirects relativos, por exemplo com `absolute_redirect off` no escopo apropriado, e conferir as duas URLs sem barra através da cadeia real de proxies.

### 1.4. Falta um procedimento executável de backup e restauração

- **Severidade:** média.
- **Local:** [`docs/guias/operacao.md`](../guias/operacao.md), linha 73; [`docs/guias/inicializacao-producao.md`](../guias/inicializacao-producao.md), linha 11; [`docs/referencia/implantacao.md`](implantacao.md), linha 7.
- **Problema:** a documentação exige backup consistente e restauração testada, mas não fornece o procedimento nem referencia um roteiro institucional.
- **Evidência:** os documentos identificam os volumes e alertam sobre banco e assetstore, porém não definem captura consistente, restauração, verificação ou retorno à versão anterior. `solr_data` contém também estatísticas, além dos índices.
- **Impacto:** operadores diferentes podem produzir backups incompletos ou restaurar banco e arquivos de momentos incompatíveis. Reconstruir Discovery não recupera o histórico de estatísticas perdido.
- **Correção sugerida:** acrescentar um guia com controle de escritas durante a captura, dump PostgreSQL, cópia correspondente do assetstore, preservação das estatísticas Solr, registro das imagens/configurações e ensaio de restauração isolado.

Isso é uma lacuna confirmada do repositório; não significa que a instituição não possua backups externos.

### 1.5. A integração com dspace-migration depende de uma revisão não identificada

- **Severidade:** média.
- **Local:** [`tests/test_academic_setup.py`](../../tests/test_academic_setup.py), linha 80; [`docs/guias/preparacao-academica.md`](../guias/preparacao-academica.md), linha 9; [`docs/referencia/modelo-academico.md`](modelo-academico.md), linha 96.
- **Problema:** não está identificada a revisão compatível do projeto irmão, e o checkout disponível neste ambiente não satisfaz os contratos documentados.
- **Evidência:** dos cinco testes Python, quatro passaram e um terminou com `FileNotFoundError` para `dspace-migration/config/registries/migration-metadata.xml`. A conferência de links encontrou 11 destinos locais ausentes, todos relacionados ao projeto irmão.
- **Impacto:** o roteiro combinado não é reproduzível neste ambiente, e a suíte não consegue concluir a verificação de compatibilidade dos registros.
- **Correção sugerida:** documentar a revisão compatível de `dspace-migration`, atualizar os links conforme esse contrato e separar os testes unitários locais do teste de integração entre projetos. O teste integrado deve aceitar um caminho configurável e informar claramente sua pré-condição.

A correção deve preservar a separação dos projetos, sem trazer extração ou importação para este repositório.

## 2. Riscos que precisam de validação em ambiente real

### 2.1. A preparação pode atuar em dois destinos diferentes

- **Severidade:** média.
- **Local:** [`scripts/prepare-academic.sh`](../../scripts/prepare-academic.sh), linha 61; [`scripts/prepare_people_collection.py`](../../scripts/prepare_people_collection.py), linha 88.
- **Problema:** o script prepara registros pelo Compose selecionado e prepara a coleção pela URL de outro arquivo de ambiente.
- **Evidência:** os comandos de registro e entidades usam o projeto Compose; o Python usa `DSPACE_API_URL` do `.env` da migração. Não existe uma verificação de que ambos representam a mesma instalação.
- **Impacto:** ao alternar entre desenvolvimento e produção com o `.env` errado, a execução pode registrar campos em um ambiente e criar ou selecionar Pessoas em outro.
- **Correção sugerida:** validar a identidade do destino antes da primeira escrita e usar arquivos de ambiente de migração distintos por ambiente.

Não foi encontrada evidência de que essa mistura já tenha ocorrido.

### 2.2. O IP real depende da identidade de rede do proxy institucional

- **Severidade:** média.
- **Local:** [`docker-compose-rest.yml`](../../docker-compose-rest.yml), linha 60; [`proxy/nginx.conf`](../../proxy/nginx.conf), linha 66.
- **Problema:** a faixa explicitamente confiável cobre os containers, mas o funcionamento completo depende também do endereço usado pelo proxy institucional.
- **Evidência:** o Nginx acrescenta seu cliente à cadeia `X-Forwarded-For`. A implementação 10.1 inspecionada escolhe o último endereço não confiável dessa cadeia. O DSpace pode acrescentar automaticamente os IPs resolvidos de `dspace.ui.url`, mas o endereço de saída do proxy pode ser diferente.
- **Impacto:** as estatísticas e o GeoIP podem registrar o proxy como visitante.
- **Correção sugerida:** conferir a cadeia recebida em produção e o IP efetivamente calculado. Se necessário, acrescentar somente os endereços institucionais correspondentes à configuração confiável.

Também permanecem sem validação nesta revisão: TLS/DNS institucional, SMTP, upload, permissões reais dos volumes, SSR publicado e acesso a PDFs restritos através dos dois proxies.

## 3. Melhorias opcionais

### 3.1. Atualizar referências históricas das RFCs

- **Severidade:** baixa.
- **Local:** [RFC 0001](../../rfc/0001-build-e-ativacao-do-tema-custom.md), linha 13; [RFC 0012](../../rfc/0012-seo-sitemaps-robots-ssr.md), linha 17.
- **Problema:** algumas referências históricas não estão claramente distinguidas da configuração atual.
- **Evidência:** ainda aparecem `dspace-10_x`, caminhos `dspace-docker/` e referências a testes que não pertencem à suíte deste checkout.
- **Impacto:** aumentam o esforço de interpretação durante uma atualização.
- **Correção sugerida:** marcar explicitamente esses trechos como históricos e apontar para os arquivos e verificações atuais.

### 3.2. Executar as verificações existentes antes de publicar a imagem

- **Severidade:** baixa.
- **Local:** [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml), linha 19.
- **Problema:** as verificações existentes não são executadas pelo workflow de publicação.
- **Evidência:** o workflow compila e publica a imagem, mas não executa os testes Node/Python, a validação Compose ou o verificador Java existente.
- **Impacto:** uma compilação bem-sucedida pode publicar regressões cobertas por essas verificações.
- **Correção sugerida:** adicionar uma etapa de validação com os testes locais e a composição de produção; manter a integração com a migração em uma etapa com dependências explícitas.

## 4. Áreas revisadas sem outro problema identificado

- **Compose:** a ordem `dist → rest → prod` é coerente. Somente o proxy publica a porta 80. Desenvolvimento mantém portas em loopback e rede separada.
- **Persistência:** os quatro volumes estão declarados; GeoLite2 exige arquivo existente e fica somente leitura. SAF fica somente leitura na produção normal e gravável no overlay de migração. A documentação proíbe `docker compose down -v` em produção.
- **Versões:** os serviços DSpace estão alinhados em `dspace-10.1`; a tag e o digest fixados do Nginx correspondem.
- **URLs e rotas:** exemplos usam domínios genéricos, caminhos e ausência de barra final corretamente. O encaminhamento para `/server/` e os cabeçalhos estão presentes, com as ressalvas descritas. TLS e certificados permanecem sob responsabilidade do proxy institucional.
- **Modelo acadêmico:** curso/campus, quatro autoridades, formulários de submissão/edição, Discovery e perfis estão alinhados. Os scripts não importam trabalhos nem criam EPersons para pessoas bibliográficas. A documentação reconhece que alterar `relationship.enable-virtual-metadata` não converte relações já persistidas.
- **Privacidade:** a imagem oficial inspecionada mantém `metadata.hide.person.email=true`; o exportador OAI utiliza filtragem por permissão. Não foi encontrada evidência de exposição indevida nos overrides.
- **Idiomas:** resumos repetíveis, qualifiers `pt`/`en`, independência de `dc.language.iso` e consultas `allLanguages` estão coerentes.
- **Frontend:** registros eager/listable e imports diretos correspondem às extensões utilizadas. Dockerfiles aplicam explicitamente patches e overrides. A separação entre imagem e runtime está documentada. Acessibilidade e responsividade foram avaliadas pelo código, sem nova inspeção visual.
- **Scripts:** os argumentos e as pré-condições principais são verificados; a preparação reutiliza a coleção selecionada e preserva as demais variáveis ao salvar seu UUID. Os testes locais de repetição e preservação passaram, com a ressalva sobre a identidade do destino.

## 5. Validações efetivamente realizadas

| Verificação | Resultado |
| --- | --- |
| Compose de produção com `.env.production.example`, projeto `d10` e ordem `dist → rest → prod` | Passou. |
| Composição de desenvolvimento e overlay de migração | Portas, rede e SAF conferidos. |
| Manifestos públicos do Nginx | Tag `1.30.5-alpine3.24` e digest fixado correspondem. |
| `node --test tests/frontend/*.test.mjs` | 39 testes passaram. |
| Testes Python com dependências disponíveis | 4 passaram; 1 erro pela ausência do registro no projeto irmão. |
| `bash -n scripts/prepare-academic.sh` | Passou. |
| TypeScript e templates Angular com `--noEmit` no container local 10.1 | Passaram; aviso de `RouterLink` não utilizado na privacidade. |
| Comparação do tema local com o container validado | 99 arquivos, sem diferenças. |
| `git diff --check` | Passou. |

A tentativa inicial da suíte Python no interpretador padrão falhou por ausência de `python-dotenv`. A execução com um ambiente existente que continha as dependências permitiu rodar os cinco testes e identificar o erro de integração descrito no achado 1.5.

Não foram executados build completo de produção, suíte Angular/Karma, `nginx -t` ou restauração. O verificador Java/DTD não foi concluído: a tentativa sem criar arquivos, pela entrada padrão, falhou com `Illegal seek` antes de executar o teste. A leitura e o parsing dos XMLs não substituem essa validação.

A análise das bibliotecas oficiais utilizou os containers de desenvolvimento já existentes, sem recriá-los. A validação Compose verifica os modelos, mas não comprova funcionamento em produção. Resultados históricos registrados em outros documentos não foram tratados como testes executados nesta revisão.

## 6. Próximos passos priorizados

1. Restringir a publicação da tag de produção e vincular a implantação à revisão correta.
2. Corrigir a ordem de registro dos metadados e criação do administrador.
3. Corrigir os redirects e validar a cadeia de proxies em produção.
4. Documentar e ensaiar recuperação; depois, alinhar a revisão da migração e concluir a suíte integrada.

As correções propostas dependem de autorização para implementação.
