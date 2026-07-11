---
name: tui-ui
description: >-
  Design web-like user interfaces in the terminal and inside tmux with a
  cell-grid Canvas, CSS-like box model, flexbox/grid layout, and 15 reusable
  widgets such as Panel, Table, Card, ProgressBar, Meter, Tabs, Tree, Badge,
  Banner, and a braille line chart. Use when an agent needs a dashboard, panel,
  table, status page, TUI layout, tmux dashboard, screenshot-driven CLI/TUI
  replica, ANSI frame, truecolor render, pyte PNG screenshot smoke test,
  wide-character alignment, or a new terminal widget.
allowed-tools: Bash, Read
version: 0.1.0
---

# tui-ui

Lay out a terminal screen the way you lay out a web page: nested boxes with margin,
border, and padding; rows and columns that flex with `fr` units; and drop-in widgets
(panels, tables, cards, meters, tabs, trees). You compose a tree of renderables, and
the engine resolves sizes, composites cell grids, and serializes **once** to a
tmux-safe ANSI frame. Everything is display-cell accurate, so CJK, emoji, and
box-drawing never desync your columns.

Pure Python **stdlib** (optional `pyfiglet` for the Banner, optional `wcwidth` for an
authoritative width — a stdlib fallback covers the same edge cases). Output is a
plain string you can `print`, pipe, feed to the fx play loop, or render to PNG with
the SmartCLI pyte harness.

## When to use
- Building a status page / dashboard / control panel that should look designed, not dumped.
- You need boxes, tables, or columns that **line up** — especially with wide glyphs.
- You want web mental models (box model, flexbox rows, a grid, cards) in a TUI.
- Adding a new reusable terminal widget to a shared catalog.
- Do NOT use for full-screen *interactive* apps with input loops — that is drive-tui's job. tui-ui produces *frames*; something else owns the terminal.

## Setup
Run from the skill directory `skills/tui-ui` as a package:

```
python -m ui widgets                                  # list widgets
python -m ui demo <name> --width 60 --height 12       # render one widget
python -m ui gallery --width 100 --height 30           # the showcase dashboard "page"
python -m ui demo table --theme synthwave              # --theme applies a palette
```

Or by path from anywhere (a PEP-366 prelude bootstraps the package):
`python skills/tui-ui/ui/cli.py gallery`

On Windows set `PYTHONIOENCODING=utf-8` (or the CLI auto-reconfigures stdout) so
box/CJK glyphs encode. The CLI renders **once** and exits — bounded, no loop.

## The box model (`ui/box.py`)
A `Box` wraps content in the CSS nesting order **margin → border → padding →
content**. Borders are *cells* (1 per present side), padding is the CSS 4-tuple
`(top, right, bottom, left)`, and `box-sizing` defaults to **border-box**: the
requested `width`/`height` IS the border box, and `content = width − gutter` where
`gutter = padding + border` per axis.

```python
from ui import Box
Box(content="hello",
    width=24, height=5,          # int cells | "auto" | Fr(2)/"2fr" | "50%"
    border="rounded",            # single | rounded | heavy | double | ascii | none
    padding=(0, 1),              # int | (v,h) | (t,r,b,l)
    margin=0,
    title="Title", title_align="left",   # left | center | right
    align="left", valign="top",  # content alignment inside the padding box
    fg=(210,216,228), bg="#0e1016", border_fg="#4a5a82")
```

`Box.measure(w, h) -> (w, h)` reports the natural outer size; `Box.render(w, h) ->
Canvas` draws it into an exact region. Content taller/wider than the region is
**clipped** to the content box so it never overwrites the border.

## Layout (`ui/layout.py`)
Containers share the widget protocol (`measure` / `render`), so they nest freely.

- `VStack(children, gap, align, valign)` — stack top→bottom; cross axis is width.
- `HStack(children, gap, valign)` — flex row left→right; `fr` children share width.
- `Grid(cells, cols, rows, col_gap, row_gap)` — rows × cols; `grid(cells, ncols=3)` is the shortcut.
- `Page(child, width, height)` — the fixed-size root; `page.to_ansi()` is your frame.

