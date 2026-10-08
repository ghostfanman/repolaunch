# Regelwerk und Gewichtung

Jede Regel hat eine eigene Version (`regel@n`), die Gewichtung je Projekttyp und Ziel steht in `src/core/rules/config.ts` und ist über die Regelwerkversion versioniert. Ein Bericht nennt beide; alte Berichte bleiben damit nachvollziehbar.

## Versionen

| Regelwerk | Änderung |
| --- | --- |
| 2026.10.0 | Erste Fassung mit 27 Regeln. |
| 2026.10.1 | `usability.visual_demo` 1 → 2: Link auf das Website-Feld (auch Unterpfade) oder auf GitHub Pages des Besitzers gilt als Demo; "Demo-Link vorhanden, Screenshot fehlt" ist ein eigener Befund mit Teilgutschrift (offenes Gewicht 1). Neue Regeln, jeweils @1: `usability.site_reachable`, `distribution.site_title`, `distribution.site_description`, `distribution.site_og_image`, `trust.site_imprint`, `trust.site_privacy`. Gewichte: `trust.contributing`, `trust.releases`, `trust.changelog` für webapp mit Ziel users auf 0 (Logik der Regeln unverändert, daher weiter @1). Abgeschaltete Regeln nennen das Ziel, mit dem sie aktiv würden. |

Eine Regelversion steigt, wenn sich ihre Auswertung ändert. Reine Gewichtsänderungen erhöhen nur die Regelwerkversion, weil die Gewichte zum Regelwerk gehören und nicht zur einzelnen Regel. Ein Bericht mit `usability.visual_demo@1` stammt also aus 2026.10.0 und kannte die Homepage- und Pages-Erkennung noch nicht.

### Website-Regeln (nur Webprodukte)

| Regel | Gewicht webapp | Bewertung |
| --- | --- | --- |
| `usability.site_reachable` | 3 | 2xx erfüllt, 404/410 fehlt, andere Statuscodes und fehlgeschlagener Abruf unbekannt |
| `distribution.site_title` | 2 | nicht leeres title-Element |
| `distribution.site_description` | 2 | meta name="description" mit Inhalt |
| `distribution.site_og_image` | 1 | meta property="og:image" mit Inhalt (Bild wird nicht abgerufen) |
| `trust.site_imprint` | 1 | Link mit Text oder Ziel Impressum, Imprint oder Legal Notice; Hinweis, keine Rechtsberatung |
| `trust.site_privacy` | 2 | Link mit Text oder Ziel Datenschutz oder Privacy; Hinweis, keine Rechtsberatung |

Größenlimit: Gelesen werden höchstens 1 MB entpacktes HTML; die Antwort wird dabei gestreamt entpackt. Ist das Dokument größer, wird es abgeschnitten und der Beleg sagt das. Fehlt eine Angabe im gelesenen Teil, ist der Befund dann "unbekannt" statt "fehlt": für Titel, Beschreibung und Vorschaubild nur, solange der Kopfbereich unvollständig ist, für Impressum und Datenschutz immer. Der Beleg der Erreichbarkeit nennt die entpackte Dokumentgröße und, bei komprimierter Übertragung, zusätzlich die übertragenen Bytes.

Umfang: Geprüft wird genau eine Seite, die Adresse aus dem Website-Feld (nach höchstens drei Weiterleitungen), ohne JavaScript und ohne Unterseiten. Der Bericht führt die Website-Befunde in einer eigenen Gruppe "Website" und sagt das dort. Verlinkt die README weitere Seiten derselben Website (gleiche Adresse oder Unterpfad), nennt er deren Anzahl als nicht geprüft; abgerufen werden sie nicht.

Ohne Website-Feld oder mit einer Adresse auf github.com sind die Regeln nicht relevant (das Feld selbst bewertet `distribution.homepage`). Ist der Abruf abgeschaltet (`REPOLAUNCH_SITE_CHECK=0`) oder fehlgeschlagen, gelten sie als unbekannt und senken nur die Abdeckung. Enthält das HTML keine Links, aber Skripte, bleiben Impressum und Datenschutz unbekannt, weil RepoLaunch kein JavaScript ausführt.

## Vergleichbarkeit von Scores

Ein Score ist nur innerhalb derselben Regelwerkversion vergleichbar. Neue Regeln, andere Gewichte oder eine geänderte Bewertung verschieben ihn auch ohne Änderung am Repository. Der Bericht nennt die Version deshalb direkt neben dem Score und enthält dazu einen festen Hinweis.

Frühere Audits werden nur verwendet, wenn sie belegbar vorliegen:

- **Analyse per Issue:** Der Workflow sucht in den letzten 100 Issues dieses Repositorys den neuesten früheren Bericht zum selben Repository. Er liest höchstens drei Kommentarlisten und zählt nur Kommentare von `github-actions[bot]`. Neue Berichte tragen dafür einen unsichtbaren Vermerk (`<!-- repolaunch-audit {...} -->`); ältere werden aus dem sichtbaren Text gelesen. Gefunden werden Regelwerk, Score und Commit. Weicht das Regelwerk ab, sagt ein Satz, dass der Unterschied auch vom Regelwerk stammen kann; bei gleichem Commit nennt er das ausdrücklich.
- **Web-App (SQLite):** Aufträge sind privat und nur über ihren Schlüssel lesbar. Ein Abgleich über Aufträge hinweg würde offenlegen, dass jemand anderes dasselbe Repository wann geprüft hat. Deshalb gibt es dort nur den festen Hinweis.
- **Workflow-Formular unter Actions:** keine Historie, fester Hinweis.

