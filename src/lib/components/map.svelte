<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";

  export let data = [];
  export let selectedId = null;
  export let onSelect = (d) => {};

  let geojson = null;
  let neighborhoods = [];
  let projects = [];

  let width = 900;
  let height = 640;
  let hoveredProject = null;
  let svgElement;
  let transform = d3.zoomIdentity;
  let zoomBehavior;

  onMount(async () => {
    const [geoRes, nhoodRes] = await Promise.all([
      fetch("/data/TODLocations_4.4.26.geojson"),
      fetch("/data/MAPC_census_tracts/mapc_census_tracts.geojson")
    ]);

    geojson = await geoRes.json();
    const nhoodData = await nhoodRes.json();
    neighborhoods = nhoodData.features;

    zoomBehavior = d3.zoom()
      .scaleExtent([0.7, 18])
      .on("zoom", (event) => {
        transform = event.transform;
      });

    d3.select(svgElement).call(zoomBehavior);
  });

  $: if (geojson && data.length) {
    projects = geojson.features
      .map(feature => {
        const match = data.find(d => d.project === feature.properties.j_Project);
        return match ? { ...match, geometry: feature.geometry } : null;
      })
      .filter(Boolean);
  } else {
    projects = [];
  }

  $: featureCollection =
    projects.length || neighborhoods.length
      ? {
          type: "FeatureCollection",
          features: [
            ...neighborhoods,
            ...projects.map(p => ({ type: "Feature", geometry: p.geometry }))
          ]
        }
      : null;

  $: projection =
    featureCollection
      ? d3.geoIdentity().reflectY(true).fitSize([width, height], featureCollection)
      : null;

  $: pathGenerator = projection ? d3.geoPath().projection(projection) : null;

  $: colorScale = d3.scaleLinear()
    .domain([-0.5, 0, 0.5])
    .range(["#c65a46", "#f5f4ef", "#2f7f5f"])
    .clamp(true);

  function getProjectedCoords(geometry) {
    if (!projection) return [0, 0];
    const [x, y] = projection(geometry.coordinates);
    return [x * transform.k + transform.x, y * transform.k + transform.y];
  }

  function resetZoom() {
    if (!zoomBehavior || !svgElement) return;
    d3.select(svgElement)
      .transition()
      .duration(500)
      .call(zoomBehavior.transform, d3.zoomIdentity);
  }
</script>

