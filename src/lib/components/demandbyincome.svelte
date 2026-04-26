<script>
  import * as d3 from "d3";
  export let tod;
  export let height = 260;

  let containerWidth = 300;

  const margin = { top: 68, right: 16, bottom: 32, left: 35 };
  $: innerWidth = containerWidth - margin.left - margin.right;
  $: innerHeight = height - margin.top - margin.bottom;
  $: bins = tod?.renterBins ?? [];

  $: x = d3.scaleBand().domain(bins.map(d => d.label)).range([0, innerWidth]).padding(0.2);
  $: y = d3.scaleLinear().domain([0, d3.max(bins, d => d.value) || 1]).nice().range([innerHeight, 0]);
  $: yTicks = y.ticks(4);
</script>

<div class="chart-wrap" bind:clientWidth={containerWidth}>
  <svg width={containerWidth} {height}>
    <g transform={`translate(${margin.left},${margin.top})`}>

      <text x={innerWidth / 2.25} y="-48" text-anchor="middle" font-size="12" font-weight="700" fill="#1e293b">
        Nearby renter households by income
      </text>
      <text x={innerWidth / 2} y="-32" text-anchor="middle" font-size="9" fill="#64748b">
        <tspan x={innerWidth / 2} dy="0">Census-based buffer area</tspan>
        <tspan x={innerWidth / 2} dy="12">around the selected TOD project.</tspan>
      </text>

      {#each yTicks as tick}
        <line x1="0" x2={innerWidth} y1={y(tick)} y2={y(tick)} stroke="#edf2f7" />
        <text x="-8" y={y(tick) + 4} text-anchor="end" font-size="10" fill="#94a3b8">
          {d3.format(".2s")(tick)}
        </text>
      {/each}

      {#each bins as d}
        <rect
          x={x(d.label)}
          y={y(d.value)}
          width={x.bandwidth()}
          height={innerHeight - y(d.value)}
          fill="#6b8fb3"
          rx="4"
        />
        <text
          x={x(d.label) + x.bandwidth() / 4}
          y={innerHeight + 20}
          text-anchor="middle"
          font-size="9"
          fill="#475569"
          transform={`rotate(-60, ${x(d.label) + x.bandwidth() / 2}, ${innerHeight + 8})`}
        >
          {d.label}
        </text>
      {/each}

      <line x1="0" x2={innerWidth} y1={innerHeight} y2={innerHeight} stroke="#e2e8f0" />
      <line x1="0" x2="0" y1="0" y2={innerHeight} stroke="#e2e8f0" />

    </g>
  </svg>
</div>

<style>
  .chart-wrap {
    width: 100%;
    overflow: hidden;
  }
</style>