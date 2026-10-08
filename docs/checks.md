# Bestandene Prüfungen und verbleibende Blocker

Entwickelt bis 7. Oktober 2026 als Unterprojekt in `ghostfanman/invoice-kit` (Branch `claude/new-session-5blm3j`). Umzug in das eigene Repository `ghostfanman/repolaunch` am 8. Oktober 2026, per `git subtree split` samt Historie. Vor der Veröffentlichung wurde die gesamte Historie auf Geheimnisse geprüft; gefunden wurden nur offensichtliche Test-Platzhalter. Alle Prüfungen lokal in der Entwicklungsumgebung (Node 22.22, npm 10.9 und 11.21) ausgeführt.

## Eigenständiger Checkout (Probelauf für den Umzug)

| Prüfung | Ergebnis |
| --- | --- |
| `npm ci` aus dem Lockfile | 383 Pakete installiert |
| `npm run typecheck`, `npm run lint` | ohne Fehler |
| `npm test` | 124 von 124 Tests bestanden |
| `npm run build` | erfolgreich |
| Browser-Smoke-Test | 18 von 18 Prüfungen bestanden |
| Audit direkt auf GitHub (`.github/workflows/repolaunch-audit.yml`, `npm run repo-audit`) | 12 eigene Tests (Eingaben, Fehler, KI ohne Schlüssel, KI mit Testadapter, KI-Fehler); Probelauf gegen `ghostfanman/invoice-kit` mit Zusammenfassung und Ausgabedateien wie auf dem Runner |
| Analyse per Issue für alle (`.github/ISSUE_TEMPLATE/repolaunch-audit.yml`, `.github/workflows/repolaunch-issue.yml`) | 16 eigene Tests: Formular und Workflow passen zum Code, Bericht als Kommentar, Schließen, Englisch, häufige Kopierformen der Adresse, verständliche Hilfe bei Fehlern, Grenzen pro Person und insgesamt, Ausnahme für Verwalter, entschärfte Erwähnungen, Kürzung, feste API-Adressen |
| Einsteigerfreundlicher Bericht | 6 eigene Tests: Anleitung für jede Regel in beiden Sprachen, Links nur auf GitHub, Vorlagen ohne erfundene Befehle, vorausgefüllte Datei-Links, Kurzfassung vor den Details, Score in Worten ohne Erfolgsversprechen; 10 Tests für das Erkennen kopierter Adressen; Browser-Smoke mit axe ohne Verstöße auf der Ergebnisseite |
| Regelwerk 2026.10.1: Demo-Erkennung (`usability.visual_demo@2`) | 6 Tests: Link auf Website-Feld (Groß-/Kleinschreibung, Protokoll, Schrägstrich, Unterpfade, Query), ähnliche Präfixe zählen nicht, GitHub Pages des Besitzers ja, fremde nein, Bild und Aufnahme erfüllt, Teilgutschrift in Score und Kategorie, gleiche Zeile wie `distribution.next_step` |
| Regelwerk 2026.10.1: Gewichte | 3 Tests: Mitwirkenden-Regeln für webapp mit Ziel users nicht relevant, Sicherheitsrichtlinie bewertet; `comboWeights` ändern genau drei Kombinationen, alle übrigen effektiven Gewichte unverändert; Überschreibungen validiert; 30-Tage-Plan "Erstes/Nächstes Release" nach Daten |
| Website-Prüfung (`src/core/site`, `test/site.test.ts`) | 65 Tests gegen einen lokalen Testserver, nie gegen das echte Netz: Adressschutz für IPv4/IPv6 einschließlich eingebetteter IPv4, Metadaten-IP und Zonen-IDs; Weiterleitung auf private Adresse, Loopback-Literal, Metadaten-IP, IPv6-Loopback und fremdes Schema abgelehnt, ohne zweite Verbindung; Standardrichtlinie verbindet weder zu 127.0.0.1 noch zu localhost; höchstens drei Weiterleitungen; Zeitlimit; zu große Antwort mit und ohne Content-Length; gzip-Bombe; HTML-Auswertung mit Zeilen; Regeln für vollständige, lückenhafte, nicht erreichbare und reine JavaScript-Seiten; nur Webprodukte |
| Hinweis auf abgeschaltete Regeln | 4 Tests: Ziele bei gleichem Projekttyp, sonst Projekttypen, auf Englisch, nicht bei per Konfiguration abgeschalteten Regeln |
| Fall invoice-kit (Issue #2, `test/invoice-kit.test.ts`) | 6 Tests auf einer Fixture mit README, Dateiliste und Startseite von invoice-kit: Demo-Link Zeile 5 erkannt, keine Mitwirkenden-Aufgaben, Website-Befunde, Score 40 / 47 = 85. Das alte Regelwerk 2026.10.0 ergibt auf derselben Fixture 79 (31 / 39) und dieselben fünf Aufgaben wie der Bericht in Issue #2 |
| Regelwerk 2026.10.2: Reihenfolge der Aufgaben | 3 Tests: Webprodukt mit gleicher Schwere zuerst Website-Befunde, Schwere bleibt erstes Kriterium; deterministisch bei umgekehrter Eingabe; für alle Fixtures, Ziele und Projekttypen außer Webprodukt identisch mit 2026.10.1 |
| Regelwerk 2026.10.2: Vergleichbarkeit | 6 Tests: Version neben dem Score und fester Hinweis; frühere Berichte aus Vermerk und sichtbarem Text (zusätzlich am echten Bericht aus Issue #4 geprüft); Satz bei anderem Regelwerk und gleichem Commit; nur Kommentare von github-actions[bot] und nur dasselbe Repository; Fehler bei der Suche stoppen den Audit nicht |
| Regelwerk 2026.10.2: Größe, Abschneiden, Zähler, Umfang | Lokaler Testserver: komprimierte Antwort mit abweichender entpackter Größe, Antworten über dem Limit (mit und ohne Content-Length) werden abgeschnitten und markiert, gzip-Bombe mit wenig übertragenen Bytes, abgeschnittenes HTML ergibt "unbekannt" statt "fehlt", Weiterleitungen als eigene Abrufe gezählt, gesperrte Adresse ohne Abruf; Hinweis auf genau eine geprüfte Seite und ungeprüfte README-Links; invoice-kit-Fixture mit der echten Startseite (23807 B entpackt, 7643 B gzip) |
| Workflow `.github/workflows/ci.yml` | übernommen aus dem Ursprungsrepository, ohne Pfadfilter und Unterverzeichnis |

## Bestanden (im Ursprungsrepository, 7. Oktober 2026)

| Prüfung | Ergebnis |
| --- | --- |
| `npm run typecheck` | ohne Fehler, auch ohne `.next` und `next-env.d.ts` (frischer Checkout) |
| `npm run lint` (ESLint 10, eslint-config-next 16.4) | 0 Probleme |
| `npm test` (Vitest) | 124 von 124 Tests bestanden, 8 Testdateien |
| `npm run build` (Next.js 16.4, Turbopack) | erfolgreich, ohne Warnungen |
| Browser-Smoke-Test (`npm run smoke:browser`, Chromium, axe-core 4.11) | 18 von 18 Prüfungen: Startseite DE und EN, Feldfehler, Demo-Audit, fünf Aufgaben, Score-Hinweis, KI-Start ohne Zustimmung gesperrt, KI mit Testadapter, ZIP mit sechs Dateien, Schlüssel bleibt im Fragment, keine horizontale Scrollleiste bei 360 px, Löschen, Zustand ohne Schlüssel; axe ohne Verstöße (WCAG 2.0, 2.1, 2.2 A/AA) auf Start- und Ergebnisseite |
| Live-Smoke-Test (`npm run smoke:live`) | `ghostfanman/invoice-kit` @ `f288a59` analysiert: 9 GET-Anfragen, 28,5 KB, 5 belegte Aufgaben, Export erzeugt; keine schreibenden Anfragen |
| Frischer Checkout nach README | `git clone`, `npm ci`, `.env` aus Vorlage, `npm run build`, `npm start`: Live-Audit (Ziel Mitwirkende, Bericht auf Englisch, 10 Anfragen) abgeschlossen, KI ehrlich als nicht konfiguriert gemeldet, ZIP mit vier Dateien, Demo-Modus standardmäßig gesperrt |
| API mit curl | Fehlercodes für ungültige Eingabe, falschen Schlüssel (404), fehlende Zustimmung, Cross-Origin-POST (403); `X-Robots-Tag`, `Referrer-Policy`, `X-Frame-Options` gesetzt |
| Docker | Image baut (386 MB), Container läuft als `node`, Healthcheck grün, Ergebnis übersteht Neustart im gemounteten `/data`, `scripts/backup.mjs` im Container mit `integrity_check=ok` |
| Ursprungsprojekt Invoice Kit | `node --test test/*.test.js` 42 von 42, `node test/static-check.mjs` bestanden (prüft auch die neuen Markdown- und JS-Dateien auf Syntax und Gedankenstriche) |
| GitHub Actions im Ursprungsrepository (`04b2511`) | Workflow "RepoLaunch" (Lockfile, Typprüfung, Lint, Tests, Build, Browser-Smoke-Test mit `google-chrome`) erfolgreich; bestehender Workflow "Validierung" von Invoice Kit ebenfalls erfolgreich |
| Beispielberichte | `npm run examples` erzeugt `docs/examples/cli-tool` und `docs/examples/web-app` reproduzierbar |

## Verbleibende Blocker und Einschränkungen

1. **Kein echter Anthropic-API-Schlüssel in dieser Umgebung.** Die Anthropic-Integration ist gegen eine simulierte API getestet (offizielles SDK mit eingespeistem `fetch`: Anfrageform mit Modell, Effort, strukturierter Ausgabe, Fallback-Header; Fehlerabbildung für Ablehnung, Abschneiden, 429, 401, 500, ungültige Ausgabe). Ein Lauf gegen die echte API steht aus: `AI_PROVIDER=anthropic ANTHROPIC_API_KEY=... npm start`, dann im Ergebnis zustimmen und Kosten im Export mit der Abrechnung abgleichen.
2. **Docker-Build in dieser Umgebung nur mit Proxy-Zertifikat.** Die Sandbox fängt TLS ab; verifiziert wurde mit einer lokalen Variante, die das Proxy-CA nur als Build-Secret an `npm ci` übergibt. Das eingecheckte Dockerfile ist unverändert und für normale Netze gedacht. Das Basis-Image ist nicht per Digest fixiert.
3. **GitHub-Ratenlimit ohne Token.** Direkte, nicht authentifizierte Anfragen aus dieser Umgebung waren wegen geteilter IP bereits limitiert (60 pro Stunde); RepoLaunch meldet das korrekt als `rate_limited`. Live-Tests liefen über den Umgebungsproxy (`NODE_USE_ENV_PROXY=1`). Für den Betrieb wird ein `GITHUB_TOKEN` ohne Scopes empfohlen.
4. **Barrierefreiheit.** Automatisierte axe-Prüfung und Tastaturpfade sind grün; ein manueller Test mit Screenreader und eine vollständige WCAG-2.2-AA-Bewertung stehen aus.
5. **`node:sqlite`** ist in Node 22 und 24 als experimentell gekennzeichnet und gibt beim Start eine Warnung aus.
6. **ESLint 10:** `eslint-config-next` 16.4 zieht Plugins mit Peer-Bereich bis ESLint 9; npm meldet Peer-Warnungen, die Prüfung läuft dennoch fehlerfrei.
7. **Nicht durchgeführt:** Pilotphase des Validierungsplans, Marken-, Domain- und Namensprüfung für "RepoLaunch", Veröffentlichung oder Deployment.
