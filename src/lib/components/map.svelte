<script>
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { loadTodData } from '../data/TODdata.js';

  let projects = [];
  let neighborhoods = [];

  let width = 800;
  let height = 600;
  let hoveredProject = null;

  let svgElement;
  let transform = d3.zoomIdentity;

  onMount(async () => {
    const rawProjects = await loadTodData();
    const geoRes = await fetch('/data/TODLocations_4.4.26.geojson');
    const geojson = await geoRes.json();

    projects = geojson.features.map(feature => {
      const csvMatch = rawProjects.find(p => p.project === feature.properties.j_Project);
      return { ...csvMatch, geometry: feature.geometry };
    }).filter(p => p.project);

    const zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .on('zoom', (event) => {
        transform = event.transform;
      });

    d3.select(svgElement).call(zoom);
  });

  $: projection = d3.geoIdentity()
    .reflectY(true)
    .fitSize([width, height], {
      type: "FeatureCollection",
      features: projects.map(p => ({ type: "Feature", geometry: p.geometry }))
    });

  $: colorScale = d3.scaleLinear()
    .domain([-0.5, 0, 0.5])
    .range(["#d73027", "#f7f7f7", "#1a9850"])
    .clamp(true);

  function getProjectedCoords(geometry) {
    if (!projection) return [0, 0];
    const [x, y] = projection(geometry.coordinates);
    return [
      x * transform.k + transform.x,
      y * transform.k + transform.y
    ];
  }
</script>

<div class="map-container" bind:clientWidth={width}>
  <svg bind:this={svgElement} {width} {height}>
    <g transform="translate({transform.x}, {transform.y}) scale({transform.k})">
      {#each projects as project}
        {@const [x, y] = projection(project.geometry.coordinates)}

        <circle
          cx={x} cy={y}
          r="30"
          fill="rgba(0,0,0,0.03)"
          stroke="#ccc"
          stroke-dasharray="2,2"
          vector-effect="non-scaling-stroke"
          style="pointer-events: none;"
        />

        <circle
          cx={x} cy={y}
          r={(hoveredProject === project ? 12 : 7) / transform.k}
          fill={colorScale(project.mismatchScore)}
          stroke="#333"
          stroke-width={1.5 / transform.k}
          on:mouseenter={() => hoveredProject = project}
          on:mouseleave={() => hoveredProject = null}
          class="project-node"
          style="pointer-events: auto;"
        />
      {/each}
    </g>
  </svg>

  {#if hoveredProject}
    {@const [tx, ty] = getProjectedCoords(hoveredProject.geometry)}
    <div class="tooltip"
         style="left: {tx + 15}px;
                top: {ty - 20}px;">
      <header>
        <strong>{hoveredProject.project}</strong>
        <p>{hoveredProject.address}</p>
      </header>

      <div class="stats">
        <div class="stat-row">
          <span>Affordable Share:</span>
          <span>{(hoveredProject.affordableShare * 100).toFixed(0)}%</span>
        </div>
        <div class="stat-row">
          <span>Local Lower-Income Demand:</span>
          <span>{(hoveredProject.lowerIncomeDemandShare * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div class="mismatch-flag" style="background: {colorScale(hoveredProject.mismatchScore)}22">
        <strong>Equity Gap: {Math.abs(hoveredProject.mismatchScore * 100).toFixed(1)}%</strong>
        <p>{hoveredProject.mismatchScore < 0 ? 'Under-serving' : 'Exceeding'} neighborhood needs.</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .map-container {
    position: relative;
    background: #b3d6ee;
    border-radius: 4px;
    cursor: grab;
    overflow: hidden;
    height: 600px;
  }
  .map-container:active { cursor: grabbing; }

  .project-node { transition: opacity 0.2s; }

  .tooltip {
    position: absolute;
    background: white;
    padding: 12px;
    border: 1px solid #333;
    box-shadow: 4px 4px 0px rgba(0,0,0,0.1);
    pointer-events: none;
    width: 220px;
    font-size: 0.85rem;
    z-index: 10;
  }

  .stat-row { display: flex; justify-content: space-between; margin: 4px 0; }
  .mismatch-flag { margin-top: 8px; padding: 6px; border-radius: 2px; font-size: 0.75rem; }
</style>
