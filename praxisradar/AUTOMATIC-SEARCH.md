# Aktueller Prüfstand 26.10.2026: CPU-Optimierung, noch keine Free-Betriebsfreigabe

Dieser Abschnitt ersetzt die älteren Mess- und Budgetangaben weiter unten. Änderungen sind ausschließlich auf dem Entwicklungsbranch vorbereitet; Produktion wurde weder migriert noch veröffentlicht.

- Automatische Faktenauswertung liegt in `lib/platform/facts.ts`. Der Suchkern importiert keine Cheerio-/DOM-/Entity-Bibliotheken mehr. Manueller Import behält seinen bisherigen Parser. Automatischer Kern: 98.126 Bytes; Paketgröße ist keine CPU-Garantie.
- Begrenzte Scannertexte werden nach Erreichen des Limits nicht weiter zusammengefügt/abgeschnitten. Wiederverwendete URL-/Regex-Werte, direkte Frame-Suche und Verzicht auf ungenutzte Detail-Link-Ausgaben bei Inline-Quellen reduzieren temporäre Objekte. Inline-Pagination bleibt erhalten. Datum-/Zahlformatierer werden wiederverwendet; gestufte Parsercaches enthalten keine doppelten Volltexte.
- D1-Metadaten werden über wiederverwendete Statement-Methoden erfasst. Je UTC-Tag pausiert die Suche bei 500.000 gelesenen oder 30.000 geschriebenen erfassten Zeilen. Vorige Schrittkosten werden mit der nächsten Reservierung verbucht, plus je 16 konservativ reservierte Lese-/Schreibzeilen für Abschluss und Buchhaltung. Dies ist eine nachlaufende, suchspezifische Reserve, kein harter kontoweiter Abrechnungsschutz. Wartung, Anmeldung, Dashboard und andere Apps teilen die echten Kontolimits. Nach CPU-Abbruch können noch nicht verbuchte Kosten fehlen.
- Weiterhin höchstens 1.100 Schritte pro UTC-Tag / 1.000 je Job und UTC-Tag, 42 reguläre SQL-/Netzwerkaufrufe, bis 45 einschließlich Abschluss; zusätzliche Reserve bis Free 50. Batches werden vorsorglich je Statement gezählt. Migration `0007_free_usage_meter.sql` fügt nur zwei Zählerspalten hinzu und wurde ausschließlich lokal sowie in isolierten Testtabellen angewendet.
- HTTPS-Antwortkörper werden bei Redirect, Fehler und Größenüberschreitung abgebrochen; Reader-Locks werden freigegeben. Keine TLS-Abschaltung und keine Umgehung von Zugriffsschutz.
- Generator lehnt zusätzliche Ressourcenbindungen, Logpush und Legacy-Nutzungsmodelle ab. Leere Wrangler-Standardfelder bleiben erlaubt. Kein Tarifwechsel, kein Versanddienst, keine automatische kostenpflichtige Erweiterung. Der tatsächliche Kontotarif muss vor einer späteren Freigabe weiterhin Free sein.
- 09:00 Europe/Berlin mit Sommerzeit, Nachholen, Tageswarteschlange, Jetzt-suchen-Button, Anmeldung/Origin-Prüfung, Dublettenerkennung und begründeter Score bleiben erhalten. Ein Wartungstick je fünf Minuten lässt ohne geöffnetes Dashboard rund 48 Suchschritte pro Stunde zu. Der Testausschnitt mit 951 Verarbeitungsschritten benötigt rechnerisch knapp 20 Stunden; zusätzliche Netz-/Wartezeiten, Quellfehler und Budgetpausen können den Tageslauf verlängern.

## Neue Messungen

Unveröffentlichte Cloudflare-Remote-Entwicklung, getrennte Test-D1, getrennte A/B/C-Tabellen. Keine Produktionsbindung. Gespeicherte öffentliche HTML-Belege werden aus D1 gelesen; Regressionstest der 23 bekannten Inserate, keine neue Marktsuche.

| Stand | HTTP-Aufrufe | erfasste CPU-Einzelwerte | Median / P99 / Maximum | Werte über 10 ms |
| --- | ---: | ---: | --- | ---: |
| Ausgangscode ohne eingebettete große Fixture | 963 | 253 | 6 / 13 / 17 ms | 11 |
| Import-/Cache-Optimierung | 963 | 263 | 5 / 11 / 25 ms | 3 |
| zusätzlicher Scanner-/Statement-Fix | 955 | 236 | 5 / 13 / 35 ms | 5 |

