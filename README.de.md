# Couchbase Slow Query Analysis Tool v3.5.0

**🌍 Sprachen:** [🇺🇸 English](README.md) | **🇩🇪 Deutsch** | [🇪🇸 Español](README.es.md) | [🇵🇹 Português](README.pt.md)

## 📁 **Download-Anweisungen:**
- **Deutsch**: Download [`de_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/de_index.html)
- **Englisch**: Download [`index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/index.html)
- **Spanisch**: Download [`es_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/es_index.html)
- **Portugiesisch**: Download [`pt_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/pt_index.html)

---

Ein umfassendes webbasiertes Tool zur Analyse der Couchbase-Query-Performance und Ausführungspläne. Visualisieren Sie Query-Muster, identifizieren Sie Engpässe und optimieren Sie die Datenbankleistung mit erweiterten Index-Nutzungstracking, Ausführungsplananalyse und dedizierten Index-Management-Funktionen.

#### (Capella Kompatibel)

## Schnellstart

### Schritt 1: Das Tool herunterladen
Laden Sie das gesamte Repository herunter oder klonen Sie es ODER laden Sie nur die `de_index.html` herunter

### Schritt 2: Im Browser öffnen
Gehen Sie zu dem Ordner, in dem Sie die `de_index.html` heruntergeladen haben, und öffnen Sie sie direkt in einem modernen Webbrowser (Chrome, Firefox, Safari, Edge). _Firefox_ scheint schneller zu sein

### Schritt 3: Query-Daten extrahieren
Führen Sie diese Abfrage in der Couchbase Query Workbench oder cbq aus:

```sql
SELECT *, meta().plan FROM system:completed_requests LIMIT 4000;
```

**Hinweise**: 
Dies könnte ein JSON von etwa 36MB zurückgeben. Alles Größere wird wahrscheinlich den Browser zum Absturz bringen. _Firefox_ scheint der schnellere Browser zu sein.

**Browser ist langsam/stürzt ab:**
Wenn der Browser langsam wird, reduzieren Sie die Datengröße über `LIMIT 2000`

[Weitere Query-Optionen](sql_queries.md)

### Schritt 4: Analysieren
Wählen Sie ALLES aus & Kopieren Sie die vollständigen JSON-Ergebnisse und fügen Sie sie in den Eingabebereich des Tools oben ein, dann klicken Sie auf **Parse JSON**

![Query-Eingabebenutzeroberfläche](copy_paste_json.png)

### Schritt 5a: Nach Datumsbereich filtern (Optional)

- **Auto-Befüllung**: Datumsfelder werden automatisch mit dem vollständigen Zeitbereich Ihrer Daten befüllt
- **Benutzerdefinierte Filterung**: Passen Sie "Von" und "Bis" Daten an, um sich auf bestimmte Zeiträume zu konzentrieren
- **Erneut analysieren**: Klicken Sie erneut auf "Parse JSON", um den Datumsfilter anzuwenden
- **Filterstatus**: Sehen Sie, wie viele Queries Ihrem gewählten Bereich entsprechen

### Schritt 5b: Erweiterte Index-Analyse (Optional)

Führen Sie die unten stehende Abfrage aus, um das JSON-Ergebnis zu erhalten. Kopieren & Fügen Sie die Ergebnisse in das 2. rechte Texteingabefeld ein und klicken Sie auf den `Parse JSON` Button.

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

## Funktionen

### **Sechs Analyse-Tabs**:

#### **1. Dashboard Tab**
- **Query-Dauer-Verteilung** Balkendiagramm, das Leistungsmuster zeigt
- **Verwendete Primary Indexes** Donut-Diagramm mit intelligentem Warnsystem
  - Bedingte Warnanzeige (erscheint nur bei erkannten Primary Indexes)
  - Lehrreicher "Mehr erfahren" Link zu Couchbase Primary Index Best Practices
  - Verbesserte visuelle Unterscheidung für Produktionsleistungsbewusstsein
