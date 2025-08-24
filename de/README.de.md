# Couchbase Slow Query Analysis Tool v3.6.2

**🌍 Sprachen:** [🇺🇸 English](README.md) | **🇩🇪 Deutsch** | [🇪🇸 Español](README.es.md) | [🇵🇹 Português](README.pt.md)

## 🚀 **Beta-Deployment-Links:**
- **Englisch**: [https://cb.fuj.io/](https://cb.fuj.io/)
- **Deutsch**: [https://cb.fuj.io/de_index](https://cb.fuj.io/de_index)
- **Spanisch**: [https://cb.fuj.io/es_index](https://cb.fuj.io/es_index)
- **Portugiesisch**: [https://cb.fuj.io/pt_index](https://cb.fuj.io/pt_index)

Wenn Sie die index.html-Dateien nicht herunterladen möchten, klicken Sie auf die Beta-Links oben. Denken Sie daran, die Schritte im `Schnellstart`-Abschnitt unten zu befolgen, um `Schritt 3:` und darüber hinaus zu vervollständigen, um die JSON-Daten zu erhalten, die Sie zum Debuggen und Analysieren benötigen.

## 📁 **Download-Anweisungen:**
Alternativ können Sie die HTML-Dateien lokal herunterladen:
- **Deutsch**: Download [`de_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/de_index.html?download=true)
- **Englisch**: Download [`index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/index.html?download=true)
- **Spanisch**: Download [`es_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/es_index.html?download=true)
- **Portugiesisch**: Download [`pt_index.html`](https://github.com/Fujio-Turner/cb_completed_request/raw/main/pt_index.html?download=true)

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
SELECT *, meta().plan FROM system:completed_requests LIMIT 2000;
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

## 📋 Versionshinweise

### Version 3.6.2 (23. August 2025)
#### 🔧 Fehlerbehebungen
- **Index/Query Flow Tab-Synchronisationsprobleme Behoben**: Probleme mit veralteter Datenanzeige bei Verwendung von SQL-String-Filtern mit versteckten Tabs gelöst
- **Verbesserte Tab-Aktivierungslogik**: Index/Query Flow wird jetzt immer aus aktuellen gefilterten Daten neu erstellt, wenn der Tab aktiviert wird
- **Verbesserte Datenstruktur-Kompatibilität**: Query-Objektstruktur korrigiert, um `undefined`-Eigenschaftsfehler während des Renderings zu verhindern
- **Komplexes Verzögertes Rendering Eliminiert**: Tab-Sichtbarkeitsbehandlung vereinfacht, um Timing-Probleme und Cache-Invalidierung zu beseitigen

#### 🎯 Technische Verbesserungen
- **Ordnungsgemäße Versteckte Tab-Verarbeitung**: Index/Query Flow verarbeitet jetzt Datenstrukturen korrekt, auch wenn der Tab nicht sichtbar ist
- **Zuverlässiges SVG-Verbindungs-Rendering**: SVG-Verbindungspositionierungsprobleme mit jQuery UI Tab-Sichtbarkeitserkennung behoben
- **Erweiterte Fehlerbehebung**: Umfassendes Konsolen-Logging für Index/Query Flow Datenverarbeitung und Rendering hinzugefügt
- **Konsistentes Tab-übergreifendes Verhalten**: Index/Query Flow verhält sich jetzt konsistent mit anderen Tabs bezüglich Datenverarbeitung

### Version 3.6.1 (23. August 2025)
#### 🚀 Neue Funktionen
- **EXECUTE-Anweisungsunterstützung**: Vollständige Unterstützung für die Erkennung und Kategorisierung von EXECUTE-Anweisungen hinzugefügt
- **Erweiterte Query-Status-Farben**: Semantisches Farbschema für Query-Status-Diagramm (grün=abgeschlossen, rot=fatal, orange=timeout, grau=gestoppt/abgebrochen, blau=laufend)
- **Verbesserte Zahlenformatierung**: Komma-Trenner und Rundung zu allen numerischen Spalten für bessere Lesbarkeit hinzugefügt
- **Erweiterte Primary Scan Warnungen**: Rot/fett Styling für Primary Scan Nutzungsindikatoren in Query Groups und Every Query Tabellen

#### ✨ Verbesserungen der Benutzererfahrung
- **Textauswahl korrigiert**: Probleme bei der Textauswahl in Tabellenzellen behoben - Benutzer können jetzt Text aus Tabellenzellen hervorheben und kopieren
- **Bessere Performance**: Query-Limit von 4000 auf 2000 Datensätze optimiert (8-10MB vs 36MB) für verbesserte Browser-Performance
- **CDN-Cache-Busting**: Versionsparameter zu allen externen Bibliothek-Importen für besseres Cache-Management hinzugefügt
- **Verbesserte deutsche Lokalisierung**: Fehlende Übersetzungen für "Verwendete Indizes" und "Ausgeführte Abfragen" in der deutschen Version behoben

#### 🔧 Technische Verbesserungen
- **Konsistente Statement-Type-Analyse**: `deriveStatementType()` Funktion für zuverlässige Statement-Type-Erkennung in allen Diagrammen hinzugefügt
- **Intelligente Klick-Behandlung**: Tabellenzeilen-Klicks erkennen jetzt intelligent Textauswahl vs. Zeilenauswahl
- **Verbessertes Flow-Diagramm**: Erweiterte Index/Query-Flow-Verbindungspositionierung mit mehreren Redraw-Versuchen
- **Bessere Fehlerbehandlung**: JavaScript-Referenzfehler in der Analyse-Tabellengenerierung behoben

#### 🌍 Lokalisierung
- **Vollständige mehrsprachige Unterstützung**: Alle neuen Funktionen vollständig ins Spanische, Portugiesische und Deutsche übersetzt
- **Konsistente Zahlenformatierung**: Locale-bewusste Zahlenformatierung in allen Sprachversionen

### Version 3.5.2 (21. August 2025)
#### 🚀 Neue Funktionen
- **Verbesserte Timeline-Steuerung**: Radio-Buttons in Dropdown für bessere Benutzerfreundlichkeit umgewandelt
- **Nach Stunde Gruppierung**: Neue "Nach Stunde" Zeit-Gruppierungsoption für Timeline-Analyse hinzugefügt
- **1 Woche Zeitbereich**: "1 Woche" Button für schnelle Zeitbereich-Auswahl hinzugefügt
- **Verbesserte UI-Labels**: Klare Labels für "Zeit-Gruppierung" und "Y-Achsen-Skalierung" Steuerungen hinzugefügt
- **Visuelle Gruppierung**: Gestylter Container für Y-Achsen-Skalierung Steuerungen mit verbesserter visueller Hierarchie hinzugefügt

#### ✨ Verbesserungen
- **Bessere Zeitbereich-Validierung**: Validierung für "Nach Stunde" Gruppierung mit 1-Woche-Limit hinzugefügt
- **Verbesserter Button-Text**: "Zeitbereich Verwenden" zu "Aktuellen X-Achsen Datumsbereich der Diagramme Verwenden" für mehr Klarheit aktualisiert
- **Vereinfachte Zoom-Anweisungen**: Zoom-Hilfetext zu "Kasten ziehen zum Zoomen des Bereichs" vereinfacht
- **Dynamische Zeiteinheit-Übersetzung**: Optimierer-Labels zeigen jetzt übersetzte Zeiteinheiten (z.B. "Nach Optimierer (Stunde)")
- **Verbesserte Button-Reihenfolge**: Zeitbereich-Buttons für logischen Ablauf neu angeordnet (Original → 1 Woche → 1 Tag → 1 Stunde)

#### 🌍 Lokalisierung
- **Vollständige Mehrsprachunterstützung**: Alle neuen Funktionen vollständig ins Spanische, Portugiesische und Deutsche übersetzt
- **Dynamische Zeiteinheit-Übersetzungen**: Zeiteinheiten in Optimierer-Labels übersetzen jetzt korrekt in allen Sprachen
- **Aktualisierte Übersetzungsschlüssel**: Neue Übersetzungsschlüssel für alle neuen UI-Elemente hinzugefügt

#### 🔧 Technische Verbesserungen
- **Modernisiertes JavaScript**: Funktionen aktualisiert, um mit Dropdown-Steuerelementen anstatt Radio-Buttons zu arbeiten
- **Bessere Fehlerbehandlung**: Verbesserte Validierung mit sprachspezifischen Fehlermeldungen
- **Konsistente UI-Architektur**: Verbesserte CSS-Klassenstruktur für bessere Wartbarkeit

### Version 3.5.1 (20. August 2025)
- **Bug Fixes**: Regex-Parsing-Fehler im Index-Tab-Bucket-Dropdown behoben, das "ON" anstatt der tatsächlichen Bucket-Namen anzeigte
- **Verbesserungen**: Verbessertes Parsing zur Behandlung komplexer CREATE INDEX-Anweisungen mit Wörtern, die "on" enthalten (wie "accommodation")

### Version 3.5.0 (15. August 2025)
- **Neue Funktionen**: SQL++ Anweisungs-Vorfilterung während JSON-Analyse für bessere Leistung hinzugefügt, Datumsauswahl-Layout mit vertikaler Stapelung und verbesserter Beschriftungsausrichtung reorganisiert.
- **Technische Verbesserungen**: Verbesserte filterSystemQueries() Funktion, verbessertes UI-Layout und Platzverwaltung, reduzierte Analysezeit für große Datensätze und behobenes Daten-Caching-Problem bei dem SQL-Filter beim erneuten Analysieren nicht ordnungsgemäß geleert wurden.
- **Lokalisierung**: Alle Sprachversionen (Spanisch, Portugiesisch, Deutsch) mit neuen Funktionen aktualisiert und Übersetzungen für neue UI-Elemente hinzugefügt.

### Version 3.4.2 (15. August 2025)
- **UI-Verbesserungen**: Verbesserte Timeline-Chart-Interaktionen und Button-Styling-Konsistenz - Mausrad-Zoom deaktiviert, Auswahlbox-Sichtbarkeit verbessert, automatisches Zurücksetzen von Radio-Buttons beim Parsen, vergrößerte Parse JSON-Button und konsistente Gestaltung für Zeitbereich- und Steuerungsbuttons.

### Version 3.4.1 (15. August 2025)
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