Alle drei Läufe behalten 23/23 Inserate, ohne HTTP-Abbrüche. Einzelwerte stammen aus Cloudflare-Preview-Traces, sind ganzzahlig und unvollständig gesampelt (rund ein Viertel der Aufrufe). P99 ist hier das Stichprobenquantil, keine kontoweite Analytics-Angabe. Das Maximum ist nur das höchste erfasste Sample. Der alte 56,415-ms-Wert war ein aggregiertes P999 eines anderen Messfensters mit 2,3 MB eingebetteten Fixture-Daten; er lässt sich keiner Funktion nachträglich sicher zuordnen. Deshalb ist 56,4 → 35 ms kein belastbarer Vorher/Nachher-Nachweis.

Finaler Replay: 55.661 D1-Zeilen gelesen, 12.514 geschrieben, höchstens 21 gezählte Aufrufe je Schritt. Die neue konservative interne Tagesbuchhaltung liegt höher. Lokaler Node-Replay: 23/23, 952 Aufrufe inklusive Abschluss, maximal 8,538 ms Prozess-CPU / 3,590 ms Thread-CPU. Lokaler workerd-Start: 17,9 ms aktive gesampelte Zeit; andere CPU und anderer Messzweck. Keine dieser lokalen Zahlen ersetzt Cloudflare-Messungen.

Verzögerte Cloudflare-Analytics für das finale Testfenster bestätigen P50 5,820 ms, P99 11,454 ms und P999 35,733 ms, keine Fehler. Der adaptive Preview-Sammelname meldet 991 geschätzte Ereignisse gegenüber 955 tatsächlich gesendeten Testanfragen; keine exakte pro Funktion vollständige Zählung. Zwei zusätzliche echte Concura-Indexabrufe über normales HTTPS waren erfolgreich. Diese begrenzte Live-Prüfung ist kein neuer vollständiger Suchlauf.

**Ergebnis:** Funktion und Ressourcenbegrenzung sind verbessert und getestet. Zuverlässiger dauerhafter Betrieb unter 10 ms ist noch nicht nachgewiesen. Restspitzen betreffen Scan und große Seitenabrufe; vollständige Anmeldung/SSR, Live-Geocodierung, ein ganzer Cron-Tag und größere Bestände benötigen getrennte Prüfungen. Erweiterung bleibt bis ausdrücklicher Freigabe serverseitig deaktiviert. Keine Veröffentlichung.

