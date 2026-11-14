# Sources and AI disclosure

Font and icon license notices are copied to `public/licenses/` so they are retained with a static build.

- Product/design: BurnCal by the NileSpark team, NASA Space Apps project planning context. No NASA endorsement or official NASA logo is implied by the BurnCal wordmark.
- Design reference: https://www.figma.com/design/9gkx5vdSywSJMxdpfB1wdc/?node-id=26-266
- Earth/Nile illustration: AI-generated earlier in this design session using OpenAI image generation. It is concept artwork, not satellite imagery or measured hotspot data. The local design asset `burncal-earth-concept.png` is the source. WebP versions preserve the illustration and reduce transfer size.
- Fonts: Space Grotesk, Inter, IBM Plex Mono, self-hosted through Fontsource npm packages. Their package license files contain the relevant font licenses (SIL Open Font License).
- Icons: Lucide React (ISC license); only named icons used by components are imported.
- Map engine: MapLibre GL JS (BSD), notice in public/licenses/MapLibre-BSD.txt. Basemap: OpenFreeMap dark; OpenMapTiles and OpenStreetMap attribution is retained. This is geography, not a NASA observations layer. https://openfreemap.org/ and https://maplibre.org/
- React / Vite / TypeScript and lint tooling retain their package licenses. `package-lock.json` records installed versions.
- NASA FIRMS source reference: https://firms.modaps.eosdis.nasa.gov/ and https://firms.modaps.eosdis.nasa.gov/country/
- Synthetic mode uses generated points, counts and CSV rows. API mode displays separately labeled server responses and methodology; the current server supplies placeholders, not populated FIRMS observations. Actual dataset/processing citations must accompany future observation results.
- Codex assisted with project setup, UI implementation, documentation and verification. The design-context tool was unavailable because of the Figma Starter quota; the previously authored local design source and its visual reference were used. This is an implementation of the visual foundation, not a claim of an automated exact Figma export.
