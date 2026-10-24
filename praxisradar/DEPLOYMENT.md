# Bestehende App – Vorbereitung ohne Deployment

Diese Version basiert auf dem gesicherten Originalprojekt vom 24.10.2026. Ein separater Branch dient der Pruefung. Worker, Datenbank und Sites-Projektkennung bleiben erhalten.

## Dateiauswahl

Enthalten: App/API, Fachlogik, UI und Hooks, SVG-Assets, Datenbankschema/Migrationen, Tests, Buildskripte, Paketdateien und Lizenzen. Unbenutzte D1-Notizbeispiele und generiertes next-env.d.ts sind ausgeschlossen. PDF-/OCR-Bibliotheken werden beim Build aus den Abhaengigkeiten erzeugt.

Nicht einchecken: .sites-runtime, .wrangler, dist, node_modules, .env-Dateien, private Konfigurationen, OAuth-Token, Einladungen, Passwoerter, Sitzungen, Originalunterlagen und Datenbankexporte. Testadressen mit example-Domains sind keine Teamadressen.

## Lokale Pruefung

Node.js 22.13 oder neuer; pnpm gemaess packageManager in package.json. Im Projektverzeichnis:

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit --incremental false
node scripts/check-team-cloud.mjs
node scripts/check-team-password.mjs
node scripts/check-rank-names.mjs
node scripts/check-source-discovery.mjs
node scripts/check-release-config.mjs
pnpm run build
```

Der Build startet kein Deployment und keine Datenbankmigration. Generiertes next-env.d.ts bleibt ignoriert.

## Bestehendes Cloudflare-Ziel

Workername: praxis-search-app; Datenbank-Binding: DB; Assets-Binding: ASSETS. Konto- und Datenbank-ID werden aus privater Konfiguration uebernommen. Der Vite-Build hat zunaechst eine lokale Platzhalter-Datenbank und darf nicht direkt deployt werden.

Nach dem Build erzeugt `node scripts/prepare-cloudflare-deploy.mjs` die ignorierte private Datei dist/server/cloudflare.wrangler.json. Erforderliche Build-Variablen:

- CLOUDFLARE_ACCOUNT_ID: vorhandenes Konto.
- PRAXIS_DATABASE_ID: vorhandene D1-Datenbank.
- PRAXIS_TEAM_EMAILS: drei freigegebene Adressen, kommasepariert, vertraulich behandeln.

Alternativ kann lokal ein Pfad zur bestehenden privaten JSON-Konfiguration als Argument uebergeben werden. Diese Datei niemals einchecken. Der Generator gibt die Teamwerte nicht aus und aktiviert keine Ressourcen. Er lehnt Platzhalter-Datenbanken und R2 ab.

Reine Paketpruefung ohne Upload: `pnpm exec wrangler deploy --dry-run --config dist/server/cloudflare.wrangler.json`. Konfiguration und vollstaendige Dry-run-Ausgaben bleiben lokal, weil sie private Teamwerte enthalten koennen.

## Spaetere Veroeffentlichung – jetzt nicht ausfuehren

Vor dem Wechsel private D1-Sicherung erstellen und Migrationen mit dem bestehenden Schema abgleichen. Keine Migration automatisch ausfuehren. Die Git-Verbindung ist beim bestehenden Worker unter Settings > Builds noch nicht eingerichtet; diese Vorbereitung richtet sie nicht ein. Es ist keine GitHub-Actions-Deploymentdatei enthalten.

Erst nach ausdruecklicher Deployment-Freigabe den vorhandenen Worker mit dem Repository verbinden, den Produktionsbranch bewusst waehlen und die privaten Build-Variablen konfigurieren. Keine neue App und keine neue Datenbank erstellen. Builds mit Teamwerten nicht als oeffentliche Artefakte hochladen.

Bekannte Grenze des Originals: Die taegliche Suche kann Teilfehler einzelner Quellen haben; der Gesamtstatus unterscheidet diese derzeit nicht durchgaengig. Vor einem produktiven Versionswechsel anhand des Suchprotokolls pruefen. Ein erfolgreicher Build beweist keine vollstaendige Marktabdeckung.
