<script>
  import * as d3 from "d3";
  import DemandFitChart from "./demandbyhousingstock.svelte";

  export let tod = null;

  let stableTod = null;

  $: if (tod && (!stableTod || stableTod.project !== tod.project)) {
    stableTod = tod;
  }
</script>

{#if stableTod}
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
      <h2>{stableTod.project}</h2>
      <p class="address">{stableTod.address}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="label">Total units</span>
        <span class="value">{stableTod.totalUnits}</span>
      </div>
      <div class="stat-card">
        <span class="label">Affordable units</span>
        <span class="value">{stableTod.affordableUnits}</span>
      </div>
      <div class="stat-card">
        <span class="label">Share of Affordable</span>
        <span class="value">{d3.format(".0%")(stableTod.affordableShare)}</span>
      </div>
      <div class="stat-card highlight" class:negative={stableTod.mismatchScore < 0}>
        <span class="label">Opportunity score</span>
        <span class="value">{d3.format("+.0%")(stableTod.mismatchScore)}</span>
      </div>
    </div>

    <div class="chart-container">
      {#key stableTod.project}
        <DemandFitChart tod={stableTod} />
      {/key}
    </div>

    <div class="analysis-box">
      <div class="status-indicator" class:status-alert={stableTod.mismatchScore < 0}>
        {#if stableTod.mismatchScore < 0}
          <p>
            <strong>Providing less opportunity than local demand:</strong>
            This project’s affordable share is <strong>{Math.abs(stableTod.mismatchScore * 100).toFixed(1)} percentage points below</strong> the nearby lower-income renter share. There are more lower-income renters in this neighborhood than the development is built to serve.
          </p>
        {:else}
          <p>
            <strong>Providing more opportunity than local demand:</strong>
            This project’s affordable share is <strong>{Math.abs(stableTod.mismatchScore * 100).toFixed(1)} percentage points above</strong> the nearby lower-income renter share.
          </p>
        {/if}
      </div>

      <div class="meta-info">
        <div class="meta-stat-row">
          <span class="meta-label">Affordable units per 100 nearby lower-income renters:</span>
          <span class="meta-value">{stableTod.affordableUnitsPer100LowIncomeRenters.toFixed(1)}</span>
        </div>

        {#if stableTod.note}
          <p class="project-note"><strong>Project note:</strong> {stableTod.note}</p>
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
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    max-width: 500px;
    box-sizing: border-box;
  }

  .header {
    margin-bottom: 24px;
  }

  .eyebrow {
    margin: 0 0 6px 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
    font-weight: 700;
  }

  h2 {
    margin: 0 0 4px 0;
    font-size: 1.15rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .address {
    margin: 0;
    color: #64748b;
    font-size: 0.8rem;
  }

  .intro-box {
    margin-bottom: 24px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.75rem;
  }

  summary {
    padding: 12px 16px;
    cursor: pointer;
    font-weight: 600;
    color: #475569;
    list-style: none;
    outline: none;
    user-select: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  .details-content {
    padding: 0 16px 16px 16px;
    color: #475569;
    line-height: 1.5;
  }

  .details-content p {
    margin: 0;
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
    padding: 14px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
    display: flex;
    flex-direction: column;
  }

  .label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    margin-bottom: 6px;
    letter-spacing: 0.05em;
  }

  .value {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
  }

  .stat-card.highlight .value {
    color: #059669;
  }

  .stat-card.highlight.negative .value {
    color: #e11d48;
  }

  .chart-container {
    margin-bottom: 24px;
    padding: 20px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05);
    min-height: 250px;
    position: relative;
    overflow: hidden;
  }

  .analysis-box {
    border-top: 1px solid #e2e8f0;
    padding-top: 24px;
  }

  .status-indicator {
    padding-left: 16px;
    border-left: 4px solid #059669;
    margin-bottom: 24px;
    font-size: 0.8rem;
    line-height: 1.6;
    color: #334155;
  }

  .status-indicator.status-alert {
    border-left-color: #d97706;
  }

  .status-indicator p {
    margin: 0;
  }

  .status-indicator strong {
    color: #0f172a;
  }

  .meta-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 0.8rem;
    color: #475569;
  }

  .meta-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
  }

  .meta-label {
    font-weight: 600;
  }

  .meta-value {
    font-weight: 700;
    color: #0f172a;
    font-size: 0.9rem;
  }

  .project-note {
    background: #fffbeb;
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid #fef3c7;
    margin: 4px 0;
    line-height: 1.5;
    color: #92400e;
  }

  .disclaimer {
    font-size: 0.75rem;
    color: #94a3b8;
    margin: 8px 0 0 0;
    line-height: 1.5;
  }
</style>