Ohne belegten früheren Bericht bleibt es beim festen Hinweis; RepoLaunch erfindet keine Historie.

## Reihenfolge der fünf Aufgaben

Die Aufgaben werden nach diesen Kriterien sortiert, in dieser Reihenfolge (Code: `compareTasks` in `src/core/rules/engine.ts`):

1. Schwere des offenen Teils, absteigend: hoch, mittel, niedrig.
2. Nur bei Projekttyp "Webprodukt / SaaS": Website-Regeln (`scope: "website"`, Gruppe "Website") vor Regeln, die nur das Repository betreffen. Besucher eines Webprodukts sehen zuerst die Website.
3. Offenes Gewicht (Gewicht abzüglich Teilgutschrift), absteigend.
4. Untere Grenze des geschätzten Aufwands in Minuten, aufsteigend.
5. Kategorie: Verständnis, Nutzbarkeit, Vertrauen, Verbreitung und Vermarktung.
6. Position im Regelkatalog. Sie ist für jede Regel eindeutig, daher gibt es keine Gleichstände und die Sortierung ist deterministisch.

Für alle anderen Projekttypen entfällt Kriterium 2. Weil die Schwere direkt aus dem offenen Gewicht folgt (3 hoch, 2 mittel, 1 niedrig), ergibt sich dort genau die Reihenfolge von Regelwerk 2026.10.1.

## Gewichtsmodell

1. Grundgewicht je Projekttyp (`weights`, 0 bis 3).
2. Additive Anpassung je Ziel (`goalAdjust`), Ergebnis auf 0 bis 3 begrenzt. Die Anpassung gilt für alle Projekttypen.
3. Feste Gewichte für einzelne Kombinationen aus Projekttyp und Ziel (`comboWeights`). Sie haben Vorrang und ändern nur genau diese Kombination.

Gewicht 0 heißt "nicht relevant": Die Regel erscheint unter "Nicht bewertete Regeln" und zählt weder im Score noch in den fünf Aufgaben.

### Entscheidung: Webprodukt mit Ziel "mehr Nutzer"

`trust.contributing`, `trust.releases` und `trust.changelog` haben für Projekttyp `webapp` mit Ziel `users` das Gewicht 0, wie bereits `trust.code_of_conduct` und `distribution.contributor_entry`. Begründung: Nutzer eines Webprodukts sehen die laufende Anwendung, nicht das Repository; diese Regeln richten sich an Mitwirkende.

Gewählt wurde Gewicht 0 und nicht eine eigene Gruppe "Für Mitwirkende", weil das vorhandene Modell genau dafür gedacht ist: abgeschaltete Regeln stehen nachvollziehbar unter "Nicht bewertete Regeln" und nennen das Ziel, mit dem sie aktiv würden. Eine Gruppe hätte eine zweite Auswahl der Aufgaben und eine offene Frage zur Score-Wirkung gebracht. Weil `goalAdjust` für alle Projekttypen gilt, ließ sich die einzelne Kombination nur mit dem neuen Feld `comboWeights` ändern; ein Test stellt sicher, dass sich keine andere Kombination verschiebt.

`trust.security_policy` bleibt für diese Kombination bewertet (Gewicht 2).

## Offene Inkonsistenzen (gefunden, nicht geändert)

Stand Regelwerk 2026.10.1. Effektive Gewichte in der Reihenfolge der Ziele users, contributors, sponsors, support_clients, saas_customers.

1. **Beitragsrichtlinien bei Zielen ohne Mitwirkende.** `trust.contributing` hat bei allen Projekttypen für users, sponsors, support_clients und saas_customers Gewicht 1 (bei `webapp` jetzt außer users), während `trust.code_of_conduct` und `distribution.contributor_entry` dort 0 haben. Betroffen: 19 Kombinationen.
2. **Releases und Changelog bei Webprodukten mit anderen Nutzerzielen.** `trust.releases` und `trust.changelog` haben für `webapp` mit sponsors, support_clients und saas_customers weiter Gewicht 1. Für saas_customers gilt dieselbe Begründung wie für users: Kunden eines gehosteten Produkts sehen das Repository nicht.
3. **Releases, Changelog und Beitragsrichtlinien bei Vorlagen.** Für `template` haben `trust.releases` und `trust.changelog` bei allen Zielen Gewicht 1. Wer eine Vorlage über "Use this template" nutzt, bezieht keine Releases. Zu prüfen.
4. **Ziel hebt eine für den Typ abgeschaltete Regel an.** `usability.visual_demo` hat für `library` Gewicht 0, durch `goalAdjust.saas_customers = 1` aber bei library mit saas_customers Gewicht 1. Ursache: `goalAdjust` wirkt auch auf Typgewicht 0. Sonst tritt das nur bei Regeln auf, die absichtlich nur über das Ziel aktiv werden (funding, commercial_offer, code_of_conduct, contributor_entry).
5. **Einrichtungsregeln bei Webprodukten mit Ziel users.** `usability.quickstart` (2), `usability.prerequisites` (2) und `understanding.example` (1) richten sich an Personen, die das Projekt selbst installieren. Für ein gehostetes Webprodukt gilt dieselbe Begründung wie für Releases, für selbst gehostete Webanwendungen (Docker Compose) nicht. Das Regelwerk unterscheidet diese beiden Fälle bisher nicht.
