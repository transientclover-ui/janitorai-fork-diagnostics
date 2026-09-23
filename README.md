# JanitorAI Fork Diagnostics

Privacy-first beta userscript for recent Fork destinations and local diagnostics. MIT licensed; independent community project, not affiliated with JanitorAI.

## Install

1. Install a userscript manager such as Violentmonkey or Tampermonkey.
2. Open the raw `dist/janitorai-fork-diagnostics.user.js` file from this repository and install it in the manager (or import the local file).
3. Open a JanitorAI chat. Select the site's native **Fork** / **Fork into new chat** control. Open the small **Fork history** button in the lower right.

This script observes the site's Fork action; it never performs a fork. A destination appears when a distinct `/chats/<numeric ID>` URL is observed within 45 seconds. If the site opens a new tab, keeps the same URL, uses a different button label, or completes after the window, the attempt remains unknown. A destination observation is a navigation correlation, not proof that the server copied every message. A click with no observed destination is **not** counted as a failure.

## Privacy

Data stays in this browser's localStorage under separate keys: `nfi:history:v1` holds clickable, canonical chat URLs; `nfi:diagnostics:v1` holds only timestamp, outcome, signal, elapsed time, and an internal correlation ID. Export and copy use a fixed allowlist that omits IDs and URLs. Reports never contain chat content, credentials, cookies, tokens, character definitions, or source/destination chat IDs. The script does not read messages or make network requests. URLs can still expose private chats to someone with access to this browser profile; use **Delete local data** to remove history and diagnostics. Choose retention (7/30/90/365 days and 25/100/250 entries). Browser data deletion also removes this data. This beta does not collect prior forks automatically.

## Development

Node 20+: `npm test` and `npm run build`. Edit `src/core.js` and `src/app.js`, then commit the generated `dist/*.user.js`. No runtime dependencies or build packages.

## Investigation and limits

The public site could not be inspected directly in this environment: its browser security policy blocked access. Public examples show numeric `/chats/<id>` links and community reports describe “Fork into new chat” as opening a branch. Neither establishes the private request endpoint, response schema, precise button markup, or failure behavior. This beta does not intercept fetch/XHR, responses, cookies, or page state. No endpoint is assumed. A userscript can observe clicks and same-tab URL changes without reading chat data; it cannot infer a confirmed server failure from silence. The existing browser policy prevented an authenticated end-to-end fork, so native button matching and destination capture need live validation on JanitorAI. If the UI differs, file a sanitized issue with only the button's visible label and whether same-tab navigation occurred. Do not attach private URLs or network logs.

## Planned, not implemented

A future GitHub Pages community dashboard could plot aggregated fork outcomes and outage trends. Any community diagnostic collection must be explicit opt-in, offer a report preview and per-submission consent, publish a schema and retention policy, and audit aggregation so private URLs and identifiers never leave the browser. Outage graphs would require independently validated signals and sufficient samples; unknown outcomes cannot be called outages. This beta sends no telemetry.
