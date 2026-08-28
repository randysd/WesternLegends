## v1.1.24 — Event Dialog Callout Cleanup

- Event dialogs no longer auto-generate an **Effect** callout from the same effect payload that is already described by the main instruction text.
- The parchment callout remains available for genuinely additional authored information via `calloutText`, `displayText`, or an explicit `showEffectCallout` opt-in.
- Reward callouts are shown only when `rewardText` adds information that is not already stated in the main event instruction.
- This keeps common One-Off, Character Arc, Storyline, and World Event dialogs shorter while preserving the existing callout style for complex events that actually benefit from it.

## v1.1.23 — Event Text + Player Prompt Cleanup

- Removed redundant `For the next X primary triggers` wording from World Event and ongoing-event display text; duration remains represented by the live number + hourglass counter.
- Event dialog effect lists no longer repeat `Lasts X primary triggers`; the duration effect remains active internally.
- Player-selection prompts now use the same true circular player-color swatches used by Setup and the Story Point indicators, with larger touch targets for mobile.

## v1.1.22 — Ongoing Story Heading Alignment

- Personal ongoing stories now place the player-color circle beside the complete source/title heading block, so the blue arc name and title align.
- The personal owner circle matches the 34px Story Point indicator size.
- Removed the redundant `World Event` subtitle inside the `Current World Event` section.
- Increased the active-event countdown number and filled hourglass icon for phone readability.

## v1.1.21 — Ongoing Story Card Hierarchy

- Restored personal-story ownership to a compact circular player-color marker immediately left of the story title; removed the vertical color rail and visible "Player only" ownership copy from the card body.
- Moved the blue story/source label above each card title (for example, "The Starving Prospector" and "World Event").
- Renamed the story section to **Ongoing Stories** and added a compact count badge so multiple simultaneous story threads are obvious at a glance.
- Renamed the single-world-event section to **Current World Event**, matching the engine rule that only one World Event is active at a time.
- Replaced the countdown hourglass path with a blocky, solid filled silhouette matching the supplied reference image; it inherits the countdown number color.

## v1.1.19 — Active Story Ownership Clarity

- Personal Character Arc tasks now explicitly retain a player owner; global storyline tasks are stored without an owner and may be resolved by any player.
- Personal active-story rows show a true circular player-color marker plus a compact "Player only" cue. Global storyline rows show "Any player" instead of a misleading player color.
- Global story resolution now asks which player resolved the task when Story Point tracking is enabled, so the Story Point goes to the actual resolver rather than the player who happened to reveal the storyline.
- Replaced the emoji hourglass with a monochrome SVG silhouette that inherits the countdown number color.

## v1.1.18 — Active Event Row Cleanup

- Removed the decorative left-side icon from Active Story Trigger and Active World Effect rows so the event text gets substantially more horizontal space.
- Compressed duration display to a number plus hourglass icon; the accessibility label/tooltip clarifies that the number is remaining primary action triggers.
- Player-specific active stories now use the same round player-color swatch styling used elsewhere in setup and the Story Point track instead of a square color block.
- Confirmed World Events remain time-started and can appear while Character Arc/Story Trigger cards are already active. Only one World Event is active at a time.
- Kept active-event expiration action-based: durations advance only when one of the three primary action cards is tapped. Resolving an active story does not consume another duration step, preventing double-counting when the same tabletop action satisfies both a primary trigger and an active story condition.

## v1.1.17 Story Point Reminder Slot
- Restores the original compact circular player-colored Story Point markers with the current track number centered.
- Story Point reward reminders now temporarily replace the marker row inside the same fixed-height area, so Event Triggers and other gameplay content never shift.
- Reminder identifies the player with name + color dot, is tap-to-dismiss, and auto-dismisses after a few seconds.
- Real event dialogs are independent; a reminder never queues or blocks them, and its timeout waits while a story dialog is open so the reminder is not silently missed underneath it.
- Preserves the optional Do not show again preference without adding icons to the normal Story Point markers.


