# Western Legends Frontier Director

A vanilla HTML/CSS/JavaScript PWA prototype for a Western Legends companion app.



## v1.1.3 interactive Fight Flow

- Reworked Fight Flow into an interactive, module-aware fight assistant.
- Added a Fight Type selector grouped into Player and NPC fights; Outlaw/Claim Jumper and Train Guard appear only when their modules are active.
- The visible flow now contains only concise step text; tapping a step opens a tap-anywhere-to-close rule detail overlay.
- Win/loss result cards change to the selected fight type.
- NPC card selection includes an Auto-Select action that opens the existing Fight Card helper already preset to the selected NPC.
- The Fight Card helper now has Bandit (2), Bank Guard (3), Sheriff (4), and Other presets; Other allows manual card-count adjustment.

## v1.1.2 refinement

- Made the home status card use the same translucent, blurred parchment treatment whether a game is active or not.
- Moved the Companion Menu heading into the close-button row and standardized drawer buttons to a one-line height.
- Changed the active-game drawer label from Continue Game to Resume Game.
- Simplified About & Support to About; version/update controls now live inside About.
- Restored the top-right control to an audio-only speaker action with Sound Controls / Audio labeling.
- Simplified Final Tally: scoring reminders are collapsed by default, player names/characters use a clearer hierarchy, and the highest LP winner is detected automatically.
- When the highest LP is tied, only the tied players are shown in a tie-resolution choice, with Shared Victory available if the normal tie-breakers still do not resolve the game.
- Newspaper final scoring now supports shared winners.

## Run locally

Extract the zip, open Command Prompt in this folder, then run:

```cmd
py -m http.server 8080
```

Open:

```text
http://localhost:8080
```

If `py` does not work, try:

```cmd
python -m http.server 8080
```


### v1.1.2
- Fixed Final Tally score-field alignment by reserving a permanent winner-star column and moving the star to the far right.
- Replaced Fight Flow accordion steps with a top-to-bottom flowchart including NPC/player and win/loss branches.
- Replaced Point Reference bullets with scannable action rows using existing in-app icons.

## What changed in this version

- Portrait/mobile-first layout.
- Light parchment and watercolor visual direction.
- Three primary event triggers are prominent clickable western panels.
- Trigger titles are rendered as live text using a western display font, with keyword colors controlled by JSON.
- Repeated small trigger text below the artwork was removed.
- Player-specific status bar was removed.
- Active Story Triggers and World Effects appear below the primary triggers.
- Trigger imagery is driven by SVG assets in `assets/images/triggers`.

## Data-driven trigger title example

```json
{
  "id": "trig_defeat_bandit",
  "label": "A player defeats a Bandit",
  "titleParts": [
    { "text": "DEFEAT A", "style": "normal" },
    { "text": "BANDIT", "style": "red" }
  ],
  "image": "assets/images/triggers/bandit.svg",
  "themeColor": "red"
}
```

Supported title keyword styles currently include `red`, `blue`, `green`, `gold`, and `brown`.

## Notes

The app references Google Fonts (`Rye` and `IM Fell English`) for the western typography. If offline font loading is needed later, use locally licensed font files in your own private project, but do not redistribute font files unless the license permits it.
