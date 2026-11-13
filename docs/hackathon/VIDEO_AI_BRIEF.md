# BurnCal — AI Video Generator Brief
**Purpose:** Local NASA Space Apps Cairo 2026 registration video (proposal stage)  
**Team:** NileSpark · **Product:** BurnCal  
**Challenge:** Harmonization of MODIS and VIIRS Hot Spots  
**Duration:** 90 seconds maximum (target **85–88 s**)  
**Aspect:** Landscape **16:9** (1920×1080 or 1280×720)  
**Language:** English  
**Style:** Professional documentary + data viz · Voice-over + B-roll (no talking heads required)  
**Audio:** Clear single VO, light ambient underscore (optional, low volume), no lyrics  
**Export:** MP4 H.264 · public YouTube or Google Drive link (Anyone with link → Viewer)

---

## Master prompt (paste into any tool’s “overall style” / system field)

```
Create an 85–90 second landscape 16:9 cinematic explainer video for a NASA Space Apps hackathon proposal.
Tone: urgent but hopeful, scientific, clean, modern.
Visual language: Earth observation, satellite thermal imagery aesthetic, abstract data overlays, Nile River geography, fire/hotspot dots on maps, calendar heatmaps — NOT sci-fi lasers, NOT horror fire, NOT fake NASA logos or seals.
Color palette: deep navy #0B1F33, sand #E8D5B7, ember orange #E85D04, cool teal #2A9D8F, soft white text.
Motion: slow pans, gentle zooms, particle-like hotspot dots appearing, calendar cells lighting up.
No talking heads. Voice-over only. On-screen text sparse and large.
This is a PLAN for a hackathon project, not a finished product demo — show conceptual UI mockups labeled as concept.
```

---

## Negative prompts / do-nots (all tools)

```
Do NOT: NASA official logo or seal, fake "approved by NASA" badges, stock horror wildfire victims, gore, political maps disputes, cluttered dashboards, emoji, purple neon AI cliché, cyberpunk city, readable fake personal data, unfinished UI claiming "live production", watermarks from other brands, vertical phone framing, text smaller than readable at 1080p, Arabic text (English only for this cut).
```

---

## Full voice-over script (speak aloud ~145–155 words ≈ 85–90 s at calm pace)

**VO (English, clear, mid-tempo, confident student-engineer tone):**

> Across more than twenty years, satellites have watched Earth’s burning activity—wildfires and agricultural burns bright enough to see from space.
>
> But the record is split. MODIS and VIIRS hotspots cannot be compared directly. Different resolution. Different sensitivity. Different timing. Fire managers lose the single calendar they need.
>
> We are NileSpark—six students from SVNU in Upper Egypt. Our project is BurnCal: a web app that harmonizes NASA FIRMS MODIS and VIIRS hotspots into one burning-activity calendar.
>
> Select any region—our story starts along the Nile—choose dates, and see seasons, anomalies against the historical median, and download a CSV for action.
>
> During NASA Space Apps Cairo, we will build the harmonization pipeline and the interactive map. One spark. A clearer fire history for responders, scientists, and land managers.

**Word count:** ~148  
**Suggested VO voice:** English (neutral / light international accent), male or female, age 20–35, “documentary narrator,” not robotic.

---

## Timed beat sheet (use these exact cuts)

| Beat | Time | VO (approx) | Visual goal |
|------|------|-------------|-------------|
| 1 | 0:00–0:12 | “Across more than twenty years…” | Earth from space → thermal glow patches |
| 2 | 0:12–0:28 | “But the record is split…” | Split-screen MODIS vs VIIRS mismatch |
| 3 | 0:28–0:42 | “We are NileSpark…” | Nile corridor map + team name title |
| 4 | 0:42–0:62 | “Select any region…” | Concept UI: AOI draw → calendar → CSV |
| 5 | 0:62–0:85 | “During NASA Space Apps Cairo…” | Hackathon build montage → end card |
| End | 0:85–0:88 | silence / soft music fade | End card hold |

---

## Scene-by-scene prompts (copy one scene per generation, then stitch)

