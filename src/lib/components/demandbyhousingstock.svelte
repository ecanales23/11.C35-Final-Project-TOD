<script>
  export let tod;

  let hoveredKey = null;
  let selectedKey = null;

  const BAR_HEIGHT = 200;

  const INCOME_TIERS = [
    {
      key: "zeroNeg",
      label: "0 / neg.",
      range: "$0 or below",
      ami: "0% AMI",
      amiLevel: "Extremely Low Income",
      amiNote: "Households with zero or negative annual income. Highest housing need; cannot afford any market-rate rent.",
      qualifies: "yes",
      color: "#3b0764"
    },
    {
      key: "lt20",
      label: "<$20k",
      range: "Under $20,000 / yr",
      ami: "~17% AMI",
      amiLevel: "Extremely Low Income",
      amiNote: "Boston's median 1BR rent (~$2,400/mo) requires ~$96k income at the 30% rule — nearly 5× this group's earnings.",
      qualifies: "yes",
      color: "#6b21a8"
    },
    {
      key: "x20_35",
      label: "$20–35k",
      range: "$20,000–$34,999 / yr",
      ami: "~17–29% AMI",
      amiLevel: "Very Low Income",
      amiNote: "Qualifies for deeply affordable units targeting 30–50% AMI. Cannot afford market-rate Boston apartments without severe cost burden.",
      qualifies: "yes",
      color: "#7c3aed"
    },
    {
      key: "x35_50",
      label: "$35–50k",
      range: "$35,000–$49,999 / yr",
      ami: "~29–42% AMI",
      amiLevel: "Very Low Income",
      amiNote: "May qualify for 50–60% AMI units. At 30% of income, max affordable rent is ~$875–$1,250/mo — below most market-rate listings.",
      qualifies: "yes",
      color: "#a855f7"
    },
    {
      key: "x50_75",
      label: "$50–75k",
      range: "$50,000–$74,999 / yr",
      ami: "~42–63% AMI",
      amiLevel: "Low–Moderate Income",
      amiNote: "May qualify for some 80% AMI units depending on household size and project. Often still cost-burdened in Boston's rental market.",
      qualifies: "maybe",
      color: "#c084fc"
    },
    {
      key: "x75plus",
      label: "$75k+",
      range: "$75,000+ / yr",
      ami: "~63%+ AMI",
      amiLevel: "Middle to Higher Income",
      amiNote: "Generally above income limits for deed-restricted affordable housing. Competes in the market-rate rental market.",
      qualifies: "no",
      color: "#ede9fe"
    }
  ];

  $: totalRenters = tod?.totalRenters || 0;
  $: renterBins   = tod?.renterBins   || [];

  $: demandSegments = INCOME_TIERS.map(tier => {
    const bin = renterBins.find(b => b.key === tier.key);
    const value = bin?.value || 0;
    const share = totalRenters > 0 ? value / totalRenters : 0;
    return { ...tier, value, share };
  });

  $: affordableShare  = tod?.affordableShare  || 0;
  $: affordableUnits  = tod?.affordableUnits  || 0;
  $: totalUnits       = tod?.totalUnits       || 0;
  $: marketRateUnits  = tod?.marketRateUnits  || 0;
  $: lowerIncomeShare = tod?.lowerIncomeDemandShare || 0;

  // Active key is hovered, otherwise selected, otherwise null
  $: activeKey = hoveredKey || selectedKey;
  $: activeItem = demandSegments.find(s => s.key === activeKey) ?? null;

  $: boundaryPx = Math.round(lowerIncomeShare * BAR_HEIGHT);

  $: segmentMids = (() => {
    let offset = 0;
    return demandSegments
      .filter(s => s.share > 0)
      .map((seg, i) => {
        if (i > 0) offset += 1; // 1px gap
        const h = seg.share * BAR_HEIGHT;
        const midY = offset + h / 2;
        offset += h;
        return { key: seg.key, midY, share: seg.share, color: seg.color };
      });
  })();

  function handleInteraction(key) {
    if (selectedKey === key) {
      selectedKey = null; // Toggle off if already selected
    } else {
      selectedKey = key;
    }
  }