## v1.1.16 First Player + Story Track UI
- First Player selector X now truly closes the full-screen selector instead of navigating back into Game Assist.
- Added a persistent Start Over button at the bottom of the First Player selector.
- Story Point rewards no longer queue or delay narrative event dialogs.
- Player Story Point indicators are wider pills showing current position plus the latest reward icon (Sheriff badge, Bandit, or star).
- The optional Story Point explanation is now an inline game-page reminder with Dismiss and Do not show again; it never overlays events.

# Western Legends Frontier Director

## v1.1.15 World Event reliability

- New Game > Setup now offers **Guided** and **Checklist** views. Guided mode focuses on one conditional setup section at a time, shows total progress, keeps reference images behind a tap, auto-advances after a completed section, and saves checklist progress until the game starts.
- The Story setup card now independently controls **One-Off Events**, **Story Arcs**, and **World Events**, each with Rare / Standard / Frequent frequency settings.
- Story Point rewards no longer use the narrative event dialog. They appear as compact player-colored notifications above the bottom navigation; Sheriff reminders dismiss on tap, while Bandit/point rewards expose only the required choices.
- Story Arc continuations are deterministic after an arc starts. Personal character arcs remain tied to the player who began them; major storylines are global.
- World Events no longer compete in the primary-trigger random roll. They use a saved randomized real-time clock and appear at the next natural interaction when due.
- One-Off coverage was expanded from 62 to 72 events so every current primary trigger has at least one one-off event.
- Added `EVENT_CONTENT_AUDIT.md`, `VOICEOVER_PRODUCTION.csv`, and `data/audio-production-manifest.json` for event/voiceover review. The manifest currently identifies 15 existing MP3s and 105 recordings still to produce.

A vanilla HTML/CSS/JavaScript PWA prototype for a Western Legends companion app.

## v1.1.7 final tally & visual consistency

- Final Tally removes its introductory subtext and enlarges scoring reminder typography.
- Final Tally actions use compact **Back** plus full-width **Newspaper** controls.
- Newspaper actions use **Back**, **Save**, then a full-width **Finish Game** action.
- The Gazette now displays the current device-local date beneath the masthead and uses an old print/newspaper typography treatment.
- About copy and Game Assist button text are enlarged for consistency and readability.
- Companion Menu, Quick Reference, Game Assist, Audio, About, setup, Final Tally, and rule-detail overlays now share one parchment dialog surface.




## v1.1.6 reference & actions update

- Companion Menu uses clean leather-style buttons without diagonal striping.
- Turn Summary is now a three-part Start / Actions / End accordion with module-aware reminders.
- New Actions dialog provides expandable action/location rules and direct Fight Flow, Gambling Flow, and Dice Roller links.
- Gambling Flow now uses the same interactive vertical flowchart language as Fight Flow and includes contextual Poker Hands access.
- Game Assist group headings have simple line icons while helper buttons remain text-only.
- Final Scoring uses one concise expandable reminder per scoring rule.
- About version styling is more readable and the Support button is text-only.

## v1.1.4 reference cleanup

- Fight Card helper hides the manual card-count control for Bandit, Bank Guard, and Sheriff; Other keeps a centered +/- count control.
- Game Assist helper buttons are text-only; the redundant NPC Fight Cards helper/reference was removed.
- Final Scoring is now a compact set of per-item expandable reminders with brief scoring cues.
- Built from the user-provided app.js so the latest Risk Die changes are preserved.


### Risk Die asset note

The user-provided `app.js` references `risk-blank.png`, `risk-wound.png`, `risk-woundwound.png`, `risk-sp.png`, and `risk-woundsp.png`. Those files were not included with the uploaded source file or the prior packaged build, so the die renderer now falls back to readable face text if an image is unavailable. When those images are present under `assets/images/dice/`, they are used normally.

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

## v1.1.6 readability & action cleanup
- Preserves IM Fell English for western body copy while rendering digits 0-9 with a clearer Georgia-style numeral face.
- Renames Quick Reference `Turn & Actions` to `Turn/Actions`; Start/Actions/End accordions use solid triangle indicators and Train reminder uses normal body weight.
- Rebuilds Location actions as alphabetical peer panels with independent module visibility: Challenge, Claim, Frontier, Recruit, Repair, Trail, Trader, and Travel By Rail are no longer nested inside other actions.
- Adds Blood Money > Ruins to setup so Repair/ruin-dependent Work wording can be enabled.
- Restores Prospecting/Risk die art to fill the complete 3D die face.
- Restyles Game Assist helper cards with compact leather/plaque buttons and shorter helper descriptions.
- Removes the diagonal stripe layer from generic leather-styled action buttons.


