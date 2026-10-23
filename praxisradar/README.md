# PraxisRadar · Köln

Privater Entscheidungsraum für den Kauf einer Zahnarztpraxis: bis 75 km Luftlinie um Köln-Zentrum, mindestens sechs tatsächlich vorhandene Behandlungsräume. Kein Kaufpreislimit festgelegt.

## Enthalten

Angebote erfassen/bearbeiten, Favoriten/Status, direkte Gegenüberstellung, gewichtete Bewertung mit Belegpflicht und Datenabdeckung, Standort-/Nachfrage-/Konkurrenzanalyse mit Quellenfeldern, Behandler und Verbleib, Verkaufsgrund, Eigenlabor, Due-Diligence-Prüfliste, JSON-Export und Suchprotokoll.

Gewichte: Behandler/Verbleib 25 %, Wirtschaftlichkeit 20 %, Patienten 15 %, Standort/Wettbewerb 15 %, CAD/CAM/Labor 10 %, Preis/Investitionen 10 %, Skalierung 5 %. Unbekannte Informationen bleiben unbewertet. Ausbauoptionen zählen nicht als vorhandene Behandlungsräume; reine Neugründungsflächen werden ausgeschlossen. Die 75 km sind mangels anderer Vorgabe als Luftlinie definiert.

## Entwicklungsstart

Node >=22.13, pnpm 11.25.0. `pnpm install`, dann `pnpm run db:generate` nur nach Schemaänderungen. `pnpm run build`, lokale D1-Migrationen gemäß Starter-Anleitung ausführen und `pnpm run dev`. Der lokale Sign-in ist nur eine Entwicklungssimulation: /signin-with-chatgpt?return_to=/ . Die bereitgestellte Migration ist bereits erzeugt und darf nicht erneut als neue Historie erzeugt werden.

## Bereitstellung und Sicherheit

Vinext/Cloudflare Workers und D1, Sites Hosting. Das Projekt wurde als privat registriert. Veröffentlichung ist noch NICHT abgeschlossen: Die Umgebung blockierte wiederholt write_stdin an den unterstützten Sites-Workflow mit „approval required … sandbox_approval is false“, auch nach zusätzlichen Netzwerk- und .git-Schreibrechten. Keine Veröffentlichung oder laufende Automatisierung behaupten. Lokale Installation, Build und API-Tests sind bestanden. Visuelle Browserprüfung ist wegen blockierter/langsamer Browser-Steuerung unvollständig.

/api/update ist ein gemeinsamer Writer hinter der Plattform-Zugriffskontrolle dieser owner-private Site. Site keinesfalls öffentlich schalten, ohne unabhängige Schreibautorisierung hinzuzufügen. MCP /mcp stellt list_offers, upsert_offer und record_search_run bereit. Source und Migrationen müssen vor einer Veröffentlichung in das registrierte Sites-Repository übertragen werden. GitHub ist hier eine zusätzliche Quellcode-Sicherung und keine produktive Datenbank.

## Tägliche Suche

SEARCH.md enthält Quellen, Datenformat, Filter, Dublettenerkennung, Verifikation, Updatezugang und Fehlerverhalten. Ein Tagesplan darf erst nach erfolgreicher Veröffentlichung und nachgewiesenem unbeaufsichtigtem Schreib-/Lesezugang aktiviert werden. Zielzeit: täglich 08:00 Europe/Berlin. Der Plan ist noch NICHT aktiviert. Die sichtbare Uhrzeit in der Oberfläche ist nur der vorgesehene Rhythmus.

## Prüfung

`node scripts/check-model.mjs`, `node node_modules/typescript/bin/tsc --noEmit` und Build erfolgreich. Lokal: D1-Write/Readback, Zurückweisung ungültiger Werte, Browser-API ohne Identität 401 und MCP tools/list erfolgreich. Temporäre Testangebote wurden entfernt.

## Angebotsimport

Im Angebotsradar: Datei ablegen/auswählen, URL einlesen oder Angebotstext einfügen. Dateiauswahl und Drag-and-drop starten die Erkennung automatisch. PDF (auch Scan, OCR bis 12 Seiten), DOCX, Bilder und Text werden im Browser ausgelesen. Maximal fünf zusammengehörige Dateien, je 20 MB, zusammen 40 MB; PDF-Text bis 40 Seiten. OCR lädt deutsche/englische Sprachdaten beim ersten Gebrauch. Dokumentinhalte werden für OCR nicht an einen KI-Dienst gesendet.

Erkannte Felder erscheinen mit Fundstelle und werden nach „Angaben übernehmen & prüfen“ vorbefüllt. Keine automatische Speicherung, Bewertungen oder erfundene fehlende Angaben. Felderkennung ist regelbasiert, kein universelles Sprachmodell: ungewöhnliche Formulierungen können fehlen. Mehrere Inserat-Referenzen oder widersprüchliche Raumangaben werden zur Prüfung markiert. Keine Bewertungen allein aus Exposé-Behauptungen.

