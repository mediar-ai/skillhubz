---
name: cmd-art
description: >-
  Design and render terminal/CMD visual effects and ASCII art from a one-line
  request via the pluggable `fx` engine (18 hot-swappable, themeable effects
  plus scripted shows). Effects include donut, matrix rain, plasma, fire, a
  spinning 3D ball, Game of Life, wireframe cube, 3D text banners,
  rainbow/lolcat gradient text, starfield, tunnel, fireworks, image-to-ASCII,
  and more. Use when the request is for a terminal animation, ANSI/CLI art, or
  a new console effect. Pure Python stdlib; truecolor.
version: 0.1.0
---

# cmd-art

Render and design terminal visual effects with `fx`, a living-template engine: an `Effect` ABC + a `@register` decorator + pkgutil auto-discovery, so effects, themes, and multi-effect shows all compose. Pure Python stdlib (optional `pyfiglet` for fonts, `PIL` for real images). Truecolor + ANSI, tuned for Windows Terminal but works on any VT-capable terminal.

## When to use
- User asks for a terminal/CMD animation or ANSI art: "spinning ball", "donut", "matrix rain", "plasma", "fire", "game of life", "3D title", "rainbow banner", "starfield", "tunnel", "fireworks".
- User wants a static ASCII title/banner with a color gradient, or an image turned into ASCII.
- User wants to invent a new console effect (drop one file in `fx/effects/`).

## The 18 effects (registry names)
Run `python -m fx list` for the live catalog. Names + aliases as registered:

| name | kind | what | aliases |
|------|------|------|---------|
| `sphere` | anim | rotating Lambert-shaded 3D ball ("spinning ball") | |
| `donut` | anim | THE spinning ASCII torus (Sloane donut.c) | |
| `cube` | anim | rotating wireframe cube | |
| `tunnel` | anim | demoscene tunnel fly-through | |
| `starfield` | anim | perspective starfield warp | |
| `plasma` | anim | full-screen sine interference field | `wave` |
| `fire` | anim | demoscene fire (heat buffer + cooling) | |
| `rain` | anim | matrix digital rain | |
| `life` | anim | Conway's Game of Life, toroidal | `game_of_life` |
| `boids` | anim | Reynolds flocking | |
| `fireworks` | anim | rising shells → gravity sparks | |
| `sparkle` | anim | dim text under bright glints | |
| `text3d` | anim* | big figlet/block banner, gradient; shimmer animates | `banner` |
| `gradient_text` | anim | lolcat rainbow / theme-gradient text | `lolcat` |
| `banner_scroll` | anim | scrolling figlet marquee | `marquee` |
| `typewriter` | anim | char-by-char reveal with a cursor | |
| `decrypt` | anim | scramble-to-plaintext reveal | |
| `image2ascii` | static | image → half-block truecolor / ASCII ramp | `img` |

`*text3d` is static unless `--set shimmer=true`. `image2ascii` is a `StaticEffect` (one frame to the normal screen). Everything else animates in the alt-screen.

## How to run
From `skills/cmd-art`, run the package:
```
python -m fx <command> [args]
```
Or by path from any cwd (a PEP-366 prelude bootstraps the package):
```
python skills/cmd-art/fx/cli.py <command> [args]
```
Legacy compat shim (preserves the old surface, translates to `fx play`):
```
python skills/cmd-art/scripts/ascii_fx.py [--fps N] [--seconds N] [--once] [--width W] [--height H] <sphere|plasma|wave|rain|text3d> [args]
```
Prefer the `fx` CLI for new work; use the shim only for old commands/imports.

