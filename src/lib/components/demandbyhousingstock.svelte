<script>
  import * as d3 from "d3";

  export let tod;
  export let width = 360;
  export let height = 160;

  const margin = { top: 28, right: 16, bottom: 36, left: 84 };

  $: innerWidth = width - margin.left - margin.right;
  $: innerHeight = height - margin.top - margin.bottom;

  $: data = tod ? [
    { label: "Affordable share\nof project", value: tod.affordableShare, color: "#2a6f97" },
    { label: "Nearby renters\nunder $50k", value: tod.lowerIncomeDemandShare, color: "#b56576" }
  ] : [];

  $: x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
  $: y = d3.scaleBand().domain(data.map(d => d.label)).range([0, innerHeight]).padding(0.28);
  $: xTicks = [0, 0.25, 0.5, 0.75, 1];
</script>

{#if tod}
<svg {width} {height}>
  <g transform={`translate(${margin.left},${margin.top})`}>
    <text x="0" y="-10" font-size="12" font-weight="600">
      How well does supply fit local demand?
    </text>

    {#each xTicks as tick}
      <line x1={x(tick)} x2={x(tick)} y1="0" y2={innerHeight} stroke="#f0f0f0" />
      <text x={x(tick)} y={innerHeight + 18} text-anchor="middle" font-size="10" fill="#666">
        {d3.format(".0%")(tick)}
      </text>
    {/each}

    {#each data as d}
      <text x="-8" y={y(d.label) + y.bandwidth() / 2 + 4} text-anchor="end" font-size="10" fill="#444">
        {d.label}
      </text>

      <rect
        x="0"
        y={y(d.label)}
        width={x(d.value)}
        height={y.bandwidth()}
        fill={d.color}
        rx="4"
      />

      <text
        x={x(d.value) + 6}
        y={y(d.label) + y.bandwidth() / 2 + 4}
        font-size="10"
        fill="#222"
      >
        {d3.format(".0%")(d.value)}
      </text>
    {/each}
  </g>
</svg>

<p style="font-size: 11px; color: #555; margin-top: 4px;">
  Mismatch score: {d3.format("+.0%")(tod.mismatchScore)} ·
  {d3.format(".1f")(tod.affordableUnitsPer100LowIncomeRenters)} affordable units per 100 nearby renters under $50k
</p>
{/if}