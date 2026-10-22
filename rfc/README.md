# RFCs dos overrides do DSpace

Este diretório registra cada comportamento em que o projeto sobrescreve ou
complementa o frontend ou o backend oficial do DSpace. As RFCs são a fonte
de contexto para reaplicar e revisar essas diferenças ao atualizar as imagens.

| RFC | Decisão |
| --- | --- |
| [0001](0001-build-e-ativacao-do-tema-custom.md) | Compilar e ativar o tema local sobre a imagem oficial. |
| [0002](0002-remocao-do-banner-promocional.md) | Remover o banner promocional da página inicial. |
| [0003](0003-idioma-anonimo-padrao-pt-br.md) | Usar pt-BR para visitantes anônimos sem preferência. |
| [0004](0004-metadados-academicos-na-pagina-do-item.md) | Exibir orientador e banca na página do item. |
| [0005](0005-formatacao-localizada-da-data.md) | Formatar datas no padrão brasileiro em pt-BR. |
| [0006](0006-alinhamento-justificado-do-resumo.md) | Justificar o texto do resumo. |
| [0007](0007-negociacao-de-idioma-dos-metadados.md) | Filtrar metadados públicos por idioma e preservar todos no editor. |
| [0008](0008-formulario-de-resumos-multilingues.md) | Permitir abstracts repetíveis e qualificados por idioma. |
| [0009](0009-ocultacao-de-notas-internas.md) | Ocultar provenance do público. |
| [0010](0010-nome-publico-do-repositorio.md) | Usar o nome institucional na API e na interface. |
| [0011](0011-endpoint-oai-pmh.md) | Publicar e configurar o endpoint OAI-PMH do backend. |
| [0012](0012-seo-sitemaps-robots-ssr.md) | Ativar e validar sitemap, robots.txt e SSR. |
| [0013](0013-banco-geoip-geolite2.md) | Configurar o GeoLite2 City para estatísticas geográficas. |
| [0014](0014-pessoas-e-metadados-academicos.md) | Integrar pessoas, formulários acadêmicos e perfis por papel. |
| [0015](0015-experiencia-visual-do-repositorio.md) | Orientar a descoberta e organizar a leitura no tema institucional. |
| [0016](0016-preview-integrado-de-pdfs.md) | Integrar a leitura de PDFs com abas e visualizador local. |
| [0017](0017-registro-completo-so-para-administradores.md) | Restringir a visualização de metadados completos à administração no Angular. |
| [0018](0018-resumos-publicos-em-todos-os-idiomas.md) | Exibir todos os idiomas dos resumos, com prévias de 10 linhas e expansão individual. |
| [0019](0019-cache-de-intervalos-dos-pdfs.md) | Reutilizar trechos já baixados dos PDFs ao alternar entre abas. |
| [0020](0020-ano-de-publicacao-e-data-de-defesa.md) | Separar o ano de publicação da data de defesa nos metadados e na página do item. |
| [0021](0021-desativar-cadastro-publico.md) | Bloquear o cadastro público de contas por senha e e-mail. |

Uma nova alteração por override deve incluir sua RFC neste índice no mesmo
commit. Cada RFC deve identificar arquivos, consequência operacional e testes.