### SCENE 01 — Cold open (0:00–0:12) · 12s
**On-screen text:** `EARTH'S BURNING ACTIVITY` (fade in at 2s, out at 10s)  
**VO:** “Across more than twenty years, satellites have watched Earth’s burning activity—wildfires and agricultural burns bright enough to see from space.”

**Visual prompt:**
```
Wide cinematic shot of Earth at night from orbit, subtle infrared/thermal orange-red hotspots flickering over continents, slow push-in, documentary style, deep navy space, soft atmospheric glow, photoreal satellite aesthetic, 16:9, no logos, no text in the image itself.
```

**Transition out:** Cross-dissolve 12 frames.

---

### SCENE 02 — The split problem (0:12–0:28) · 16s
**On-screen text:**  
- `MODIS` (left)  
- `VIIRS` (right)  
- then center: `NOT DIRECTLY COMPARABLE`

**VO:** “But the record is split. MODIS and VIIRS hotspots cannot be compared directly. Different resolution. Different sensitivity. Different timing. Fire managers lose the single calendar they need.”

**Visual prompt:**
```
Clean motion-graphics split screen: left panel labeled conceptually as coarser grid of fire detection points, right panel denser finer points over the same landscape silhouette; panels drift out of sync then flash a subtle warning gap between them; flat modern data-viz style, navy and ember palette, 16:9, no brand logos.
```

**Optional second clip (stitch inside beat):** Frustrated analyst silhouette looking at dual charts (abstract, no faces needed).

**Transition out:** Hard cut or wipe to map.

---

### SCENE 03 — Who we are + product (0:28–0:42) · 14s
**On-screen text:**  
- `NILESPARK`  
- `SVNU · UPPER EGYPT`  
- `PRODUCT: BURNCAL`

**VO:** “We are NileSpark—six students from SVNU in Upper Egypt. Our project is BurnCal: a web app that harmonizes NASA FIRMS MODIS and VIIRS hotspots into one burning-activity calendar.”

**Visual prompt:**
```
Elegant top-down stylized map of the Nile River corridor through Upper Egypt, soft sand and teal tones, animated ember dots representing hotspots consolidating into a single unified layer, title-safe space for text overlay, hopeful and clear, 16:9, no national emblems, no NASA seal.
```

**Transition out:** Zoom into UI mock.

---

### SCENE 04 — How BurnCal works (0:42–0:62) · 20s
**On-screen text (sequence):**  
1. `1 · SELECT AREA`  
2. `2 · HARMONIZE MODIS + VIIRS`  
3. `3 · BURNING CALENDAR + ANOMALIES`  
4. `4 · DOWNLOAD CSV`

**VO:** “Select any region—our story starts along the Nile—choose dates, and see seasons, anomalies against the historical median, and download a CSV for action.”

**Visual prompt:**
```
Concept web-app interface mockup, dark navy UI, map with a user drawing a polygon over a river valley, then a monthly calendar heatmap lighting from cool teal to ember orange, a small sparkline labeled as anomaly versus median, and a simple CSV download button; crisp UI animation, product-demo style clearly marked as concept, 16:9, large readable UI, no real personal data.
```

**B-roll inserts (2–3s each if tool supports multi-shot):** calendar cells pulsing; CSV rows scrolling abstractly.

**Transition out:** Soft zoom out.

---

### SCENE 05 — Hackathon close (0:62–0:85) · 23s
**On-screen text:**  
- `NASA SPACE APPS CAIRO 2026`  
- `BUILD: HARMONIZATION + INTERACTIVE MAP`  
- `FOR RESPONDERS · SCIENTISTS · LAND MANAGERS`

**VO:** “During NASA Space Apps Cairo, we will build the harmonization pipeline and the interactive map. One spark. A clearer fire history for responders, scientists, and land managers.”

**Visual prompt:**
```
Montage of collaborative building energy without showing real faces: laptop screens with code and maps, whiteboard sketches of a calendar, abstract network of data flowing into a glowing single spark that expands into a calm illuminated calendar grid; inspiring, grounded, 16:9, navy-sand-ember palette.
```

**Transition out:** Fade to end card.

---

### SCENE 06 — End card (0:85–0:88) · 3s hold
**On-screen text (final frame, static OK):**

