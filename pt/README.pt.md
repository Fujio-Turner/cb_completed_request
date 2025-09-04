# Couchbase Slow Query Analysis Tool v3.12.1

**🌍 Idiomas:** [🇺🇸 English](../README.md) | [🇩🇪 Deutsch](../de/README.de.md) | [🇪🇸 Español](../es/README.es.md) | **🇵🇹 Português**

🚀 **Beta Deployment Links:**
- English: https://cb.fuj.io/en/
- German: https://cb.fuj.io/de/
- Spanish: https://cb.fuj.io/es/
- Portuguese: https://cb.fuj.io/pt/

Se não quiser baixar os arquivos index.html, clique nos links beta acima. Lembre-se de ainda seguir os passos na seção `Início Rápido` abaixo para completar `Passo 3:` e além para obter os dados JSON que você precisa para debugar e analisar.

## 📁 **Instruções de Download:**
Alternativamente, você pode baixar os arquivos HTML localmente:
- **Português**: Download [`index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/pt/index.html?download=true)
- **Inglês**: Download [`index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/en/index.html?download=true)
- **Alemão**: Download [`index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/de/index.html?download=true)
- **Espanhol**: Download [`index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/es/index.html?download=true)

---

Uma ferramenta web abrangente para analisar performance de consultas Couchbase e planos de execução. Visualize padrões de consultas, identifique gargalos e otimize performance do banco de dados com rastreamento avançado de uso de índices, análise de planos de execução e recursos dedicados de gerenciamento de índices.

#### (Compatível com Capella)

## Início Rápido

### Passo 1: Baixar a Ferramenta
Baixe ou clone todo o repositório OU apenas baixe o `pt_index.html`

### Passo 2: Abrir no Navegador
Vá para a pasta onde você baixou o `pt_index.html` e abra-o diretamente em qualquer navegador web moderno (Chrome, Firefox, Safari, Edge). _Firefox_ parece ser mais rápido

### Passo 3: Extrair Dados de Consultas
Execute esta consulta no Couchbase Query Workbench ou cbq:

```sql
SELECT *, meta().plan FROM system:completed_requests LIMIT 2000;
```

**Notas**: 
Isso pode retornar um JSON de aproximadamente 36MB. Qualquer coisa maior provavelmente fará o navegador travar. _Firefox_ parece ser o navegador mais rápido.

**Navegador está lento/travando:**
Se o navegador ficar lento, reduza o tamanho dos dados via `LIMIT 2000`

[Mais Opções de Consulta](sql_queries.md)

### Passo 4: Analisar
Selecione TUDO & Copie os resultados JSON completos e cole na área de entrada da ferramenta no topo, então clique em **Parse JSON**

![Interface de entrada de consultas](copy_paste_json.png)

### Passo 5a: Filtrar por Intervalo de Datas (Opcional)

- **Auto-preenchimento**: Campos de data são automaticamente preenchidos com o intervalo de tempo completo dos seus dados
- **Filtragem personalizada**: Ajuste as datas "De" e "Para" para focar em períodos específicos
- **Re-analisar**: Clique em "Parse JSON" novamente para aplicar o filtro de data
- **Status do filtro**: Veja quantas consultas correspondem ao seu intervalo selecionado

### Passo 5b: Análise de Índices Aprimorada (Opcional)

Execute a consulta abaixo para obter o resultado JSON. Copie e cole os resultados na segunda caixa de entrada de texto à direita e clique no botão `Parse JSON`.

