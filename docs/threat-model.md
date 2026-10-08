# Bedrohungsmodell

## Schützenswerte Güter

- Server-Geheimnisse: `ANTHROPIC_API_KEY`, optional `GITHUB_TOKEN`.
- Ergebnisse anonymer Nutzer (Audit, Nutzerangaben, KI-Entwürfe) und deren Zugriffsschlüssel.
- Verfügbarkeit des Dienstes und Kostenbudget beim KI-Anbieter.
- Integrität fremder Repositories (RepoLaunch darf sie nie verändern).
- Vertrauen in die Ergebnisse (keine erfundenen Belege oder Versprechen).

## Angreifer und Annahmen

- Anonyme Internetnutzer ohne Konto.
- Autoren analysierter Repositories, die README, Beschreibung oder Dateien manipulieren (Prompt Injection, HTML, Steuerzeichen, riesige Dateien).
- Ein kompromittierter oder fehlerhafter KI-Anbieter, der beliebigen Text liefert.
- Der Betreiber ist vertrauenswürdig; der Server läuft hinter einem TLS-terminierenden Reverse Proxy.

## Bedrohungen und Maßnahmen

| Bedrohung | Maßnahme | Prüfung |
| --- | --- | --- |
| SSRF über die Repository-Eingabe | Nur `owner/repo` oder `https://github.com/owner/repo`; ASCII, keine Zugangsdaten, kein Port, keine Pfade; Anfragen nur an `https://api.github.com` mit festen Pfadmustern | `test/repo-input.test.ts`, `test/github-http.test.ts` |
| Weiterleitung auf fremde Hosts oder Metadaten-IPs | Redirects nur auf `api.github.com`, höchstens zwei, `redirect: "manual"`; `download_url` wird nie verwendet | `test/github-http.test.ts` |
| Ressourcenerschöpfung durch große Repositories | Budgets für Anfragen, Bytes je Antwort und gesamt, Laufzeit, Dateianzahl, Unterverzeichnisse; Streaming-Abbruch | `test/github-http.test.ts`, `test/collector.test.ts` |
| Ausführung fremden Codes | Es wird nichts installiert oder ausgeführt; Manifeste werden textuell gelesen | Code-Review, keine `child_process`-Nutzung in `src/` |
| Missbrauch der GitHub-Ratenlimits | Serielle Anfragen, ETag-Cache, Retry-After nur bis 5 s, danach ehrlicher Abbruch; Limits pro Client | `test/github-http.test.ts` |
| Aufzählen oder Erraten von Ergebnissen | 256-Bit-Schlüssel, Hash in der Datenbank, Vergleich in konstanter Zeit, keine Listen, `noindex`, Lese-Ratenlimit | `test/jobs.test.ts` |
| Schlüssel in Logs, Referrern oder Verläufen | Schlüssel nur im URL-Fragment und im Authorization-Header; `Referrer-Policy: no-referrer`; Logger verwirft Felder mit Schlüsselbegriffen | `src/server/log.ts`, Browser-Smoke-Test |
| XSS über Repository- oder KI-Inhalte | Nur Textdarstellung in React, kein `dangerouslySetInnerHTML` (ESLint-Regel), Links nur zu github.com; Exporte: Roh-HTML maskiert, gefährliche Link-Schemata entfernt, Ausschnitte in Codeblöcken mit sicherer Zaunlänge | `test/security.test.ts`, `test/e2e.test.ts` |
| Prompt Injection | Repository-Inhalte als untrusted markiert; auffällige Zeilen vor dem Senden entfernt und im Bericht ausgewiesen; Systemprompt verbietet Befolgen; keine Werkzeuge für das Modell; Ausgabe nur über striktes Schema | `test/security.test.ts`, `test/ai.test.ts` |
| Geheimnisabfluss über KI-Ausgaben | Schwärzung bekannter Muster und konfigurierter Serverwerte in allen Ausgaben | `test/ai.test.ts`, `test/security.test.ts` |
| Erfundene Befehle, Pfade, Benchmarks, Testimonials | Prüfung gegen README und Manifeste; ungeprüfte Stellen werden im Entwurf und in Prüfhinweisen markiert | `test/ai.test.ts` |
| Kostenexplosion beim KI-Anbieter | Zustimmung pro Auftrag, Budget je Auftrag inklusive Fallback-Worst-Case, Ausgabegrenze, Zeitlimit, höchstens zwei Läufe je Auftrag, KI-Ratenlimit | `test/ai.test.ts`, `test/jobs.test.ts` |
| CSRF auf schreibende Endpunkte | JSON-Pflicht, Origin- und `Sec-Fetch-Site`-Prüfung, Bearer-Schlüssel nötig | Manuell geprüft mit curl |
| Clickjacking | `X-Frame-Options: DENY` | Antwort-Header geprüft |
| Ungewollte Veröffentlichung von Ergebnissen über GitHub Actions | Hinweis im Formular, in README und Datenaufbewahrung: in öffentlichen Repositories sind Lauf-Ergebnisse öffentlich; Läufe nur durch Personen mit Schreibrechten; Secret nur bei gesetztem Häkchen übergeben, GitHub maskiert es in Logs | Dokumentation, Workflow-Datei |
| Missbrauch des offenen Issue-Formulars (Massenanfragen, Erschöpfen des API-Budgets) | Höchstens 3 Anfragen pro Person und 30 insgesamt pro Stunde (frühere Formular-Issues der letzten Stunde); 30 × höchstens 24 Anfragen bleiben unter dem Stundenlimit des Workflow-Tokens; Laufzeit 10 Minuten; nur Ereignis `opened`, keine Bots | `src/cli/issue.ts`, `.github/workflows/repolaunch-issue.yml`, `test/issue.test.ts` |
| Einschleusung über den Issue-Text | Text nur über Umgebungsvariablen, nie im Skript; nur bekannte Felder werden gelesen und wie im Web-Formular geprüft; kein Secret im Issue-Workflow, Token nur `contents: read` und `issues: write` | Workflow-Datei, `test/issue.test.ts` |
| Benachrichtigungs-Spam über den Bericht (Erwähnungen, Querverweise aus fremden Repositories) | @Erwähnungen, #Nummern, GH-Nummern und Links auf fremde Issues werden außerhalb von Codeblöcken mit einem unsichtbaren Wortverbinder getrennt | `neutralizeGitHubRefs`, Tests |
| Irreführende Anleitungen | Anleitungen sind feste Texte im Code, Links nur auf github.com und docs.github.com, Vorlagen nur mit Platzhaltern in eckigen Klammern; keine erfundenen Befehle, Funktionen oder Lizenzempfehlungen | `src/core/rules/guides.ts`, `test/guides.test.ts` |
| Trojan-Source und Steuerzeichen | Steuerzeichen und Bidi-Overrides werden entfernt, Eingabe ist ASCII | `test/security.test.ts` |
| Gefälschtes X-Forwarded-For | Nur mit `TRUST_PROXY_HOPS` > 0 ausgewertet, sonst gemeinsames Limit | `test/jobs.test.ts` |

## Restrisiken

- Heuristische Injection- und Behauptungserkennung ist nicht vollständig. Deshalb bleibt die Ausgabe ein Entwurf mit Prüfpflicht.
- In-Memory-Ratenbegrenzung gilt nur für einen Prozess und wird beim Neustart zurückgesetzt.
- Ohne vertrauenswürdigen Proxy teilen sich alle Clients ein Limit; ein einzelner Nutzer kann andere ausbremsen.
- Der KI-Anbieter verarbeitet die offengelegten öffentlichen Inhalte nach seinen eigenen Bedingungen.
- `node:sqlite` ist in Node 22 und 24 noch als experimentell gekennzeichnet.