Offizielle Referenzen: [Workers-Limits](https://developers.cloudflare.com/workers/platform/limits/), [D1-Limits](https://developers.cloudflare.com/d1/platform/limits/), [D1-Free-Kontingente und Verhalten bei Überschreitung](https://developers.cloudflare.com/d1/platform/pricing/).

---

# PraxisRadar – automatische Praxissuche (Entwicklungsstand 24.10.2026)

Diese Erweiterung ist vorbereitet, lokal geprüft und noch nicht veröffentlicht. Sie verwendet die bestehende App, denselben Worker und dieselbe D1-Datenbank. Weder produktive Daten noch die laufende Version wurden geändert. Keine zusätzlichen Abonnements wurden aktiviert.

## Verhalten

- Automatisches Profil: Köln, 100 km Luftlinie, sechs Behandlungszimmer bevorzugt; weniger Zimmer sind kein harter Ausschluss. Profil und Schwellenwerte sind editierbar. Die bestehenden manuellen Vergleichskriterien (bisher 75 km) bleiben unverändert und sind im Formular ausdrücklich separat beschriftet.
- Öffentliche Inserate werden mit Belegen und Original-Link ausgelesen. Nicht veröffentlichte oder widersprüchliche Zahlen bleiben unbekannt. Veröffentlichungsdatum und Erstsichtung sind getrennt. Ortskoordinaten sind gegebenenfalls nur ungefähr; unbekannte Standorte werden nicht als innerhalb des Radius gewertet.
- Neue Angebote landen im bestehenden Angebotseingang. Erst das Team übernimmt sie in seine Auswahl. Erkannte Änderungen werden separat protokolliert; manuell bearbeitete Angebotsfelder werden nicht überschrieben. Verworfenes wird nicht wieder eingeblendet.
- Eindeutige Quellenkennung, Referenz und normalisierter Link verhindern Wiederholungen innerhalb einer Quelle. Inline-Angebote einer Sammelseite behalten ihre eigene Blockkennung. Quellenübergreifende mögliche Dubletten werden konservativ markiert und bleiben zur manuellen Prüfung getrennt.
- Rangfolge nach nachvollziehbaren Punkten: Standort 20, Zimmer 25, Mehrbehandlerstatus 13, angestellte Zahnärzte 12, laufender Betrieb 15, positive Gewinnangabe 7, positive Umsatzangabe 3, Inserat maximal 90 Tage alt 5. Unbekannte Fakten erhalten null Punkte; Datenabdeckung wird separat gezeigt. Kein geprüftes Unternehmenswertgutachten.
- Außerhalb des Radius nur gesonderte Empfehlungen mit ausreichendem Score, bevorzugter Zimmerzahl, belegtem Mehrbehandlerstatus, angestellten Zahnärzten, laufendem Betrieb und positiv veröffentlichter Gewinnangabe.
- Dauerhafte Hinweise mit getrennten Ungelesen-Zählern je Teammitglied; optionale Browserhinweise nur bei geöffneter App und Browserfreigabe.

## Quellen und Grenzen

Vorkonfigurierte Adapter: Concura, apoBank, Dentoffert, KZV Rheinland-Pfalz, dental bauer und Böker/Praxiskaufen. Neue Quellen können vorgemerkt und nach ausdrücklicher Prüfung freigegeben werden. Der frühere manuelle Quellenentdeckungsbereich bleibt erhalten; diese Erweiterung aktiviert keine ungeprüften Quellen automatisch.

- [Concura](https://www.concura.de/boerse/praxisangebote/): öffentliche Angebotsseiten, keine Exposé-Anforderung. Abrufe in dieser Umgebung nicht durchgehend erreichbar; produktiver Abruf noch nachzuweisen.
- [apoBank](https://praxisboerse.apobank.de/praxis-und-apothekenboerse/): aktuell keine Einzelangebote aus dem öffentlich gelieferten HTML erkannt. Wird als eingeschränkt gemeldet. Keine Umgehung von Anmeldung oder JavaScript-Zugriffsschutz.
- [Dentoffert](https://www.dentoffert.de/inserate?search=&type=praxis): öffentliche Karten getrennt auslesen, Gesuche ausschließen. Adapter gegen tatsächlich gelesene öffentliche Seiten geprüft.
- [KZV Rheinland-Pfalz](https://www.kzvrlp.de/praxisabgabe/): öffentliche Abgabeblöcke mit Ort und eigenständiger Kennung; keine geschützten Exposé-Downloads. Gegen tatsächlich gelesene öffentliche Seiten geprüft.
- [KZV Westfalen-Lippe](https://www.zahnaerzte-wl.de/pages/agbs-der-praxisboerse): ausdrücklich nur manuell; Nutzungsbedingungen schließen Drittanbieter aus, Detailzugriff erfordert Registrierung. Kein automatischer Zugriff.
- Weitere Adapter sind vorbereitet, ihre produktive Trefferabdeckung ist noch nicht vollständig nachgewiesen.

Vor Abrufen: öffentliche DNS-Ziele, HTTPS, gleiche freigegebene Domain, Robots-Regeln (24h Cache), begrenzte Abrufrate, Größenlimit und Ablehnung geschützter/signierter Bereiche. Redirects werden erneut geprüft; Captchas führen zum Abbruch. Robots-Erlaubnis ist keine pauschale Nutzungslizenz. Quellennutzungsbedingungen bleiben maßgeblich und veränderlich.

## Zeitplan und technische Grenzen

Die vorbereitete private Worker-Konfiguration ersetzt den bisherigen Cron durch einen Minutentakt. Ausschließlich um 09:00 Europe/Berlin wird der Tageslauf angelegt, Sommer-/Winterzeit eingeschlossen. Danach wird je Aufruf ein dauerhaft in D1 gespeicherter Arbeitsschritt bearbeitet. Das Dashboard führt ebenfalls jeweils genau einen Schritt aus. Eine Selbst-RPC-Bindung wird nicht verwendet; `waitUntil` setzt kein CPU-Budget zurück. Kein neuer Worker und kein externer Codex-Zeitplan erforderlich.

Leases verhindern gleichzeitige Verarbeitung; Tageskennung verhindert doppelte Tagesläufe. Obergrenzen: 240 gespeicherte Aufgaben und 1.000 Verarbeitungsschritte pro Lauf, höchstens zwei manuelle Läufe pro UTC-Tag zusätzlich zum Tageslauf, bis drei Indexseiten pro Quelle, 35 Einträge je Indexseite, 700 KB je Dokument und begrenzte Unteranfragen. Abbrüche, Quellenausfälle und erreichte Grenzen werden als Teilfehler angezeigt. Ein Lauf kann mehrere Stunden dauern. Die Beschriftung „alle Quellen“ bedeutet alle aktivierten Adapter innerhalb dieser Grenzen, keine Garantie vollständiger Marktabdeckung.

[Cloudflare Workers-Limits](https://developers.cloudflare.com/workers/platform/limits/) gelten weiterhin. Insbesondere die CPU-Grenzen des kostenlosen Tarifs sind durch lokale Tests und einen Dry-Run nicht produktiv nachgewiesen. Vor einer Betriebsfreigabe müssen echte Laufzeiten unter dem bestehenden Tarif und gegebenenfalls kleinere Arbeitsschritte geprüft werden. Ein kostenpflichtiger Tarif wurde nicht aktiviert.

## E-Mail-Zusammenfassung: nur vorbereitet

Nach einem Tageslauf werden Entwürfe mit Meldungen der letzten 24 Stunden, Suchstatus und Links pro Tag und freigegebener Teamadresse abgelegt. Empfänger stammen ausschließlich aus privater Serverkonfiguration. Kein Versand, keine externe Adressübermittlung. Ein getesteter, deaktivierter [Resend-Adapter](https://resend.com/docs/api-reference/emails/send-email) ist vorhanden, aber nicht mit dem Cron verbunden. Aktivierung benötigt separat einen Versanddienst, bestätigten Absender, Secret und ausdrückliche Freigabe; keine Zugangsdaten in GitHub eintragen.

## Datenbank und Veröffentlichung

Neue Migrationen 0003 und 0004 legen ausschließlich zusätzliche Tabellen/Indizes an. Kein DROP, DELETE, TRUNCATE oder Umbau bestehender Tabellen. Lokal sind alle Migrationen auf einer isolierten Testdatenbank erfolgreich angewendet. Produktiv wurde nichts migriert.

Vor späterer Veröffentlichung: frische private D1-Sicherung, bestehende Migrationstabelle prüfen, nur ausstehende additive Migrationen anwenden, private Konfiguration erzeugen, finale Freigabe und produktive Ressourcenprüfung. Nicht die lokale Testdatenbank hochladen. Die private Konfiguration enthält Teamadressen und bleibt in ignoriertem dist. Ein `wrangler deploy --dry-run` prüft Paketierung/Bindings, veröffentlicht aber nichts. Die freigegebene produktive App bleibt bis zu einer separaten Veröffentlichung unverändert.

## Verifikation

14 Testskripte einschließlich lokalem Angebots-API-Test und echtem synthetischem PDF; zusätzlich Plattform-API-Smoke-Test, TypeScript-Prüfung, vollständiger Produktionsbuild, Wrangler-Dry-Run und Browserkontrolle. Plattformtests verwenden SQLite im Speicher und klar getrennte Fixtures: Extraktion/Unbekannt/Belege, Quellenfreigaben, Robots/Redirect-Schutz, Score, Inline-Identitäten, Dubletten, Änderungsprotokolle, Transaktions-Rollback, verworfene Angebote, Nutzerhinweise, Lease/Fortsetzung, Zeitzonenwechsel und deaktivierter Mailversand. Keine erfundenen Ergebnisse werden in der produktiven App gespeichert.

Nicht als abgeschlossen behauptet: produktiver unbeaufsichtigter Tageslauf, vollständige Trefferabdeckung aller Portale, E-Mail-Zustellung und produktive CPU-Laufzeitmessung.

## Kontrollierter Test vom 24.10.2026 – noch keine Free-Betriebsfreigabe

Die Vorschau war nach beendetem lokalen Server nicht erreichbar (Verbindungsfehler auf Port 5195). Der Server wurde neu gestartet, API und Browseranzeige geprüft. Netzwerkfehler erhalten jetzt eine verständliche Meldung; im Leerlauf wird das Dashboard nur noch alle 120 Sekunden (zuvor 60, ursprünglich 10 Sekunden) abgefragt.

Ein ausdrücklicher lokaler Live-Test ist mit `node --use-system-ca scripts/check-public-sources.mjs --live-local-only` möglich. Er verwendet ausschließlich eine neue lokale SQLite-Datei und niemals die produktive D1. Maximal zwei Indexseiten und zehn externe Detailseiten pro Quelle, maximal 200 Anfragen insgesamt. Tatsächlich gelesene HTML-Belege und Messdaten bleiben unter ignoriertem `.sites-runtime/controlled-test-20261024`. Ohne ausdrücklichen Schalter startet dieses Skript keinen Netzwerktest. Es gehört nicht zum normalen Release-Testlauf.

Ergebnis im begrenzten Ausschnitt: 23 öffentlich gelesene Abgabeangebote (Dentoffert 8, KZV Rheinland-Pfalz 13, Böker 2), keines mit belegten mindestens sechs Zimmern. Das ist kein Nachweis, dass es auf diesen Portalen insgesamt keine größeren Praxen gibt. Geocodierung und die Vollständigkeit aller Portale sind durch diesen Test nicht bestätigt. Es wurden keine neuen Kaufempfehlungen als passend behauptet.

Ein Formular-Captcha bei Böker wurde fälschlich als Sperre der gesamten öffentlichen Seite behandelt. Nun werden unberührte Kontaktformulare von eigenständigen Zugriffschallenges unterschieden; Formulare werden weiterhin niemals abgesendet. Auch öffentliche Böker-URLs mit ausgeschriebenen Ortsnamen werden erkannt. Concura scheitert aus dieser Umgebung an der Zertifikatskette (keine Abschaltung der TLS-Prüfung); apoBank liefert keine erkennbaren Einzelangebote; dental bauer überschreitet das bewusst beibehaltene Dokumentlimit; KZV Westfalen-Lippe bleibt wegen Nutzungsbeschränkungen manuell.

Ressourcen: ausschließlich lokale Suchausführung; bestehende D1 nur lesend auf Metadaten geprüft. Kein Deployment, keine Migration und kein produktiver Suchlauf. Der getestete Ausschnitt ist klein, aber einzelne lokale CPU-Messungen liegen über 10 ms. Node-Prozessmessungen sind keine Cloudflare-Isolate-Messungen und erlauben keine Bestätigung des Free-Dauerbetriebs. Deshalb bleibt die Erweiterung ausdrücklich **nicht für einen unbeaufsichtigten Workers-Free-Betrieb freigegeben**. Vor einer Veröffentlichung sind kleinere Parser-Arbeitsschritte und eine aussagekräftige Isolate-CPU-Prüfung notwendig. Die Tarif-API war mit OAuth nicht lesbar. Bei der anschließenden Optimierung wurde im Cloudflare-Dashboard jedoch Workers Free als aktueller Tarif bestätigt; kein Tarif wurde geändert. Der vollständige Bericht mit sämtlichen Original-Links liegt ausschließlich lokal in `outputs/praxisradar/Kontrollierter-Praxissuche-Test-20261024.md` im übergeordneten Arbeitsbereich.


## Optimierung für Workers Free (24.10.2026)

- Index- und Detailabruf, HTML-Scan, einzelne Karte, DOM-Vorbereitung, Faktenextraktion, Geocodierung und Speicherung sind getrennte, dauerhaft gespeicherte Schritte. Je Cron-Ereignis wird höchstens ein Schritt verarbeitet; um 09:00 Europe/Berlin wird der Tageslauf nur angelegt.
- HTML wird in 32.768-Zeichen-Blöcken zwischengespeichert und je Schritt um höchstens 4.096 Zeichen weitergelesen. Karten sind auf 24.000, bereinigte Detailtexte auf 16.000 Zeichen begrenzt. Parserzustand und Referenzen liegen in D1; große HTML-Kopien werden nicht in Aufgaben eingebettet. Stabile Cache-Schlüssel vermeiden neue Kopien pro Tageslauf.
- Ein gemeinsamer Zähler begrenzt SQL- und Netzwerkanfragen auf 42 reguläre Aufrufe plus zwei reservierte Checkpoint-Aufrufe. Er ist ein konservativer Programmschutz und ersetzt keine tatsächliche Kontoquotenmessung. Authentifizierung und Laufzeit benötigen zusätzliche Reserven.
- Nach 1.000 Schritten wird ein Lauf ehrlich als teilweise abgeschlossen beendet; ausstehende Aufgaben bleiben gespeichert. Zwei manuelle Läufe pro UTC-Tag sind erlaubt, der separate Tageslauf bleibt möglich. Leerlaufabfragen im Dashboard erfolgen alle 120 Sekunden.
- Ausgeschriebene Zimmerzahlen, BHZ/Beh.-Zimmer und explizite angestellte Zahnärzte werden erkannt. Geplante Erweiterungen, Stellenanzeigen, Bereiche und widersprüchliche Zahlen bleiben unbekannt. Teamgröße wird nicht als Zahl angestellter Zahnärzte ausgegeben.
- Der gespeicherte öffentliche Testausschnitt enthält weiterhin alle 23 Inserate. Lokale Node-CPU-Werte sind ausdrücklich keine Cloudflare-CPU-Messungen. Für echte Cloudflare-Prüfungen wird ausschließlich eine neue getrennte Test-D1 mit öffentlichen Belegen verwendet; die produktive DB ist dort nicht gebunden.
- Concura liefert über Cloudflares normales HTTPS öffentliche Index- und Detailseiten. Kein Abschalten der Zertifikatsprüfung, kein Login, keine Exposé-Anforderung. Das lokale Zertifikatsproblem ist damit kein Beleg für eine Cloudflare-Sperre.

Ein Schritt pro Minute bedeutet für den Testausschnitt rund 13,5 Stunden; das absolute Laufbudget entspricht 16 Stunden 40 Minuten. Größere Suchumfänge können dieses Budget erreichen und müssen dann als unvollständig angezeigt werden. Zeitsteuerung allein vergrößert das kostenlose CPU-Budget nicht. Echte Cloudflare-Messungen, Fehlerraten und D1-Zeilenzähler entscheiden über eine spätere Betriebsfreigabe; ein erfolgreicher Build oder lokale Messungen genügen dafür nicht. Der vollständige lokale Optimierungsbericht liegt unter `outputs/praxisradar/Workers-Free-Optimierung-20261024.md` im übergeordneten Arbeitsbereich.

### Ergebnis des isolierten Cloudflare-Tests

807 echte HTTP-Testanfragen gegen die unveröffentlichte Remote-Entwicklung mit separater Test-D1 erhalten alle 23 bisherigen Inserate. Keine HTTP-Abbrüche, höchstens 21 gezählte SQL-/Netzwerkaufrufe je Suchschritt. Gespeicherte öffentliche Belege ersetzen in diesem Replay externe Abrufe; Geocodierung, Authentifizierung und ein ganzer Cron-Tag sind damit nicht vollständig gemessen. Der Lauf meldet wegen begrenzter Belegabdeckung korrekt ein Teilergebnis.

Echte, verzögerte Cloudflare-CPU-Analytics des Preview-Sammelnamens zeigen P99 oberhalb 10 ms. Sie sind keine pro Schritt vollständige Messreihe. Der separate Parser-Test und lokale Node-CPU-Werte belegen deshalb keinen sicheren Free-Dauerbetrieb. **Derzeit keine zuverlässige Free-Betriebsfreigabe:** CPU-Ausreißer und vollständige D1-Tages-/Langzeitbilanz bleiben vor Veröffentlichung zu klären. Die produktive App bleibt unverändert.

## Aktueller Korrekturstand: lokale Umsetzung, noch nicht veröffentlicht

Dieser Abschnitt ersetzt die früher beschriebenen Laufbudget-/Fortsetzungsgrenzen. Die historischen Cloudflare-Messungen weiter oben beziehen sich auf den vorherigen Code und sind keine Messung dieser Korrekturen.

- Die automatische Pipeline liest öffentliches HTML als Text aus D1 in höchstens 4.096 Zeichen großen Abschnitten. Es werden keine ganzen großen JSON-Seiten pro Scan zurück in den Worker übertragen. Karten werden ohne vollständigen DOM gelesen; die automatische Verarbeitung erzeugt dafür keinen DOM mehr. Bereits gescannte Details werden direkt weiterverwendet. Identität, Zimmer, Finanzen, Team und weitere Geschäftsangaben werden in fünf separaten Aufrufen ausgewertet. Die manuelle Importfunktion bleibt vollständig verfügbar. Ein eigener Match-Schritt prüft höchstens 20 bestehende Links je Aufruf; bekannte Quellenkennungen und exakte Links haben einen schnellen indexierten Pfad.
- `PLATFORM_SEARCH_ENABLED` muss ausdrücklich `true` sein. Die private Konfiguration erzeugt standardmäßig `false`; erst die spätere Freigabe setzt in der privaten Eingabe `searchEnabled: true`. Das hält Cron und beide Start-Endpunkte serverseitig an. Die Oberfläche zeigt den Zustand an. Kein R2, kein bezahlter Such-, Queue- oder Versanddienst.
- Der UTC-Minutencron prüft die lokale Uhrzeit mit `Europe/Berlin`. Ab 09:00 wird der Tagesauftrag dauerhaft und eindeutig nach lokalem Datum vorgemerkt. Ein verpasstes 09:00-Ereignis wird beim nächsten Tick nachgeholt. Wenn ein anderer Job läuft, bleibt der Auftrag in der Warteschlange, auch über Mitternacht. Die tatsächliche Durchführung kann bei ausgeschöpftem Budget später erfolgen; ein täglicher vollständiger Marktüberblick ist damit nicht garantiert.
- Höchstens 1.100 tatsächliche Arbeitsschritte der Suche je UTC-Tag insgesamt und 1.000 je Job/UTC-Tag. Bei Erreichen bleibt der Job aktiv, mit `resumeAt` und einer D1-Sperre bis zum nächsten UTC-Tag. Aufgaben und Parserzustände bleiben erhalten. Kein manueller Neustart notwendig. Harte Endgrenze: sieben Tage oder 7.000 Schritte; danach ehrliches Teilergebnis. Quellabrufzeit wird mit den Fakten weitergegeben, statt erst die spätere Auswertungszeit als Sichtung auszugeben.
- Die manuelle Fortsetzung ist persistent für das Team auf einen Aufruf je 15 Sekunden begrenzt; HTTP 429 enthält `Retry-After`. Die Oberfläche fragt aktive Jobs nur alle 30 Sekunden weiter und setzt während einer Budgetpause aus. Leerlaufabfrage bleibt bei 120 Sekunden. Anmeldung und Origin-Prüfung bleiben bestehen.
- In jedem fünften Cron-Tick erfolgt ein eigener kleiner Wartungsschritt statt einer zusätzlichen Suchkette. Er entfernt höchstens 50 abgelaufene technische Cacheeinträge, alte Aufgaben abgeschlossener Jobs nach 14 Tagen oder bis zu 20 alte Jobmetadaten nach 90 Tagen; abgeschlossene Tagesmarker und alte technische Tageszähler werden ebenfalls begrenzt bereinigt. Aktive Jobs, offene Tagesaufträge, Praxen, Originaldateien, Benutzer, Belege und Änderungsereignisse werden nicht automatisch gelöscht.
- Atomare SQLite-Trigger begrenzen Payload-Speicher: Cache 32 MiB, Aufgaben 16 MiB, Jobs 4 MiB, Änderungsereignisse 32 MiB, Hinweise 4 MiB und Mailentwürfe 2 MiB. Eine Überschreitung bricht den betreffenden Schreibvorgang ab; bestehende Daten bleiben erhalten. Höchstens 5.000 neu automatisch verwaltete Inserate. Das ersetzt keine kontoweite D1-Zeilen-/Speichermessung und ist keine unbegrenzte Archivierung.
- Neue, ausschließlich lokal geprüfte Migrationen: `0005_free_runtime_controls.sql` (additive Spalte, Tabellen, Indizes, Budgettrigger) und `0006_daily_schedule.sql` (Tageswarteschlange). Keine davon wurde produktiv angewendet. Der Generator trägt `migrations_dir` jetzt automatisch absolut ein. Drizzle-Schema, Journal und Snapshots sind mitgeführt; Ausdrucksindex und Budgettrigger sind ausdrücklich gepflegtes SQL.

Lokale Tests prüfen Upgrade mit erhaltenen Praxisdaten/Originalbytes, atomare Speichergrenzen, begrenzte Bereinigung, Unicode-Seitenschnitte, Sommer-/Winterzeit, Nachholen, Warteschlange über Mitternacht, Tagespause/Fortsetzung, unveränderte manuelle Importe und serverseitige Deaktivierung. Ein lokaler CPU-Wert ist kein Cloudflare-Nachweis; vor Veröffentlichung bleibt ein neuer isolierter Cloudflare-Free-Test erforderlich.