```sql
SELECT 
 s.name,
 s.id,
 s.metadata,
 s.state,
 s.num_replica,
CONCAT("CREATE INDEX ", s.name, " ON ", k, ks, p, w, ";") AS indexString
FROM system:indexes AS s
LET bid = CONCAT("", s.bucket_id, ""),
    sid = CONCAT("", s.scope_id, ""),
    kid = CONCAT("", s.keyspace_id, ""),
    k = NVL2(bid, CONCAT2(".", bid, sid, kid), kid),
    ks = CASE WHEN s.is_primary THEN "" ELSE "(" || CONCAT2(",", s.index_key) || ")" END,
    w = CASE WHEN s.condition IS NOT NULL THEN " WHERE " || REPLACE(s.condition, '"', "'") ELSE "" END,
    p = CASE WHEN s.`partition` IS NOT NULL THEN " PARTITION BY " || s.`partition` ELSE "" END;
```

## Recursos

### **Seis Abas de Análise**:

#### **1. Aba Dashboard**
- **Distribuição de Duração de Consultas** gráfico de barras mostrando padrões de performance
- **Índices Primários Utilizados** gráfico de donut com sistema de alerta inteligente
  - Exibição de alerta condicional (aparece apenas quando índices primários são detectados)
  - Link educativo "Saiba mais" para melhores práticas de índices primários do Couchbase
  - Distinção visual aprimorada para consciência de performance em produção
- **Recursos de Padrões de Consulta** análise para insights de performance
- **Usuários por Contagem de Consultas** tabela ordenável mostrando os principais geradores de consultas
- **Contagem de Uso de Índices** tabela ordenável rastreando utilização de índices
- **Tipo de Statement** gráfico de pizza (detalhamento de SELECT, INSERT, UPDATE, DELETE)
- **Estado da Consulta** gráfico de pizza mostrando status de conclusão

#### **2. Aba Timeline**
- **Seis Visualizações Interativas** em layout de grade 2x3:
  - **Gráfico de Buckets de Duração**: Distribuição de duração de consultas ao longo do tempo
  - **Gráfico de Tipos de Consulta**: Detalhamento de tipos de consulta por períodos de tempo
  - **Gráfico de Operações**: Comparação de scans de índices vs buscas de documentos
  - **Gráfico de Filtros**: Eficiência de operações de filtro (relações IN vs OUT)
  - **Gráfico de Timeline**: Distribuição de porcentagem de tempo de kernel ao longo do tempo
  - **Gráfico de Memória**: Uso de memória (MB) ao longo do tempo com rastreamento de contagem de consultas
- **Controles Interativos**:
  - Botão de Reset Zoom para navegação de gráficos
  - Opções de escala do eixo Y (Linear/Logarítmica)
  - Opções de agrupamento de tempo (Por Otimizador/Por Minuto/Por Segundo)
  - Botão de filtro "Usar Intervalo de Tempo"
  - Capacidades de pan/zoom com arrastar para panorâmica, rolar para zoom, seleção de caixa de arrastar

#### **3. Aba Query Groups** (Análise)
- **Análise Agregada de Consultas** com agrupamento de statements normalizados
- **Métricas Estatísticas**: total_count, duração min/max/avg/median
- **Médias de Performance**: avg_fetch, avg_primaryScan, avg_indexScan
- **Detalhamento de Usuários**: Mostra contagem de execução por usuário para cada padrão de consulta
- **Normalização Inteligente**: Substitui literais de string e números por placeholders `?`
- **Resultados Filtrados**: Exclui consultas INFER, ADVISE, CREATE, ALTER INDEX e SYSTEM

#### **4. Aba Every Query**
- **Tabela Abrangente de Consultas** com 17 colunas
- **Diagramas de Fluxo Interativos** com visualização de plano de execução codificada por cores
- **Recursos Avançados de Tabela** com ordenação completa de colunas e gerenciamento de statements
- **Processamento Avançado de Dados** com capacidades de processamento em lote

#### **5. Aba Index Query Flow**
- **Relacionamentos Visuais Índice-Consulta** com diagramas de fluxo interativos
- **Detecção Aprimorada de Índices Primários** com cobertura abrangente
- **Insights de Performance** para oportunidades de otimização

