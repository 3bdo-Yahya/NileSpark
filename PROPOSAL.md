# BurnCal
## NASA Space Apps Cairo 2026 — Team Proposal
**Team:** NileSpark  
**Challenge:** Harmonization of MODIS and VIIRS Hot Spots  
**Local event:** Cairo (On-site) — Sewedy University of Technology (SUT), 13–14 November 2026

---

### Executive Summary (300 words max)

We selected the 2026 NASA Space Apps Challenge *Harmonization of MODIS and VIIRS Hot Spots* because fire managers still lack one comparable long-term view of burning activity. NASA FIRMS provides more than two decades of active-fire hotspots, yet MODIS and VIIRS differ in spatial resolution, sensitivity, and overpass timing. Without harmonization, monthly and yearly patterns cannot be trusted as a single timeline.

Our product is **BurnCal**, a web application that (1) harmonizes MODIS and VIIRS FIRMS hotspots into one consistent time series, (2) lets users select an area of interest and date range, and (3) delivers a burning-activity calendar with accessible color ramps, anomaly views against the historical median, and CSV download of hotspots for the search. After harmonization, the sensor of origin no longer blocks analysis—patterns, trends, and anomalies become the focus.

We are NileSpark: six SVNU students from Qena and Luxor. Upper Egypt and the Nile corridor motivate our demo story—agricultural burning, land-use pressure, and the need for clear seasonal signals—while the tool itself remains global for any region FIRMS covers.

BurnCal meets the challenge in two phases during the hackathon: transparent statistical harmonization and density normalization of hotspot counts, then an interactive web map and calendar UI. Target users are early-warning teams, emergency responders, scientists, and land managers who need to see which months and years burned most, and how the current period compares to history.

*(Word count: ~218)*

---

### Problem Definition (150 words max)

Active fires are tracked from space for climate, biodiversity, health, and emergency response. FIRMS archives MODIS (Terra/Aqua) and VIIRS detections, but the records are not directly comparable: resolutions, detection thresholds, and observation schedules differ. As MODIS approaches end of life and VIIRS provides continuity at finer detail, managers inherit a broken timeline—raw dual-sensor tables hide whether a “busy” month is real change or a sensor effect.

Without a harmonized burning-activity calendar for a chosen area, responders cannot quickly see seasonal peaks, multi-year anomalies, or whether the current month is unusual versus the historical median. That gap slows monitoring and weakens planning as fire weather intensifies.

*(Word count: ~118)*

---

### Background & Literature Review (200 words max)

MODIS Fire and Thermal Anomalies products established a multi-decadal global active-fire record; Collection 6 refined detection and fire radiative power retrievals (Giglio, Schroeder, & Justice, 2016). VIIRS active-fire algorithms extend that lineage: the 750 m stream emphasizes continuity with MODIS, while the 375 m product increases detection of smaller fires and improves perimeter consistency (Schroeder et al., 2014; Csiszar et al., 2014). NASA FIRMS packages these detections for near-real-time and archival use.

Existing portals excel at mapping recent hotspots and downloading sensor-specific files. Fewer tools expose a **harmonized** multi-sensor calendar where counts are comparable across the MODIS-to-VIIRS transition and where anomalies versus a multi-year baseline are first-class. Continuity documents note algorithm heritage, but operational users still face dual streams with different sensitivities.

BurnCal builds on that literature: we treat harmonization as an explicit preprocessing step, then prioritize calendar visualization and CSV export for managers—not another raw hotspot dump.

*(Word count: ~155)*

---

### Methodology

We will follow a two-phase process aligned with the challenge.

**Phase A — Harmonization (sensor becomes irrelevant)**  
1. **Ingest:** Pull NASA FIRMS active-fire hotspots (MODIS and VIIRS) for the study window via Earthdata/FIRMS CSV or API.  
2. **Quality filter:** Retain standard confidence classes; drop obvious invalids; keep geolocation, acquisition time, and FRP when available.  
3. **Spatial normalize:** Grid or bin detections to a common analysis cell (e.g., fixed grid over the AOI) so finer VIIRS resolution does not inflate raw point counts versus MODIS.  
4. **Temporal align:** Aggregate to day → month → year using a shared calendar.  
5. **Statistical harmonization:** Estimate overlap-period scaling / density factors between sensors (bias and rate adjustment), apply transparent correction, and produce one harmonized hotspot intensity series. Document assumptions in-app.  
6. **Validate sanity checks:** Compare overlap years; flag residual gaps.

**Phase B — Web application**  
7. **AOI input:** Draw polygon on map or enter lat/lon bounds.  
8. **Query:** Filter harmonized series by AOI + date range.  
9. **Analytics:** Monthly/yearly counts; anomaly vs multi-year median; accessible color ramp.  
10. **Outputs:** Interactive burning calendar + map; downloadable CSV of hotspots for the search.

**Tools (planned):** Python (pandas/geopandas) for pipeline; FastAPI or equivalent for API; React (or similar) + Leaflet/MapLibre for UI; NASA FIRMS/Earthdata as primary data. AI teammates support anomaly scoring and QC heuristics—not a opaque black-box model as the sole harmonizer.

This methodology directly satisfies challenge requirements: harmonize first, then calendar + AOI analytics + CSV.

---

### Solution

**BurnCal** is a planned web app with one sentence of purpose: *one comparable fire calendar from two satellite sensors.*

