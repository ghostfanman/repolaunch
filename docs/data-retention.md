# Datenaufbewahrung

## Was gespeichert wird

| Daten | Ort | Dauer |
| --- | --- | --- |
| Auftrag: Eingabe (Repository, Ziel, Sprache, optionale Zielgruppe und Merkmale), Status, Ereignisse | SQLite `jobs`, `job_events` | bis Ablauf (`JOB_TTL_HOURS`, Standard 72 Stunden) oder Löschung |
| Schnappschuss: öffentliche Metadaten, Dateiliste, README und ausgewählte Textdateien (begrenzt) | SQLite `jobs.snapshot_json` | wie oben |
| Website-Prüfung (nur Webprodukte): Adresse, Status, Weiterleitungen, Größe sowie aus dem HTML Titel, Meta-Beschreibung, og:image-Adresse und gefundene Links zu Impressum und Datenschutz mit Zeilennummer; nicht das HTML selbst | SQLite `jobs.snapshot_json` | wie oben |
| Audit-Ergebnis und KI-Ergebnis | SQLite `jobs.audit_json`, `jobs.ai_result_json` | wie oben |
| Zugriffsschlüssel | nur als SHA-256-Hash | wie oben |
| ETag-Cache öffentlicher GitHub-Antworten | SQLite `http_cache` | höchstens 24 Stunden |
| Ratenbegrenzung | Arbeitsspeicher des Prozesses | bis Fensterende oder Neustart |

Nicht gespeichert werden: Konten, E-Mail-Adressen, IP-Adressen in der Datenbank, Cookies, Tracking-Daten, Klartext-Schlüssel.

## Löschung

- Jederzeit über den Ergebnislink ("Ergebnis jetzt löschen" oder `DELETE /api/jobs/:id` mit Schlüssel). Ereignisse werden mitgelöscht.
- Automatisch: Der Worker löscht alle zehn Minuten abgelaufene Aufträge und alte Cache-Einträge. Abgelaufene Aufträge sind schon vor der physischen Löschung nicht mehr abrufbar.
- SQLite gibt Speicherplatz nicht sofort frei. Für eine sofortige Bereinigung der Datei: `sqlite3 data/repolaunch.sqlite "VACUUM;"` bei gestopptem Dienst.
- Backups (siehe [operations.md](operations.md)) enthalten Daten bis zu ihrer eigenen Löschung. Backup-Aufbewahrung daher kurz halten, Empfehlung höchstens 7 Tage.

## Logs

Strukturierte JSON-Logs auf stdout enthalten Zeit, Ereignis, Auftrags-ID, Pfadmuster der GitHub-API (ohne Owner und Repo), Status, Dauer und Fehlercodes. Keine Schlüssel, Tokens, Inhalte oder Nutzerangaben. Die Aufbewahrung der Logs bestimmt der Betreiber.

## KI-Verarbeitung

Nur nach ausdrücklicher Zustimmung im Ergebnis. Übermittelt werden genau die vorher angezeigten Inhaltsgruppen an den angezeigten Anbieter (Standard: Anthropic, `api.anthropic.com`). Dort gelten dessen Bedingungen zur Datenverarbeitung.

## Analyse per Issue (für alle)

Für den Hinweis zur Vergleichbarkeit liest der Workflow zusätzlich die letzten 100 Issues dieses Repositorys und von höchstens drei früheren Anfragen zum selben Repository die Kommentare. Verwendet werden nur Regelwerk, Score, Commit und Datum aus Berichten von `github-actions[bot]`; gespeichert wird davon nichts. In der Web-App werden Aufträge verschiedener Personen nie miteinander verglichen.

Wer das Issue-Formular nutzt, veröffentlicht die Anfrage als Issue. RepoLaunch selbst speichert nichts: Der Workflow schreibt den Bericht als Kommentar, schließt das Issue und lädt die Dateien als Artefakt hoch (7 Tage). Issue und Kommentar bleiben öffentlich, bis die Person mit Schreibrechten sie löscht oder sperrt. Das Formular weist vor dem Absenden darauf hin und verlangt eine Bestätigung. Für die Grenzen pro Stunde liest der Workflow nur die Issues der letzten Stunde (Nummer, Zeit, Autor, Text) und speichert sie nicht.

## Audit per GitHub Actions

Beim Workflow "RepoLaunch: Repository analysieren" speichert RepoLaunch selbst nichts. GitHub bewahrt den Lauf auf: die Zusammenfassung mit dem Bericht nach den Log-Einstellungen des Repositorys, die Artefakte 7 Tage. In öffentlichen Repositories sind beide für alle sichtbar. Der Repository-Owner kann einzelne Läufe unter **Actions** löschen. Wer Ergebnisse nicht öffentlich haben möchte, nutzt eine private Kopie des Repositorys.

## Pilotdaten

Für den Validierungsplan werden Pilotaufzeichnungen manuell und anonymisiert außerhalb der Anwendung geführt, siehe [validation-plan.md](validation-plan.md).