#### **6. Aba Indexes** (NOVO na v3.0.0)
- **Gerenciamento Abrangente de Índices** com catálogo completo de índices
- **Opções de filtragem avançadas** e filtros especializados
- **Consolidação Inteligente de Índices** e correspondência consulta-índice

## Entendendo a Análise

- **Bolhas verdes**: < 25% do tempo total de consulta
- **Bolhas amarelas**: 25-50% do tempo total de consulta
- **Bolhas laranja**: 50-75% do tempo total de consulta
- **Bolhas vermelhas**: > 75% do tempo total de consulta
- **Scan Primário destacado**: Consultas usando scans de índices primários (candidatos potenciais de otimização)

## Diretrizes de Agrupamento de Tempo

Ao analisar gráficos de linha do tempo, escolha intervalos de data apropriados para cada agrupamento de tempo:

- **Por Otimizador**: Seleciona automaticamente o melhor agrupamento baseado no seu intervalo de data (recomendado)
- **Por Segundo**: Melhor para intervalos ≤ 1 hora (análise detalhada)
- **Por Minuto**: Melhor para intervalos ≤ 1 dia (padrões horários)
- **Por Hora**: Melhor para intervalos ≤ 1 mês (padrões diários)
- **Por Dia**: Melhor para intervalos > 1 mês (tendências de longo prazo)

**⚠️ Aviso**: Intervalos de data grandes com agrupamentos de granularidade fina podem causar erros de renderização de gráficos. A ferramenta alertará você e sugerirá melhores combinações.

## 📋 Notas de Lançamento

### Versão 3.12.0 (September 3, 2025)
#### 🚀 Novos Recursos
- **Análise de Consultas Propensas a Timeout**: Adicionada detecção e análise abrangente de timeout para consultas que se aproximam ou excedem o limiar de 75 segundos
- **Dashboard de Insights Aprimorado**: Nova perspectiva rastreando consultas que consistentemente se aproximam de limites de timeout com categorização detalhada
- **Classificação Avançada de Consultas**: Análise sofisticada distinguindo entre timeouts que se aproximam (60-75s concluídas) e timeouts reais (74-76s fatais)

#### 🔧 Melhorias de Performance
- **Processamento de Consultas Otimizado**: Melhorado cache e deduplicação de declarações SQL para análise mais rápida
- **Análise de Dados Aprimorada**: Pipeline de processamento otimizado com melhorias de performance
- **Gerenciamento de Memória**: Melhor manuseio de grandes conjuntos de dados com utilização de memória aprimorada

#### 📊 Melhorias em Dados de Exemplo
- **Dados de Teste Abrangentes**: Adicionados dados de teste extensivos de cenários de timeout para desenvolvimento e testes
- **Exemplos do Mundo Real**: Dados de exemplo aprimorados com padrões de timeout autênticos e casos extremos
- **Cobertura de Testes**: Melhorada cobertura de testes para algoritmos de detecção de timeout

#### 🛡️ Melhorias na Qualidade do Código
- **Manutenção JavaScript**: Limpeza e otimização de código para melhor manutenibilidade
- **Validação Aprimorada**: Melhorado tratamento de erros e processos de validação de dados
- **Monitoramento de Performance**: Melhor rastreamento e registro de métricas de performance de análise

### Versão 3.11.0 (1 de setembro de 2025)
#### 🚀 Novos Recursos
- **Visualização de Timeline Aprimorada**: Adicionada nova funcionalidade de gráfico índice/documento para análise de performance abrangente
- **Análise de KernTime**: Implementados gráficos de comparação kernTime vs ElapsedTime para insights de utilização de CPU
- **Melhorias Multi-Gráfico**: Adicionados múltiplos novos tipos de gráficos com funcionalidade de zoom e arrastar sincronizada
- **Recursos de Gráficos Interativos**: Aprimorados todos os gráficos com interfaces arrastáveis e navegação sincronizada
- **Otimizações de Performance**: Implementadas melhorias de velocidade 10x com otimização de parsing e cache