**fr / fractional distribution** is the load-bearing algorithm. Never round each
track independently (that drifts ±1). The engine uses Rich's carry-remainder method,
so `resolve_tracks(10, [Fr(1),Fr(1),Fr(1)], ...) == [3, 3, 4]` exactly and cumulative
offsets never drift. Fixed/auto tracks are measured and subtracted first; the
remainder is shared among `fr` tracks by weight; overflowing fixed tracks shrink
largest-first to fit.

## Compose a "page"
A dashboard is just a tree of boxes and widgets handed to a `Page`:

```python
from ui import Page, VStack, HStack, Box, Fr, get_theme
from ui.widgets import Banner, Badge, Table, Meter, ProgressBar, Tabs, Tree

t = get_theme("dashboard")
def panel(content, title, **kw):
    return Box(content, border="single", title=title, padding=(0,1),
               bg=t.bg, fg=t.fg, border_fg=t.border, **kw)

page = Page(
    VStack([
        Box(Banner("DASH", theme=t), border="rounded", border_fg=t.accent, height=8),
        HStack([panel(Meter(theme=t), "Resources"),          # auto width
                panel(Table(theme=t), "Services", width=Fr(1))], gap=1),  # flex fill
        panel(ProgressBar(0.73, label="Deploy", theme=t), "Progress", height=3),
    ], gap=0, bg=t.bg),
    width=100, height=30, bg=t.bg)
print(page.to_ansi())
```

See `ui/cli.py:_build_gallery` for the full showcase (banner, badge status row, a
two-panel middle region, tabs, and a progress footer). Themes live in
`ui/core.py` (`dashboard`, `synthwave`, `forest`, `mono`, `amber`); each carries
semantic slots (`bg fg muted border accent ok warn err`) plus gradient `stops`.

## Widget catalog
`python -m ui widgets` lists them; each has a `sample(theme)` used by `demo`/`gallery`.

| key | what it renders |
|---|---|
| `panel` | Bordered frame with title + word-wrapped body |
| `table` | Auto-sized data table with borders, bold header, status coloring |
| `card` | Composite: title + body + key/value list + badge footer |
| `progress` | Progress bar, 1/8-cell precision (`█▉▊▋▌▍▎▏`), gradient fill + percent |
| `meter` | Multi-row labelled bar chart (CPU/MEM/DISK style) |
| `tabs` | Tab strip with the active tab underlined + a content pane |
| `kv` | Two-column key/value (definition) list; keys padded, values wrap |
| `tree` | DFS tree with `├──`/`└──`/`│` guide glyphs |
| `rule` | Horizontal divider with an optional aligned title |
| `badge` | Inline status pill / chip (`ok`/`warn`/`err`/`accent`) |
| `banner` | Big FIGlet text (needs `pyfiglet`; degrades to a bold label) |

Plus 4 shader/raster-backed extras shipped in `ui/widgets_ext/` (the effort-replica primitives + a sub-cell chart; also in `python -m ui widgets`):

| key | what it renders |
|---|---|
| `gradient_rule` | Solid rule filled with a per-cell truecolor gradient |
| `radial_glow` | Localized rounded/pulsing radial glow (background light field) |
| `slider_track` | Thin solid slider rail with a marker + tick labels |
| `braille_chart` | Smooth sub-cell line chart of a data series (braille 2×4 px/cell) |

## Add a widget (the recipe)
Drop a module in `ui/widgets_ext/` — `registry.load_all()` discovers it, no wiring.