```
NILESPARK
BurnCal
Harmonized MODIS + VIIRS Burning Calendar
NASA Space Apps Cairo 2026 · On-site
SVNU · Qena & Luxor
```

**Visual prompt:**
```
Clean end card, deep navy background, subtle Nile line watermark, ember spark icon, white and sand typography, minimal, 16:9, no logos of NASA or sponsors.
```

**Audio:** Music fade out; no VO.

---

## Alternate single-shot prompt (if the tool only allows one generation)

```
85–90 second 16:9 English explainer. Style: documentary Earth-observation + clean data UI.
Sequence: (1) Earth at night with thermal hotspots; (2) split MODIS vs VIIRS mismatch graphics; (3) Nile corridor map with unifying hotspot layer and titles NileSpark / BurnCal / SVNU Upper Egypt; (4) concept web UI—draw AOI, burning calendar heatmap, anomaly vs median, CSV download; (5) hackathon build montage ending on navy end card with NileSpark and BurnCal.
Palette: navy, sand, ember orange, teal. Voice-over narrates the problem of incomparable MODIS/VIIRS fire records and BurnCal as a harmonized burning-activity calendar web app for responders and land managers. No NASA logo, no talking heads, no vertical video, concept UI only.
```

---

## Caption / subtitle file (optional burn-in or SRT)

Use the VO script broken into lines ≤42 characters where possible:

```
1
00:00:00,000 --> 00:00:06,000
Satellites have watched Earth's burning
activity for more than twenty years.

2
00:00:06,000 --> 00:00:12,000
Wildfires and agricultural burns
visible from space.

3
00:00:12,000 --> 00:00:20,000
But MODIS and VIIRS hotspots
cannot be compared directly.

4
00:00:20,000 --> 00:00:28,000
Different resolution, sensitivity,
and timing break the fire calendar.

5
00:00:28,000 --> 00:00:36,000
We are NileSpark — SVNU students
from Upper Egypt.

6
00:00:36,000 --> 00:00:42,000
Our project BurnCal harmonizes
NASA FIRMS MODIS and VIIRS data.

7
00:00:42,000 --> 00:00:52,000
Select a region — our story starts
along the Nile — and choose dates.

8
00:00:52,000 --> 00:01:02,000
See seasons, anomalies versus the
historical median, and download CSV.

9
00:01:02,000 --> 00:01:12,000
At NASA Space Apps Cairo we will build
the pipeline and interactive map.

10
00:01:12,000 --> 00:01:25,000
One spark. A clearer fire history
for responders, scientists, and land managers.
```

---

## Music / SFX guidance

- Bed: low ambient electronic or soft documentary piano, 70–90 BPM, −20 to −26 dB under VO.  
- SFX (subtle): soft “data tick” when calendar cells light; soft whoosh on scene changes.  
- No sirens, no screaming, no explosive fire crackle spikes.

---

## Post-production checklist (Mahmoud)

- [ ] Total length ≤ **1:30** (prefer ≤1:28)  
- [ ] Landscape 16:9 only  
- [ ] VO loud and clear; music ducked under speech  
- [ ] On-screen text readable on phone  
- [ ] No NASA seal / fake endorsement  
- [ ] End card shows **NileSpark** + **BurnCal**  
- [ ] Export MP4  
- [ ] Upload YouTube (Unlisted or Public) **or** Drive (Anyone with link)  
- [ ] Open link in incognito — must play without login  
- [ ] Paste link into local Cairo registration form with proposal PDF  

---

## One-line description (for YouTube/Drive title)

`NileSpark — BurnCal Proposal | NASA Space Apps Cairo 2026 | MODIS–VIIRS Harmonized Burning Calendar`

## YouTube description (paste)

```
Proposal video for NASA Space Apps Cairo 2026 (local registration).

Team: NileSpark (SVNU — Qena & Luxor)
Product: BurnCal
Challenge: Harmonization of MODIS and VIIRS Hot Spots

BurnCal is our planned web app to harmonize NASA FIRMS MODIS and VIIRS active-fire hotspots into a burning-activity calendar with AOI selection, anomaly views, and CSV export.

This video describes our plan for the hackathon — not a finished product.
```
