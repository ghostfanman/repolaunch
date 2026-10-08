# RepoLaunch

**Kostenloser Check für dein GitHub-Projekt.** RepoLaunch sagt dir in einfachen Worten, was Besuchern an deinem Repository fehlt, und zeigt dir Klick für Klick, wie du es behebst. Du brauchst keine Installation und kein technisches Vorwissen, nur ein GitHub-Konto.

### 👉 [Jetzt Repository analysieren](https://github.com/ghostfanman/repolaunch/issues/new?template=repolaunch-audit.yml)

1. Auf den Link oben klicken. Du musst bei GitHub angemeldet sein.
2. Die Adresse deines Repositories einfügen, z. B. `https://github.com/octocat/hello-world`. Alles andere kann so bleiben.
3. Das Häkchen beim Hinweis setzen und auf **Create** klicken.
4. Nach etwa 1 bis 2 Minuten steht dein Bericht als Kommentar darunter. GitHub benachrichtigt dich zusätzlich per E-Mail.

**Das bekommst du:**

- eine Kurzfassung in einfachen Worten: Wo steht das Projekt, was ist schon gut?
- fünf Aufgaben, sortiert nach Wirkung und Aufwand, jede mit Klick-für-Klick-Anleitung für die GitHub-Webseite,
- Vorlagen zum Kopieren und Direktlinks wie „README bearbeiten“ oder „Datei mit Vorlage anlegen“,
- kurze Erklärungen der Fachbegriffe und für jeden Befund einen Beleg (Datei, Zeile, Ausschnitt).

[Beispielbericht ansehen](docs/examples/web-app/audit.md)

**Gut zu wissen:** Es funktioniert nur mit öffentlichen Repositories. RepoLaunch liest nur und führt keinen Code aus: Gelesen wird über die GitHub-API, bei Webprodukten zusätzlich einmal die im Repository angegebene Website (ein Abruf, ohne JavaScript, ohne Unterseiten). Anfrage und Bericht sind öffentlich sichtbar. Pro Person sind 3 Analysen pro Stunde möglich. Diese Variante nutzt keine KI.

