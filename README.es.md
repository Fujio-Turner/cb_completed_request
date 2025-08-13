# Couchbase Slow Query Analysis Tool v3.4.0

**🌍 Idiomas:** [🇺🇸 English](README.md) | [🇩🇪 Deutsch](README.de.md) | **🇪🇸 Español** | [🇵🇹 Português](README.pt.md)

## 📁 **Instrucciones de Descarga:**
- **Español**: Download [`es_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/es_index.html)
- **Inglés**: Download [`index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/index.html)
- **Alemán**: Download [`de_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/de_index.html)
- **Portugués**: Download [`pt_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/pt_index.html)

---

Una herramienta web integral para analizar el rendimiento de consultas de Couchbase y planes de ejecución. Visualice patrones de consultas, identifique cuellos de botella y optimice el rendimiento de la base de datos con seguimiento avanzado de uso de índices, análisis de planes de ejecución y funciones dedicadas de gestión de índices.

#### (Compatible con Capella)

## Inicio Rápido

### Paso 1: Descargar la Herramienta
Descarga o clona todo el repositorio O simplemente descarga el `es_index.html`

### Paso 2: Abrir en el Navegador
Ve a la carpeta donde descargaste el `es_index.html` y ábrelo directamente en cualquier navegador web moderno (Chrome, Firefox, Safari, Edge). _Firefox_ parece ser más rápido

### Paso 3: Extraer Datos de Consultas
Ejecuta esta consulta en Couchbase Query Workbench o cbq:

```sql
SELECT *, meta().plan FROM system:completed_requests LIMIT 4000;
```

**Notas**: 
Esto podría devolver un JSON de aproximadamente 36MB. Cualquier cosa más grande probablemente haga que el navegador falle. _Firefox_ parece ser el navegador más rápido.

**El navegador es lento/falla:**
Si el navegador se vuelve lento, reduce el tamaño de los datos con `LIMIT 2000`

[Más Opciones de Consulta](sql_queries.md)

### Paso 4: Analizar
Selecciona TODO & Copia los resultados JSON completos y pégalos en el área de entrada de la herramienta en la parte superior, luego haz clic en **Parse JSON**

![Interfaz de entrada de consultas](copy_paste_json.png)

### Paso 5a: Filtrar por Rango de Fechas (Opcional)

- **Auto-población**: Los campos de fecha se llenan automáticamente con el rango de tiempo completo de sus datos
- **Filtrado personalizado**: Ajuste las fechas "Desde" y "Hasta" para enfocarse en períodos específicos
- **Re-analizar**: Haga clic en "Parse JSON" nuevamente para aplicar el filtro de fecha
- **Estado del filtro**: Vea cuántas consultas coinciden con su rango seleccionado

### Paso 5b: Análisis de Índices Mejorado (Opcional)

Ejecute la consulta a continuación para obtener el resultado JSON. Copie y pegue los resultados en el segundo cuadro de entrada de texto a la derecha y haga clic en el botón `Parse JSON`.

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

## Características

### **Seis Pestañas de Análisis**:

#### **1. Pestaña Dashboard**
- **Distribución de Duración de Consultas** gráfico de barras que muestra patrones de rendimiento
- **Índices Primarios Utilizados** gráfico de rosquilla con sistema de advertencia inteligente
  - Visualización de advertencia condicional (solo aparece cuando se detectan índices primarios)
  - Enlace educativo "Saber más" a las mejores prácticas de índices primarios de Couchbase
  - Distinción visual mejorada para conciencia de rendimiento en producción
- **Características de Patrones de Consulta** análisis para obtener información de rendimiento
- **Usuarios por Cantidad de Consultas** tabla ordenable que muestra los principales generadores de consultas
- **Cantidad de Uso de Índices** tabla ordenable que rastrea la utilización de índices
- **Tipo de Declaración** gráfico circular (desglose de SELECT, INSERT, UPDATE, DELETE)
- **Estado de Consulta** gráfico circular que muestra el estado de finalización