- **Query-Pattern-Funktionen** Analyse für Leistungseinblicke
- **Benutzer nach Query-Anzahl** sortierbare Tabelle mit Top-Query-Generatoren
- **Index-Nutzungsanzahl** sortierbare Tabelle zur Verfolgung der Index-Nutzung
- **Statement-Typ** Kreisdiagramm (SELECT, INSERT, UPDATE, DELETE Aufschlüsselung)
- **Query-Status** Kreisdiagramm, das den Abschlussstatus zeigt

#### **2. Timeline Tab**
- **Sechs interaktive Visualisierungen** im 2x3 Raster-Layout:
  - **Dauer-Buckets-Diagramm**: Query-Dauer-Verteilung über die Zeit
  - **Query-Typen-Diagramm**: Query-Typ-Aufschlüsselung nach Zeiträumen
  - **Operations-Diagramm**: Index-Scans vs. Dokument-Fetches Vergleich
  - **Filter-Diagramm**: Filter-Operations-Effizienz (IN vs OUT Verhältnisse)
  - **Timeline-Diagramm**: Kernel-Zeit-Prozentsatz-Verteilung über die Zeit
  - **Memory-Diagramm**: Speichernutzung (MB) über die Zeit mit Query-Anzahl-Verfolgung
- **Interaktive Steuerungen**:
  - Zoom zurücksetzen Button für Diagramm-Navigation
  - Y-Achsen-Skalierung (Linear/Logarithmisch) Optionen
  - Zeit-Gruppierungs-Optionen (Nach Optimizer/Nach Minute/Nach Sekunde)
  - "Zeitbereich verwenden" Filter-Button
  - Pan/Zoom-Fähigkeiten mit Drag-to-Pan, Scroll-to-Zoom, Drag-Box-Auswahl

#### **3. Query Groups Tab** (Analyse)
- **Aggregierte Query-Analyse** mit normalisierter Statement-Gruppierung
- **Statistische Metriken**: total_count, min/max/avg/median Dauer
- **Leistungsdurchschnitte**: avg_fetch, avg_primaryScan, avg_indexScan
- **Benutzer-Aufschlüsselung**: Zeigt Ausführungsanzahl pro Benutzer für jedes Query-Muster
- **Intelligente Normalisierung**: Ersetzt String-Literale und Zahlen durch `?` Platzhalter
- **Gefilterte Ergebnisse**: Schließt INFER, ADVISE, CREATE, ALTER INDEX und SYSTEM Queries aus

#### **4. Every Query Tab**
- **Umfassende Query-Tabelle** mit 17 Spalten
- **Interaktive Fluss-Diagramme** mit farbkodierter Ausführungsplan-Visualisierung
- **Erweiterte Tabellen-Funktionen** mit vollständiger Spalten-Sortierung und Statement-Management
- **Erweiterte Datenverarbeitung** mit Batch-Processing-Fähigkeiten

#### **5. Index Query Flow Tab**
- **Visuelle Index-Query-Beziehungen** mit interaktiven Fluss-Diagrammen
- **Erweiterte Primary Index Erkennung** mit umfassender Abdeckung
- **Performance-Einblicke** für Optimierungsmöglichkeiten

#### **6. Indexes Tab** (NEU in v3.0.0)
- **Umfassendes Index-Management** mit komplettem Index-Katalog
- **Erweiterte Filteroptionen** und spezialisierte Filter
- **Intelligente Index-Konsolidierung** und Query-Index-Matching

## Die Analyse verstehen

- **Grüne Bubbles**: < 25% der gesamten Query-Zeit
- **Gelbe Bubbles**: 25-50% der gesamten Query-Zeit
- **Orange Bubbles**: 50-75% der gesamten Query-Zeit
- **Rote Bubbles**: > 75% der gesamten Query-Zeit
- **Primary Scan hervorgehoben**: Queries, die Primary Index Scans verwenden (potentielle Optimierungskandidaten)

