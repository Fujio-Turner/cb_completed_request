# Couchbase Slow Query Analysis Tool v3.6.1

**🌍 Idiomas:** [🇺🇸 English](README.md) | [🇩🇪 Deutsch](README.de.md) | **🇪🇸 Español** | [🇵🇹 Português](README.pt.md)

## 🚀 **Enlaces de Implementación Beta:**
- **Inglés**: [https://cb.fuj.io/](https://cb.fuj.io/)
- **Alemán**: [https://cb.fuj.io/de_index](https://cb.fuj.io/de_index)
- **Español**: [https://cb.fuj.io/es_index](https://cb.fuj.io/es_index)
- **Portugués**: [https://cb.fuj.io/pt_index](https://cb.fuj.io/pt_index)

Si no quiere descargar los archivos index.html, haga clic en los enlaces beta anteriores. Recuerde seguir los pasos en la sección `Inicio Rápido` a continuación para completar `Paso 3:` y más allá para obtener los datos JSON que necesita para depurar y analizar.

## 📁 **Instrucciones de Descarga:**
Alternativamente, puede descargar los archivos HTML localmente:
- **Español**: Download [`es_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/es_index.html?download=true)
- **Inglés**: Download [`index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/index.html?download=true)
- **Alemán**: Download [`de_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/de_index.html?download=true)
- **Portugués**: Download [`pt_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/pt_index.html?download=true)

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
SELECT *, meta().plan FROM system:completed_requests LIMIT 2000;
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

## 📋 Notas de Lanzamiento

### Versión 3.6.1 (23 de agosto de 2025)
#### 🚀 Nuevas Características
- **Soporte para Declaración EXECUTE**: Se agregó soporte completo para el reconocimiento y categorización de declaraciones EXECUTE
- **Colores de Estado de Consulta Mejorados**: Esquema de colores semántico para el gráfico de Estado de Consulta (verde=completado, rojo=fatal, naranja=timeout, gris=detenido/cancelado, azul=ejecutando)
- **Formato Numérico Mejorado**: Se agregaron separadores de comas y redondeo a todas las columnas numéricas para mejor legibilidad
- **Advertencias de Escaneo Primario Mejoradas**: Estilo rojo/negrita para indicadores de uso de escaneo primario en las tablas de Grupos de Consultas y Cada Consulta

#### ✨ Mejoras de Experiencia de Usuario
- **Selección de Texto Corregida**: Se resolvieron problemas de selección de texto en celdas de tabla - los usuarios ahora pueden resaltar y copiar datos de las celdas de la tabla
- **Mejor Rendimiento**: Se optimizó el límite de consultas de 4000 a 2000 registros (8-10MB vs 36MB) para mejorar el rendimiento del navegador
- **Eliminación de Caché CDN**: Se agregaron parámetros de versión a todas las importaciones de librerías externas para mejor gestión de caché
- **Localización Alemana Mejorada**: Se corrigieron traducciones faltantes para "Índices Utilizados" y "Consultas Ejecutadas" en la versión alemana

#### 🔧 Mejoras Técnicas
- **Análisis Consistente de Tipos de Declaración**: Se agregó la función `deriveStatementType()` para detección confiable de tipos de declaración en todos los gráficos
- **Manejo de Clics Inteligente**: Los clics en filas de tabla ahora detectan inteligentemente selección de texto vs selección de fila
- **Diagrama de Flujo Mejorado**: Se mejoró el posicionamiento de conexiones del Flujo de Índice/Consulta con múltiples intentos de redibujo
- **Mejor Manejo de Errores**: Se corrigieron errores de referencia JavaScript en la generación de tabla de análisis

#### 🌍 Localización
- **Soporte Completo Multiidioma**: Todas las nuevas características completamente traducidas al español, portugués y alemán
- **Formato Numérico Consistente**: Formato de números consciente de la configuración regional en todas las versiones de idiomas

### Versión 3.5.2 (21 de agosto de 2025)
#### 🚀 Nuevas Características
- **Controles de Línea de Tiempo Mejorados**: Radio buttons convertidos a dropdown para mejor UX
- **Agrupación Por Hora**: Nueva opción de agrupación de tiempo "Por Hora" para análisis de línea de tiempo
- **Rango de Tiempo de 1 Semana**: Botón "1 Semana" agregado para selección rápida de rango de tiempo
- **Etiquetas de UI Mejoradas**: Etiquetas claras agregadas para controles de "Agrupación de Tiempo" y "Escala del Eje Y"
- **Agrupación Visual**: Contenedor estilizado agregado para controles de Escala del Eje Y con jerarquía visual mejorada

#### ✨ Mejoras
- **Mejor Validación de Rango de Tiempo**: Validación agregada para agrupación "Por Hora" con límite de 1 semana
- **Texto de Botón Mejorado**: "Usar Rango de Tiempo" actualizado a "Usar Rango de Fechas del Eje X de los Gráficos Actuales" para mayor claridad
- **Instrucciones de Zoom Simplificadas**: Texto de ayuda de zoom simplificado a "Arrastrar caja para ampliar área"
- **Traducción Dinámica de Unidades de Tiempo**: Las etiquetas del optimizador ahora muestran unidades de tiempo traducidas (ej. "Por Optimizador (hora)")
- **Orden de Botones Mejorado**: Botones de rango de tiempo reordenados para flujo lógico (Original → 1 Semana → 1 Día → 1 Hora)

#### 🌍 Localización
- **Soporte Multiidioma Completo**: Todas las nuevas características completamente traducidas al español, portugués y alemán
- **Traducciones Dinámicas de Unidades de Tiempo**: Las unidades de tiempo en etiquetas del optimizador ahora se traducen correctamente en todos los idiomas
- **Claves de Traducción Actualizadas**: Nuevas claves de traducción agregadas para todos los nuevos elementos de UI

#### 🔧 Mejoras Técnicas
- **JavaScript Modernizado**: Funciones actualizadas para trabajar con controles dropdown en lugar de radio buttons
- **Mejor Manejo de Errores**: Validación mejorada con mensajes de error específicos del idioma
- **Arquitectura UI Consistente**: Estructura de clases CSS mejorada para mejor mantenibilidad

### Versión 3.5.1 (20 de agosto de 2025)
- **Correcciones de errores**: Solucionado error de análisis regex en el dropdown de bucket de la pestaña Index que mostraba "ON" en lugar de los nombres reales de los buckets
- **Mejoras**: Mejorado el análisis para manejar declaraciones CREATE INDEX complejas con palabras que contienen "on" (como "accommodation")

### Versión 3.5.0 (15 de agosto de 2025)
- **Nuevas Características**: Se agregó pre-filtrado de declaraciones SQL++ durante el análisis JSON para mejor rendimiento, se reorganizó el diseño del selector de fechas con apilamiento vertical y mejor alineación de etiquetas.
- **Mejoras Técnicas**: Se mejoró la función filterSystemQueries(), se mejoró el diseño de la interfaz y gestión del espacio, se redujo el tiempo de análisis para conjuntos de datos grandes y se solucionó el problema de caché de datos donde los filtros SQL no se limpiaban correctamente al re-analizar.
- **Localización**: Se actualizaron todas las versiones de idiomas (español, portugués, alemán) con nuevas características y se agregaron traducciones para nuevos elementos de la interfaz.

### Versión 3.4.2 (15 de agosto de 2025)
- **Mejoras de UI**: Mejoradas las interacciones de gráficos de Timeline y consistencia de estilo de botones - deshabilitado zoom con rueda del ratón, mejorada visibilidad de caja de selección, auto-reset de botones de radio al parsear, agrandado botón Parse JSON y aplicado estilo consistente a botones de rango de tiempo y control.

### Versión 3.4.1 (15 de agosto de 2025)
- **Correcciones de errores**: Se corrigió la funcionalidad del botón de copiar JavaScript en todas las versiones de idioma - se resolvió el manejo de parámetros de eventos en las funciones copyStatement, copyAnalysisStatement y copyToClipboard.

### Versión 3.4.0 (2025-08-13)
- **Gráfico de Línea de Tiempo de Operaciones de Base de Datos Mejorado**: Añadida métrica de promedio de escaneos de índices por consulta y visualización de línea curva para mejores insights de rendimiento.

### Versión 3.3.1 (2025-08-10)
- **Corrección de Errores**: Solucionados problemas de sincronización de cursor cruzado en versiones localizadas y corregido el comportamiento de escalado del eje Y para gráficos de línea de tiempo.

### Versión 3.3.0 (2025-08-09)
- **Cursores de Línea de Tiempo Sincronizados**: Todos los gráficos de línea de tiempo ahora presentan cursores sincronizados que se mueven juntos al pasar el cursor sobre cualquier gráfico, facilitando la correlación de datos entre diferentes métricas en el mismo punto temporal.

### Versión 3.1.0 (2025-08-07)
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

### Versión 3.2.0 (2025-08-08)
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
