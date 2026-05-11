<script>
  import * as d3 from "d3";
  import DemandFitChart from "./demandbyhousingstock.svelte";

  export let tod = null;
</script>

{#if tod}
  <div class="panel">
    <details class="intro-box">
      <summary>About this panel</summary>
      <div class="details-content">
        <p>
          The selected project is compared with nearby renter households in the surrounding buffer area shown on the map.
          The goal is to show whether the project’s affordable share appears low, similar to, or high relative to
          nearby lower-income renter demand.
        </p>
      </div>
    </details>

    <div class="header">
      <p class="eyebrow">Selected project</p>
      <h2>{tod.project}</h2>
      <p class="address">{tod.address}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="label">Total units</span>
        <span class="value">{tod.totalUnits}</span>
      </div>
      <div class="stat-card">
        <span class="label">Affordable units</span>
        <span class="value">{tod.affordableUnits}</span>
      </div>
      <div class="stat-card">
        <span class="label">Share of Affordable Units</span>
        <span class="value">{d3.format(".0%")(tod.affordableShare)}</span>
      </div>
      <div class="stat-card highlight" class:negative={tod.mismatchScore < 0}>
        <span class="label">Opportunity score</span>
        <span class="value">{d3.format("+.0%")(tod.mismatchScore)}</span>
      </div>
    </div>

    <!-- <div class="description-card">
      <p>
        For <strong>{tod.project}</strong>, the affordability rate is <strong>{d3.format(".0%")(tod.affordableShare)}</strong>
        because this TOD includes <strong>{tod.affordableUnits}</strong> affordable units and
        <strong>{tod.marketRateUnits}</strong> market-rate units out of <strong>{tod.totalUnits}</strong> total units.
      </p>
    </div> -->

    <div class="chart-container">
      <DemandFitChart {tod} />
    </div>

    <div class="analysis-box">
      <div class="status-indicator" class:status-alert={tod.mismatchScore < 0}>
        {#if tod.mismatchScore < 0}
          <p>
            <strong>Providing less opportunity than local demand:</strong>
            This project’s affordable share is <strong>{Math.abs(tod.mismatchScore * 100).toFixed(1)} percentage points below</strong> the nearby lower-income renter share. There are more lower-income renters in this neighborhood than the development is built to serve.
          </p>
        {:else}
          <p>
            <strong>Providing more opportunity than local demand:</strong>
            This project’s affordable share is <strong>{Math.abs(tod.mismatchScore * 100).toFixed(1)} percentage points above</strong> the nearby lower-income renter share — opening doors for renters to access this neighborhood.
          </p>
        {/if}
      </div>

      <div class="meta-info">
        <p>
          <strong>Affordable units per 100 nearby lower-income renters:</strong>
          {tod.affordableUnitsPer100LowIncomeRenters.toFixed(1)}
        </p>

        {#if tod.note}
          <p class="project-note"><strong>Project note:</strong> {tod.note}</p>
        {/if}

        <p class="disclaimer">
          <strong>Note:</strong>
          This is a proxy for local fit, not a full measure of whether the project meets all housing demand.
        </p>
      </div>
    </div>
  </div>
{/if}

<style>
  .panel {
    padding: 24px;
    font-family: system-ui, -apple-system, sans-serif;
    color: #1e293b;
    max-width: 500px;
  }

  .header {
    margin-bottom: 24px;
  }

  .eyebrow {
    margin: 0 0 4px 0;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
    font-weight: 700;
  }

  h2 {
    margin: 0 0 2px 0;
    font-size: 1.0rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
  }

  .address {
    margin: 0;
    color: #64748b;
    font-size: 0.75rem;
  }

  .intro-box {
    margin-bottom: 20px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.7rem;
  }

  summary {
    padding: 10px 14px;
    cursor: pointer;
    font-weight: 600;
    color: #475569;
    list-style: none;
    outline: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  .details-content {
    padding: 0 14px 12px 14px;
    color: #64748b;
    line-height: 1.5;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
  }

  .label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .value {
    font-size: 0.85rem;
    font-weight: 700;
    color: #1e293b;
  }

  .stat-card.highlight .value {
    color: #10b981;
  }

  .stat-card.highlight.negative .value {
    color: #ef4444;
  }

  .description-card {
    background: #f1f5f9;
    padding: 16px;
    border-radius: 12px;
    font-size: 0.7rem;
    line-height: 1.6;
    margin-bottom: 24px;
    color: #334155;
  }

  .chart-container {
    margin-bottom: 24px;
    padding: 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .analysis-box {
    border-top: 1px solid #e2e8f0;
    padding-top: 20px;
  }

  .status-indicator {
    padding-left: 16px;
    border-left: 4px solid #10b981;
    margin-bottom: 20px;
    font-size: 0.7rem;
    line-height: 1.6;
  }

  .status-indicator.status-alert {
    border-left-color: #f59e0b;
  }

  .meta-info {
    font-size: 0.85rem;
    color: #475569;
  }

  .project-note {
    background: #fff7ed;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #ffedd5;
    margin: 12px 0;
  }

  .disclaimer {
    font-size: 0.7rem;
    color: #94a3b8;
    margin-top: 16px;
    font-style: italic;
  }
</style>