## Zeit-Gruppierungs-Richtlinien

Bei der Analyse von Timeline-Diagrammen wählen Sie angemessene Datumsbereiche für jede Zeit-Gruppierung:

- **Nach Optimizer**: Wählt automatisch die beste Gruppierung basierend auf Ihrem Datumsbereich (empfohlen)
- **Nach Sekunde**: Am besten für Bereiche ≤ 1 Stunde (detaillierte Analyse)
- **Nach Minute**: Am besten für Bereiche ≤ 1 Tag (stündliche Muster)
- **Nach Stunde**: Am besten für Bereiche ≤ 1 Monat (tägliche Muster)
- **Nach Tag**: Am besten für Bereiche > 1 Monat (langfristige Trends)

**⚠️ Warnung**: Große Datumsbereiche mit feinkörnigen Gruppierungen können zu Diagramm-Rendering-Fehlern führen. Das Tool wird Sie warnen und bessere Kombinationen vorschlagen.

## Release Notes

### **Version 3.5.0 - 14. Januar 2025**
**🎯 Verbesserte SQL-Anweisungsfilterung & Verbessertes Layout**

**Neue Funktionen:**
- **SQL++ Anweisungs-Vorfilterung**: Hinzugefügtes "In SQL++ Anweisungen suchen" Eingabefeld, das Queries während der initialen JSON-Analyse für bessere Performance filtert
- **Neuorganisiertes Layout**: Datumsauswahl-Eingaben (Von/Bis) sind jetzt vertikal gestapelt für bessere Platznutzung und saubereres Erscheinungsbild
- **Verbesserte Ausrichtung**: Datumsauswahl-Labels haben jetzt konsistente feste Breite für perfekte Eingabe-Ausrichtung

**Technische Verbesserungen:**
- Erweiterte `filterSystemQueries()` Funktion um SQL-Anweisungsfilterung während der Parse-Phase zu integrieren
- Verbessertes UI-Layout mit besserem Platzmanagement
- Reduzierte Parse-Zeit für große Datensätze durch Vor-Filterung unerwünschter Queries
- Behoben: Daten-Caching-Problem, bei dem SQL-Filter nicht ordnungsgemäß beim Re-Parse geleert wurden

**Lokalisierung:**
- Alle Sprachversionen (Spanisch, Portugiesisch, Deutsch) mit neuen Funktionen aktualisiert
- Übersetzungen für neue UI-Elemente und Platzhaltertext hinzugefügt

### Version 3.4.2 (2025-08-14)
- **UI-Verbesserungen**: Verbesserte Timeline-Chart-Interaktionen und Button-Styling-Konsistenz - Mausrad-Zoom deaktiviert, Auswahlbox-Sichtbarkeit verbessert, automatisches Zurücksetzen von Radio-Buttons beim Parsen, vergrößerte Parse JSON-Button und konsistente Gestaltung für Zeitbereich- und Steuerungsbuttons.

### Version 3.4.1 (2025-08-14)
- **Fehlerbehebungen**: JavaScript-Kopierbutton-Funktionalität in allen Sprachversionen repariert - Behandlung von Event-Parametern in copyStatement-, copyAnalysisStatement- und copyToClipboard-Funktionen behoben.

### Version 3.4.0 (2025-08-13)
- **Erweiterte Database Operations Timeline-Chart**: Hinzugefügtes Durchschnitt-Index-Scans-pro-Query-Metrik und gekrümmte Linien-Visualisierung für bessere Performance-Einblicke.

### Version 3.3.1 (2025-08-10)
- **Bug Fixes**: Behoben: Fadenkreuz-Synchronisationsprobleme in lokalisierten Versionen und korrigiertes Y-Achsen-Skalierungsverhalten für Timeline-Diagramme.

