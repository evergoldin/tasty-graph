import * as d3 from 'd3';

export const CANVAS_CONSTANTS = {
  NODE_WIDTH: 200,
  NODE_HEIGHT: 100,
  GRID_SIZE: 50,
  BORDER_RADIUS: 5,
  TEXT_PADDING: 10,
  CONTENT_MAX_LENGTH: 50,
};

export function createGridPattern(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
  const defs = svg.append("defs");
  const gridPattern = defs.append("pattern")
    .attr("id", "grid")
    .attr("width", CANVAS_CONSTANTS.GRID_SIZE)
    .attr("height", CANVAS_CONSTANTS.GRID_SIZE)
    .attr("patternUnits", "userSpaceOnUse");

  gridPattern.append("path")
    .attr("d", `M ${CANVAS_CONSTANTS.GRID_SIZE} 0 L 0 0 0 ${CANVAS_CONSTANTS.GRID_SIZE}`)
    .attr("fill", "none")
    .attr("stroke", "#e0e0e0")
    .attr("stroke-width", "0.5");
}

export function createBackground(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  styles: { [key: string]: string }
) {
  svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "url(#grid)")
    .attr("class", styles.background);
} 