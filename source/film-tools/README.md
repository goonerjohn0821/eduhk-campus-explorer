# Exploring EdUHK — Flight, pacing and music revision

90 seconds · 16:9 · 30 fps · location captions and instrumental music; no voiceover.

The film uses the existing campus geometry and Quaternius student, with an open bus doorway, complete bus-stop benches and the university name stone in the administrative forecourt. It is an applicant-authored AI-assisted experiment, not an official university production.

## Editing

- `dist/film-sequences.js`: 14 independently named shots. Times, durations, camera position/target/FOV, easing and character paths are explicit. Coordinates use the existing campus map frame.
- `dist/film-director.js`: deterministic time sampling; camera and character evaluation shared by the live film and offline export. Camera roll is zero. The fly-through uses time-aware cubic Hermite interpolation; independent node shots use a single slow dolly.
- `dist/film-character.js`: portrait posing on the original rig. Walking settles into a standing pose; the student faces the camera and raises one hand.
- `dist/film-app.js`: live Three.js playback, seek, shot selection, fullscreen, photo card, synchronized music and mute control. The audio clock drives live playback, including seek and pause.
- `dist/film.html`: film viewer. The interactive campus remains at `index.html`.

| Time | Act | Content |
| --- | --- | --- |
| 00–05 | Arrival | Bus stopped; step down beside the door |
| 05–09.5 | Arrival | Walk toward the named entrance at normal cadence |
| 09.5–32 | Arrival | Rise and follow the road between the halls and teaching buildings |
| 32–37 | Discovery | Campus establishing shot |
| 37–66 | Discovery | Entrance plaza, halls, library, teaching wings, garden, sports |
| 66–72 | Experience | Walk on the path beside the football field |
| 72–78 | Experience | Side-follow beside the garden |
| 78–84 | Experience | Walk in front of the administrative building toward the name stone |
| 84–86.7 | Experience | Face the camera and pose beside the university name stone |
| 86.7–90 | Ending | Shutter flash; freeze; photo card; fade |

The first act reaches the central campus rather than crossing the entire roughly 700 m model in 20 seconds. Later establishing/node shots complete the spatial account without a rapid flyover.

## Export

Run from the repository root:

```sh
node film-tools/check-sequences.mjs /ABS/REVIEW/sequence-check.json
node film-tools/export-film.mjs /ABS/REVIEW/final --full
python3 film-tools/render-film.py /ABS/REVIEW/final --full
python3 film-tools/verify-video.py /ABS/REVIEW/final
```

The node export instantiates the **same Three.js modules** and bakes camera matrices and posed character vertices at 30 fps. The MP4 review copy uses a native OpenGL renderer with a simple daylight/shadow approximation; its lighting is not pixel-identical to Three.js PBR. No campus is rebuilt or replaced for the film. The website is the authoritative live Three.js preview. The native renderer requires Python `moderngl`, `glcontext`, `numpy`, `Pillow`, and FFmpeg with `libx264`.

Omit `--full` to render the start, midpoint and end of every shot as stills for framing review. Full output is exactly 2,700 frames of H.264, yuv420p, 1920×1080, with faststart. The delivery MP4 includes a stereo AAC score. The only deliberately black frames are the ending fade.

## Validation

Continuity: shot boundaries cover 0–90 without gaps; 2,700 camera samples are finite; camera movement is checked against geometry; all featured pedestrian paths remain clear. During the lifting shot the camera deliberately leaves the student behind, so the student need not remain framed. Gate collision prisms extend above some low fixtures; actual camera segment/mesh intersection is used for this flight.

Rendered review covers the bus doorway, leg clearance, bilingual gate sign, fly-through, all six nodes, all three walking scenes, the portrait pose, raised bilingual name stone and the final card. Video decoding and black-frame checks are performed on the exported MP4.

The revised filename is `EdUHK-Campus-Updated-90s.mp4`. Scene labels use the bundled Noto Sans CJK subset. Mesh exports use checked writes and atomic finalization; the renderer rejects incomplete static or actor buffers. Range options `--start` and `--end` use absolute frame indices, with `--output` selecting a segment filename.

## Flight, pacing and score changes

Shot 03 climbs progressively while continuing down the central road. The cruise
height reaches 64 m in scene coordinates (58 m above the base). Forward speed stays
about 11–14 m/s, while climb speed is at most 4.2 m/s. The final camera looks past
the library into the teaching and sports areas, rather than down at its roof.

Each of shots 11–13 is 6 s instead of 8 s. Their first 2 s of walking are trimmed,
keeping the travel speed and animation cadence unchanged. Each of the six node
shots 05–10 gains exactly 1 s. The portrait still starts at 84 s and freezes at 86.7 s.

Music: Carefree by Kevin MacLeod, CC BY 4.0 (see dist/assets/CREDITS.txt).
`prepare-music.py SOURCE.mp3 OUTPUT.wav` creates a 90 s, 48 kHz stereo master
with a 1.2 s opening fade and 3.5 s ending fade. The original recording is not
included in the repository. Encode the master as `dist/assets/campus-score.mp3`
for live playback; mux the WAV into the rendered movie as AAC 192k.
The final photo card, music metadata and website provide the attribution.

Pass `--times=9.5,16.5,26.5,29.5,31.9` to export-film.mjs for targeted
framing reviews. Rendered segment files are silent intermediates; mux the score
before running final verification.