</script>

<div class="chart-wrap">

  <div class="section-title">Project Supply vs. Nearby Demand</div>

  <div class="supply-section">
    <div class="bar-header">
      <span class="bar-label">Project Supply</span>
      <span class="bar-stat supply-stat">{Math.round(affordableShare * 100)}% affordable</span>
    </div>
    <div class="bar-sub">
      {affordableUnits} affordable + {marketRateUnits} market-rate = {totalUnits} total units
    </div>
    <div class="h-bar-track">
      {#if affordableShare > 0}
        <div class="h-bar-fill supply-fill" style="width:{affordableShare * 100}%">
          {#if affordableShare > 0.08}<span class="fill-label">{affordableUnits}</span>{/if}
        </div>
      {/if}
      <div class="h-bar-fill market-fill" style="width:{(1 - affordableShare) * 100}%">
        {#if (1 - affordableShare) > 0.08}<span class="fill-label market-label">{marketRateUnits}</span>{/if}
      </div>
    </div>
    <div class="supply-legend">
      <span class="dot" style="background:#1e40af;"></span>
      <span class="leg">Deed-restricted affordable</span>
      <span class="dot" style="background:#e2e8f0; border:1px solid #cbd5e1;"></span>
      <span class="leg">Market-rate</span>
    </div>
  </div>

  <div class="demand-section">
    <div class="bar-header">
      <span class="bar-label">Nearby Demand</span>
      <span class="bar-stat demand-stat">{Math.round(lowerIncomeShare * 100)}% low-income renters</span>
    </div>
    <div class="bar-sub">
      Income distribution of {totalRenters.toLocaleString()} renter households within 0.5 mi
    </div>

    <div class="demand-body">

      <div class="vbar-wrap" style="height:{BAR_HEIGHT}px;">
        <div class="vbar" role="group" aria-label="Renter income distribution">
          <div class="boundary-line" style="top:{boundaryPx}px;"></div>
          {#each demandSegments as seg}
            {#if seg.share > 0}
              <button
                class="vbar-seg"
                class:seg-active={activeKey === seg.key}
                class:seg-selected={selectedKey === seg.key}
                class:seg-dim={activeKey && activeKey !== seg.key}
                style="height:{seg.share * 100}%; background:{seg.color};"
                on:mouseenter={() => (hoveredKey = seg.key)}
                on:mouseleave={() => (hoveredKey = null)}
                on:click={() => handleInteraction(seg.key)}
                aria-label="{seg.range}: {Math.round(seg.share * 100)}% of renters"
              ></button>
            {/if}
          {/each}
        </div>
        {#each segmentMids as m}
          <span
            class="ext-pct"
            class:ext-active={activeKey === m.key}
            style="top:{m.midY}px; color:{m.key === 'x75plus' ? '#6b21a8' : m.color};"
          >{Math.round(m.share * 100)}%</span>
        {/each}
      </div>

      <div class="ann-col" style="height:{BAR_HEIGHT}px;">
        <div class="ann-block" style="height:{lowerIncomeShare * 100}%; border-color:#6b21a8;">
          <span class="ann-label low-ann">
            {Math.round(lowerIncomeShare * 100)}%<br>low-<br>income
          </span>
        </div>
        <div class="ann-block ann-high" style="height:{(1 - lowerIncomeShare) * 100}%; border-color:#94a3b8;">
          <span class="ann-label high-ann">
            {Math.round((1 - lowerIncomeShare) * 100)}%<br>higher<br>income
          </span>
        </div>
      </div>

      <div class="info-panel" class:info-active={!!activeItem} class:info-locked={!!selectedKey} style="height:{BAR_HEIGHT}px; overflow-y: auto; overflow-x: hidden;">
        {#if activeItem}
          <div class="info-header">
            <div class="info-swatch" style="background:{activeItem.color};"></div>
            {#if selectedKey === activeItem.key}
              <span class="locked-badge">Selected</span>
            {/if}
          </div>
          <div class="info-range">{activeItem.range}</div>
          <div class="info-ami">{activeItem.ami} · {activeItem.amiLevel}</div>
          <div class="info-count">
            <strong>{activeItem.value.toLocaleString()}</strong> hh
            <span class="info-pct">({Math.round(activeItem.share * 100)}%)</span>
          </div>
          <p class="info-note">{activeItem.amiNote}</p>
          <div
            class="info-badge"
            class:badge-yes={activeItem.qualifies === 'yes'}
            class:badge-maybe={activeItem.qualifies === 'maybe'}
            class:badge-no={activeItem.qualifies === 'no'}
          >
            {#if activeItem.qualifies === 'yes'}
              Qualifies for affordable units
            {:else if activeItem.qualifies === 'maybe'}
              May qualify by household size
            {:else}
              Above typical income limits
            {/if}
          </div>
        {:else}
          <p class="info-empty">← Hover or click a segment for income tier details</p>
        {/if}
      </div>

    </div>

    <div class="tier-legend">
      {#each demandSegments as seg}
        <button
          class="tier-chip"
          class:chip-active={activeKey === seg.key}
          class:chip-selected={selectedKey === seg.key}
          on:mouseenter={() => (hoveredKey = seg.key)}
          on:mouseleave={() => (hoveredKey = null)}
          on:click={() => handleInteraction(seg.key)}
        >
          <span class="chip-dot" style="background:{seg.color}; {seg.key === 'x75plus' ? 'border:1px solid #d8b4fe;' : ''}"></span>
          <span class="chip-label">{seg.label}</span>
        </button>
      {/each}
      {#if selectedKey}
        <button class="clear-btn" on:click={() => selectedKey = null}>Clear selection ✕</button>
      {/if}
    </div>
  </div>

  <div class="footnote">
    AMI = Area Median Income for the Boston metro area. Thresholds are approximate; eligibility varies by household size and project. Income data from ACS 5-Year Estimates.
  </div>
</div>

<style>
  .chart-wrap {
    width: 100%;
    font-family: inherit;
  }

  .section-title {
    font-size: 0.8rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
    margin-bottom: 14px;
  }

  .supply-section { margin-bottom: 18px; }

  .bar-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 1px;
  }

  .bar-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #334155;
  }

  .bar-stat { font-size: 0.76rem; font-weight: 700; }
  .supply-stat { color: #1e40af; }
  .demand-stat { color: #6b21a8; }

  .bar-sub {
    font-size: 0.63rem;
    color: #94a3b8;
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .h-bar-track {
    display: flex;
    width: 100%;
    height: 26px;
    border-radius: 5px;
    overflow: hidden;
    background: #f1f5f9;
  }

  .h-bar-fill {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .supply-fill { background: #1e40af; }
  .market-fill { background: #e2e8f0; }

  .fill-label {
    font-size: 0.62rem;
    font-weight: 700;
    color: white;
    pointer-events: none;
    user-select: none;
  }
  .market-label { color: #475569; }

  .supply-legend {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 5px;
    flex-wrap: wrap;
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: 2px;
    flex-shrink: 0;
    display: inline-block;
  }

  .leg { font-size: 0.65rem; color: #475569; margin-right: 8px; }

  /* ── Demand section (vertical bar) ── */
  .demand-section { margin-bottom: 10px; }

  .demand-body {
    display: grid;
    grid-template-columns: 58px 48px 1fr;
    gap: 6px;
    align-items: stretch;
    margin-top: 8px;
  }

  .vbar-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .vbar {
    display: flex;
    flex-direction: column;
    width: 36px;
    height: 100%;
    border-radius: 5px;
    overflow: hidden;
    gap: 1px;
    background: #e2e8f0;
    position: relative;
  }

  .boundary-line {
    position: absolute;
    left: -2px;
    right: -2px;
    height: 2px;
    background: white;
    z-index: 2;
    pointer-events: none;
  }

  .vbar-seg {
    width: 100%;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: opacity 0.1s, box-shadow 0.1s;
  }

  .vbar-seg.seg-dim { opacity: 0.35; }
  .vbar-seg.seg-active { outline: 2px solid #1e293b; outline-offset: -2px; z-index: 1; opacity: 1; }
  .vbar-seg.seg-selected { box-shadow: inset 0 0 0 2px #ffffff, 0 0 0 2px #0f172a; z-index: 2; }

  .ext-pct {
    position: absolute;
    left: 40px;
    transform: translateY(-50%);
    font-size: 0.55rem;
    font-weight: 700;
    white-space: nowrap;
    pointer-events: none;
    transition: opacity 0.1s, font-size 0.1s;
  }

  .ext-pct.ext-active { font-size: 0.62rem; color: #1e293b !important; }

  .ann-col {
    display: flex;
    flex-direction: column;
  }

  .ann-block {
    border-right: 2px solid #6b21a8;
    border-top: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 5px;
    box-sizing: border-box;
  }

  .ann-high { border-color: #94a3b8; }

  .ann-label {
    font-size: 0.55rem;
    font-weight: 700;
    line-height: 1.3;
    text-align: right;
  }

  .low-ann  { color: #6b21a8; }
  .high-ann { color: #94a3b8; }

  /* Info panel */
  .info-panel {
    background: #f8f7ff;
    border: 1px solid #e9d5ff;
    border-radius: 8px;
    padding: 9px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s;
  }

  .info-panel::-webkit-scrollbar {
    width: 4px;
  }

  .info-panel::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  .info-panel.info-active { border-color: #a855f7; }
  .info-panel.info-locked { background: #fdfcff; border-color: #7c3aed; box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08); }

  .info-empty {
    font-size: 0.6rem;
    color: #94a3b8;
    line-height: 1.5;
    margin: auto 0;
  }

  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .info-swatch {
    width: 22px;
    height: 6px;
    border-radius: 3px;
    flex-shrink: 0;
    margin-bottom: 2px;
  }

  .locked-badge {
    font-size: 0.5rem;
    text-transform: uppercase;
    font-weight: 800;
    letter-spacing: 0.05em;
    background: #e2e8f0;
    color: #475569;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .info-range {
    font-size: 0.67rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.3;
  }

  .info-ami {
    font-size: 0.59rem;
    color: #7c3aed;
    margin-bottom: 2px;
    line-height: 1.3;
  }

  .info-count { font-size: 0.64rem; color: #334155; }
  .info-pct   { color: #94a3b8; font-weight: 400; }

  .info-note {
    font-size: 0.59rem;
    color: #64748b;
    line-height: 1.4;
    margin: 2px 0 4px;
  }

  .info-badge {
    font-size: 0.57rem;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 20px;
    display: inline-block;
    align-self: flex-start;
  }

  .badge-yes   { background: #dbeafe; color: #1e40af; }
  .badge-maybe { background: #ede9fe; color: #6b21a8; }
  .badge-no    { background: #f1f5f9; color: #64748b; }

  .tier-legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 3px 5px;
    margin-top: 8px;
  }

  .tier-chip {
    display: flex;
    align-items: center;
    gap: 3px;
    background: none;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 2px 6px 2px 4px;
    cursor: pointer;
    transition: border-color 0.1s, background 0.1s;
  }

  .tier-chip:hover,
  .tier-chip.chip-active {
    border-color: #a855f7;
    background: #f5f3ff;
  }

  .tier-chip.chip-selected {
    border-color: #7c3aed;
    background: #ede9fe;
    box-shadow: 0 1px 2px rgba(124, 58, 237, 0.1);
  }

  .chip-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
    display: inline-block;
  }

  .chip-label { font-size: 0.6rem; color: #475569; font-weight: 500; }
  .chip-selected .chip-label { color: #1e293b; font-weight: 600; }

  .clear-btn {
    font-size: 0.55rem;
    color: #64748b;
    background: none;
    border: 1px solid transparent;
    cursor: pointer;
    padding: 2px 6px;
    margin-left: auto;
    border-radius: 4px;
  }

  .clear-btn:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  .footnote {
    font-size: 0.58rem;
    color: #94a3b8;
    line-height: 1.4;
    border-top: 1px solid #f1f5f9;
    padding-top: 6px;
    margin-top: 4px;
  }
</style>