#### **2. Pestaña Timeline**
- **Seis Visualizaciones Interactivas** en diseño de cuadrícula 2x3:
  - **Gráfico de Buckets de Duración**: Distribución de duración de consultas a lo largo del tiempo
  - **Gráfico de Tipos de Consulta**: Desglose de tipos de consulta por períodos de tiempo
  - **Gráfico de Operaciones**: Comparación de escaneos de índices vs búsquedas de documentos
  - **Gráfico de Filtros**: Eficiencia de operaciones de filtro (relaciones IN vs OUT)
  - **Gráfico de Timeline**: Distribución de porcentaje de tiempo de kernel a lo largo del tiempo
  - **Gráfico de Memoria**: Uso de memoria (MB) a lo largo del tiempo con seguimiento de conteo de consultas
- **Controles Interactivos**:
  - Botón de Resetear Zoom para navegación de gráficos
  - Opciones de escalado del eje Y (Lineal/Logarítmico)
  - Opciones de agrupación de tiempo (Por Optimizador/Por Minuto/Por Segundo)
  - Botón de filtro "Usar Rango de Tiempo"
  - Capacidades de panorámica/zoom con arrastrar para panorámica, desplazar para zoom, selección de caja de arrastre

#### **3. Pestaña Query Groups** (Análisis)
- **Análisis Agregado de Consultas** con agrupación de declaraciones normalizadas
- **Métricas Estadísticas**: total_count, duración min/max/avg/median
- **Promedios de Rendimiento**: avg_fetch, avg_primaryScan, avg_indexScan
- **Desglose de Usuarios**: Muestra el conteo de ejecución por usuario para cada patrón de consulta
- **Normalización Inteligente**: Reemplaza literales de cadena y números con marcadores de posición `?`
- **Resultados Filtrados**: Excluye consultas INFER, ADVISE, CREATE, ALTER INDEX y SYSTEM

#### **4. Pestaña Every Query**
- **Tabla de Consultas Integral** con 17 columnas
- **Diagramas de Flujo Interactivos** con visualización de plan de ejecución codificada por colores
- **Características Avanzadas de Tabla** con ordenación completa de columnas y gestión de declaraciones
- **Procesamiento Avanzado de Datos** con capacidades de procesamiento por lotes

#### **5. Pestaña Index Query Flow**
- **Relaciones Visuales Índice-Consulta** con diagramas de flujo interactivos
- **Detección Mejorada de Índices Primarios** con cobertura integral
- **Perspectivas de Rendimiento** para oportunidades de optimización

#### **6. Pestaña Indexes** (NUEVO en v3.0.0)
- **Gestión Integral de Índices** con catálogo completo de índices
- **Opciones de filtrado avanzadas** y filtros especializados
- **Consolidación Inteligente de Índices** y coincidencia consulta-índice

## Entendiendo el Análisis

- **Burbujas verdes**: < 25% del tiempo total de consulta
- **Burbujas amarillas**: 25-50% del tiempo total de consulta
- **Burbujas naranjas**: 50-75% del tiempo total de consulta
- **Burbujas rojas**: > 75% del tiempo total de consulta
- **Escaneo Primario resaltado**: Consultas que usan escaneos de índices primarios (candidatos potenciales de optimización)

## Pautas de Agrupación de Tiempo

Al analizar gráficos de línea de tiempo, elija rangos de fecha apropiados para cada agrupación de tiempo:

- **Por Optimizador**: Selecciona automáticamente la mejor agrupación basada en su rango de fecha (recomendado)
- **Por Segundo**: Mejor para rangos ≤ 1 hora (análisis detallado)
- **Por Minuto**: Mejor para rangos ≤ 1 día (patrones por hora)
- **Por Hora**: Mejor para rangos ≤ 1 mes (patrones diarios)
- **Por Día**: Mejor para rangos > 1 mes (tendencias a largo plazo)

**⚠️ Advertencia**: Rangos de fecha grandes con agrupaciones de grano fino pueden causar errores de renderizado de gráficos. La herramienta le alertará y sugerirá mejores combinaciones.