#### 🔧 Melhorias Técnicas
- **Sincronização de Gráficos**: Todos os gráficos agora sincronizam zoom e filtragem de intervalo de datas na aba Timeline
- **Arrastar-para-Zoom**: Seleção de caixa interativa para zoom em áreas de gráficos
- **Reordenação de Gráficos**: Organização de dataset melhorada para melhor análise visual
- **Preenchimento entre Linhas**: Visualização de gráficos aprimorada com preenchimento de área para melhor análise de tendências

### Versão 3.10.0 (30 de agosto de 2025)
#### 🚀 Novos Recursos
- **Dashboard de Insights Aprimorado**: Expandiu a aba Insights com análise de performance abrangente e recomendações automáticas de otimização de consultas
- **Interface de Usuário Melhorada**: Adicionado emoji de foguete ao título principal e banner gradiente destacando as novas capacidades de Insights
- **Documentação Aprimorada**: Atualizado guia do Passo 4 para destacar proeminentemente o novo dashboard de Insights com descrições detalhadas de recursos

#### 🛡️ Melhorias de Tradução e Localização
- **Sistema de Tradução Protegido**: Implementado sistema abrangente de proteção de tradução para prevenir erros de sintaxe JavaScript e corrupção de atributos HTML
- **Sistema de Validação Dupla**: Adicionado validação de sintaxe JavaScript e validação de atributos HTML para garantir qualidade de tradução
- **Localização Completa de Insights**: Todo conteúdo de Insights agora totalmente traduzido nas versões alemã, espanhola e portuguesa

#### 🔧 Melhorias Técnicas
- **Proteção de Sintaxe JavaScript**: Criadas ferramentas de validação para prevenir erros JavaScript induzidos por tradução
- **Proteção de Atributos HTML**: Implementadas salvaguardas para prevenir tradução de IDs e classes HTML críticos
- **Guias de Processo Numerados**: Adicionados passos numerados a todos os documentos de guia para re-execuções parciais mais fáceis ("refazer apenas passo X")

#### 📚 Experiência do Desenvolvedor
- **Processo de Lançamento Aprimorado**: Criado fluxo de trabalho de lançamento abrangente com etapas de validação detalhadas
- **Regras de Proteção de Tradução**: Documentado o que nunca deve ser traduzido para prevenir problemas futuros
- **Ferramentas de Validação Automatizadas**: Construídas ferramentas para capturar problemas de tradução antes da implantação

