<script>
  import * as d3 from "d3";
  export let tod;
  export let width = 360;
  export let height = 72;

  const margin = { top: 20, right: 16, bottom: 24, left: 16 };
  $: innerWidth = width - margin.left - margin.right;
  $: data = [
    { label: "Affordable", value: tod?.affordableUnits ?? 0, color: "#2f7f5f" },
    { label: "Market-rate", value: tod?.marketRateUnits ?? 0, color: "#d98c5f" }
  ];
  $: total = d3.sum(data, d => d.value);
  $: x = d3.scaleLinear().domain([0, Math.max(total, 1)]).range([0, innerWidth]);

  $: stacked = (() => {
    let acc = 0;
    return data.map(d => {
      const x0 = acc;
      acc += d.value;
      return { ...d, x0, x1: acc };
    });
  })();
</script>

<svg {width} {height}>
  <g transform={`translate(${margin.left},${margin.top})`}>
    <text x="0" y="-6" font-size="12" font-weight="700">Unit mix</text>

    {#each stacked as d}
      <rect
        x={x(d.x0)}
        y={0}
        width={Math.max(0, x(d.x1) - x(d.x0))}
        height={24}
        fill={d.color}
        rx="5"
      />
    {/each}

    <text x="0" y="42" font-size="11" fill="#475569">Affordable: {tod.affordableUnits}</text>
    <text x="125" y="42" font-size="11" fill="#475569">Market-rate: {tod.marketRateUnits}</text>
    <text x="265" y="42" font-size="11" fill="#475569">{d3.format(".0%")(tod.affordableShare)} affordable</text>
  </g>
</svg>