```python
# ui/widgets_ext/spark.py
from ui.registry import register
from ui.widgets import Widget
from ui.core import Canvas

@register
class Spark(Widget):
    key = "spark"                       # registry key (python -m ui demo spark)
    summary = "Inline sparkline"        # shown by `widgets`

    def __init__(self, values=(1,3,2,5,4), *, theme=None):
        super().__init__(theme)
        self.values = list(values)

    def measure(self, avail_w, avail_h):        # (width_wanted, height_wanted)
        return (len(self.values), 1)

    def render(self, region_w, region_h):       # -> exact-size Canvas
        cv = Canvas(region_w, max(1, region_h), bg=self.theme.bg)
        bars = "▁▂▃▄▅▆▇█"; hi = max(self.values) or 1
        for i, v in enumerate(self.values[:region_w]):
            cv.set(i, 0, bars[min(7, v*7//hi)], fg=self.theme.accent, bg=self.theme.bg)
        return cv

    @classmethod
    def sample(cls, theme):                      # used by demo/gallery
        return cls(theme=theme)
```

Contract every widget honors: `measure(avail_w, avail_h) -> (w, h)` and
`render(region_w, region_h) -> Canvas` of exactly that region. Set class attrs
`width`/`height` (int / `Fr` / `"auto"`) if a parent stack should size it specially.
Then: `python -m ui widgets` (it appears) and `python -m ui demo spark`.

## Width & alignment (why columns don't misalign)
The engine never uses `len()`. `ui.core.width(s)` returns **display cells**: CJK /
fullwidth → 2, combining marks → 0, ANSI stripped to 0, and the emoji edge cases
handled — ZWJ sequences (`👩‍💻`=2), VS16 (`♀️`=2), regional-indicator flag pairs
(`🇯🇵`=2). `Canvas.put_text` is wide-aware: a double-width glyph occupies its cell
plus a continuation cell that is never serialized, so a CJK char can't shove the
columns behind it. `blit` heals any wide glyph it cuts at a seam.

## tmux safety & rendering to PNG
`to_ansi()` emits only CSI **SGR** color runs (`\x1b[…m`, run-length like fx) and
newlines — no cursor moves, no alt-screen, no scroll region. A frame is therefore
composable and safe to print inside a tmux pane; tmux re-parses it through its own VT
layer identically. There is **no real tmux/docker/WSL on this box**, so rendering is
verified with **pyte** (a faithful VT emulator) → **PNG** via PIL — the standard
no-tmux snapshot method. Always label such captures as pyte-simulation, not a
real-tmux capture (see `tools/screenshot/shot.py:RENDER_LABEL`).

```python
import sys; sys.path[:0] = ["tools/screenshot", "skills/tui-ui"]
import shot
from ui import get_theme; from ui.cli import _build_gallery
ansi = _build_gallery(get_theme("dashboard"), 100, 30).to_ansi()
screen = shot.render_bytes_to_screen(shot.render_frame_to_bytes(ansi), 100, 30)
shot.screen_to_png(screen, "out.png")     # faithful cell-grid render
```

## Knowledge base — look before you build
Before recreating or inventing any effect, consult the SmartCLI knowledge graph at
`D:/Project/SmartCLI/knowledge/INDEX.md` — 89 sourced concept notes + 27 case studies,
organized around one discipline: **pick your lane.**
- **Replica** (reproduce a real, existing UI/animation/screenshot): measure ground truth
  first, never head-canon. Start at [[hard-lessons]] (mirrors `references/HARD-LESSONS.md`)
  and the worked case [[effort-selector]] (measured palette/geometry/animation for the
  `/effort` picker) → drive-and-capture, quantify scale + form, extract exact params, build
  against truth, verify on the real run path.
- **Creative** (design a new widget/effect): compose primitives. Start at [[rendering-model]]
  (mirrors `references/RENDERING-MODEL.md`, the four-primitive kernel) and ask "which
  primitives compose this?" before writing a bespoke widget.

## Recreating a REAL effect — read this first
Before recreating any effect that already exists (a real CLI's UI, an animation, a
screenshot), **read `references/HARD-LESSONS.md`** and follow its 10 rules. It is the
distilled record of a replica that took a dozen wrong iterations because of guessing
instead of measuring. The non-negotiable core:

1. **Get ground truth first — never approximate from imagination.** If the real program
   exists, drive it with `smartcli_core.PtySession`, capture the actual rendered
   per-cell bytes/colors, and for animations capture **multiple PNG frames** and study
   them. Reverse-engineer exact constants from source when available.