### Versão 3.9.0 (28 de agosto de 2025)
#### 🔧 Correções de Bugs
- **Funcionalidade de Abas Corrigida**: Resolveu problema crítico onde abas nas versões não-inglesas (alemão, espanhol, português) apareciam como hiperlinks em vez de abas interativas devido a erros de sintaxe JavaScript em string literals traduzidos
- **Exibição de Porcentagem de Stream Corrigida**: Corrigiu issue [#35](https://github.com/Fujio-Turner/cb_completed_request/issues/35) onde tempo de execução Stream mostrava 00:00.000 mas incorretamente exibia valores de porcentagem de dois dígitos nos diagramas de fluxo em bolhas
- **Localização JavaScript Aprimorada**: Processo de tradução melhorado para prevenir erros de sintaxe de string literal entre versões de idiomas

#### 🚀 Novos Recursos  
- **Documentação Aprimorada**: Organização melhorada das notas de lançamento com integração de issues do GitHub e diretrizes de gerenciamento de versões
- **Processo de Localização Melhorado**: Atualizado LOCALIZATION_GUIDE.md com validação obrigatória de sintaxe JavaScript para prevenir erros de sintaxe induzidos por tradução

#### 🎯 Melhorias Técnicas
- **Verificação de Lançamento Abrangente**: Adicionado ferramenta RELEASE_WORK_CHECK.md para verificação independente da conclusão do trabalho de lançamento
- **Prevenção de Problemas Futuros**: Guias de localização atualizados com comandos de detecção e instruções de correção para preservação de sintaxe JavaScript

### Versão 3.8.0 (27 de agosto de 2025)
#### 🚀 Novos Recursos
- **Aba de Insights Adicionada**: Implementada nova aba Insights ([#32](https://github.com/Fujio-Turner/cb_completed_request/issues/32)) com análise abrangente de consultas lentas incluindo detecção de alto tempo de kernel, scans de índice ineficientes, respostas de índice atrasadas, consultas USE KEY lentas, e análise de streaming de payload grande
- **Navegação Aprimorada**: Sistema de abas atualizado com interface de usuário melhorada para melhor fluxo de análise
- **Inteligência de Performance**: Reconhecimento avançado de padrões de consulta com métricas específicas para recomendações de otimização

### Versão 3.7.2 (27 de agosto de 2025)
#### 🔧 Bug Fixes
- **Fixed ServiceTime Calculation**: Fixed serviceTime calculation in Every Query table to properly sum all operator service times from execution plan instead of displaying the same value as elapsedTime
- **Enhanced Data Accuracy**: ServiceTime column now shows accurate sum of all servTime values from plan operators, providing better query performance insights

#### 🎯 Technical Improvements  
- **Improved Query Analysis**: Added `calculateTotalServiceTime()` function to sum all servTime values from plan operators
- **Better Data Processing**: Updated `processRequestData()` to calculate serviceTimeMs from plan data instead of using raw serviceTime value
- **Enhanced Table Display**: Updated table display logic to use calculated serviceTimeMs value for accurate performance metrics

### Versão 3.7.0 (24 de janeiro de 2025)
#### 🚀 Novas Funcionalidades
- **Coluna de Consistência de Escaneamento**: Adicionada nova coluna "Consistência de Escaneamento" na tabela Every Query entre as colunas de statement e usuários, exibindo valores como "unbounded" e "request_plus"
- **Filtragem de Índices do Sync Gateway**: Adicionada checkbox "Excluir Índices Móveis" na aba Indexes para filtrar índices móveis do Sync Gateway
- **Estatísticas de Índices Aprimoradas**: Corrigida a exibição de estatísticas da aba Index/Query Flow - DIVs de índices agora mostram tempos de escaneamento médio/min/max apropriados e contagens de itens em vez de "N/A"

#### 🔧 Correções de Bugs
- **Corrigido Bug de Estatísticas de Índices**: Resolvido problema onde todas as estatísticas de índices mostravam "N/A" na aba Index/Query Flow corrigindo o acesso aos dados de solicitação na função `buildIndexQueryFlow()`
- **Coleta de Estatísticas Aprimorada**: Adicionada coleta de estatísticas faltante na função `processIndexQueryData()` para comportamento consistente quando a aba está oculta
- **Acesso de Índice de Array Corrigido**: Corrigido `originalRequests[requestIndex]` para `requestsToUse[requestIndex]` para prevenir acesso de dados incompatível

#### 🌍 Atualizações de Localização
- **Suporte Multilíngue Completo**: Todas as novas funcionalidades completamente traduzidas para espanhol, português e alemão
- **Traduções Atualizadas**: Adicionadas traduções para "Consistência de Escaneamento", "Índices do Sync Gateway" e "Excluir Índices Móveis"
- **Sincronização de Versões**: Atualizadas todas as versões de idiomas para v3.7.0 com funcionalidade consistente

#### 🎯 Melhorias Técnicas
- **Funcionalidade de Tabela Aprimorada**: Melhorado o manuseio de overflow de tabela para tabelas mais largas com nova coluna de Consistência de Escaneamento
- **Melhor Processamento de Dados**: Racionalizado o cálculo de estatísticas de índices e lógica de exibição
- **Paridade de Funcionalidades Consistente**: Todas as versões localizadas agora incluem funcionalidade idêntica e correções de bugs

### Versão 3.6.2 (23 de agosto de 2025)
#### 🔧 Correções de Bugs
- **Problemas de Sincronização da Aba Index/Query Flow Corrigidos**: Resolvidos problemas de exibição de dados obsoletos ao usar filtros de strings SQL com abas ocultas
- **Lógica de Ativação de Aba Aprimorada**: Index/Query Flow agora sempre reconstrói a partir dos dados filtrados atuais quando a aba é ativada
- **Compatibilidade de Estrutura de Dados Melhorada**: Corrigida estrutura do objeto query para prevenir erros de propriedades `undefined` durante o renderizado
- **Renderizado Diferido Complexo Eliminado**: Simplificado o manuseio de visibilidade de abas para remover problemas de timing e invalidação de cache

#### 🎯 Melhorias Técnicas
- **Processamento Adequado de Aba Oculta**: Index/Query Flow agora processa estruturas de dados corretamente mesmo quando a aba não está visível
- **Renderizado de Conexões SVG Confiável**: Corrigidos problemas de posicionamento de conexões SVG com detecção de visibilidade de abas jQuery UI
- **Depuração Aprimorada**: Adicionado logging abrangente do console para processamento e renderizado de dados do Index/Query Flow
- **Comportamento Consistente Entre Abas**: Index/Query Flow agora se comporta consistentemente com outras abas em relação ao processamento de dados

### Versão 3.6.1 (23 de agosto de 2025)
#### 🚀 Novos Recursos
- **Suporte à Declaração EXECUTE**: Adicionado suporte completo para reconhecimento e categorização de declarações EXECUTE
- **Cores de Estado de Consulta Aprimoradas**: Esquema de cores semântico para o gráfico de Estado de Consulta (verde=concluído, vermelho=fatal, laranja=timeout, cinza=parado/cancelado, azul=executando)
- **Formatação Numérica Aprimorada**: Adicionados separadores de vírgula e arredondamento a todas as colunas numéricas para melhor legibilidade
- **Avisos de Varredura Primária Aprimorados**: Estilo vermelho/negrito para indicadores de uso de varredura primária nas tabelas Grupos de Consultas e Cada Consulta

#### ✨ Melhorias na Experiência do Usuário
- **Seleção de Texto Corrigida**: Resolvidos problemas de seleção de texto em células de tabela - usuários agora podem destacar e copiar dados de células da tabela
- **Melhor Performance**: Otimizado o limite de consultas de 4000 para 2000 registros (8-10MB vs 36MB) para melhorar a performance do navegador
- **Quebra de Cache CDN**: Adicionados parâmetros de versão a todas as importações de bibliotecas externas para melhor gerenciamento de cache
- **Localização Alemã Aprimorada**: Corrigidas traduções ausentes para "Índices Utilizados" e "Consultas Executadas" na versão alemã

#### 🔧 Melhorias Técnicas
- **Análise Consistente de Tipos de Declaração**: Adicionada função `deriveStatementType()` para detecção confiável de tipos de declaração em todos os gráficos
- **Tratamento Inteligente de Cliques**: Cliques em linhas da tabela agora detectam inteligentemente seleção de texto vs seleção de linha
- **Diagrama de Fluxo Aprimorado**: Aprimorado posicionamento de conexões do Fluxo de Índice/Consulta com múltiplas tentativas de redesenho
- **Melhor Tratamento de Erros**: Corrigidos erros de referência JavaScript na geração de tabela de análise

#### 🌍 Localização
- **Suporte Multilíngue Completo**: Todos os novos recursos completamente traduzidos para espanhol, português e alemão
- **Formatação Numérica Consistente**: Formatação numérica consciente de localidade em todas as versões de idiomas

### Versão 3.5.2 (21 de agosto de 2025)
#### 🚀 Novos Recursos
- **Controles de Linha do Tempo Aprimorados**: Radio buttons convertidos para dropdown para melhor UX
- **Agrupamento Por Hora**: Nova opção de agrupamento de tempo "Por Hora" para análise de linha do tempo
- **Intervalo de Tempo de 1 Semana**: Botão "1 Semana" adicionado para seleção rápida de intervalo de tempo
- **Rótulos de UI Melhorados**: Rótulos claros adicionados para controles de "Agrupamento de Tempo" e "Escala do Eixo Y"
- **Agrupamento Visual**: Container estilizado adicionado para controles de Escala do Eixo Y com hierarquia visual melhorada

#### ✨ Melhorias
- **Melhor Validação de Intervalo de Tempo**: Validação adicionada para agrupamento "Por Hora" com limite de 1 semana
- **Texto de Botão Melhorado**: "Usar Intervalo de Tempo" atualizado para "Usar Intervalo de Datas do Eixo X dos Gráficos Atuais" para maior clareza
- **Instruções de Zoom Simplificadas**: Texto de ajuda de zoom simplificado para "Arraste caixa para ampliar área"
- **Tradução Dinâmica de Unidades de Tempo**: Rótulos do otimizador agora mostram unidades de tempo traduzidas (ex. "Por Otimizador (hora)")
- **Ordem de Botões Melhorada**: Botões de intervalo de tempo reordenados para fluxo lógico (Original → 1 Semana → 1 Dia → 1 Hora)

#### 🌍 Localização
- **Suporte Multilíngue Completo**: Todos os novos recursos completamente traduzidos para espanhol, português e alemão
- **Traduções Dinâmicas de Unidades de Tempo**: Unidades de tempo em rótulos do otimizador agora traduzem corretamente em todos os idiomas
- **Chaves de Tradução Atualizadas**: Novas chaves de tradução adicionadas para todos os novos elementos de UI

#### 🔧 Melhorias Técnicas
- **JavaScript Modernizado**: Funções atualizadas para trabalhar com controles dropdown em vez de radio buttons
- **Melhor Tratamento de Erros**: Validação melhorada com mensagens de erro específicas do idioma
- **Arquitetura UI Consistente**: Estrutura de classes CSS melhorada para melhor manutenibilidade

### Versão 3.5.1 (20 de agosto de 2025)
- **Correções de bugs**: Corrigido erro de análise regex no dropdown de bucket da aba Index que mostrava "ON" em vez dos nomes reais dos buckets
- **Melhorias**: Melhorada a análise para lidar com declarações CREATE INDEX complexas com palavras contendo "on" (como "accommodation")

### Versão 3.5.0 (15 de agosto de 2025)
- **Novas Funcionalidades**: Adicionada pré-filtragem de declarações SQL++ durante análise JSON para melhor desempenho, reorganizado layout do seletor de datas com empilhamento vertical e melhor alinhamento de rótulos.
- **Melhorias Técnicas**: Aprimorada função filterSystemQueries(), melhorado layout da interface e gerenciamento de espaço, reduzido tempo de análise para grandes conjuntos de dados e corrigido problema de cache de dados onde filtros SQL não eram limpos adequadamente na re-análise.
- **Localização**: Atualizadas todas versões de idiomas (espanhol, português, alemão) com novas funcionalidades e adicionadas traduções para novos elementos da interface.

### Versão 3.4.2 (15 de agosto de 2025)
- **Melhorias de UI**: Melhoradas as interações dos gráficos de Timeline e consistência de estilo de botões - desabilitado zoom com roda do mouse, melhorada visibilidade da caixa de seleção, auto-reset dos botões de rádio ao analisar, aumentado botão Parse JSON e aplicado estilo consistente aos botões de intervalo de tempo e controle.

### Versão 3.4.1 (15 de agosto de 2025)
- **Correções de bugs**: Corrigida a funcionalidade do botão de copiar JavaScript em todas as versões de idioma - resolvido o tratamento de parâmetros de evento nas funções copyStatement, copyAnalysisStatement e copyToClipboard.

### Versão 3.4.0 (2025-08-13)
- **Gráfico de Linha do Tempo de Operações de Banco de Dados Aprimorado**: Adicionada métrica de média de scans de índices por consulta e visualização de linha curva para melhores insights de performance.

### Versão 3.3.1 (2025-08-10)
- **Correções de Bugs**: Corrigidos problemas de sincronização de cursor cruzado em versões localizadas e corrigido comportamento de escala do eixo Y para gráficos de linha do tempo.

### Versão 3.3.0 (2025-08-09)
- **Cursores de Linha do Tempo Sincronizados**: Todos os gráficos de linha do tempo agora apresentam cursores sincronizados que se movem juntos ao passar o mouse sobre qualquer gráfico, facilitando a correlação de dados entre diferentes métricas no mesmo ponto temporal.

### Versão 3.1.0 (2025-08-07)
**Novos Recursos e Melhorias:**
- **Melhorias da Aba Dashboard**:
  - Convertido gráfico de pizza "Primary Scan Usage" para gráfico de donut "Primary Indexes Used"
  - Adicionado sistema de alerta inteligente que aparece apenas quando índices primários são detectados
  - Integrado link "Saiba mais" para documentação de melhores práticas do Couchbase
  - Design visual aprimorado com melhor contraste de cores e legibilidade
- **Melhorias da Aba Index Query Flow**:
  - Melhorada detecção de índices primários para incluir índices terminando com `*_primary`
  - Aprimorado destaque visual para todas as variantes de índices primários
  - Melhor cobertura de padrões de nomes de índices primários (`#primary`, `bucket_primary`, etc.)
- **Experiência do Usuário**:
  - Interface mais limpa com alertas condicionais apenas quando relevante
  - Recursos educacionais integrados diretamente na ferramenta
  - Feedback visual mais intuitivo para oportunidades de otimização de performance

### Versão 3.0.1 e Anteriores
Veja histórico do git para mudanças de versões anteriores

## Solução de Problemas

- **Resultados vazios**: Verifique se o logging de consultas está habilitado no Couchbase
- **Erros do navegador**: Certifique-se de que JavaScript está habilitado
- **Erros de renderização de gráficos**: Reduza o intervalo de data ou use agrupamento de tempo mais grosso (ex., mude de "por Minuto" para "por Hora")
- **Erros "Too far apart"**: O intervalo de tempo selecionado é muito grande para o agrupamento escolhido - siga as diretrizes de agrupamento de tempo acima
- **Avisos de destruição de canvas**: Comportamento normal ao alternar entre diferentes agrupamentos de tempo ou intervalos de data

## Requisitos

- Navegador web moderno com JavaScript habilitado
- Couchbase Server com logging de consultas habilitado
- Acesso a `system:completed_requests` (requer privilégios de administrador)

### Versão 3.2.0 (2025-08-08)
**Principais Melhorias de Arquitetura e Localização:**
- **Refatoração da Arquitetura CSS**:
  - Migrado de 208 estilos inline para classes CSS centralizadas (redução de 44%)
  - Implementado sistema abrangente de classes utilitárias para melhor manutenibilidade
  - CSS minimizado para melhor performance e redução do tamanho de arquivo
  - Consistência visual aprimorada em todos os componentes
- **Suporte Multilíngue**:
  - Localização alemã adicionada (de_index.html)
  - Localização espanhola completada (es_index.html)
  - Localização portuguesa completada (pt_index.html)
  - Arquitetura CSS sincronizada em todas as versões de idiomas
- **Experiência do Desenvolvedor**:
  - Criado LOCALIZATION_GUIDE.md abrangente para manutenção futura
  - Estabelecido sistema translations.json para traduções consistentes
  - Processo de sincronização de localização simplificado com estilo centralizado
  - Manutenibilidade de código aprimorada e dependências de estilos inline reduzidas