## Commands
- `list [--tag T] [--json]` — every registered effect (kind, tags, description, aliases). `--tag` filters (e.g. `3d`, `text`, `particles`, `classic`, `field`, `matrix`). `--json` emits full param schemas.
- `show <name>` — one effect's details: animated?, tags, aliases, preferred theme, and every `--set` param (kind, default, choices, range, help), plus a ready-to-run example. `show` also plays scripted shows via `--seq`/`--script` (see Compose a show).
- `play <name> [flags]` — play one effect. **Bounded by default** (10s on a TTY when no `--seconds`/`--frames`). Flags:
  - `--theme NAME` — palette (see Themes). Defaults to the effect's `preferred_theme`.
  - `--seconds N` — stop after N seconds.
  - `--frames N` — stop after N frames.
  - `--once` — render ONE frame to the normal screen and exit (best for `text3d`, `image2ascii`, previews).
  - `--forever` — explicitly unbounded (until Ctrl-C).
  - `--fps N` — frame rate (default: the effect's own `default_fps`).
  - `--width W` / `--height H` — `0` = terminal size (height leaves 1 row headroom).
  - `--set K=V` — override an effect param (repeatable). Unknown keys fail loudly.
- `gallery [--seconds-per N] [--tag T] [--theme NAME]` — tour every animated effect back-to-back in one alt-screen (default 3s each).
- `random [play-flags]` — play a random animated effect with a random theme (defaults to 8s).

Non-TTY safety: `play`/shows degrade to a single plain frame when stdout is not a terminal, and the play loop always restores the terminal (cursor, wrap, alt-screen) via try/finally. Prefer `--seconds`/`--once` in automated contexts so the process always terminates.

## Themes
`--theme` names (from `fx/theme.py`, live via `theme_names()`):
`mono`, `fire`, `ocean`, `synthwave`, `viridis`, `pastel`, `matrix-green`, `rainbow`.
Default theme is `synthwave`. Effects never bake in hex; they sample the active `Theme` (`color_at(t)` gradient, `cycle(phase)` HSV/lolcat sweep, `.primary`/`.accent`/`.base`), so swapping the theme restyles every effect for free. Unknown `--theme` on `play` fails loud; on shows it falls back to default.

## Example commands
- Spinning ball, 5s, ocean: `python -m fx play sphere --seconds 5 --theme ocean`
- THE donut, faster spin: `python -m fx play donut --set speed=2 --seconds 8`
- Matrix rain: `python -m fx play rain --seconds 8`
- Fire, taller flames: `python -m fx play fire --set cool=2`
- Game of Life, dense start: `python -m fx play life --set fill=0.35 --seconds 10`
- 3D title, one static frame: `python -m fx play text3d --set text=KIRO --once`
- Shimmering animated title: `python -m fx play text3d --set text=KIRO --set shimmer=true --seconds 6`
- Rainbow lolcat text: `python -m fx play gradient_text --set text="hello" --theme rainbow`
- Image → ASCII (half-block): `python -m fx play image2ascii --set path=pic.png --once`
- Tour everything: `python -m fx gallery --seconds-per 3`
- Surprise me: `python -m fx random`

## Compose a show
Play a timed sequence of segments in ONE alt-screen (no flicker between segments) via `show`:
- Compact `--seq` grammar `effect[:theme[:seconds]],...`, with `left|right` split-screen in the effect slot:
  ```
  python -m fx show --seq "donut:fire:4,plasma::3,rain:matrix-green:5"
  python -m fx show --seq "donut|fire:synthwave:6"   # donut left, fire right
  ```
- JSON `--script show.json` (list of segment objects):
  ```json
  [
    {"effect": "donut", "theme": "fire", "seconds": 4, "params": {"speed": 2}},
    {"split": ["donut", "fire"], "themes": ["ocean", "fire"], "seconds": 6}
  ]
  ```
`--seconds-per` sets the default per-segment duration; `--theme` is the fallback for segments without one. Each segment gets a local clock (t restarts at 0). `Split` is a combinator built from two real effects, not a registered effect.

## Knowledge base — look before you build
Before inventing or tuning an effect, consult the SmartCLI knowledge graph at
`D:/Project/SmartCLI/knowledge/INDEX.md`. Its `effects/` domain carries exact-formula
notes for most of what ships here — [[donut-torus]], [[plasma]], [[fire-lode]] /
[[fire-doom-psx]], [[matrix-rain]], [[game-of-life]], [[boids]], [[starfield]],
[[tunnel]], [[rotating-cube]], [[ascii-luminance-ramp]] — plus [[color-interpolation]]
and [[hsv-cycling-lolcat]] for theme/lolcat color. The `works/` wing ([[donut-c]],
[[lolcat]], [[cmatrix]], [[terminaltexteffects]], ...) is the design brain for a NEW
effect: pick your lane — **replica** a real effect by measuring its source math, or
**compose** a new one from documented primitives. Read the relevant note before writing
render code from scratch; `references/effects.md` is the local techniques sampler, the
graph is the sourced depth.

## Add a NEW effect
Drop one module in `fx/effects/` — pkgutil auto-imports it, `@register` wires it into `list`/`show`/`play`/`gallery`. A module that fails to import is reported (stderr + `registry.load_errors()`) but never takes the catalog down.

Minimal contract (`fx/base.py`):
- Subclass `Effect` (or `StaticEffect` for one-shot art). Set class metadata: `name` (lowercase, unique registry key), `description`, `tags`, optional `aliases`, `preferred_theme`, `default_fps`, and a `params` tuple of `Param(...)`.
- `Param(name, kind, default, help, choices=None, min=None, max=None)` — `kind` ∈ `int float str bool color`. The CLI lists/parses/validates `--set` against these; unknown keys and out-of-range values fail loud. `color` accepts `#RRGGBB`/`RRGGBB` (empty = None).
- Implement `render(self, ctx: FrameCtx) -> str`: return ONE full frame — `ctx.height` rows joined by `\n`, no trailing newline, EVERY cell written. Effects are pure frame producers: never print, sleep, or touch ANSI modes — the play loop owns the terminal.
- `ctx: FrameCtx` fields: `t` (seconds since start), `frame_index`, `width`, `height`, `theme` (active `Theme`, never None), `params` (coerced dict).
- Optional lifecycle: `setup()` (allocate buffers/particles before the first frame) and `teardown()` (release state; also runs on error/Ctrl-C). Override `is_animated(cls, params)` for effects that are static by default but animate on a flag (see `text3d`'s `shimmer`, `gradient_text`).

Skeleton:
```python
from fx.base import Effect, FrameCtx, Param
from fx.registry import register

@register
class Swirl(Effect):
    name = "swirl"
    description = "example: a themed diagonal sweep."
    tags = ("field", "demo")
    default_fps = 24.0
    params = (Param("speed", "float", 1.0, "sweep speed", min=0.0, max=10.0),)

    def render(self, ctx: FrameCtx) -> str:
        rows = []
        for y in range(ctx.height):
            cells = []
            for x in range(ctx.width):
                t = ((x + y) / max(1, ctx.width + ctx.height)
                     + ctx.t * ctx.params["speed"] * 0.1) % 1.0
                r, g, b = ctx.theme.color_at(t)
                cells.append(f"\x1b[38;2;{r};{g};{b}m#")
            rows.append("".join(cells) + "\x1b[0m")
        return "\n".join(rows)
```
Then `python -m fx play swirl --theme rainbow --seconds 5`. Duplicate names raise `RegistryError` (pass `@register(replace=True)` to intentionally override a built-in).

## Constraints / gotchas
- Keep frames exactly `ctx.height` rows and `ctx.width` cells; auto-size leaves 1 row headroom so the top doesn't scroll off.
- `plasma` and full-field effects are the heaviest (O(width×height) escapes/frame); shrink dimensions or lower `--fps` if they stutter.
- `pyfiglet` powers `text3d`/`banner_scroll`/`gradient_text --set big=true` if importable; otherwise a built-in block font covers A-Z, 0-9, space. `image2ascii` uses `PIL` if present, else a PNM/built-in demo fallback.
- ANSI on Windows is enabled automatically at startup (`enable_vt()`), no action needed.
- `references/effects.md` is a **techniques sampler** — it works a few effects in depth (sphere/block-text projection, plasma field, fire kernel, rain fade), not one section per shipped effect. Read it, plus the per-effect formula notes in `knowledge/effects/` (see Knowledge base above), when adding or tuning an effect.
- Paths above are relative to this skill's folder.

## Optional tmux launchers
The play loop already owns a single alt-screen session, so tmux is never required. For convenience, `tmux/` ships two POSIX-sh launchers that drop an effect into a tmux popup or split pane:
- `tmux/fx-popup.sh <effect|gallery|random> [fx args]` — `display-popup -E` (tmux >= 3.2).
- `tmux/fx-split.sh [-v] EFFECT [EFFECT2] [fx args]` — split the current window (one effect in a new pane, or a 2-up of two).

Both guard on `command -v tmux`: with no tmux they print the direct/compositor alternative plus install hints and exit `0`. `play`/`random` runs get a default `--seconds 10` bound. Truecolor through tmux needs `set -g default-terminal "tmux-256color"` + `set -ga terminal-overrides ",*:Tc"`. See `tmux/README.md`. For a seamless side-by-side without tmux, use the compositor: `python -m fx show --seq "donut|fire:synthwave:6"`.
