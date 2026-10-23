# RFC 0022 — VLibras Widget global

- Status: aceita
- Escopo: frontend e dependência externa de acessibilidade

## Decisão

Com autorização institucional já concedida, integrar ativamente o widget oficial
VLibras, sem token, no ponto de extensão `custom/app/root` do DSpace 10.1.
Conservar o template e o comportamento do root oficial, registrando a extensão
no bundle eager. Um serviço singleton inicia o loader após o render somente no
navegador, fora da zona Angular. A tag e o botão oficial impedem duplicação
durante carga pendente ou navegação entre rotas.

Usar o construtor documentado com posição `R`, coordenado com a inicialização
automática do loader oficial. Conservar o botão flutuante de 40 px à direita,
40 px acima da altura padrão, usando a referência pública `VLibrasWidget.initBtn`
e verificando o ID do contêiner de acesso antes de ajustar seu estilo. Na home
móvel de referência, o botão inicia entre o parágrafo e os links de descoberta,
sem reservar coluna ou reduzir a largura do conteúdo no celular. Uma pequena
sobreposição é aceita e resolvida por rolagem; o painel usa seus controles
oficiais para fechar e expandir. Não substituir a estrutura interna do widget
nem modificar dependências geradas, proxy ou configuração de SSR para acomodá-lo.

## Limites e consequências

O script e o aplicativo são servidos pelo VLibras e podem receber atualizações
independentemente da imagem DSpace. A tradução depende dos serviços externos;
indisponibilidade não deve bloquear o catálogo. O serviço é destinado a
português para Libras; não se promete tradução de abstracts estrangeiros nem de
texto dentro do iframe PDF.js. Os resumos e seus qualifiers são preservados.
Não há mudança em API, metadados, contas, acesso ou acervo.

Não existe CSP versionada a alterar. Uma CSP imposta pelo proxy institucional
precisa permitir os recursos oficiais sem remover as permissões já necessárias
ao DSpace e ao PDF local. O aviso de privacidade informa o serviço externo.
Produção exige reconstruir/publicar a imagem Angular; o watcher aplica o tema
em desenvolvimento.

## Implementação e validação

- `frontend/themes/custom/app/accessibility/`: serviço browser-only e loader;
- `frontend/themes/custom/app/root/` e registro eager: extensão global;
- `tests/frontend/vlibras-widget.test.mjs`: idempotência, falha e prefixo;
- [Referência VLibras](../docs/referencia/vlibras.md): configuração, CSP,
  publicação, resultados observados e limites da validação remota.

Verificar testes Node, TypeScript, build browser/SSR, navegação Angular e layout
desktop/móvel. A validação de 23/10/2026 encontrou o núcleo remoto de tradução
indisponível e DNS institucional inacessível; isso não comprova tradução ou CSP
em produção. Fontes: [instalação oficial](https://www.vlibras.gov.br/doc/widget/installation/webpageintegration.html)
e [CSP oficial](https://www.vlibras.gov.br/doc/widget/installation/content-security-policy.html).