**English:** [Analyse a repository now](https://github.com/ghostfanman/repolaunch/issues/new?template=repolaunch-audit.yml). Paste your repository address, choose “en – English” as report language and click **Create**. The report arrives as a comment within about two minutes.

---

Arbeitstitel; Marken-, Domain- und Repository-Verfügbarkeit sind nicht geprüft.

RepoLaunch analysiert ein öffentliches GitHub-Repository mit reinem Lesezugriff und liefert:

- einen nachvollziehbaren Audit in vier Bereichen (Verständnis, Nutzbarkeit, Vertrauen, Verbreitung und Vermarktung),
- fünf priorisierte Aufgaben mit Belegen (Datei, Zeilen, Ausschnitt, Commit-Link), Aufwand und erwarteter Wirkung als Hypothese,
- eine regelbasierte Einordnung möglicher Einnahmewege und einen 30-Tage-Plan,
- optional ein KI-Launch-Paket (README-Entwurf, Beschreibung und Topics, Plan, Launch-Texte, drei Monetarisierungsoptionen, Landingpage-Entwurf), erst nach ausdrücklicher Zustimmung,
- einen ZIP-Export (`audit.json`, `audit.md`, `README.suggested.md`, `launch-plan.md`, `monetization-plan.md`, `marketing-drafts.md`), der nur tatsächlich erzeugte Dateien enthält.

RepoLaunch verspricht keine Rankings, Trending-Platzierungen, Sterne oder Umsätze. Der angezeigte Score ist ein interner Bereitschaftsscore dieses Werkzeugs; Sterne fließen nicht ein.

## Für Maintainer: Audit über Actions, optional mit KI-Paket

Das Issue-Formular oben steht allen offen und nutzt keine KI. Für Personen mit Schreibrechten gibt es zusätzlich den Workflow mit KI-Paket:

1. Im Repository den Reiter **Actions** öffnen und links **RepoLaunch: Repository analysieren** wählen.
2. **Run workflow** klicken, das Formular ausfüllen (Repository, Ziel, Sprache, optional Projekttyp, Zielgruppe, Merkmale) und starten.
3. Nach etwa einer Minute den Lauf öffnen: Der vollständige Bericht steht in der Zusammenfassung, alle Dateien liegen unten unter **Artifacts** (7 Tage aufbewahrt).

Optional KI-Launch-Paket: einmalig unter **Settings > Secrets and variables > Actions** das Secret `ANTHROPIC_API_KEY` anlegen und im Formular das Häkchen setzen. Ohne Häkchen wird der Schlüssel nicht an den Lauf übergeben. Der Issue-Workflow erhält den Schlüssel nie.

**Sichtbarkeit:** In einem öffentlichen Repository sind Issues, Kommentare, Zusammenfassungen und Artefakte für alle sichtbar. Wer Ergebnisse nicht öffentlich haben möchte, nutzt eine private Kopie des Repositorys und startet den Audit dort über **Actions**.

**Abläufe im Repository:** `.github/ISSUE_TEMPLATE/repolaunch-audit.yml` (Formular), `.github/workflows/repolaunch-issue.yml` (Analyse per Issue, Kommentar, Schließen; höchstens 3 Anfragen pro Person und 30 insgesamt pro Stunde; Erwähnungen und Querverweise im Bericht werden entschärft), `.github/workflows/repolaunch-audit.yml` (Workflow-Formular mit KI-Option).

Lokal ohne Oberfläche: `INPUT_REPO=owner/repo npm run repo-audit`.

## Schnellstart

Voraussetzungen: Node.js 24 LTS (empfohlen) oder Node.js ab 22.13. Keine nativen Abhängigkeiten; SQLite kommt über das eingebaute `node:sqlite`.

```sh
git clone https://github.com/ghostfanman/repolaunch.git
cd repolaunch
npm ci
cp .env.example .env        # optional anpassen
npm run build
npm start                   # http://localhost:3000
```

Entwicklung mit automatischem Neuladen: `npm run dev`.

Mit Beispieldaten ohne GitHub-Zugriff (Demo-Modus, im UI gekennzeichnet) und deterministischem KI-Testadapter:

```sh
REPOLAUNCH_DEMO=1 AI_PROVIDER=fake npm start
```

`npm ci` funktioniert mit npm 10 und 11. Wer Abhängigkeiten neu auflöst (`npm install`), braucht npm 11 (in Node 24 enthalten); npm 10.9 bricht dabei mit einem internen Fehler in der Peer-Auflösung ab.

## Prüfungen

```sh
npm run typecheck
npm run lint
npm test                    # 290 Tests: URL-Validierung, Regeln, unbekannte Daten, Injection, XSS, Limits, Website-Prüfung mit SSRF-Schutz, LLM-Fehler, Exporte, Ende-zu-Ende
npm run build
npm run smoke:browser       # gegen laufenden Server mit REPOLAUNCH_DEMO=1 AI_PROVIDER=fake (axe-core, WCAG 2.2 A/AA)
npm run smoke:live          # Live-Audit eines öffentlichen Repositorys, Standard: ghostfanman/invoice-kit (nur lesend)
npm run examples            # erzeugt docs/examples neu
```

Für den Browser-Smoke-Test die Limits anheben, sonst greift die Ratenbegrenzung bei wiederholten Läufen: `RATE_LIMIT_JOBS_PER_HOUR=200 RATE_LIMIT_AI_PER_HOUR=100`. Chromium-Pfad über `CHROMIUM_PATH`.

## Ablauf

1. Repository als `owner/repo` oder `https://github.com/owner/repo` eingeben, Ziel wählen (mehr Nutzer, Mitwirkende, Sponsoren, Supportkunden, SaaS-Kunden), optional Zielgruppe, bekannte Merkmale und Projekttyp.
2. Der Server legt einen Auftrag an und gibt einen geheimen Link zurück (`/report/<id>#k=<schlüssel>`). Der Schlüssel steht im URL-Fragment und wird nie an Server-Logs übertragen; Anfragen senden ihn als `Authorization: Bearer`.
3. Ein einzelner Worker erfasst seriell höchstens 24 Anfragen, 1,5 MB und 30 Sekunden gegen `api.github.com`. Bei Webprodukten folgt ein einzelner lesender Abruf der Website aus dem Website-Feld (8 Sekunden, höchstens 1 MB entpacktes HTML, höchstens drei Weiterleitungen, nur öffentliche Adressen). Danach bewertet er 33 Regeln und speichert das Ergebnis mit Commit-SHA, Analysezeit und Regelwerksversion.
4. Optional: KI-Paket. Vorher zeigt die Seite Anbieter, Modell, Empfänger-Host, jede übermittelte Inhaltsgruppe mit Zeichenzahl, entfernte Injection-Zeilen, Grenzen und Kostenbudget. Erst nach Zustimmung startet der Auftrag.
5. Export als ZIP, Löschen jederzeit über den Link. Nach `JOB_TTL_HOURS` (Standard 72) wird automatisch gelöscht.

## Konfiguration

Alle Einstellungen über Umgebungsvariablen, siehe [.env.example](.env.example). Wichtig:

| Variable | Zweck |
| --- | --- |
| `REPOLAUNCH_DATA_DIR` | Verzeichnis für die SQLite-Datenbank (persistent, sichern) |
| `GITHUB_TOKEN` | optional, ohne Scopes; nur für höhere Ratenlimits bei öffentlichen Repositories |
| `AI_PROVIDER` | `none` (Standard ohne Schlüssel), `anthropic` oder `fake` |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | nur serverseitig; Standardmodell `claude-opus-5-5` |
| `AI_MAX_COST_USD`, `AI_MAX_OUTPUT_TOKENS`, `AI_TIMEOUT_MS`, `AI_MAX_INPUT_CHARS` | Budget und Grenzen je Auftrag |
| `TRUST_PROXY_HOPS` | Anzahl vertrauenswürdiger Reverse Proxys für die Ratenbegrenzung pro Client |
| `REPOLAUNCH_RULES_CONFIG` | JSON mit Regel-Überschreibungen, Beispiel in [rules.example.json](rules.example.json) |
| `NODE_USE_ENV_PROXY=1` | ausgehende Anfragen an die GitHub-API über `HTTPS_PROXY` (Node ab 22.21 bzw. 24.5); der Website-Abruf nutzt keinen Proxy |
| `REPOLAUNCH_SITE_CHECK` | `0` schaltet den lesenden Abruf der Website ab; die Website-Regeln gelten dann als unbekannt (Standard an) |

## Grenzen des MVP

- Nur öffentliche Repositories, keine GitHub-Schreibrechte, keine GitHub App, keine Pull Requests.
- Kein rekursiver Scan: Wurzelverzeichnis plus höchstens zwei Unterverzeichnisse (`.github`, `docs`), höchstens acht kleine Textdateien. Was nicht gelesen wurde, gilt als "unbekannt", nicht als "fehlt".
- GitHub beantwortet private und nicht existierende Repositories öffentlich gleich (404). RepoLaunch sagt das so.
- Ob ein Paket tatsächlich in einem Register veröffentlicht ist, wird nicht extern geprüft (nur Links in der README).
- Die Website wird nur als ausgeliefertes HTML gelesen. Inhalte, die erst per JavaScript entstehen, sieht RepoLaunch nicht; ohne Links im HTML gelten Impressum und Datenschutz deshalb als unbekannt. Impressum und Datenschutz sind Hinweise, keine Rechtsberatung.
- Ein einzelner Prozess mit In-Memory-Ratenbegrenzung. Nicht für serverlose Plattformen oder mehrere Instanzen gedacht.
- Ohne `GITHUB_TOKEN` gilt GitHubs Limit von 60 Anfragen pro Stunde und IP (etwa fünf bis acht Audits).
- Keine Abrechnung, kein Konto, kein Verlauf über die Aufbewahrungsfrist hinaus.
- Keine Rechtsberatung. Lizenzhinweise beruhen auf GitHubs Lizenzerkennung.

## Dokumentation

- [Ist-Analyse und Arbeitsplan](docs/ist-analyse.md)
- [Architektur und Entscheidungen](docs/architecture.md)
- [Bedrohungsmodell](docs/threat-model.md)
- [Datenaufbewahrung](docs/data-retention.md)
- [Validierungsplan](docs/validation-plan.md)
- [Betrieb mit Docker oder auf einem VPS](docs/operations.md)
- [Roadmap (nur Architektur)](docs/roadmap.md)
- [Bestandene Prüfungen und Blocker](docs/checks.md)
- [Regelwerk, Versionen und Gewichtung](docs/regelwerk.md)
- Beispielberichte: [CLI-Tool](docs/examples/cli-tool/audit.md), [Webprodukt](docs/examples/web-app/audit.md)

## Maintainer

Emanuele ([@ghostfanman](https://github.com/ghostfanman)), entwickelt zusammen mit Claude Code.

## Lizenz

Der Audit-Kern und dieses Repository stehen unter der [MIT-Lizenz](LICENSE). Siehe auch [CONTRIBUTING.md](CONTRIBUTING.md) und [SECURITY.md](SECURITY.md).