**How it tackles the challenge**  
- Harmonized MODIS+VIIRS time series so comparisons are meaningful.  
- Interactive AOI (draw or coordinates) and date range.  
- Burning-activity calendar from early-2000s coverage through present (as data availability allows).  
- Color ramps for month-to-month intensity; anomaly view vs historical median.  
- CSV export of hotspots for the selected search.

**Implementation steps during the hackathon**  
1. Wire FIRMS ingest + grid aggregation.  
2. Implement overlap-based scaling and save harmonized table.  
3. Ship map + calendar UI wired to the API.  
4. Add anomaly panel and CSV download.  
5. Demo with Upper Egypt / Nile corridor as story AOI; confirm global AOI still works.

**Requirements coverage:** Phase A removes sensor friction; Phase B delivers the visual calendar tool managers need.

---

### Value Proposition

**Customers:** early-warning and emergency responders, fire scientists, land managers, and agencies watching agricultural and wildland burning.

**Jobs to be done:** “Show me this region’s fire season,” “Is this month abnormal?” and “Give me the hotspot list for my report.”

**Why BurnCal over alternatives**  
- Raw FIRMS downloads force users to reconcile sensors themselves.  
- Single-sensor dashboards break at the MODIS→VIIRS transition.  
- BurnCal sells **comparability + calendar clarity**: harmonized counts, historical median context, and export—in one interactive place.

For Upper Egypt and Nile corridor communities (our motivating story), clearer seasonal signals support monitoring of agricultural burns and unusual spikes, while the same workflow applies worldwide.

---

### Role of Team Members

| Member | Role in BurnCal |
|--------|-----------------|
| **Abdelrahman Yahia** | Team lead; backend API; FIRMS ingest; deployment; submission owner |
| **Salma Gad** | Harmonization math/QC; anomaly vs median; validation checks |
| **Omar Mohamed** | Front-end map, AOI drawing, calendar UI, accessible color ramps |
| **Ali Haggag** | Full-stack glue (API↔UI); CSV export; performance of queries |
| **Maryem Helal** | User narrative, UX copy, demo story (Nile corridor), judge-facing clarity |
| **Mahmoud Abdelhady** | Proposal/demo video; slide/visual assets; final 30s demo cut |

---

### Workflow Strategy

**Collaboration:** Shared repo + WhatsApp/Discord standups every 3–4 hours on-site; one Kanban board (To Do / Doing / Blocked / Done). Abdelrahman owns merge + submission clock.

**Day 1 (13 Nov)**  
- Hour 0–2: Confirm FIRMS access, sample AOI (Upper Egypt), schema.  
- Hour 2–8: Ingest + grid + first harmonization pass.  
- Hour 8–12: API endpoints for AOI query; thin map shell.  
- Checkpoint: harmonized monthly series for demo AOI exists.

**Day 2 (14 Nov)**  
- Morning: Calendar UI, color ramp, anomaly vs median.  
- Afternoon: CSV download, polish, edge cases.  
- Final hours: Local Cairo demo submit (30s video **or** exactly 7 slides) → global Space Apps Project tab.  
- Checkpoint: end-to-end path AOI → calendar → CSV works.

**Rules we will not break:** No pre-built finished product before the hackathon; challenge stays MODIS/VIIRS Hot Spots; local form before global final submit.

---

### Resources

**Data & NASA**  
- NASA FIRMS active-fire hotspots (MODIS & VIIRS)  
- NASA Earthdata / challenge Resources tab: https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/  
- Challenge briefing video (YouTube, challenge page)

**Software (planned)**  
- Python, pandas/geopandas, FastAPI (or Flask)  
- React (or Vite+React), Leaflet/MapLibre  
- GitHub, VS Code, laptops (team-provided; venue does not supply devices)

**Hardware**  
- Personal laptops; on-site at SUT (5 members) + 1 remote Day 1 if needed

**Scientific references (minimum one required)**  
1. Giglio, L., Schroeder, W., & Justice, C. O. (2016). The collection 6 MODIS active fire detection algorithm and fire products. *Remote Sensing of Environment*, 178, 31–41. https://doi.org/10.1016/j.rse.2016.02.054  
2. Schroeder, W., Oliva, P., Giglio, L., & Csiszar, I. A. (2014). The New VIIRS 375 m active fire detection data product: Algorithm description and initial assessment. *Remote Sensing of Environment*, 143, 85–96. https://doi.org/10.1016/j.rse.2013.12.008  
3. Csiszar, I., et al. (2014). Active fires from the Suomi NPP Visible Infrared Imaging Radiometer Suite: Product status and first evaluation results. *Journal of Geophysical Research: Atmospheres*. https://doi.org/10.1002/2013JD020453

---

### Team

| | |
|--|--|
| **Team Name** | **NileSpark** |
| 1 | Abdelrahman Yahia |
| 2 | Salma Gad |
| 3 | Omar Mohamed |
| 4 | Ali Haggag |
| 5 | Maryem Helal |
| 6 | Mahmoud Abdelhady |

**University:** South Valley National University (SVNU)  
**Origin:** Qena & Luxor, Upper Egypt  
**Track:** On-site — NASA Space Apps Cairo 2026

---

### Submission notes (for the team — not part of template body)

1. Copy each section into the official PDF/DOCX template; trim if any section exceeds the cap after paste.  
2. Export as PDF for the local Cairo form.  
3. Attach public ≤90s English video (see `VIDEO_AI_BRIEF.md`).  
4. Every member submits the local form; select On-site; challenge = Harmonization of MODIS and VIIRS Hot Spots (final).
