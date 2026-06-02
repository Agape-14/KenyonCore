# KenyonCore — Job Tracker

A division-aware job-site tracking module for the KenyonCore app suite. Tracks
active job sites on an interactive map, manages status/notes, gives one-tap
directions, and supports **bulk project import from a standard Excel template**.

This is a rebuild of the original Replit/Streamlit "Kenyon Plastering Job
Tracker," re-skinned to the KenyonCore navy design system and re-architected as
a portable, self-contained front-end that an IT team can wrap as a WordPress
plugin.

## Run it

It's a single self-contained file — no build step, no server:

```
open job-tracker/index.html        # macOS
# or just double-click the file, or serve the folder with any static host
```

All third-party libraries (Leaflet, MarkerCluster, SheetJS) load from CDNs.

## Key features

- **Divisions** — every division is its own company with its own jobs. Switch
  divisions from the top-right selector; all views and the dashboard scope to
  the selected division.
- **Map** — clustered, color-coded pins (Active / Upcoming / On Hold /
  Completed) on a clean CartoDB Positron basemap. Click a pin for details +
  Google Maps directions.
- **Jobs list** — live search, status filter, inline status/notes/contact
  editing (saves instantly), delete-with-confirmation.
- **Add Job** — geocodes the address automatically (no manual coordinates).
- **Bulk Import** — upload the standard `.xlsx`/`.csv`, the app validates +
  geocodes every row, then shows an **exceptions-only** review screen. Clean
  rows import automatically; only problem rows need a human.

## Standard import template

Download it in-app (**Bulk Import → Download Template**). Columns:

| Column | Required | Notes |
|---|---|---|
| Job Name | ✅ | |
| Address | ✅ | Street only |
| City | ✅ | |
| State | ✅ | |
| Job Number | | Internal # |
| Zip | | |
| Status | | `Active` / `Upcoming` / `On Hold` / `Completed` (blank = Active) |
| Superintendent | | Site contact |
| Start Date | | |
| Notes | | |
| Division Code | | Overrides the selected division per-row. Must be a valid code. |
| Latitude / Longitude | | Leave blank — auto-geocoded. Fill only to override the pin. |

Validation flags missing required fields, unknown statuses, unknown division
codes, addresses that can't be geocoded, and low-confidence matches.

## Divisions

| Code | Division |
|---|---|
| BLKSAN | San Diego |
| BLKONT | Fontana |
| BLKDEN | Denver |
| BLKPHX | Phoenix |
| BLKLVK | Livermore |
| BLKSMF | Sacramento |
| BLKSCK | Stockton |
| BLKFAT | Fresno |
| BLKABQ | New Mexico |
| BLKRNO | Reno *(code inferred — confirm)* |
| BLKTUS | Tucson *(code inferred — confirm)* |
| BLKVIS | Visalia *(code inferred — confirm)* |

Edit the `DIVISIONS` array near the top of the `<script>` block to change these.

## Architecture notes (for the WordPress / backend handoff)

The UI talks to data **only** through the `Store` object. It's currently backed
by `localStorage`; every method is async and returns a Promise, so swapping in a
real backend means replacing the method bodies — **no UI changes**:

```js
Store.listJobs(division)     // -> Promise<Job[]>
Store.addJob(job)            // -> Promise<Job>
Store.addJobsBulk(jobs)      // -> Promise<Job[]>
Store.updateJob(id, patch)   // -> Promise<Job>
Store.deleteJob(id)          // -> Promise<bool>
```

To wire WordPress: register a custom table (or CPT) + REST routes and have these
methods `fetch()` the WP REST API (with a nonce). Because they're already
async, the rest of the app is untouched.

Geocoding is similarly isolated behind the `Geocoder` module. Default provider
is OpenStreetMap **Nominatim** (free, no key, throttled to respect their usage
policy). To switch to Google later, implement a `google()` provider in the
module and point the `provider` constant at it — callers don't change.

### Known limitation today
`localStorage` is per-browser, so data isn't shared between users yet. Bulk
upload → shared map for the whole team requires the backend swap above. This was
the agreed-on path: build the full UI + pipeline now, wire the shared backend
next.
