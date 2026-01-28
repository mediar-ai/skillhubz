# D3.js Visualization

Create sophisticated, interactive data visualizations using D3.js with precise control over every visual element.

## Prerequisites

- JavaScript/TypeScript environment
- Understanding of SVG basics

## Instructions

### When to Use D3.js

**Use D3.js for:**
- Custom visualizations requiring unique visual encodings
- Interactive explorations with pan, zoom, brush behaviors
- Network/graph visualizations (force-directed, trees, hierarchies)
- Geographic visualizations with custom projections
- Smooth, choreographed transitions
- Publication-quality graphics

**Consider alternatives for:**
- 3D visualizations (use Three.js)
- Simple charts (use Chart.js or similar)

### Setup

```javascript
import * as d3 from 'd3';
// or CDN
// <script src="https://d3js.org/d3.v7.min.js"></script>
```

### Core Workflow

**Pattern A: Direct DOM Manipulation (Recommended)**
```javascript
function drawChart(data) {
  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', 800)
    .attr('height', 400);

  svg.selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', (d, i) => i * 50)
    .attr('y', d => 400 - d.value)
    .attr('width', 40)
    .attr('height', d => d.value)
    .attr('fill', 'steelblue');
}
```

**Pattern B: React Integration**
```javascript
function Chart({ data }) {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    // D3 bindings here
  }, [data]);

  return <svg ref={svgRef} />;
}
```

### Key Concepts

- **Scales**: Map data domains to visual ranges
- **Axes**: Generate axis elements from scales
- **Shapes**: Paths, arcs, lines, areas
- **Transitions**: Animate between states
- **Layouts**: Force, tree, pack, partition

## Guidelines

1. Use `join()` for enter/update/exit patterns
2. Separate data transformation from rendering
3. Use scales for all data-to-visual mappings
4. Add transitions for smooth updates
5. Make visualizations responsive with viewBox

## Notes

- Works in any JavaScript environment (vanilla, React, Vue, Svelte)
- All modules accessible through `d3` namespace
- Publication-quality output with fine-grained control

Source: chrisvoncsefalvay/claude-d3js-skill