URLs werden serverseitig ohne Benutzer-Cookies abgerufen; private/interne URLs und IP-Literale werden abgelehnt. Öffentliche DNS-Auflösung, Weiterleitungsprüfung, Größen- und Zeitlimits. Login-, Anti-Bot- und nur JavaScript-basierte Seiten können scheitern; dann PDF oder kopierten Text nutzen. PDF/OCR-Worker werden mit scripts/prepare-import-assets.mjs vorbereitet (auch Teil der Build- und Dev-Skripte).

Verifiziert: Textimport im Browser einschließlich Vorbefüllung und PDF-Dateiimport; öffentlicher Linkabruf und Ablehnung privater URLs; TypeScript, Extraktionstests und Build. Zusätzlicher Screenshot-Uploadtest wurde durch die abgelehnte Browser-Uploadfreigabe gestoppt. OCR und DOCX daher noch nicht vollständig im Browser verifiziert. Veröffentlichung und tägliche Suche bleiben vom früher dokumentierten Hosting-Blocker betroffen.

## Onepager: Praxis Search macher gmbh

Die Navigation wurde durch eine einzelne Seite ersetzt: editierbares, in D1 gespeichertes Suchprofil; Import mit bewusstem Erkennen und Speichern; gespeicherte Praxen untereinander; separater Eingang für Internetfunde; Vergleich und Fazit am Seitenende. Der Import leert sich erst nach erfolgreichem Speichern. Rechtsklick und ⋯ bieten Umbenennen, Bearbeiten und reversibles Entfernen.

Suchprofil enthält Ort, frei wählbaren Luftlinienradius, Mindestzimmer, Budget, Behandler-/Verbleibsvorgaben, Umsatz-/Gewinngrenzen, Eigenlaborwunsch, Angebotsarten, Notizen und normalisierte Gewichte. Bei Ortswechsel wird der Mittelpunkt beim Speichern öffentlich geokodiert. Freie Notizen werden nicht stillschweigend als strukturierte Muss-Filter interpretiert. Ungefähr bekannte Standorte bleiben kenntlich.

„Suche aktualisieren“ sucht öffentlich per Websuche und prüft außerdem dental-bauer-, Concura- und tape.-Übersichten. Maximal 18 Kandidaten pro Lauf, begrenzte Quellenabdeckung, dokumentierte Zugriffslücken. Nur passende oder noch unvollständig beschriebene Angebote landen im Eingang, nie automatisch in der angenommenen Liste. Autorisierung über die Plattform-Identität, Quellseiten ohne Benutzer-Cookies. Mindestens 45 Sekunden Abstand zwischen Läufen. Kein täglich laufender Zeitplan eingerichtet.

Automatische Analyse vergleicht ausschließlich angenommene Angebote. Muss-Verstöße werden zuerst berücksichtigt; danach gewichtete, erreichte Punkte und Datenabdeckung. Eigene begründete Scores gehen vor. Ergänzende Regeln für Gewinnmarge, Verbleibsquote, Laborstatus und Budget sind in lib/analysis.ts und der UI offengelegt. Keine erfundenen Nachfrage-/Konkurrenzbewertungen. Bei weniger als 50 % bewerteter Gewichtung des führenden Angebots wird kein klarer Favorit benannt. Vorläufige Einordnungen nennen offene Punkte.

Schemaerweiterung: drizzle/0001_sticky_sandman.sql ergänzt settings; lokale Migration ist angewandt. Vorhandene Angebote bleiben erhalten, neue Suchfunde erhalten stage=inbox. deleted/dismissed sind reversible Zustände. Deployment weiter nicht abgeschlossen; lokale Vorschau und GitHub-Sicherung sind der geprüfte Stand.

Verifiziert: Profil-Persistenz, dynamischer Radius und Mindestgröße, Eingang/Annahme-Trennung, Umbenennen, Entfernen und Wiederherstellen, Import-Speichern mit anschließend leerem Feld, Rechtsklick und Vergleich/Fazit im Browser. Echte Websuche durchgeführt. Eine ursprüngliche Fehllesung von Quartalsfallzahlen als Raumzahl wurde korrigiert und die neu gefundenen Einträge erneut geprüft. Temporäre QA-Angebote wurden entfernt.

## PDF-Kompatibilitätskorrektur

Der eingebettete WebKit-Browser kann ReadableStream.getReader unterstützen, aber dessen AsyncIterator nicht. PDF.js getTextContent nutzt intern for-await und verursachte deshalb „undefined is not a function … value of readableStream“. lib/pdf-text.ts liest den öffentlichen Textstream nun direkt über getReader/read und gibt den Reader auch bei Fehlern frei. Der Dateiimport verwendet diesen Weg. Geprüft mit fehlendem AsyncIterator, mehreren Textblöcken und Reader-Fehlern sowie mit einer echten Test-PDF (scripts/check-pdf-file.mjs <Testdatei>).