### v1.1.9 module-selection behavior

Expansion checkboxes now use standard parent/child tri-state behavior. Selecting an expansion selects all of its modules. Deselecting one or more child modules puts the expansion into an indeterminate/partial state; clearing every child clears the expansion; clicking a partial expansion selects all children again; and clicking a fully selected expansion clears all optional child modules. Base Game remains required.

### v1.1.10 readability pass
- Raised small/meta/subtext typography consistently across dialogs, reference panels, setup panels, helper cards, and expandable content.
- Enlarged the Home page active-game summary, including player chips, player/LP/story facts, and active-story/world-effect status.
- Enlarged Fight Flow/Gambling context chips and compact phase/category labels without flattening the overall type hierarchy.
- Increased Game Assist button titles/subtext and compact cross-reference button labels for table-distance readability.


### v1.1.11 text spacing pass
- Tightened ordinary wrapped reading copy to a consistent `1rem` line-height across dialogs, reference/setup panels, helper descriptions, Final Tally copy, About text, and home status text.
- Preserved custom spacing for the three primary event trigger cards, headings/display titles, buttons, and newspaper typography.
- Specifically reduces excess spacing inside wrapped Turn Summary bullets such as the End phase example.

### v1.1.15
- World Events now use a 15-second heartbeat in addition to their persisted timestamp, so an event becomes visible when due even if no trigger is tapped at that exact moment.
- Frequent World Events are now scheduled 5-8 minutes apart (Standard 15-25, Rare 30-45).
- Changing the World Event frequency during an existing saved game immediately rebuilds the timer.
- The service worker bypasses Range requests and never attempts to cache HTTP 206 Partial Content responses.

### v1.1.20
- Moved personal active-story ownership to a thin player-color rail at the card edge, preserving title width.
- Replaced the active-event hourglass with a solid currentColor SVG silhouette.


### v1.1.25
- Gives Who Triggered/Who Resolved player-color prompts a full-width event title below the close button so long trigger names wrap less.
- Scales player-color chooser circles down responsively so all six standard colors fit on one row on normal phone widths.


## v1.1.30 - Setup flow, live game settings, and story-owner alerts

- Game Setup now uses **Next** at the bottom of Modules and Basics; **Start Game** appears only at the bottom of the final Setup panel.
- Added **Game Settings** to the Companion Menu for an active game. Modules remain fixed, while One-Off Events, Character Arcs, World Events, their frequencies, Story Point tracking, and Story Point reward reminders can be changed live.
- Removed the redundant **Skip** button from the "Who Triggered This?" player-color dialog; the top-right X remains the cancel/close action.
- Player Story Point circles now show a small **!** when that player owns an unresolved story chapter. If Story Point tracking is off, only players with unresolved chapters appear as color circles with a centered **!**.
- Alert-only player circles can be tapped to jump to that player's unresolved story.

## v1.1.29 - Shared Character Arc chapter continuity
- Character Arcs are now shared stories: any player may trigger a later eligible chapter.
- Each revealed chapter is owned only by the player who triggered that chapter.
- Arc progress remembers the player and outcome for every completed chapter.
- Later chapters can use same-player vs. different-player text, preserving NPC memory without locking the story to one player.
- Existing Character Arcs include player-aware follow-up text where the prior encounter matters.
- Multiple Character Arcs continue independently at different chapter positions.
- Pending continuation triggers retain a strong draw-weight boost so ongoing stories are more likely to keep moving.

## v1.1.28 - Trigger title color callouts
- Restored selective colored keywords on event-trigger cards while retaining concise card wording.
- Fixed the extra vertical gap between normal and colored title fragments by replacing stretched grid rows with naturally wrapping title fragments.
- Trigger title font sizing is unchanged from v1.1.25/v1.1.27, and words are never split mid-word to make them fit.