## Release Notes

### Versión 3.4.0 (2025-01-27)
- **Gráfico de Línea de Tiempo de Operaciones de Base de Datos Mejorado**: Añadida métrica de promedio de escaneos de índices por consulta y visualización de línea curva para mejores insights de rendimiento.

### Versión 3.3.1 (2025-01-23)
- **Corrección de Errores**: Solucionados problemas de sincronización de cursor cruzado en versiones localizadas y corregido el comportamiento de escalado del eje Y para gráficos de línea de tiempo.

### Versión 3.3.0 (2025-01-23)
- **Cursores de Línea de Tiempo Sincronizados**: Todos los gráficos de línea de tiempo ahora presentan cursores sincronizados que se mueven juntos al pasar el cursor sobre cualquier gráfico, facilitando la correlación de datos entre diferentes métricas en el mismo punto temporal.

### Versión 3.1.0 (2025-01-20)
**Nuevas Características y Mejoras:**
- **Mejoras de la Pestaña Dashboard**:
  - Convertido gráfico circular "Primary Scan Usage" a gráfico de donut "Primary Indexes Used"
  - Añadido sistema de advertencia inteligente que solo aparece cuando se detectan índices primarios
  - Integrado enlace "Saber más" a documentación de mejores prácticas de Couchbase
  - Diseño visual mejorado con mejor contraste de colores y legibilidad
- **Mejoras de la Pestaña Index Query Flow**:
  - Mejorada detección de índices primarios para incluir índices que terminan con `*_primary`
  - Mejorado resaltado visual para todas las variantes de índices primarios
  - Mejor cobertura de patrones de nombres de índices primarios (`#primary`, `bucket_primary`, etc.)
- **Experiencia de Usuario**:
  - Interfaz más limpia con advertencias condicionales solo cuando es relevante
  - Recursos educativos integrados directamente en la herramienta
  - Retroalimentación visual más intuitiva para oportunidades de optimización de rendimiento

### Versión 3.0.1 y Anteriores
Ver historial de git para cambios de versiones anteriores

## Solución de Problemas

- **Resultados vacíos**: Verifique si el registro de consultas está habilitado en Couchbase
- **Errores del navegador**: Asegúrese de que JavaScript esté habilitado
- **Errores de renderizado de gráficos**: Reduzca el rango de fecha o use agrupación de tiempo más gruesa (ej., cambiar de "por Minuto" a "por Hora")
- **Errores "Too far apart"**: El rango de tiempo seleccionado es demasiado grande para la agrupación elegida - siga las pautas de agrupación de tiempo arriba
- **Advertencias de destrucción de canvas**: Comportamiento normal al cambiar entre diferentes agrupaciones de tiempo o rangos de fecha

## Requisitos

- Navegador web moderno con JavaScript habilitado
- Couchbase Server con registro de consultas habilitado
- Acceso a `system:completed_requests` (requiere privilegios de administrador)

### Versión 3.2.0 (2025-01-22)
**Mejoras Importantes de Arquitectura y Localización:**
- **Refactorización de Arquitectura CSS**:
  - Migrado de 208 estilos en línea a clases CSS centralizadas (reducción del 44%)
  - Implementado sistema integral de clases utilitarias para mejor mantenibilidad
  - CSS minimizado para mejor rendimiento y reducción del tamaño de archivo
  - Consistencia visual mejorada en todos los componentes
- **Soporte Multiidioma**:
  - Localización alemana añadida (de_index.html)
  - Localización española completada (es_index.html)
  - Localización portuguesa completada (pt_index.html)
  - Arquitectura CSS sincronizada en todas las versiones de idiomas
- **Experiencia del Desarrollador**:
  - Creada LOCALIZATION_GUIDE.md integral para mantenimiento futuro
  - Establecido sistema translations.json para traducciones consistentes
  - Proceso de sincronización de localización simplificado con estilo centralizado
  - Mantenibilidad de código mejorada y dependencias de estilos en línea reducidas
