<script>
  import * as d3 from "d3";

  export let tod;
  export let width = 360;
  export let height = 220;

  const margin = { top: 24, right: 16, bottom: 48, left: 56 };

  $: innerWidth = width - margin.left - margin.right;
  $: innerHeight = height - margin.top - margin.bottom;

  $: bins = tod?.renterBins ?? [];

  $: x = d3.scaleBand()
    .domain(bins.map(d => d.label))
    .range([0, innerWidth])
    .padding(0.18);

  $: y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.value) || 1])
    .nice()
    .range([innerHeight, 0]);

  $: yTicks = y.ticks(4);
</script>

{#if tod}
<svg {width} {height}>
  <g transform={`translate(${margin.left},${margin.top})`}>
    <text x="0" y="-8" font-size="12" font-weight="600">
      Nearby renter households by income
    </text>

    {#each yTicks as tick}
      <line x1="0" x2={innerWidth} y1={y(tick)} y2={y(tick)} stroke="#e5e7eb" />
      <text x="-8" y={y(tick) + 4} text-anchor="end" font-size="10" fill="#666">
        {d3.format(".2s")(tick)}
      </text>
    {/each}

    {#each bins as d}
      <rect
        x={x(d.label)}
        y={y(d.value)}
        width={x.bandwidth()}
        height={innerHeight - y(d.value)}
        fill="#6c8ebf"
        rx="3"
      />
      <text
        x={x(d.label) + x.bandwidth() / 2}
        y={innerHeight + 14}
        text-anchor="middle"
        font-size="10"
        fill="#444"
      >
        {d.label}
      </text>
    {/each}
  </g>
</svg>
{/if}