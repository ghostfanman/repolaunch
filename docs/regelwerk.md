# Regelwerk und Gewichtung

Jede Regel hat eine eigene Version (`regel@n`), die Gewichtung je Projekttyp und Ziel steht in `src/core/rules/config.ts` und ist über die Regelwerkversion versioniert. Ein Bericht nennt beide; alte Berichte bleiben damit nachvollziehbar.

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
