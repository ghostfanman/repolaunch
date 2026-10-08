# RepoLaunch-Audit: repolaunch-fixtures/invoice-kit

> Demo-Modus: Diese Daten stammen aus erfundenen Fixtures, nicht von GitHub.

- Repository: [repolaunch-fixtures/invoice-kit](https://github.com/repolaunch-fixtures/invoice-kit)
- Analysierter Commit: `f288a59553f844fe3bb919768ff314e4c8fded5a` (Default-Branch `main`)
- Analysezeit: 2026-10-07T12:00:00.000Z

## Das Wichtigste in Kürze

**85 von 100 Punkten** (Regelwerk `2026.10.2`). Gut vorbereitet. Einige Punkte fehlen noch.

- Projekttyp: Webprodukt / SaaS
- Ziel: Mehr Nutzer

**Das ist schon gut:** Aussagekräftige Repository-Beschreibung, README vorhanden, Lizenzinformation, Website-Feld gesetzt

> So nutzt du diesen Bericht: Arbeite die Aufgaben unten der Reihe nach ab. Jede hat eine Klick-für-Klick-Anleitung für die GitHub-Webseite, ein Terminal brauchst du nicht. Für die meisten Schritte brauchst du Schreibrechte am Repository. Lass danach erneut analysieren: Fortschritt zeigt der Score nur im Vergleich mit einem Bericht derselben Regelwerkversion, die neben dem Score steht.

## Fünf priorisierte Aufgaben

### 1. Datenschutzerklärung prüfen und verlinken

**Warum:** Eine Datenschutzerklärung zeigt, welche Daten die Website verarbeitet. Je nach Land und Datenverarbeitung kann sie vorgeschrieben sein, etwa nach der DSGVO. Das ist ein Hinweis, keine Rechtsberatung.

**Aufgabe:** Prüfe, welche Angaben zur Datenverarbeitung deine Website braucht, und verlinke eine Datenschutzerklärung gut sichtbar. Im Zweifel rechtlich beraten lassen.

Aufwand: 30 bis 120 Min. · Wichtigkeit: mittel

**So geht's:**

1. Prüfe, welche Daten deine Website verarbeitet (z. B. Server-Logs, Formulare, Analyse, eingebettete Inhalte) und welche Angaben dafür nötig sind. Im Zweifel rechtlich beraten lassen.
2. Lege die Seite an, zum Beispiel datenschutz.html neben der Startdatei.
3. Die Website kommt aus diesem Repository. Öffne die Startdatei index.html im Bearbeitungsmodus: [index.html bearbeiten](https://github.com/repolaunch-fixtures/invoice-kit/edit/main/index.html)
4. Füge den Link gut sichtbar ein, zum Beispiel im Fußbereich vor \</body\>, und ersetze die Platzhalter.
5. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

Vorlage für den Link:

```text
<a href="[datenschutz.html]">Datenschutz</a>
```

> Hinweis: RepoLaunch erstellt keine Inhalte für Impressum oder Datenschutzerklärung und prüft sie nicht. Das ist ein Hinweis, keine Rechtsberatung; im Zweifel rechtlich beraten lassen.

Erwartete Wirkung (Hypothese): Besucher können nachvollziehen, was mit ihren Daten geschieht.

Prüfregel und Belege: Website: Datenschutzerklärung verlinkt (`trust.site_privacy@2`), siehe „Alle Befunde“.

### 2. Sicherheitsrichtlinie mit Meldeweg anlegen

**Warum:** Eine SECURITY.md sagt, wie Schwachstellen vertraulich gemeldet werden. Für Unternehmen ist das oft ein Prüfpunkt.

**Aufgabe:** Lege SECURITY.md an: Meldeweg (z. B. private Sicherheitsmeldung über GitHub), unterstützte Versionen, Reaktionszeit ohne Garantie.

Aufwand: 15 bis 30 Min. · Wichtigkeit: mittel

**So geht's:**

1. Schalte zuerst vertrauliche Meldungen ein: Einstellungen → „Advanced Security“ (je nach Ansicht „Code security“) → bei „Private vulnerability reporting“ auf „Enable“ klicken. [Sicherheitseinstellungen](https://github.com/repolaunch-fixtures/invoice-kit/settings/security_analysis)
2. Öffne die neue Datei SECURITY.md. Die Vorlage ist bereits eingefügt: [SECURITY.md anlegen](https://github.com/repolaunch-fixtures/invoice-kit/new/main?filename=SECURITY.md&value=%23%20Sicherheitsrichtlinie%0A%0A%23%23%20Sicherheitsl%C3%BCcke%20melden%0A%0ABitte%20melde%20Sicherheitsl%C3%BCcken%20nicht%20%C3%B6ffentlich%20als%20Issue%2C%20sondern%20vertraulich%20%C3%BCber%20%5BReport%20a%20vulnerability%5D%28https%3A%2F%2Fgithub.com%2Frepolaunch-fixtures%2Finvoice-kit%2Fsecurity%2Fadvisories%2Fnew%29.%0A%0A%23%23%20Unterst%C3%BCtzte%20Versionen%0A%0A%7C%20Version%20%7C%20Unterst%C3%BCtzt%20%7C%0A%7C%20---%20%7C%20---%20%7C%0A%7C%20%5Bz.%20B.%201.x%5D%20%7C%20ja%20%7C%0A%7C%20%5B%C3%A4ltere%20Versionen%5D%20%7C%20nein%20%7C%0A%0A%23%23%20Reaktionszeit%0A%0AIch%20bem%C3%BChe%20mich%2C%20innerhalb%20von%20%5BZeitraum%2C%20z.%20B.%2014%20Tagen%5D%20zu%20antworten.%20Das%20ist%20keine%20Garantie.%0A)
3. Ersetze alles in eckigen Klammern \[ \] durch deine eigenen Angaben und lösche, was nicht passt.
4. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

Inhalt der Vorlage:

```markdown
# Sicherheitsrichtlinie

## Sicherheitslücke melden

Bitte melde Sicherheitslücken nicht öffentlich als Issue, sondern vertraulich über [Report a vulnerability](https://github.com/repolaunch-fixtures/invoice-kit/security/advisories/new).

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

### 3. Impressum prüfen und verlinken

**Warum:** Ein Impressum zeigt, wer hinter dem Angebot steht; viele Besucher und Geschäftskunden suchen danach. In einigen Ländern, etwa Deutschland, kann für bestimmte Websites eine Pflicht dazu bestehen. Das ist ein Hinweis, keine Rechtsberatung.

**Aufgabe:** Prüfe, ob für deine Website ein Impressum nötig oder sinnvoll ist, und verlinke es gut sichtbar, zum Beispiel im Fußbereich. Im Zweifel rechtlich beraten lassen.

Aufwand: 15 bis 60 Min. · Wichtigkeit: niedrig

**So geht's:**

1. Prüfe, ob für deine Website ein Impressum nötig oder sinnvoll ist. Im Zweifel rechtlich beraten lassen.
2. Lege die Seite an, zum Beispiel impressum.html neben der Startdatei.
3. Die Website kommt aus diesem Repository. Öffne die Startdatei index.html im Bearbeitungsmodus: [index.html bearbeiten](https://github.com/repolaunch-fixtures/invoice-kit/edit/main/index.html)
4. Füge den Link gut sichtbar ein, zum Beispiel im Fußbereich vor \</body\>, und ersetze die Platzhalter.
5. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

Vorlage für den Link:

```text
<a href="[impressum.html]">Impressum</a>
```

> Hinweis: RepoLaunch erstellt keine Inhalte für Impressum oder Datenschutzerklärung und prüft sie nicht. Das ist ein Hinweis, keine Rechtsberatung; im Zweifel rechtlich beraten lassen.

Erwartete Wirkung (Hypothese): Mehr Vertrauen, besonders bei Geschäftskunden.

Prüfregel und Belege: Website: Impressum verlinkt (`trust.site_imprint@2`), siehe „Alle Befunde“.

### 4. Vorschaubild für geteilte Links einrichten

**Warum:** Mit einem Open-Graph-Bild (og:image) zeigen soziale Netzwerke und Messenger beim Teilen ein Bild statt eines leeren Rahmens.

**Aufgabe:** Lege ein Vorschaubild an (etwa 1200 × 630 Pixel) und verweise mit meta property="og:image" und absoluter Adresse darauf.

Aufwand: 15 bis 45 Min. · Wichtigkeit: niedrig

**So geht's:**

1. Erstelle ein Bild der Anwendung im Querformat, etwa 1200 × 630 Pixel, zum Beispiel aus einem Screenshot.
2. Lade das Bild dorthin hoch, wo die Dateien deiner Website liegen (auf GitHub: „Add file“ → „Upload files“).
3. Die Website kommt aus diesem Repository. Öffne die Startdatei index.html im Bearbeitungsmodus: [index.html bearbeiten](https://github.com/repolaunch-fixtures/invoice-kit/edit/main/index.html)
4. Füge die Vorlage im Bereich zwischen \<head\> und \</head\> ein und ersetze alles in eckigen Klammern \[ \].
5. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

Vorlage zum Kopieren:

```text
<meta property="og:image" content="https://[Adresse deiner Website]/[Bildname].png">
```

> Hinweis: Die Adresse muss vollständig sein (mit https://), sonst zeigen viele Dienste das Bild nicht.

Erwartete Wirkung (Hypothese): Geteilte Links fallen in Feeds und Chats eher auf.

Prüfregel und Belege: Website: Vorschaubild für geteilte Links (`distribution.site_og_image@2`), siehe „Alle Befunde“.

### 5. Screenshot in die README einfügen

**Warum:** Bei sichtbaren Produkten zeigt ein Bild sofort, was man bekommt. Bei CLIs ist es ein Pluspunkt, kein Muss. Ein Demo-Link ist vorhanden, es fehlt nur ein Bild der Anwendung.

**Aufgabe:** Ergänze einen Screenshot der Anwendung in der README, zum Beispiel direkt unter dem vorhandenen Demo-Link.

Aufwand: 10 bis 20 Min. · Wichtigkeit: niedrig

**So geht's:**

1. Mache einen Screenshot deines Projekts (Windows: Win+Umschalt+S, Mac: Cmd+Umschalt+4, Linux: Taste „Druck“).
2. Öffne die README im Bearbeitungsmodus: [README bearbeiten](https://github.com/repolaunch-fixtures/invoice-kit/edit/main/README.md)
3. Klicke in die Zeile unter dem vorhandenen Demo-Link und ziehe die Bilddatei in das Textfeld. GitHub lädt das Bild hoch und fügt den Link selbst ein.
4. Ersetze den Text in den eckigen Klammern des Bild-Links durch eine kurze Beschreibung, z. B. „Startseite der App“.
5. Klicke oben rechts auf „Commit changes…“ und im Fenster noch einmal auf „Commit changes“. Fertig.

Erwartete Wirkung (Hypothese): Besucher sehen schon auf der Repository-Seite, was sie erwartet, bevor sie die Demo öffnen.

Prüfregel und Belege: Screenshot, Animation oder Demo (`usability.visual_demo@2`), siehe „Alle Befunde“.

## Begriffe kurz erklärt

- **README**: Die Startseite deines Projekts: die Datei README.md, die GitHub unter der Dateiliste anzeigt.
- **Commit**: Eine gespeicherte Änderung. „Commit changes“ speichert deine Bearbeitung im Repository.
- **Issue**: Ein Eintrag für Fragen, Fehler oder Ideen im Reiter „Issues“.
- **Markdown**: Die einfache Textformatierung von GitHub: # für Überschriften, - für Listen, [Text](Adresse) für Links.

## Interner Bereitschaftsscore

> Interne Kennzahl dieses Werkzeugs. Kein GitHub- oder Google-Ranking und keine Erfolgswahrscheinlichkeit. Sterne fließen nicht ein.

**85 / 100** (Regelwerk `2026.10.2`), Abdeckung 100 %

> Scores sind nur innerhalb derselben Regelwerkversion vergleichbar. Mit einem anderen Regelwerk kann sich der Score auch ohne Änderung am Repository verschieben.

Berechnung: Score = Summe der Gewichte erfüllter Regeln (einschließlich Teilgutschriften) / Summe der Gewichte bewerteter Regeln × 100 = 40 / 47 × 100. Unbekannte und nicht relevante Regeln zählen nicht. Abdeckung = bewertete Gewichte / (bewertete + unbekannte Gewichte) = 47 / 47.

| Kategorie | Erfüllt | Bewertet | Unbekannt |
| --- | --- | --- | --- |
| Verständnis | 11 | 11 | 0 |
| Nutzbarkeit | 10 | 11 | 0 |
| Vertrauen | 7 | 12 | 0 |
| Verbreitung und Vermarktung | 12 | 13 | 0 |

- Regelwerk: `2026.10.2`
- GitHub-API: 9 Anfragen (0 × 304), 16829 B
- Website: 1 Abruf, 7643 B übertragen
- Sterne (nur Anzeige, nicht bewertet): 0

## Alle Befunde

### Verständnis

#### Aussagekräftige Repository-Beschreibung (`understanding.description@1`)

- Status: **vorhanden**, Gewicht: 3
- Begründung: Die Beschreibung erscheint in Suchergebnissen, Vorschauen und Listen. Sie ist oft der erste Kontakt.
- Belege:

  - [GitHub API: description](https://github.com/repolaunch-fixtures/invoice-kit)
  
    ```text
    E-Rechnung (XRechnung 3.0) & PDF-Rechnung kostenlos erstellen – unbegrenzt, ohne Abo, ohne Anmeldung. Daten bleiben im Browser. Für Freelancer, Kleinunternehmer & KMU.
    ```
  

#### README vorhanden (`understanding.readme@1`)

- Status: **vorhanden**, Gewicht: 3
- Begründung: Die README ist laut GitHub meist das Erste, was Besucher sehen. Ohne sie fehlt jede Erklärung.
- Belege:

  - [README.md (8991 B)](https://github.com/repolaunch-fixtures/invoice-kit/blob/f288a59553f844fe3bb919768ff314e4c8fded5a/README.md)

#### Einleitender Absatz in der README (`understanding.intro@1`)

- Status: **vorhanden**, Gewicht: 2
- Begründung: Ein kurzer Absatz direkt unter dem Titel erklärt Zweck und Nutzen, bevor Details folgen.
- Belege:

  - [Einleitung](https://github.com/repolaunch-fixtures/invoice-kit/blob/f288a59553f844fe3bb919768ff314e4c8fded5a/README.md#L3-L3) (Zeilen 3 bis 3)
  
    ```text
    Invoice Kit erstellt CII-XML für XRechnung und ZUGFeRD-/Factur-X-PDFs mit eingebetteter XML. Der Viewer liest CII, UBL und XML-Anhänge in PDFs. Alle Rechnungsdaten werden ausschließlich lokal im Browser verarbeitet. Es gibt kein Benutzerkonto und keinen Server für Rechnungsdaten.
    ```
  

#### Zielgruppe und Nutzen benannt (`understanding.audience@1`)

- Status: **vorhanden**, Gewicht: 2
- Begründung: Besucher entscheiden schneller, wenn Funktionen, Anwendungsfälle oder die Zielgruppe ausdrücklich genannt sind.
- Belege:

  - [Abschnitt "Funktionen"](https://github.com/repolaunch-fixtures/invoice-kit/blob/f288a59553f844fe3bb919768ff314e4c8fded5a/README.md#L7-L15) (Zeilen 7 bis 15)
  
    ```text
    ## Funktionen
    
    - Rechnungsvorschau, XML-Export, PDF-Export, Drucken sowie JSON-Sicherung und Import.
    - Sieben Rechnungssprachen, mehrere Steuersätze, steuerfreie Fälle, Rechnungskorrekturen, Leistungszeiträume, Skonto und Fremdwährungen.
    - Unentgeltliche Rechnungen für Geschenke und Werbezwecke: Unter „Zahlung“ → „Berechnung“ auswählbar. Die Positionen zeigen den Warenwert, ein Nachlass von 100 %  …
    ```
  

#### Konkretes Nutzungsbeispiel (`understanding.example@1`)

- Status: **vorhanden**, Gewicht: 1
- Begründung: Ein kurzes Beispiel zeigt schneller als jede Beschreibung, wie sich das Projekt anfühlt.
- Belege:

  - [Codebeispiel](https://github.com/repolaunch-fixtures/invoice-kit/blob/f288a59553f844fe3bb919768ff314e4c8fded5a/README.md#L32-L34) (Zeilen 32 bis 34)
  
    ````text
    ```sh
    python3 -m http.server 8765 --bind 127.0.0.1
    ```
    ````
  

### Nutzbarkeit

#### Dokumentierter Schnellstart (`usability.quickstart@1`)

- Status: **vorhanden**, Gewicht: 2
- Begründung: Ein klarer erster Schritt (Installation oder Start) ist die Voraussetzung jeder Nutzung.
- Belege:

  - [Abschnitt "Lokal starten und testen"](https://github.com/repolaunch-fixtures/invoice-kit/blob/f288a59553f844fe3bb919768ff314e4c8fded5a/README.md#L28-L38) (Zeilen 28 bis 38)
  
    ````text
    ## Lokal starten und testen
    
    Voraussetzungen: Node.js ab Version 22 und Python 3. Es sind keine npm-Abhängigkeiten erforderlich.
    
    ```sh
    python3 -m http.server 8765 --bind 127.0.0.1
    ```
    
    Öffne anschließend `http://127.0.0.1:8765/`. JavaScript-Module benötigen einen HTTP-Server; direktes Öffnen per `file://` reicht nicht.
    
    ```sh
    ````
  

#### Voraussetzungen genannt (`usability.prerequisites@1`)

- Status: **vorhanden**, Gewicht: 2
- Begründung: Fehlende Angaben zu Laufzeit oder Versionen führen zu fehlgeschlagenen ersten Versuchen.
- Belege:

  - [Voraussetzung im Text](https://github.com/repolaunch-fixtures/invoice-kit/blob/f288a59553f844fe3bb919768ff314e4c8fded5a/README.md#L30-L30) (Zeilen 30 bis 30)
  
    ```text
    Voraussetzungen: Node.js ab Version 22 und Python 3. Es sind keine npm-Abhängigkeiten erforderlich.
    ```
  

#### Screenshot, Animation oder Demo (`usability.visual_demo@2`)

- Status: **fehlt**, Schwere: niedrig, Gewicht: 3 (teilweise erfüllt, angerechnet: 2 / 3)
- Begründung: Bei sichtbaren Produkten zeigt ein Bild sofort, was man bekommt. Bei CLIs ist es ein Pluspunkt, kein Muss. Ein Demo-Link ist vorhanden, es fehlt nur ein Bild der Anwendung.
- Aufgabe: Ergänze einen Screenshot der Anwendung in der README, zum Beispiel direkt unter dem vorhandenen Demo-Link.
- Aufwand: 10 bis 20 Min.
- Erwartete Wirkung (Hypothese): Besucher sehen schon auf der Repository-Seite, was sie erwartet, bevor sie die Demo öffnen.
- So geht's: siehe Aufgabe 5 oben
- Belege:

  - [Demo-Link in Zeile 5: https://repolaunch-fixtures.github.io/invoice-kit/ (entspricht dem Website-Feld des Repositorys)](https://github.com/repolaunch-fixtures/invoice-kit/blob/f288a59553f844fe3bb919768ff314e4c8fded5a/README.md#L5-L5) (Zeilen 5 bis 5)
  
    ```text
    [Generator öffnen](https://repolaunch-fixtures.github.io/invoice-kit/) · [Viewer öffnen](https://repolaunch-fixtures.github.io/invoice-kit/anzeigen.html)
    ```
  
  - [README.md: kein Bild außer Badges und kein Link auf Screenshot oder Video](https://github.com/repolaunch-fixtures/invoice-kit/blob/f288a59553f844fe3bb919768ff314e4c8fded5a/README.md)

#### Weiterführende Dokumentation (`usability.docs@1`)

- Status: **vorhanden**, Gewicht: 1
- Begründung: Über den Einstieg hinaus brauchen Nutzer eine Stelle für Details: docs-Ordner, Wiki oder Doku-Seite.
- Belege:

  - [Verzeichnis docs/](https://github.com/repolaunch-fixtures/invoice-kit/tree/f288a59553f844fe3bb919768ff314e4c8fded5a/docs)

### Vertrauen

#### Lizenzinformation (`trust.license@1`)

- Status: **vorhanden**, Gewicht: 3
- Begründung: Ohne erkennbare Lizenz ist unklar, ob und wie andere das Projekt nutzen dürfen. Das ist keine Rechtsberatung.
- Belege:

  - [GitHub API: license.spdx\_id (GitHub-Lizenzerkennung)](https://github.com/repolaunch-fixtures/invoice-kit)
  
    ```text
    MIT (MIT License)
    ```
  

#### Erkennbarer Wartungsstatus (`trust.maintenance@1`)

- Status: **vorhanden**, Gewicht: 2
- Begründung: Nutzer prüfen, ob ein Projekt gepflegt wird. Archivierte oder lange inaktive Projekte wirken riskant.
- Belege:

  - [GitHub API: pushed\_at (letzter Push auf einen beliebigen Branch)](https://github.com/repolaunch-fixtures/invoice-kit)
  
    ```text
    2026-10-06T09:00:00Z (vor 1 Tagen)
    ```
  

#### Sicherheitsrichtlinie (`trust.security_policy@1`)

- Status: **fehlt**, Schwere: mittel, Gewicht: 2
- Begründung: Eine SECURITY.md sagt, wie Schwachstellen vertraulich gemeldet werden. Für Unternehmen ist das oft ein Prüfpunkt.
- Aufgabe: Lege SECURITY.md an: Meldeweg (z. B. private Sicherheitsmeldung über GitHub), unterstützte Versionen, Reaktionszeit ohne Garantie.
- Aufwand: 15 bis 30 Min.
- Erwartete Wirkung (Hypothese): Höheres Vertrauen bei professionellen Nutzern.
- So geht's: siehe Aufgabe 2 oben
- Belege:

  - [Dateiliste @ f288a59: keine Datei security.md, security.txt, security in /, .github/, docs/](https://github.com/repolaunch-fixtures/invoice-kit/tree/f288a59553f844fe3bb919768ff314e4c8fded5a)

#### Kontakt- oder Supportweg (`trust.contact@1`)

- Status: **vorhanden**, Gewicht: 2
- Begründung: Nutzer brauchen einen Weg für Fragen und Fehlerberichte: Issues, Discussions oder ein Kontaktabschnitt.
- Belege:

  - [GitHub API: has\_issues / has\_discussions](https://github.com/repolaunch-fixtures/invoice-kit)
  
    ```text
    true / false
    ```
  

### Verbreitung und Vermarktung

#### Passende Topics (`distribution.topics@1`)

- Status: **vorhanden**, Gewicht: 2
- Begründung: Topics machen ein Repository über GitHub-Themenseiten und Suche auffindbar.
- Belege:

  - [GitHub API: topics](https://github.com/repolaunch-fixtures/invoice-kit)
  
    ```text
    e-rechnung, einvoicing, en16931, freelancer, invoice-generator, kleinunternehmer, pdf, rechnung, xrechnung
    ```
  

#### Website-Feld gesetzt (`distribution.homepage@1`)

- Status: **vorhanden**, Gewicht: 3
- Begründung: Das Website-Feld erscheint prominent neben der Beschreibung und führt zu Demo, Doku oder Produktseite.
- Belege:

  - [GitHub API: homepage](https://github.com/repolaunch-fixtures/invoice-kit)
  
    ```text
    https://repolaunch-fixtures.github.io/invoice-kit/
    ```
  

#### Klarer nächster Schritt oben in der README (`distribution.next_step@1`)

- Status: **vorhanden**, Gewicht: 3
- Begründung: Wer die ersten Zeilen liest, sollte sofort wissen, was als Nächstes zu tun ist: installieren, Demo öffnen oder Doku lesen.
- Belege:

  - [Handlungslink im oberen Teil](https://github.com/repolaunch-fixtures/invoice-kit/blob/f288a59553f844fe3bb919768ff314e4c8fded5a/README.md#L5-L5) (Zeilen 5 bis 5)
  
    ```text
    [Generator öffnen](https://repolaunch-fixtures.github.io/invoice-kit/) · [Viewer öffnen](https://repolaunch-fixtures.github.io/invoice-kit/anzeigen.html)
    ```
  

### Website

> Geprüft wurde genau eine Seite: die Adresse aus dem Website-Feld (https://repolaunch-fixtures.github.io/invoice-kit/), ohne JavaScript und ohne Unterseiten. Die README verlinkt 1 weitere Seite derselben Website; sie wurde nicht geprüft.

#### Website: erreichbar (`usability.site_reachable@1`)

- Status: **vorhanden**, Gewicht: 3
- Begründung: Bei einem Webprodukt ist die Website der eigentliche Einstieg. Ist sie nicht erreichbar, endet der Besuch dort.
- Belege:

  - [Abruf der Website https://repolaunch-fixtures.github.io/invoice-kit/: Status 200](https://repolaunch-fixtures.github.io/invoice-kit/)
  
    ```text
    GET https://repolaunch-fixtures.github.io/invoice-kit/
    HTTP 200, text/html; charset=utf-8
    Dokument (entpackt): 23807 B
    Übertragen (gzip-komprimiert): 7643 B
    ```
  

#### Website: Seitentitel (`distribution.site_title@2`)

- Status: **vorhanden**, Gewicht: 2
- Begründung: Der Seitentitel (title-Element) erscheint in Suchergebnissen, Lesezeichen und Browser-Tabs.
- Belege:

  - [Website: title-Element im HTML](https://repolaunch-fixtures.github.io/invoice-kit/) (Zeilen 6 bis 6)
  
    ```text
    Invoice Kit: E-Rechnung (XRechnung) & PDF-Rechnung kostenlos erstellen
    ```
  

#### Website: Meta-Beschreibung (`distribution.site_description@2`)

- Status: **vorhanden**, Gewicht: 2
- Begründung: Suchmaschinen und Link-Vorschauen zeigen die Meta-Beschreibung oft als Kurztext unter dem Titel.
- Belege:

  - [Website: meta description im HTML](https://repolaunch-fixtures.github.io/invoice-kit/) (Zeilen 7 bis 7)
  
    ```text
    E-Rechnung kostenlos erstellen: ZUGFeRD-PDF und XRechnung 3.0 mit Eingabeprüfung, GiroCode, Reverse Charge, 7 Sprachen. Ohne Anmeldung, ohne Abo, Daten bleiben im Browser.
    ```
  

#### Website: Vorschaubild für geteilte Links (`distribution.site_og_image@2`)

- Status: **fehlt**, Schwere: niedrig, Gewicht: 1
- Begründung: Mit einem Open-Graph-Bild (og:image) zeigen soziale Netzwerke und Messenger beim Teilen ein Bild statt eines leeren Rahmens.
- Aufgabe: Lege ein Vorschaubild an (etwa 1200 × 630 Pixel) und verweise mit meta property="og:image" und absoluter Adresse darauf.
- Aufwand: 15 bis 45 Min.
- Erwartete Wirkung (Hypothese): Geteilte Links fallen in Feeds und Chats eher auf.
- So geht's: siehe Aufgabe 4 oben
- Belege:

  - [Kein meta-Element property="og:image" mit Inhalt im ausgelieferten HTML von https://repolaunch-fixtures.github.io/invoice-kit/](https://repolaunch-fixtures.github.io/invoice-kit/)

#### Website: Impressum verlinkt (`trust.site_imprint@2`)

- Status: **fehlt**, Schwere: niedrig, Gewicht: 1
- Begründung: Ein Impressum zeigt, wer hinter dem Angebot steht; viele Besucher und Geschäftskunden suchen danach. In einigen Ländern, etwa Deutschland, kann für bestimmte Websites eine Pflicht dazu bestehen. Das ist ein Hinweis, keine Rechtsberatung.
- Aufgabe: Prüfe, ob für deine Website ein Impressum nötig oder sinnvoll ist, und verlinke es gut sichtbar, zum Beispiel im Fußbereich. Im Zweifel rechtlich beraten lassen.
- Aufwand: 15 bis 60 Min.
- Erwartete Wirkung (Hypothese): Mehr Vertrauen, besonders bei Geschäftskunden.
- So geht's: siehe Aufgabe 3 oben
- Belege:

  - [Im ausgelieferten HTML von https://repolaunch-fixtures.github.io/invoice-kit/ (ohne JavaScript, 5 Links) kein Link mit Text oder Ziel Impressum, Imprint oder Legal Notice](https://repolaunch-fixtures.github.io/invoice-kit/)

#### Website: Datenschutzerklärung verlinkt (`trust.site_privacy@2`)

- Status: **fehlt**, Schwere: mittel, Gewicht: 2
- Begründung: Eine Datenschutzerklärung zeigt, welche Daten die Website verarbeitet. Je nach Land und Datenverarbeitung kann sie vorgeschrieben sein, etwa nach der DSGVO. Das ist ein Hinweis, keine Rechtsberatung.
- Aufgabe: Prüfe, welche Angaben zur Datenverarbeitung deine Website braucht, und verlinke eine Datenschutzerklärung gut sichtbar. Im Zweifel rechtlich beraten lassen.
- Aufwand: 30 bis 120 Min.
- Erwartete Wirkung (Hypothese): Besucher können nachvollziehen, was mit ihren Daten geschieht.
- So geht's: siehe Aufgabe 1 oben
- Belege:

  - [Im ausgelieferten HTML von https://repolaunch-fixtures.github.io/invoice-kit/ (ohne JavaScript, 5 Links) kein Link mit Text oder Ziel Datenschutz oder Privacy](https://repolaunch-fixtures.github.io/invoice-kit/)

## Nicht bewertete Regeln

- `usability.cli_reference`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "Mehr Nutzer" nicht relevant (Gewicht 0). Für diesen Projekttyp mit keinem Ziel aktiv; aktiv bei Projekttyp "CLI-Tool".
- `usability.api_reference`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "Mehr Nutzer" nicht relevant (Gewicht 0). Für diesen Projekttyp mit keinem Ziel aktiv; aktiv bei Projekttyp "Bibliothek".
- `usability.template_flag`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "Mehr Nutzer" nicht relevant (Gewicht 0). Für diesen Projekttyp mit keinem Ziel aktiv; aktiv bei Projekttyp "Vorlage".
- `trust.releases`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "Mehr Nutzer" nicht relevant (Gewicht 0). Aktiv mit Ziel "Mehr Mitwirkende", "Sponsoren", "Supportkunden", "SaaS-Kunden".
- `trust.contributing`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "Mehr Nutzer" nicht relevant (Gewicht 0). Aktiv mit Ziel "Mehr Mitwirkende", "Sponsoren", "Supportkunden", "SaaS-Kunden".
- `trust.code_of_conduct`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "Mehr Nutzer" nicht relevant (Gewicht 0). Aktiv mit Ziel "Mehr Mitwirkende".
- `trust.changelog`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "Mehr Nutzer" nicht relevant (Gewicht 0). Aktiv mit Ziel "Mehr Mitwirkende", "Sponsoren", "Supportkunden", "SaaS-Kunden".
- `distribution.registry`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "Mehr Nutzer" nicht relevant (Gewicht 0). Für diesen Projekttyp mit keinem Ziel aktiv; aktiv bei Projekttyp "CLI-Tool", "Bibliothek".
- `distribution.funding`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "Mehr Nutzer" nicht relevant (Gewicht 0). Aktiv mit Ziel "Sponsoren", "Supportkunden".
- `distribution.commercial_offer`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "Mehr Nutzer" nicht relevant (Gewicht 0). Aktiv mit Ziel "Supportkunden", "SaaS-Kunden".
- `distribution.contributor_entry`: nicht relevant. Für Projekttyp "Webprodukt / SaaS" und Ziel "Mehr Nutzer" nicht relevant (Gewicht 0). Aktiv mit Ziel "Mehr Mitwirkende".

## Inhalt dieses Exports

Der Export enthält nur tatsächlich erzeugte Dateien.

- `audit.json`: enthalten
- `audit.md`: enthalten
- `README.suggested.md`: nicht enthalten. Wird nur mit dem optionalen KI-Launch-Paket erzeugt, das nicht ausgeführt wurde.
- `launch-plan.md`: enthalten
- `monetization-plan.md`: enthalten
- `marketing-drafts.md`: nicht enthalten. Wird nur mit dem optionalen KI-Launch-Paket erzeugt, das nicht ausgeführt wurde.