2. **Confirm scale and shape before writing render code** — how many rows/cols the
   effect occupies, 1-D vs 2-D, static vs animated, and *how* it moves (measure the
   moving edge across frames, don't guess). A ripple that is really an 8-row rectangle
   will never be reproduced as a 1-row bar.
3. **Verify on the REAL run path, never on a self-satisfying preview.** Run the script's
   own full startup (`python script.py`, no monkeypatches), capture stderr, and use
   SmartCLI to drive *your own script* and diff its real output against ground truth.
   A missing import or an `isatty()` early-return produces a blank/crash the PNG preview
   won't show.
4. **You have the tools to look — use them.** You are an agent CLI with PTY + screen
   capture + PNG rendering. Don't ask the user what it looks like; go capture it.

## Replica smoke workflow
When recreating a screenshot-driven CLI/TUI, do not finish after visual intuition or one
happy-path preview. Create a bounded `--once` frame mode in the target program, then
render a matrix through `tools/screenshot/shot.py` or `tools/screenshot/cli.py`.

Minimum checks for a screenshot replica:
- Cover every visible state in the reference, plus separate animation frames for each
  distinct animated backdrop or transition shape.
- Render at the reference size and at least two stress sizes, such as `80x24` and
  a wider/taller terminal.
- Assert the stream contains truecolor ANSI when color is part of the design, has no
  `U+FFFD`, and includes the key visible labels from the reference.
- Inspect the generated PNG contact set manually before handoff; pyte checks catch
  blanks, clipping, color presence, and mojibake, but not taste, exact spacing, or
  whether an active color reads like the reference.
- Run one real Windows Terminal interactive smoke for input semantics, alt-screen
  restoration, cursor restoration, and resize behavior. Pyte is not a substitute for
  keyboard/input-loop verification.

For interactive replicas, make `Enter` and `Esc` behavior observable: emit the selected
value or use distinct exit status/cancel semantics after leaving the alt screen. Keep
`--once` non-interactive and deterministic so reports can reproduce the PNG set.

## Self-test (bounded, no loop)
`python self_test.py` renders the 100×30 dashboard once and asserts: 30 rows each
exactly 100 cells (no fr drift), box-drawing glyphs present, truecolor SGR present,
`width()` edge cases correct, and a CJK table row's vertical bars land on the SAME
columns as an ASCII row (proving wide-char alignment). Exit 0 = pass. It also passes
cleanly at sizes (40,12), (80,24), (120,40), (200,50).

## File map
- `ui/core.py` — `Canvas`, `Cell`, `width()`, color/SGR helpers, box-glyph tables, `Theme`s.
- `ui/box.py` — the CSS box model (`Box`, `Fr`, dim resolution, clipping).
- `ui/layout.py` — `VStack`/`HStack`/`Grid`/`Page` + carry-remainder `fr` resolution.
- `ui/widgets.py` — the 11 core web-style widgets.
- `ui/widgets_ext/` — 4 shipped extras (`gradient_rule`, `radial_glow`, `slider_track`, `braille_chart`) + drop a module here to add your own.
- `ui/registry.py` — `@register` + folder discovery.
- `ui/cli.py` — `widgets` / `demo` / `gallery` (+ `--width --height --theme`).
- `ui/field.py` — CellField shader engine (`Ripple`/`RadialGlow`/`LinearGradient`/`Plasma` + ASPECT dist).
- `self_test.py` — bounded render assertions.
- `references/HARD-LESSONS.md` — **read before any replica**: 10 rules from a dozen failed iterations (knowledge twin: [[hard-lessons]]).
- `references/RENDERING-MODEL.md` — first-principles: cell grid, shader fields, sub-cell, box algebra (knowledge twin: [[rendering-model]]).
- `examples/effort_selector.py` — worked replica of a real /effort-style selector (ground-truth-driven; measured constants: [[effort-selector]]).
- `D:/Project/SmartCLI/knowledge/INDEX.md` — the knowledge graph: look here before building (replica vs creative lanes).
