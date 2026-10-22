# RFC 0019 — Cache de intervalos dos PDFs

- Status: aceita
- Escopo: tema Angular, complementa a RFC 0016

## Contexto

A troca de abas fecha o leitor anterior para cancelar transferências e liberar
o worker e as páginas renderizadas. Antes deste ajuste, voltar para o mesmo PDF
repetia os pedidos HTTP dos intervalos já recebidos. A leitura parcial economiza
dados apenas se esses trechos também puderem ser reaproveitados entre leitores.

## Decisão

- Manter um cache de intervalos completos e validados no `PdfPreviewService`,
  que já tem escopo do componente de pré-visualização.
- Separar os arquivos por UUID, URL HAL de conteúdo, tamanho e checksum. Uma
  nova versão do arquivo não reutiliza os bytes da versão anterior.
- Montar cada leitura com os trechos disponíveis e pedir somente as lacunas,
  inclusive quando o novo intervalo se sobrepõe a pedidos anteriores.
- Compartilhar requisições simultâneas de intervalos idênticos e cancelar o
  HTTP quando não houver mais leitores interessados. Falhas e respostas
  incompletas não entram no cache.
- Limitar os bytes retidos a **64 MiB**, compartilhados entre todos os PDFs
  do item, descartando primeiro os intervalos menos usados. Uma resposta
  maior que esse limite atende a leitura atual, mas não permanece no cache.
- Preservar os bytes ao alternar abas e fechar/reabrir o leitor na mesma
  visita. Limpar o cache ao mudar de item, recarregar o catálogo, mudar de
  usuário ou destruir o componente. Não persistir o conteúdo no navegador.
- Manter `CanDownload` pelo serviço oficial de autorização, com seu cache e
  invalidação próprios. O cache de conteúdo não concede acesso ao leitor.
- Preservar a escolha de abrir um PDF grande durante a visita e mostrar o
  volume transferido por arquivo, sem contar novamente os acertos do cache.

Somente um leitor continua ativo. A ponte de mesma origem e a distribuição
PDF.js permanecem iguais; não é necessário alterar a versão dos assets.
Páginas ainda não consultadas podem exigir novos intervalos. O descarte por
limite de memória também pode exigir transferência ao voltar a um arquivo.

## Implementação e operação

- `pdf-preview/pdf-range-cache.ts`: planejamento das leituras e limite de memória;
- `pdf-preview/pdf-preview.service.ts`: cache de conteúdo, deduplicação dos
  pedidos em curso e contagem de bytes transferidos;
- `pdf-preview/pdf-preview.component.ts`: ciclo de vida, troca de usuário e
  preservação da abertura explícita de cada PDF.

As alterações locais são sincronizadas pelo watcher do tema. Produção exige
uma nova imagem Angular, sem mudanças no backend, nos dados ou nas políticas.

## Validação

Os testes Node verificam isolamento entre A/B, lacunas, sobreposição, descarte
por uso e limite, propriedade dos buffers e limpeza. Os specs Angular verificam
A/B repetido sem novos pedidos de conteúdo, transferências apenas de lacunas,
deduplicação, cancelamento, erros, mudança de checksum, troca de usuário e
desmontagem do componente. Também devem ser executados lint e build Angular
de navegador/SSR. A validação visual confirma que o PDF continua renderizando
após voltar à aba; a economia é verificada pela contagem de requisições.

Na verificação local com PDFs de 2.588 e 968.109 bytes, as primeiras aberturas
somaram 12 pedidos parciais e 708.553 bytes. O retorno A → B após essas
aberturas manteve os totais: zero novos pedidos à API e zero bytes adicionais,
com ambos os documentos renderizados novamente. A medição usou um proxy
temporário em loopback com `Cache-Control: no-store`, sem alterar os arquivos,
as permissões ou os dados do backend.

Validação executada: 37 testes Node e 26 specs Angular passaram, além do lint
e das compilações de produção do navegador e do servidor (SSR), verificadas
separadamente. `git diff --check` também passou.
