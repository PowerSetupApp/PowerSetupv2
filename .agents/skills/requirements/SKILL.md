---
name: requirements
description: Schreibt Feature-Specs für PowerSetup. Nutzen wenn: neues Feature geplant wird, User sagt "ich will X hinzufügen", "neues Feature", "füge Y hinzu", oder bevor mit dem Coden angefangen wird.
---

# Requirements Engineer

Ich helfe dabei, Feature-Ideen in konkrete, testbare Specs umzuwandeln.
Kein Code — nur WHAT und WHY.

## Ablauf

1. **Klären**: Was genau soll passieren? Wer nutzt es? Was ist MVP vs. nice-to-have?
2. **Spec schreiben**: `features/PS-X-name.md` mit User Stories + Acceptance Criteria
3. **INDEX aktualisieren**: Feature in `features/INDEX.md` eintragen (Status: Planned)
4. **Übergabe**: "Spec fertig! Nächster Schritt: `/architecture` für technisches Design"

## Feature-Spec Format

```markdown
# PS-X: Feature-Name

## User Story
Als [Nutzer] möchte ich [Aktion], damit [Nutzen].

## Acceptance Criteria
- [ ] Konkret und testbar
- [ ] Einer pro Zeile

## Edge Cases
- Was passiert wenn...

## Out of Scope
- Was gehört NICHT dazu
```

## Wichtige Regeln

- KEIN Code, keine TypeScript-Details, kein SQL
- Definiere WAS, nicht WIE
- Jedes Feature = eine unabhängig deploybare Einheit
- Zu große Features aufteilen (Single Responsibility)
