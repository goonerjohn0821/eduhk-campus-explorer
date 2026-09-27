# 香港教育大学 · 校园漫游

An interactive Three.js scene of the EdUHK Tai Po campus. This is an independent schematic interpretation of the campus plan, not a measured digital twin or the university's official navigation system.

## Features

- Orbit, dolly and pan using mouse or touch.
- Landmark selection by sidebar, projected labels and raycast building selection.
- Animated student with third-person follow camera, switchable first-person exterior walking with keyboard, drag-to-look, optional Pointer Lock and touch joystick.
- Building and pool collision, ground-following camera and bounded campus area.
- Wall-aware follow camera, WASD movement, Shift running, V view toggle and top-down plan view.
- Day/dusk lighting and a live orientation minimap.
- Local Three.js r180 modules; no CDN dependency at runtime.
- Optional WebMCP commands using the same visible actions.

## Run

Serve the `dist` directory using any static HTTP server. For example:

```sh
python3 -m http.server 8000 --directory dist
```

The browser needs WebGL 2. Opening `index.html` with `file://` is not supported by ES module security rules.

## Sources and interpretation

- Official campus map: https://www.eduhk.hk/re/student_handbook/tc/Maps-Of-The-University-Campuses.html
- Official master plan raster: https://www.apply.eduhk.hk/ug/sites/default/files/2026-02/Campus%20map.jpg
- Updated 2026 plan: https://iday.eduhk.hk/sites/default/files/2026-05/Faculty%20info%20day%20agenda_digital%20(FINAL).pdf
- New academic building: https://www.eduhk.hk/eo/our-projects/new-academic-building-tai-po-campus
- Google Maps satellite view centred on EdUHK, inspected September 2026; exact link is in dist/layout.js.

Building footprints and the campus boundary are manually traced from the official plan. Satellite imagery informs the stepped halls and massing. Block N follows current university information where older satellite imagery differs. Scale, heights, terrain, facade details and landscaping remain approximations; there are no modelled interiors.

`dist/layout.js` holds reference coordinates and sources. `dist/campus.js` builds geometry and collision boundaries. `dist/student.js` models the jointed student; `dist/walking.js` handles movement and follow-camera collision. `dist/app.js` connects rendering and the interface.

## Validation

JavaScript syntax, local assets and DOM references checked. Three.js geometry contains finite coordinates. All seven walking starts are clear and connected on a 2 m navigation grid. Automated movement checks cover walking, running, collision and first/third-person camera switching. A footprint overlay was compared with the official plan. Browser/WebGL visual QA has not been performed in this environment.

## Dependency

Three.js 0.180.0 (MIT). The upstream license is retained at `dist/vendor/LICENSE-three.txt`.
