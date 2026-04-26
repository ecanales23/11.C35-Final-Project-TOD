<script>
  import * as d3 from "d3";
  export let tod;
  export let height = 200;

  let containerWidth = 300;

  const margin = { top: 56, right: 16, bottom: 48, left: 48 };
  $: innerWidth = containerWidth - margin.left - margin.right;
  $: innerHeight = height - margin.top - margin.bottom;

  $: data = tod ? [
    { label: "Affordable share", value: tod.affordableShare, color: "#2f7f5f" },
    { label: "Low-income demand", value: tod.lowerIncomeDemandShare, color: "#d80073" }
  ] : [];

  $: x = d3.scaleBand().domain(data.map(d => d.label)).range([0, innerWidth]).padding(0.3);
  $: y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);
  $: yTicks = [0, 0.25, 0.5, 0.75, 1];
</script>

<div class="chart-wrap" bind:clientWidth={containerWidth}>
  <svg width={containerWidth} {height}>
    <g transform={`translate(${margin.left},${margin.top})`}>

      <text x={innerWidth / 2.23} y="-38" text-anchor="middle" font-size="12" font-weight="700" fill="#1e293b">
        Project supply vs. Nearby Demand
      </text>


      <!-- y gridlines + ticks -->
      {#each yTicks as tick}
        <line x1="0" x2={innerWidth} y1={y(tick)} y2={y(tick)} stroke="#edf2f7" />
        <text x="-8" y={y(tick) + 4} text-anchor="end" font-size="10" fill="#94a3b8">
          {d3.format(".0%")(tick)}
        </text>
      {/each}

      <!-- bars -->
      {#each data as d}
        <rect
          x={x(d.label)}
          y={y(d.value)}
          width={x.bandwidth()}
          height={innerHeight - y(d.value)}
          fill={d.color}
          rx="3"
        />
        <!-- value label above bar -->
        <text
          x={x(d.label) + x.bandwidth() / 2}
          y={y(d.value) - 5}
          text-anchor="middle"
          font-size="10"
          font-weight="600"
          fill="#334155"
        >
          {d3.format(".0%")(d.value)}
        </text>
        <!-- x axis label -->
        <text
          x={x(d.label) + x.bandwidth() / 2}
          y={innerHeight + 16}
          text-anchor="middle"
          font-size="10"
          fill="#475569"
        >
        {#if d.label === "Affordable share"}
              <tspan x={x(d.label) + x.bandwidth() / 2} dy="0">Affordable</tspan>
              <tspan x={x(d.label) + x.bandwidth() / 2} dy="12">share</tspan>
            {:else}
              <tspan x={x(d.label) + x.bandwidth() / 2} dy="0">Low-income</tspan>
              <tspan x={x(d.label) + x.bandwidth() / 2} dy="12">demand</tspan>
            {/if}
          </text>
      {/each}

      <!-- axes -->
      <line x1="0" x2={innerWidth} y1={innerHeight} y2={innerHeight} stroke="#e2e8f0" />
      <line x1="0" x2="0" y1="0" y2={innerHeight} stroke="#e2e8f0" />

    </g>
  </svg>
</div>

<style>
  .chart-wrap { width: 100%; }
</style>