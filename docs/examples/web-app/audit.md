# RepoLaunch-Audit: repolaunch-fixtures/web-app

> Demo-Modus: Diese Daten stammen aus erfundenen Fixtures, nicht von GitHub.

- Repository: [repolaunch-fixtures/web-app](https://github.com/repolaunch-fixtures/web-app)
- Analysierter Commit: `2222222222222222222222222222222222222222` (Default-Branch `main`)
- Analysezeit: 2026-10-07T12:00:00.000Z

## Das Wichtigste in Kürze

**36 von 100 Punkten.** Am Anfang: Wichtige Grundlagen fehlen noch. Die Aufgaben unten bringen am meisten.

- Projekttyp: Webprodukt / SaaS
- Ziel: SaaS-Kunden

**Das ist schon gut:** README vorhanden, Lizenzinformation, Erkennbarer Wartungsstatus, Klarer nächster Schritt oben in der README

> So nutzt du diesen Bericht: Arbeite die Aufgaben unten der Reihe nach ab. Jede hat eine Klick-für-Klick-Anleitung für die GitHub-Webseite, ein Terminal brauchst du nicht. Für die meisten Schritte brauchst du Schreibrechte am Repository. Lass danach einfach erneut analysieren, um den Fortschritt zu sehen.

## Fünf priorisierte Aufgaben

### 1. Website im About-Bereich eintragen

**Warum:** Das Website-Feld erscheint prominent neben der Beschreibung und führt zu Demo, Doku oder Produktseite.

**Aufgabe:** Trage im Repository unter "About" eine Website ein (Demo, Doku oder Produktseite).

Aufwand: 2 bis 10 Min. · Wichtigkeit: hoch

**So geht's:**

1. Öffne die Startseite deines Repositories: [Repository öffnen](https://github.com/repolaunch-fixtures/web-app)
2. Klicke rechts neben der Überschrift „About“ auf das Zahnrad-Symbol (⚙).
3. Trage im Feld „Website“ die Adresse deiner Demo, Doku oder Produktseite ein.
4. Klicke auf „Save changes“. Die Änderung ist sofort sichtbar.

> Hinweis: Noch keine Website? GitHub Pages ist kostenlos (Einstellungen → „Pages“). Sonst das Feld leer lassen, bis es eine passende Seite gibt.

Erwartete Wirkung (Hypothese): Mehr Besuche der Demo- oder Produktseite.

Prüfregel und Belege: Website-Feld gesetzt (`distribution.homepage@1`), siehe „Alle Befunde“.

### 2. Beschreibung in einem Satz formulieren

**Warum:** Die Beschreibung erscheint in Suchergebnissen, Vorschauen und Listen. Sie ist oft der erste Kontakt. Beschreibung ist sehr kurz oder wiederholt nur den Namen.

**Aufgabe:** Formuliere die Beschreibung als einen Satz: Was ist das Projekt, für wen, welcher Nutzen.

Aufwand: 5 bis 15 Min. · Wichtigkeit: hoch

**So geht's:**

1. Öffne die Startseite deines Repositories: [Repository öffnen](https://github.com/repolaunch-fixtures/web-app)
2. Klicke rechts neben der Überschrift „About“ auf das Zahnrad-Symbol (⚙).
3. Trage im Feld „Description“ einen Satz nach der Vorlage unten ein.
4. Klicke auf „Save changes“. Die Änderung ist sofort sichtbar.

Satzbaustein (Platzhalter ersetzen):

```text
web-app ist ein [Art: z. B. Kommandozeilen-Werkzeug, Bibliothek, Web-App] für [Zielgruppe], das [konkreter Nutzen].
```

> Hinweis: Gut sind 60 bis 160 Zeichen. Nenne Nutzen statt Technik.

Erwartete Wirkung (Hypothese): Besucher erkennen schneller, ob das Projekt zu ihrem Problem passt.

Prüfregel und Belege: Aussagekräftige Repository-Beschreibung (`understanding.description@1`), siehe „Alle Befunde“.

### 3. Sicherheitsrichtlinie mit Meldeweg anlegen

**Warum:** Eine SECURITY.md sagt, wie Schwachstellen vertraulich gemeldet werden. Für Unternehmen ist das oft ein Prüfpunkt.

**Aufgabe:** Lege SECURITY.md an: Meldeweg (z. B. private Sicherheitsmeldung über GitHub), unterstützte Versionen, Reaktionszeit ohne Garantie.

Aufwand: 15 bis 30 Min. · Wichtigkeit: hoch

**So geht's:**

1. Schalte zuerst vertrauliche Meldungen ein: Einstellungen → „Advanced Security“ (je nach Ansicht „Code security“) → bei „Private vulnerability reporting“ auf „Enable“ klicken. [Sicherheitseinstellungen](https://github.com/repolaunch-fixtures/web-app/settings/security_analysis)
2. Öffne die neue Datei SECURITY.md. Die Vorlage ist bereits eingefügt: [SECURITY.md anlegen](https://github.com/repolaunch-fixtures/web-app/new/main?filename=SECURITY.md&value=%23%20Sicherheitsrichtlinie%0A%0A%23%23%20Sicherheitsl%C3%BCcke%20melden%0A%0ABitte%20melde%20Sicherheitsl%C3%BCcken%20nicht%20%C3%B6ffentlich%20als%20Issue%2C%20sondern%20vertraulich%20%C3%BCber%20%5BReport%20a%20vulnerability%5D%28https%3A%2F%2Fgithub.com%2Frepolaunch-fixtures%2Fweb-app%2Fsecurity%2Fadvisories%2Fnew%29.%0A%0A%23%23%20Unterst%C3%BCtzte%20Versionen%0A%0A%7C%20Version%20%7C%20Unterst%C3%BCtzt%20%7C%0A%7C%20---%20%7C%20---%20%7C%0A%7C%20%5Bz.%20B.%201.x%5D%20%7C%20ja%20%7C%0A%7C%20%5B%C3%A4ltere%20Versionen%5D%20%7C%20nein%20%7C%0A%0A%23%23%20Reaktionszeit%0A%0AIch%20bem%C3%BChe%20mich%2C%20innerhalb%20von%20%5BZeitraum%2C%20z.%20B.%2014%20Tagen%5D%20zu%20antworten.%20Das%20ist%20keine%20Garantie.%0A)
3. Ersetze alles in eckigen Klammern \[ \] durch deine eigenen Angaben und lösche, was nicht passt.
4. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

Inhalt der Vorlage:

```markdown
# Sicherheitsrichtlinie

## Sicherheitslücke melden

Bitte melde Sicherheitslücken nicht öffentlich als Issue, sondern vertraulich über [Report a vulnerability](https://github.com/repolaunch-fixtures/web-app/security/advisories/new).

## Unterstützte Versionen

| Version | Unterstützt |
| --- | --- |
| [z. B. 1.x] | ja |
| [ältere Versionen] | nein |

## Reaktionszeit

Ich bemühe mich, innerhalb von [Zeitraum, z. B. 14 Tagen] zu antworten. Das ist keine Garantie.
```

Erwartete Wirkung (Hypothese): Höheres Vertrauen bei professionellen Nutzern.

Prüfregel und Belege: Sicherheitsrichtlinie (`trust.security_policy@1`), siehe „Alle Befunde“.

### 4. Abschnitt „Für wen“ und „Funktionen“ ergänzen

**Warum:** Besucher entscheiden schneller, wenn Funktionen, Anwendungsfälle oder die Zielgruppe ausdrücklich genannt sind.

**Aufgabe:** Ergänze einen Abschnitt "Funktionen" oder "Für wen" mit drei bis fünf konkreten Punkten.

Aufwand: 20 bis 60 Min. · Wichtigkeit: hoch

**So geht's:**

1. Öffne die README im Bearbeitungsmodus: [README bearbeiten](https://github.com/repolaunch-fixtures/web-app/edit/main/README.md)
2. Setze den Cursor unter die Einleitung, vor die Installation.
3. Kopiere die Vorlage unten an diese Stelle und ersetze alles in eckigen Klammern \[ \] durch deine eigenen Angaben.
4. Prüfe das Ergebnis über den Reiter „Preview“ oben im Editor.
5. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

Vorlage zum Kopieren:

```text
## Für wen ist web-app?

- [Zielgruppe 1, z. B. „Teams, die …“]
- [Zielgruppe 2]

## Funktionen

- [Konkrete Funktion 1]
- [Konkrete Funktion 2]
- [Konkrete Funktion 3]
```

> Hinweis: Nenne nur Funktionen, die es wirklich gibt.

Erwartete Wirkung (Hypothese): Passende Nutzer erkennen sich wieder, unpassende Anfragen nehmen ab.

Prüfregel und Belege: Zielgruppe und Nutzen benannt (`understanding.audience@1`), siehe „Alle Befunde“.

### 5. Screenshot oder Demo-Link in die README einfügen

**Warum:** Bei sichtbaren Produkten zeigt ein Bild sofort, was man bekommt. Bei CLIs ist es ein Pluspunkt, kein Muss.

**Aufgabe:** Füge einen aktuellen Screenshot, eine kurze Aufnahme oder einen Demo-Link in die README ein.

Aufwand: 20 bis 60 Min. · Wichtigkeit: hoch

**So geht's:**

1. Mache einen Screenshot deines Projekts (Windows: Win+Umschalt+S, Mac: Cmd+Umschalt+4, Linux: Taste „Druck“).
2. Öffne die README im Bearbeitungsmodus: [README bearbeiten](https://github.com/repolaunch-fixtures/web-app/edit/main/README.md)
3. Klicke unter die Einleitung und ziehe die Bilddatei in das Textfeld. GitHub lädt das Bild hoch und fügt den Link selbst ein.
4. Ersetze den Text in den eckigen Klammern des Bild-Links durch eine kurze Beschreibung, z. B. „Startseite der App“.
5. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

Alternative: Link zu einer Demo:

```text
[Live-Demo ansehen](https://[Adresse deiner Demo])
```

Erwartete Wirkung (Hypothese): Höhere Klickrate auf Demo bzw. Installation, besonders bei Webprodukten.

Prüfregel und Belege: Screenshot, Animation oder Demo (`usability.visual_demo@2`), siehe „Alle Befunde“.

## Begriffe kurz erklärt

- **README**: Die Startseite deines Projekts: die Datei README.md, die GitHub unter der Dateiliste anzeigt.
- **About**: Der Kasten rechts oben auf der Repository-Seite mit Beschreibung, Website und Topics.
- **Commit**: Eine gespeicherte Änderung. „Commit changes“ speichert deine Bearbeitung im Repository.
- **Issue**: Ein Eintrag für Fragen, Fehler oder Ideen im Reiter „Issues“.
- **Markdown**: Die einfache Textformatierung von GitHub: # für Überschriften, - für Listen, [Text](Adresse) für Links.

## Interner Bereitschaftsscore

> Interne Kennzahl dieses Werkzeugs. Kein GitHub- oder Google-Ranking und keine Erfolgswahrscheinlichkeit. Sterne fließen nicht ein.

**36 / 100**, Abdeckung 100 %

Berechnung: Score = Summe der Gewichte erfüllter Regeln (einschließlich Teilgutschriften) / Summe der Gewichte bewerteter Regeln × 100 = 16 / 45 × 100. Unbekannte und nicht relevante Regeln zählen nicht. Abdeckung = bewertete Gewichte / (bewertete + unbekannte Gewichte) = 45 / 45.

| Kategorie | Erfüllt | Bewertet | Unbekannt |
| --- | --- | --- | --- |
| Verständnis | 3 | 12 | 0 |
| Nutzbarkeit | 2 | 8 | 0 |
| Vertrauen | 8 | 14 | 0 |
| Verbreitung und Vermarktung | 3 | 11 | 0 |

- Regelwerk: `2026.10.1`
- API-Anfragen: 7 (0 × 304), 1672 B
- Sterne (nur Anzeige, nicht bewertet): 7

## Alle Befunde

### Verständnis

#### Aussagekräftige Repository-Beschreibung (`understanding.description@1`)

- Status: **fehlt**, Schwere: hoch, Gewicht: 3
- Begründung: Die Beschreibung erscheint in Suchergebnissen, Vorschauen und Listen. Sie ist oft der erste Kontakt. Beschreibung ist sehr kurz oder wiederholt nur den Namen.
- Aufgabe: Formuliere die Beschreibung als einen Satz: Was ist das Projekt, für wen, welcher Nutzen.
- Aufwand: 5 bis 15 Min.
- Erwartete Wirkung (Hypothese): Besucher erkennen schneller, ob das Projekt zu ihrem Problem passt.
- So geht's: siehe Aufgabe 2 oben
- Belege:

  - [GitHub API: description](https://github.com/repolaunch-fixtures/web-app)
  
    ```text
    Shiftboard
    ```
  

#### README vorhanden (`understanding.readme@1`)

- Status: **vorhanden**, Gewicht: 3
- Begründung: Die README ist laut GitHub meist das Erste, was Besucher sehen. Ohne sie fehlt jede Erklärung.
- Belege:

  - [README.md (129 B)](https://github.com/repolaunch-fixtures/web-app/blob/2222222222222222222222222222222222222222/README.md)

#### Einleitender Absatz in der README (`understanding.intro@1`)

- Status: **fehlt**, Schwere: mittel, Gewicht: 2
- Begründung: Ein kurzer Absatz direkt unter dem Titel erklärt Zweck und Nutzen, bevor Details folgen.
- Aufgabe: Schreibe unter den Titel zwei bis drei Sätze: Problem, Lösung, für wen.
- Aufwand: 15 bis 45 Min.
- Erwartete Wirkung (Hypothese): Weniger Absprünge auf der Repository-Seite, weniger Grundsatzfragen in Issues.

  **So geht's:**

  1. Öffne die README im Bearbeitungsmodus: [README bearbeiten](https://github.com/repolaunch-fixtures/web-app/edit/main/README.md)
  2. Setze den Cursor direkt unter die erste Überschrift (die Zeile mit #).
  3. Kopiere die Vorlage unten an diese Stelle und ersetze alles in eckigen Klammern \[ \] durch deine eigenen Angaben.
  4. Prüfe das Ergebnis über den Reiter „Preview“ oben im Editor.
  5. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

  Vorlage zum Kopieren:

  ```text
  web-app hilft [Zielgruppe], [Problem] zu lösen. [Ein Satz, wie es das tut und was danach besser ist.]
  ```

- Belege:

  - [Kurzer Einleitungstext](https://github.com/repolaunch-fixtures/web-app/blob/2222222222222222222222222222222222222222/README.md#L3-L3) (Zeilen 3 bis 3)
  
    ```text
    Shiftboard
    ```
  

#### Zielgruppe und Nutzen benannt (`understanding.audience@1`)

- Status: **fehlt**, Schwere: hoch, Gewicht: 3
- Begründung: Besucher entscheiden schneller, wenn Funktionen, Anwendungsfälle oder die Zielgruppe ausdrücklich genannt sind.
- Aufgabe: Ergänze einen Abschnitt "Funktionen" oder "Für wen" mit drei bis fünf konkreten Punkten.
- Aufwand: 20 bis 60 Min.
- Erwartete Wirkung (Hypothese): Passende Nutzer erkennen sich wieder, unpassende Anfragen nehmen ab.
- So geht's: siehe Aufgabe 4 oben
- Belege:

  - [README.md: keine Überschrift wie Features/Why/Use cases/Funktionen und keine Zielgruppennennung](https://github.com/repolaunch-fixtures/web-app/blob/2222222222222222222222222222222222222222/README.md)

#### Konkretes Nutzungsbeispiel (`understanding.example@1`)

- Status: **fehlt**, Schwere: niedrig, Gewicht: 1
- Begründung: Ein kurzes Beispiel zeigt schneller als jede Beschreibung, wie sich das Projekt anfühlt.
- Aufgabe: Füge ein minimales, lauffähiges Beispiel mit erwarteter Ausgabe hinzu.
- Aufwand: 20 bis 60 Min.
- Erwartete Wirkung (Hypothese): Mehr erfolgreiche erste Nutzungen, weniger Fragen zur Grundbedienung.

  **So geht's:**

  1. Öffne die README im Bearbeitungsmodus: [README bearbeiten](https://github.com/repolaunch-fixtures/web-app/edit/main/README.md)
  2. Setze den Cursor unter den Abschnitt zur Installation.
  3. Kopiere die Vorlage unten an diese Stelle und ersetze alles in eckigen Klammern \[ \] durch deine eigenen Angaben.
  4. Prüfe das Ergebnis über den Reiter „Preview“ oben im Editor.
  5. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

  Vorlage zum Kopieren:

  ````text
  ## Beispiel

  ```
  [Ein kurzer Befehl oder Code, den man direkt ausprobieren kann]
  ```

  Ergebnis:

  ```
  [Was dabei herauskommt]
  ```
  ````

  > Hinweis: Trage nur Befehle ein, die du selbst ausprobiert hast. RepoLaunch erfindet keine Befehle.

- Belege:

  - [README.md: kein Codeblock außer Installationsbefehlen und kein Abschnitt Usage/Example/Verwendung mit Code](https://github.com/repolaunch-fixtures/web-app/blob/2222222222222222222222222222222222222222/README.md)

### Nutzbarkeit

#### Dokumentierter Schnellstart (`usability.quickstart@1`)

- Status: **vorhanden**, Gewicht: 2
- Begründung: Ein klarer erster Schritt (Installation oder Start) ist die Voraussetzung jeder Nutzung.
- Belege:

  - [Abschnitt "Setup"](https://github.com/repolaunch-fixtures/web-app/blob/2222222222222222222222222222222222222222/README.md#L5-L12) (Zeilen 5 bis 12)
  
    ````text
    ## Setup
    
    ```sh
    docker compose up
    ```
    
    Then open http://localhost:8080.
    
    ````
  

#### Voraussetzungen genannt (`usability.prerequisites@1`)

- Status: **fehlt**, Schwere: mittel, Gewicht: 2
- Begründung: Fehlende Angaben zu Laufzeit oder Versionen führen zu fehlgeschlagenen ersten Versuchen.
- Aufgabe: Nenne vor der Installation Laufzeit und Mindestversionen (z. B. Node, Python, Docker).
- Aufwand: 10 bis 20 Min.
- Erwartete Wirkung (Hypothese): Weniger Issues zu Installationsfehlern.

  **So geht's:**

  1. Öffne die README im Bearbeitungsmodus: [README bearbeiten](https://github.com/repolaunch-fixtures/web-app/edit/main/README.md)
  2. Setze den Cursor direkt über den Abschnitt zur Installation.
  3. Kopiere die Vorlage unten an diese Stelle und ersetze alles in eckigen Klammern \[ \] durch deine eigenen Angaben.
  4. Prüfe das Ergebnis über den Reiter „Preview“ oben im Editor.
  5. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

  Vorlage zum Kopieren:

  ```text
  ## Voraussetzungen

  - [Software, z. B. Node.js, Python oder Docker] ab Version [Mindestversion]
  - [Betriebssystem, falls relevant]
  ```

- Belege:

  - [README.md: keine Voraussetzungen/Requirements genannt; kein engines/requires-python/rust-version im Manifest](https://github.com/repolaunch-fixtures/web-app/blob/2222222222222222222222222222222222222222/README.md)

#### Screenshot, Animation oder Demo (`usability.visual_demo@2`)

- Status: **fehlt**, Schwere: hoch, Gewicht: 3
- Begründung: Bei sichtbaren Produkten zeigt ein Bild sofort, was man bekommt. Bei CLIs ist es ein Pluspunkt, kein Muss.
- Aufgabe: Füge einen aktuellen Screenshot, eine kurze Aufnahme oder einen Demo-Link in die README ein.
- Aufwand: 20 bis 60 Min.
- Erwartete Wirkung (Hypothese): Höhere Klickrate auf Demo bzw. Installation, besonders bei Webprodukten.
- So geht's: siehe Aufgabe 5 oben
- Belege:

  - [README.md: kein Bild außer Badges, kein Link auf Screenshot oder Video und kein Demo-Link (Website-Feld, GitHub Pages oder als Demo beschriftet)](https://github.com/repolaunch-fixtures/web-app/blob/2222222222222222222222222222222222222222/README.md)

#### Weiterführende Dokumentation (`usability.docs@1`)

- Status: **fehlt**, Schwere: niedrig, Gewicht: 1
- Begründung: Über den Einstieg hinaus brauchen Nutzer eine Stelle für Details: docs-Ordner, Wiki oder Doku-Seite.
- Aufgabe: Lege einen docs-Ordner oder eine Doku-Seite an und verlinke sie prominent in der README.
- Aufwand: 1 bis 4 Std.
- Erwartete Wirkung (Hypothese): Fortgeschrittene Nutzer bleiben, wiederkehrende Fragen nehmen ab.

  **So geht's:**

  1. Öffne die neue Datei docs/README.md. Die Vorlage ist bereits eingefügt: [docs/README.md anlegen](https://github.com/repolaunch-fixtures/web-app/new/main?filename=docs%2FREADME.md&value=%23%20Dokumentation%20f%C3%BCr%20web-app%0A%0A%23%23%20Erste%20Schritte%0A%0A%5BWie%20man%20anf%C3%A4ngt%5D%0A%0A%23%23%20Konfiguration%0A%0A%5BWelche%20Einstellungen%20es%20gibt%5D%0A%0A%23%23%20H%C3%A4ufige%20Fragen%0A%0A%5BFrage%20und%20Antwort%5D%0A)
  2. Ersetze alles in eckigen Klammern \[ \] durch deine eigenen Angaben und lösche, was nicht passt.
  3. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

  Inhalt der Vorlage:

  ```markdown
  # Dokumentation für web-app

  ## Erste Schritte

  [Wie man anfängt]

  ## Konfiguration

  [Welche Einstellungen es gibt]

  ## Häufige Fragen

  [Frage und Antwort]
  ```

  > Hinweis: Verlinke die Seite danach in der README, z. B. mit der Zeile: Ausführliche Dokumentation: \[docs/README.md\](docs/README.md)

- Belege:

  - [Kein docs/-Verzeichnis im Wurzelverzeichnis und kein Doku-Link in der README](https://github.com/repolaunch-fixtures/web-app/tree/2222222222222222222222222222222222222222)

### Vertrauen

#### Lizenzinformation (`trust.license@1`)

- Status: **vorhanden**, Gewicht: 3
- Begründung: Ohne erkennbare Lizenz ist unklar, ob und wie andere das Projekt nutzen dürfen. Das ist keine Rechtsberatung.
- Belege:

  - [GitHub API: license.spdx\_id (GitHub-Lizenzerkennung)](https://github.com/repolaunch-fixtures/web-app)
  
    ```text
    AGPL-3.0 (GNU Affero General Public License v3.0)
    ```
  

#### Erkennbarer Wartungsstatus (`trust.maintenance@1`)

- Status: **vorhanden**, Gewicht: 3
- Begründung: Nutzer prüfen, ob ein Projekt gepflegt wird. Archivierte oder lange inaktive Projekte wirken riskant.
- Belege:

  - [GitHub API: pushed\_at (letzter Push auf einen beliebigen Branch)](https://github.com/repolaunch-fixtures/web-app)
  
    ```text
    2026-07-02T08:00:00Z (vor 97 Tagen)
    ```
  

#### Versionierte Releases oder Tags (`trust.releases@1`)

- Status: **fehlt**, Schwere: niedrig, Gewicht: 1
- Begründung: Releases geben Nutzern stabile Stände und zeigen Fortschritt nachvollziehbar.
- Aufgabe: Veröffentliche ein Release mit Versionsnummer und kurzen Release Notes.
- Aufwand: 20 bis 60 Min.
- Erwartete Wirkung (Hypothese): Mehr produktive Nutzung, weil Nutzer eine Version festlegen können.

  **So geht's:**

  1. Öffne die Seite für ein neues Release: [Neues Release](https://github.com/repolaunch-fixtures/web-app/releases/new)
  2. Klicke auf „Choose a tag“, tippe eine Versionsnummer ein, z. B. v0.1.0, und wähle „Create new tag“.
  3. Klicke auf „Generate release notes“. GitHub schreibt die Änderungen selbst zusammen; prüfe und ergänze den Text.
  4. Klicke auf „Publish release“.

  > Hinweis: Eine Versionsnummer wie v0.1.0 signalisiert eine frühe Version, v1.0.0 eine stabile.

- Belege:

  - [GET /releases und GET /tags: keine Einträge](https://github.com/repolaunch-fixtures/web-app/releases)

#### Beitragsrichtlinien (`trust.contributing@1`)

- Status: **fehlt**, Schwere: niedrig, Gewicht: 1
- Begründung: CONTRIBUTING-Dateien verlinkt GitHub automatisch bei Issues und Pull Requests. Sie senken die Einstiegshürde.
- Aufgabe: Lege CONTRIBUTING.md an: Setup, Tests, Stil, Ablauf für Pull Requests.
- Aufwand: 30 bis 90 Min.
- Erwartete Wirkung (Hypothese): Mehr und besser vorbereitete Beiträge.

  **So geht's:**

  1. Öffne die neue Datei CONTRIBUTING.md. Die Vorlage ist bereits eingefügt: [CONTRIBUTING.md anlegen](https://github.com/repolaunch-fixtures/web-app/new/main?filename=CONTRIBUTING.md&value=%23%20Mitmachen%20bei%20web-app%0A%0ADanke%20f%C3%BCr%20dein%20Interesse%21%20So%20kannst%20du%20beitragen%3A%0A%0A%23%23%20Fehler%20melden%20und%20Ideen%20vorschlagen%0A%0A%C3%96ffne%20ein%20%5BIssue%5D%28https%3A%2F%2Fgithub.com%2Frepolaunch-fixtures%2Fweb-app%2Fissues%29%20und%20beschreibe%2C%20was%20passiert%20ist%20und%20was%20du%20erwartet%20hast.%0A%0A%23%23%20Entwicklungsumgebung%20einrichten%0A%0A1.%20%5BRepository%20forken%20und%20herunterladen%5D%0A2.%20%5BBefehl%20zum%20Installieren%20der%20Abh%C3%A4ngigkeiten%5D%0A3.%20%5BBefehl%20zum%20Starten%20der%20Tests%5D%0A%0A%23%23%20Pull%20Requests%0A%0A-%20%5BRegeln%2C%20z.%20B.%20ein%20Thema%20pro%20Pull%20Request%2C%20Tests%20erg%C3%A4nzen%5D%0A-%20%5BCode-Stil%20oder%20Formatierungswerkzeug%5D%0A)
  2. Ersetze alles in eckigen Klammern \[ \] durch deine eigenen Angaben und lösche, was nicht passt.
  3. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

  Inhalt der Vorlage:

  ```markdown
  # Mitmachen bei web-app

  Danke für dein Interesse! So kannst du beitragen:

  ## Fehler melden und Ideen vorschlagen

  Öffne ein [Issue](https://github.com/repolaunch-fixtures/web-app/issues) und beschreibe, was passiert ist und was du erwartet hast.

  ## Entwicklungsumgebung einrichten

  1. [Repository forken und herunterladen]
  2. [Befehl zum Installieren der Abhängigkeiten]
  3. [Befehl zum Starten der Tests]

  ## Pull Requests

  - [Regeln, z. B. ein Thema pro Pull Request, Tests ergänzen]
  - [Code-Stil oder Formatierungswerkzeug]
  ```

  > Hinweis: Trage nur Befehle ein, die du selbst ausprobiert hast. RepoLaunch erfindet keine Befehle.

- Belege:

  - [Dateiliste @ 2222222: keine Datei contributing, contributing.md, contributing.rst, contributing.txt, contributing.adoc in /, .github/, docs/](https://github.com/repolaunch-fixtures/web-app/tree/2222222222222222222222222222222222222222)

#### Sicherheitsrichtlinie (`trust.security_policy@1`)

- Status: **fehlt**, Schwere: hoch, Gewicht: 3
- Begründung: Eine SECURITY.md sagt, wie Schwachstellen vertraulich gemeldet werden. Für Unternehmen ist das oft ein Prüfpunkt.
- Aufgabe: Lege SECURITY.md an: Meldeweg (z. B. private Sicherheitsmeldung über GitHub), unterstützte Versionen, Reaktionszeit ohne Garantie.
- Aufwand: 15 bis 30 Min.
- Erwartete Wirkung (Hypothese): Höheres Vertrauen bei professionellen Nutzern.
- So geht's: siehe Aufgabe 3 oben
- Belege:

  - [Dateiliste @ 2222222: keine Datei security.md, security.txt, security in /, .github/, docs/](https://github.com/repolaunch-fixtures/web-app/tree/2222222222222222222222222222222222222222)

#### Kontakt- oder Supportweg (`trust.contact@1`)

- Status: **vorhanden**, Gewicht: 2
- Begründung: Nutzer brauchen einen Weg für Fragen und Fehlerberichte: Issues, Discussions oder ein Kontaktabschnitt.
- Belege:

  - [GitHub API: has\_issues / has\_discussions](https://github.com/repolaunch-fixtures/web-app)
  
    ```text
    true / false
    ```
  

#### Änderungsprotokoll (`trust.changelog@1`)

- Status: **fehlt**, Schwere: niedrig, Gewicht: 1
- Begründung: Ein Changelog oder Release Notes zeigen, was sich ändert, und erleichtern Updates.
- Aufgabe: Führe CHANGELOG.md oder schreibe Release Notes zu jedem Release.
- Aufwand: 15 bis 45 Min.
- Erwartete Wirkung (Hypothese): Nutzer aktualisieren eher und melden weniger Überraschungen.

  **So geht's:**

  1. Öffne die neue Datei CHANGELOG.md. Die Vorlage ist bereits eingefügt: [CHANGELOG.md anlegen](https://github.com/repolaunch-fixtures/web-app/new/main?filename=CHANGELOG.md&value=%23%20%C3%84nderungsprotokoll%0A%0AAlle%20wichtigen%20%C3%84nderungen%20an%20web-app%20stehen%20in%20dieser%20Datei.%0A%0A%23%23%20Unver%C3%B6ffentlicht%0A%0A%23%23%23%20Neu%0A%0A-%20%5BNeue%20Funktion%5D%0A%0A%23%23%23%20Ge%C3%A4ndert%0A%0A-%20%5B%C3%84nderung%5D%0A%0A%23%23%23%20Behoben%0A%0A-%20%5BFehlerbehebung%5D%0A)
  2. Ersetze alles in eckigen Klammern \[ \] durch deine eigenen Angaben und lösche, was nicht passt.
  3. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

  Inhalt der Vorlage:

  ```markdown
  # Änderungsprotokoll

  Alle wichtigen Änderungen an web-app stehen in dieser Datei.

  ## Unveröffentlicht

  ### Neu

  - [Neue Funktion]

  ### Geändert

  - [Änderung]

  ### Behoben

  - [Fehlerbehebung]
  ```

  > Hinweis: Einfachste Alternative: Bei jedem Release auf „Generate release notes“ klicken. Dann ist keine eigene Datei nötig.

- Belege:

  - [Dateiliste @ 2222222: keine Datei changelog.md, changelog, changes.md, history.md, news.md, changelog.rst in /, docs/](https://github.com/repolaunch-fixtures/web-app/tree/2222222222222222222222222222222222222222)

### Verbreitung und Vermarktung

#### Passende Topics (`distribution.topics@1`)

- Status: **fehlt**, Schwere: mittel, Gewicht: 2
- Begründung: Topics machen ein Repository über GitHub-Themenseiten und Suche auffindbar.
- Aufgabe: Vergib drei bis acht präzise Topics (Sprache, Problemfeld, Projekttyp).
- Aufwand: 5 bis 10 Min.
- Erwartete Wirkung (Hypothese): Mehr Besucher über Themenseiten und Suche; keine Garantie für Rankings.

  **So geht's:**

  1. Öffne die Startseite deines Repositories: [Repository öffnen](https://github.com/repolaunch-fixtures/web-app)
  2. Klicke rechts neben der Überschrift „About“ auf das Zahnrad-Symbol (⚙).
  3. Trage im Feld „Topics“ drei bis acht Schlagwörter (nach jedem Wort Enter drücken; GitHub schlägt passende vor) ein.
  4. Klicke auf „Save changes“. Die Änderung ist sofort sichtbar.

  Vorschläge aus erkannten Daten (bitte prüfen und um das Problemfeld ergänzen):

  ```text
  web-app javascript
  ```

  > Hinweis: Gute Topics beschreiben Sprache, Problemfeld und Art des Projekts, z. B. „pdf“, „invoices“, „cli“.

- Belege:

  - [GitHub API: topics](https://github.com/repolaunch-fixtures/web-app)
  
    ```text
    (keine)
    ```
  

#### Website-Feld gesetzt (`distribution.homepage@1`)

- Status: **fehlt**, Schwere: hoch, Gewicht: 3
- Begründung: Das Website-Feld erscheint prominent neben der Beschreibung und führt zu Demo, Doku oder Produktseite.
- Aufgabe: Trage im Repository unter "About" eine Website ein (Demo, Doku oder Produktseite).
- Aufwand: 2 bis 10 Min.
- Erwartete Wirkung (Hypothese): Mehr Besuche der Demo- oder Produktseite.
- So geht's: siehe Aufgabe 1 oben
- Belege:

  - [GitHub API: homepage](https://github.com/repolaunch-fixtures/web-app)
  
    ```text
    (leer)
    ```
  

#### Klarer nächster Schritt oben in der README (`distribution.next_step@1`)

- Status: **vorhanden**, Gewicht: 3
- Begründung: Wer die ersten Zeilen liest, sollte sofort wissen, was als Nächstes zu tun ist: installieren, Demo öffnen oder Doku lesen.
- Belege:

  - [Installationsbefehl im oberen Teil](https://github.com/repolaunch-fixtures/web-app/blob/2222222222222222222222222222222222222222/README.md#L8-L8) (Zeilen 8 bis 8)
  
    ```text
    docker compose up
    ```
  

#### Kommerzielles Angebot benannt (`distribution.commercial_offer@1`)

- Status: **fehlt**, Schwere: hoch, Gewicht: 3
- Begründung: Wer zahlende Kunden sucht, muss sagen, was man kaufen kann und wie man Kontakt aufnimmt.
- Aufgabe: Ergänze einen Abschnitt "Support" oder "Kommerzielle Nutzung" mit Angebot und Kontaktweg. Keine Umsatzversprechen.
- Aufwand: 30 bis 90 Min.
- Erwartete Wirkung (Hypothese): Interessierte Unternehmen melden sich direkt statt abzuwandern.

  **So geht's:**

  1. Öffne die README im Bearbeitungsmodus: [README bearbeiten](https://github.com/repolaunch-fixtures/web-app/edit/main/README.md)
  2. Setze den Cursor ans Ende der README, vor die Lizenz.
  3. Kopiere die Vorlage unten an diese Stelle und ersetze alles in eckigen Klammern \[ \] durch deine eigenen Angaben.
  4. Prüfe das Ergebnis über den Reiter „Preview“ oben im Editor.
  5. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

  Vorlage zum Kopieren:

  ```text
  ## Support und kommerzielle Nutzung

  Du brauchst Hilfe bei Einrichtung, Anpassung oder Betrieb? [Was du anbietest, z. B. Einrichtung, Schulung, Wartung]

  Kontakt: [E-Mail-Adresse oder Link]
  ```

  > Hinweis: Nenne nur Leistungen, die du wirklich anbietest, und versprich keine Ergebnisse.

- Belege:

  - [README.md: kein Abschnitt Support/Enterprise/Pricing/Beratung und kein Angebotslink](https://github.com/repolaunch-fixtures/web-app/blob/2222222222222222222222222222222222222222/README.md)

## Nicht bewertete Regeln

- `usability.cli_reference`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "SaaS-Kunden" nicht relevant (Gewicht 0). Für diesen Projekttyp mit keinem Ziel aktiv; aktiv bei Projekttyp "CLI-Tool".
- `usability.api_reference`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "SaaS-Kunden" nicht relevant (Gewicht 0). Für diesen Projekttyp mit keinem Ziel aktiv; aktiv bei Projekttyp "Bibliothek".
- `usability.template_flag`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "SaaS-Kunden" nicht relevant (Gewicht 0). Für diesen Projekttyp mit keinem Ziel aktiv; aktiv bei Projekttyp "Vorlage".
- `trust.code_of_conduct`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "SaaS-Kunden" nicht relevant (Gewicht 0). Aktiv mit Ziel "Mehr Mitwirkende".
- `distribution.registry`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "SaaS-Kunden" nicht relevant (Gewicht 0). Für diesen Projekttyp mit keinem Ziel aktiv; aktiv bei Projekttyp "CLI-Tool", "Bibliothek".
- `distribution.funding`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "SaaS-Kunden" nicht relevant (Gewicht 0). Aktiv mit Ziel "Sponsoren", "Supportkunden".
- `distribution.contributor_entry`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "SaaS-Kunden" nicht relevant (Gewicht 0). Aktiv mit Ziel "Mehr Mitwirkende".
- `usability.site_reachable`: nicht relevant. Ohne abrufbare Website im Website-Feld gibt es nichts zu prüfen; das Feld selbst bewertet die Regel "Website-Feld gesetzt".
- `distribution.site_title`: nicht relevant. Ohne abrufbare Website im Website-Feld gibt es nichts zu prüfen; das Feld selbst bewertet die Regel "Website-Feld gesetzt".
- `distribution.site_description`: nicht relevant. Ohne abrufbare Website im Website-Feld gibt es nichts zu prüfen; das Feld selbst bewertet die Regel "Website-Feld gesetzt".
- `distribution.site_og_image`: nicht relevant. Ohne abrufbare Website im Website-Feld gibt es nichts zu prüfen; das Feld selbst bewertet die Regel "Website-Feld gesetzt".
- `trust.site_imprint`: nicht relevant. Ohne abrufbare Website im Website-Feld gibt es nichts zu prüfen; das Feld selbst bewertet die Regel "Website-Feld gesetzt".
- `trust.site_privacy`: nicht relevant. Ohne abrufbare Website im Website-Feld gibt es nichts zu prüfen; das Feld selbst bewertet die Regel "Website-Feld gesetzt".

## Nutzerangaben (nicht belegt)

- Zielgruppe (optional): Kleine Teams mit Schichtbetrieb

## Inhalt dieses Exports

Der Export enthält nur tatsächlich erzeugte Dateien.

- `audit.json`: enthalten
- `audit.md`: enthalten
- `README.suggested.md`: nicht enthalten. Wird nur mit dem optionalen KI-Launch-Paket erzeugt, das nicht ausgeführt wurde.
- `launch-plan.md`: enthalten
- `monetization-plan.md`: enthalten
- `marketing-drafts.md`: nicht enthalten. Wird nur mit dem optionalen KI-Launch-Paket erzeugt, das nicht ausgeführt wurde.