### Version 3.3.0 (2025-08-09)
- **Synchronisierte Timeline-Fadenkreuze**: Alle Timeline-Diagramme verfügen jetzt über synchronisierte Fadenkreuze, die sich gemeinsam bewegen, wenn Sie über ein beliebiges Diagramm fahren. Dies erleichtert die Korrelation von Daten zwischen verschiedenen Metriken zum gleichen Zeitpunkt.

### Version 3.1.0 (2025-08-07)
**Neue Funktionen & Verbesserungen:**
- **Dashboard Tab Verbesserungen**:
  - "Primary Scan Usage" Kreisdiagramm zu "Primary Indexes Used" Donut-Diagramm konvertiert
  - Intelligentes Warnsystem hinzugefügt, das nur bei erkannten Primary Indexes erscheint
  - "Mehr erfahren" Link zu Couchbase Best Practices Dokumentation integriert
  - Verbessertes visuelles Design mit besserem Farbkontrast und Lesbarkeit
- **Index Query Flow Tab Verbesserungen**:
  - Verbesserte Primary Index Erkennung um Indexes mit `*_primary` Endung erweitert
  - Verbesserte visuelle Hervorhebung für alle Primary Index Varianten
  - Bessere Abdeckung von Primary Index Namensmustern (`#primary`, `bucket_primary`, etc.)
- **Benutzererfahrung**:
  - Sauberere Benutzeroberfläche mit bedingten Warnungen nur wenn relevant
  - Lernressourcen direkt in das Tool integriert
  - Intuitiveres visuelles Feedback für Performance-Optimierungsmöglichkeiten

### Version 3.0.1 & Früher
Siehe Git-Verlauf für vorherige Versionsänderungen

## Fehlerbehebung

- **Leere Ergebnisse**: Überprüfen Sie, ob Query-Logging in Couchbase aktiviert ist
- **Browser-Fehler**: Stellen Sie sicher, dass JavaScript aktiviert ist
- **Diagramm-Rendering-Fehler**: Reduzieren Sie den Datumsbereich oder verwenden Sie gröbere Zeit-Gruppierung (z.B. von "nach Minute" zu "nach Stunde" wechseln)
- **"Too far apart" Fehler**: Der gewählte Zeitbereich ist zu groß für die gewählte Gruppierung - folgen Sie den Zeit-Gruppierungs-Richtlinien oben
- **Canvas-Destruction-Warnungen**: Normales Verhalten beim Wechseln zwischen verschiedenen Zeit-Gruppierungen oder Datumsbereichen

## Anforderungen

- Moderner Webbrowser mit aktiviertem JavaScript
- Couchbase Server mit aktiviertem Query-Logging
- Zugang zu `system:completed_requests` (benötigt Admin-Privilegien)

### Version 3.2.0 (2025-08-08)
**Wichtige Architektur- und Lokalisierungsverbesserungen:**
- **CSS-Architektur-Refactoring**:
  - Von 208 Inline-Styles zu zentralisierten CSS-Klassen verschoben (44% Reduzierung)
  - Umfassendes Utility-Class-System für bessere Wartbarkeit implementiert
  - CSS minimiert für verbesserte Performance und reduzierte Dateigröße
  - Verbesserte visuelle Konsistenz über alle Komponenten
- **Mehrsprachige Unterstützung**:
  - Deutsche Lokalisierung hinzugefügt (de_index.html)
  - Spanische Lokalisierung vervollständigt (es_index.html)
  - Portugiesische Lokalisierung vervollständigt (pt_index.html)
  - CSS-Architektur über alle Sprachversionen synchronisiert
- **Entwicklererfahrung**:
  - Umfassende LOCALIZATION_GUIDE.md für zukünftige Wartung erstellt
  - translations.json-System für konsistente Übersetzungen etabliert
  - Vereinfachter Lokalisierungs-Sync-Prozess mit zentralisiertem Styling
  - Verbesserte Code-Wartbarkeit und reduzierte Inline-Style-Abhängigkeiten
