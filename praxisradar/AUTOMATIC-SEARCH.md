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

Die vorbereitete private Worker-Konfiguration ersetzt den bisherigen Cron durch einen Minutentakt. Ausschließlich um 09:00 Europe/Berlin wird der Tageslauf angelegt, Sommer-/Winterzeit eingeschlossen. Danach wird je Aufruf ein dauerhaft in D1 gespeicherter Arbeitsschritt bearbeitet. Eine interne SearchRunner-Servicebindung erlaubt denselben Ablauf aus dem Dashboard. Kein neuer Worker und kein externer Codex-Zeitplan erforderlich.

Leases verhindern gleichzeitige Verarbeitung; Tageskennung verhindert doppelte Tagesläufe. Obergrenzen: 240 Aufgaben pro Lauf, bis drei Indexseiten pro Quelle, 35 Einträge je Indexseite, 700 KB je Dokument und begrenzte Unteranfragen. Abbrüche, Quellenausfälle und erreichte Grenzen werden als Teilfehler angezeigt. Ein Lauf kann mehrere Stunden dauern. Die Beschriftung „alle Quellen“ bedeutet alle aktivierten Adapter innerhalb dieser Grenzen, keine Garantie vollständiger Marktabdeckung.

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

Die Vorschau war nach beendetem lokalen Server nicht erreichbar (Verbindungsfehler auf Port 5195). Der Server wurde neu gestartet, API und Browseranzeige geprüft. Netzwerkfehler erhalten jetzt eine verständliche Meldung; im Leerlauf wird das Dashboard nur noch alle 60 statt alle 10 Sekunden abgefragt.

Ein ausdrücklicher lokaler Live-Test ist mit `node --use-system-ca scripts/check-public-sources.mjs --live-local-only` möglich. Er verwendet ausschließlich eine neue lokale SQLite-Datei und niemals die produktive D1. Maximal zwei Indexseiten und zehn externe Detailseiten pro Quelle, maximal 200 Anfragen insgesamt. Tatsächlich gelesene HTML-Belege und Messdaten bleiben unter ignoriertem `.sites-runtime/controlled-test-20261024`. Ohne ausdrücklichen Schalter startet dieses Skript keinen Netzwerktest. Es gehört nicht zum normalen Release-Testlauf.

Ergebnis im begrenzten Ausschnitt: 23 öffentlich gelesene Abgabeangebote (Dentoffert 8, KZV Rheinland-Pfalz 13, Böker 2), keines mit belegten mindestens sechs Zimmern. Das ist kein Nachweis, dass es auf diesen Portalen insgesamt keine größeren Praxen gibt. Geocodierung und die Vollständigkeit aller Portale sind durch diesen Test nicht bestätigt. Es wurden keine neuen Kaufempfehlungen als passend behauptet.

Ein Formular-Captcha bei Böker wurde fälschlich als Sperre der gesamten öffentlichen Seite behandelt. Nun werden unberührte Kontaktformulare von eigenständigen Zugriffschallenges unterschieden; Formulare werden weiterhin niemals abgesendet. Auch öffentliche Böker-URLs mit ausgeschriebenen Ortsnamen werden erkannt. Concura scheitert aus dieser Umgebung an der Zertifikatskette (keine Abschaltung der TLS-Prüfung); apoBank liefert keine erkennbaren Einzelangebote; dental bauer überschreitet das bewusst beibehaltene Dokumentlimit; KZV Westfalen-Lippe bleibt wegen Nutzungsbeschränkungen manuell.

Ressourcen: ausschließlich lokale Suchausführung; bestehende D1 nur lesend auf Metadaten geprüft. Kein Deployment, keine Migration und kein produktiver Suchlauf. Der getestete Ausschnitt ist klein, aber einzelne lokale CPU-Messungen liegen über 10 ms. Node-Prozessmessungen sind keine Cloudflare-Isolate-Messungen und erlauben keine Bestätigung des Free-Dauerbetriebs. Deshalb bleibt die Erweiterung ausdrücklich **nicht für einen unbeaufsichtigten Workers-Free-Betrieb freigegeben**. Vor einer Veröffentlichung sind kleinere Parser-Arbeitsschritte und eine aussagekräftige Isolate-CPU-Prüfung notwendig. Tarifdaten sind mit der vorhandenen OAuth-Freigabe nicht lesbar; es wurde weder ein Tarif geändert noch eine zusätzliche Berechtigung beantragt. Der vollständige Bericht mit sämtlichen Original-Links liegt ausschließlich lokal in `outputs/praxisradar/Kontrollierter-Praxissuche-Test-20261024.md` im übergeordneten Arbeitsbereich.