<div class="map-wrapper">
  <div class="header">
    <div>
      <p class="eyebrow">Map view</p>
      <h2>Where TOD project supply appears aligned — or misaligned — with nearby renter demand</h2>
      <p class="caption">
        Circle color shows the gap between affordable unit share and the share of nearby lower-income renters. Click a project to update all charts.
      </p>
    </div>
    <button class="reset" on:click={resetZoom}>Reset view</button>
  </div>

  <div class="map-container" bind:clientWidth={width}>
    <svg bind:this={svgElement} {width} {height}>
      <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
        <g class="basemap">
          {#each neighborhoods as feature}
            {#if pathGenerator}
              <path
                d={pathGenerator(feature)}
                fill="#f7f8fa"
                stroke="#cfd8df"
                stroke-width={0.6 / transform.k}
                style="vector-effect: non-scaling-stroke;"
              />
            {/if}
          {/each}
        </g>

        {#each projects as project}
          {#if projection}
            {@const [x, y] = projection(project.geometry.coordinates)}
            {@const isSelected = selectedId === project.id}
            {@const isHovered = hoveredProject?.id === project.id}

            <circle
              cx={x}
              cy={y}
              r={32 / transform.k}
              fill="rgba(31, 41, 55, 0.04)"
              stroke={isSelected ? "#111827" : "#c6ced6"}
              stroke-dasharray="4 4"
              stroke-width={1 / transform.k}
              style="pointer-events:none;"
            />

            <circle
              cx={x}
              cy={y}
              r={(isSelected ? 13 : isHovered ? 10 : 7) / transform.k}
              fill={colorScale(project.mismatchScore)}
              stroke={isSelected ? "#111827" : "white"}
              stroke-width={(isSelected ? 2.4 : 1.5) / transform.k}
              class="project-node"
              on:mouseenter={() => hoveredProject = project}
              on:mouseleave={() => hoveredProject = null}
              on:click={() => onSelect(project)}
            />
          {/if}
        {/each}
      </g>
    </svg>

    {#if hoveredProject}
      {@const [tx, ty] = getProjectedCoords(hoveredProject.geometry)}
      <div class="tooltip" style={`left:${tx + 16}px; top:${ty - 18}px;`}>
        <p class="tooltip-title">{hoveredProject.project}</p>
        <p class="tooltip-address">{hoveredProject.address}</p>

        <div class="stats">
          <div class="stat-row">
            <span>Affordable share</span>
            <strong>{(hoveredProject.affordableShare * 100).toFixed(0)}%</strong>
          </div>
          <div class="stat-row">
            <span>Lower-income demand</span>
            <strong>{(hoveredProject.lowerIncomeDemandShare * 100).toFixed(0)}%</strong>
          </div>
          <div class="stat-row">
            <span>Total units</span>
            <strong>{hoveredProject.totalUnits}</strong>
          </div>
        </div>

        <div class="mismatch-flag" style={`background:${colorScale(hoveredProject.mismatchScore)}22`}>
          <strong>Gap: {(hoveredProject.mismatchScore * 100).toFixed(1)} pts</strong>
          <p>{hoveredProject.mismatchScore < 0 ? "Affordable share falls short of nearby demand." : "Affordable share exceeds nearby demand share."}</p>
        </div>
      </div>
    {/if}
  </div>

  <div class="legend">
    <div class="bar"></div>
    <div class="labels">
      <span>Under-serving</span>
      <span>Balanced</span>
      <span>Exceeding</span>
    </div>
  </div>
</div>

{#if data.length}
  {@const worst = [...data].sort((a, b) => a.mismatchScore - b.mismatchScore)[0]}
  <div class="annotation-box">
    <strong>Current takeaway</strong>
    <p>
      The largest gap in the filtered view appears at <em>{worst.project}</em>,
      where the affordable share of the project trails nearby lower-income demand by
      {(Math.abs(worst.mismatchScore) * 100).toFixed(1)} percentage points.
    </p>
  </div>
{/if}

<style>
  .map-wrapper {
    padding: 18px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .eyebrow {
    margin: 0 0 6px 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    font-weight: 700;
  }

  h2 {
    margin: 0 0 4px 0;
    font-size: 1.1rem;
    line-height: 1.25;
  }

  .caption {
    margin: 0;
    font-size: 0.88rem;
    color: #5b6b7a;
    max-width: 720px;
  }

  .reset {
    border: 1px solid #d0d7de;
    background: white;
    border-radius: 10px;
    padding: 8px 12px;
    cursor: pointer;
  }

  .map-container {
    position: relative;
    background: #d9edf8;
    border: 1px solid #d9e0e7;
    border-radius: 14px;
    overflow: hidden;
    cursor: grab;
  }

  .map-container:active {
    cursor: grabbing;
  }

  .tooltip {
    position: absolute;
    width: 250px;
    background: white;
    border: 1px solid #cfd8df;
    border-radius: 12px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
    padding: 12px;
    pointer-events: none;
    z-index: 10;
  }

  .tooltip-title {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 700;
  }

  .tooltip-address {
    margin: 4px 0 10px 0;
    color: #64748b;
    font-size: 0.8rem;
  }

  .stats {
    display: grid;
    gap: 6px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.8rem;
  }

  .mismatch-flag {
    margin-top: 10px;
    padding: 8px;
    border-radius: 8px;
    font-size: 0.78rem;
  }

  .mismatch-flag p {
    margin: 4px 0 0 0;
  }

  .legend {
    width: 320px;
    margin-top: 10px;
  }

  .bar {
    height: 10px;
    border-radius: 8px;
    background: linear-gradient(to right, #c65a46, #f5f4ef, #2f7f5f);
  }

  .labels {
    display: flex;
    justify-content: space-between;
    color: #64748b;
    font-size: 0.74rem;
    margin-top: 6px;
  }

  .project-node {
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .annotation-box {
    margin-top: 12px;
    max-width: 520px;
    padding: 12px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    font-size: 0.84rem;
    color: #334155;
  }

  .annotation-box p {
    margin: 6px 0 0 0;
  }
</style>