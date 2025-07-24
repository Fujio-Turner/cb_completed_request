# Couchbase Slow Query Analysis Tool v3.3.1

**🌍 Idiomas:** [🇺🇸 English](README.md) | [🇩🇪 Deutsch](README.de.md) | [🇪🇸 Español](README.es.md) | **🇵🇹 Português**

## 📁 **Instruções de Download:**
- **Português**: Download [`pt_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/pt_index.html)
- **Inglês**: Download [`index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/index.html)
- **Alemão**: Download [`de_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/de_index.html)
- **Espanhol**: Download [`es_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/es_index.html)

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
SELECT *, meta().plan FROM system:completed_requests LIMIT 4000;
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

## Release Notes

### Versão 3.3.1 (2025-01-23)
- **Correções de Bugs**: Corrigidos problemas de sincronização de cursor cruzado em versões localizadas e corrigido comportamento de escala do eixo Y para gráficos de linha do tempo.

### Versão 3.3.0 (2025-01-23)
- **Cursores de Linha do Tempo Sincronizados**: Todos os gráficos de linha do tempo agora apresentam cursores sincronizados que se movem juntos ao passar o mouse sobre qualquer gráfico, facilitando a correlação de dados entre diferentes métricas no mesmo ponto temporal.

### Versão 3.1.0 (2025-01-20)
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

### Versão 3.2.0 (2025-01-22)
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
