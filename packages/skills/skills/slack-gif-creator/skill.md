# Slack GIF Creator

Create animated GIFs optimized for Slack with proper dimensions, frame rates, and file sizes.

## Prerequisites

- Python with Pillow, imageio, numpy
- Understanding of animation concepts

## Instructions

### Slack Requirements

| Type | Dimensions | FPS | Colors | Duration |
|------|------------|-----|--------|----------|
| Emoji | 128x128 | 10-30 | 48-128 | <3 sec |
| Message | 480x480 | 10-30 | 48-128 | flexible |

### Core Workflow

```python
from core.gif_builder import GIFBuilder
from PIL import Image, ImageDraw

builder = GIFBuilder(width=128, height=128, fps=10)

for i in range(12):
    frame = Image.new('RGB', (128, 128), (240, 248, 255))
    draw = ImageDraw.Draw(frame)
    # Draw animation using PIL primitives
    builder.add_frame(frame)

builder.save('output.gif', num_colors=48, optimize_for_emoji=True)
```

### Drawing Graphics

```python
draw = ImageDraw.Draw(frame)
draw.ellipse([x1, y1, x2, y2], fill=(r,g,b), width=3)  # Circles
draw.polygon(points, fill=(r,g,b), width=3)            # Polygons
draw.line([(x1,y1), (x2,y2)], fill=(r,g,b), width=5)  # Lines
draw.rectangle([x1,y1,x2,y2], fill=(r,g,b), width=3)  # Rectangles
```

### Animation Concepts

- **Shake**: Use `math.sin()`/`math.cos()` for oscillation
- **Pulse**: Scale size with sine wave (0.8 to 1.2)
- **Bounce**: Use `easing='bounce_out'` for landing
- **Spin**: `image.rotate(angle, resample=Image.BICUBIC)`
- **Fade**: Adjust alpha channel or use `Image.blend()`
- **Slide**: Move from off-screen with `easing='ease_out'`

### Making Graphics Look Good

- Use thicker lines (`width=2` or higher)
- Add visual depth with gradients
- Layer multiple shapes for complexity
- Use vibrant, complementary colors
- Add contrast (dark outlines on light shapes)

## Error Handling

- If file size too large, reduce colors/frames/dimensions
- Don't use emoji fonts (unreliable across platforms)
- Test GIF in Slack before finalizing

## Notes

- Utilities: GIFBuilder, validators, easing functions
- Easing options: linear, ease_in, ease_out, bounce_out, elastic_out
- Combine concepts: bouncing + rotating, pulsing + sliding

Source: anthropics/skills
