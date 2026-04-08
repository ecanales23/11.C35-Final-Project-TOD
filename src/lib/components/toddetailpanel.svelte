<script>
  import * as d3 from "d3";
  import UnitSplitChart from "./todunitsplit.svelte";
  import DemandByIncomeChart from "./demandbyincome.svelte";
  import DemandFitChart from "./demandbyhousingstock.svelte";

  export let tod = null;
</script>

{#if tod}
  <div class="panel">
    <div class="header">
      <p class="eyebrow">Selected project</p>
      <h2>{tod.project}</h2>
      <p class="address">{tod.address}</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <span>Total units</span>
        <strong>{tod.totalUnits}</strong>
      </div>
      <div class="stat-card">
        <span>Affordable units</span>
        <strong>{tod.affordableUnits}</strong>
      </div>
      <div class="stat-card">
        <span>Affordable share</span>
        <strong>{d3.format(".0%")(tod.affordableShare)}</strong>
      </div>
      <div class="stat-card">
        <span>Gap score</span>
        <strong>{d3.format("+.0%")(tod.mismatchScore)}</strong>
      </div>
    </div>

    <div class="chart-group">
      <UnitSplitChart {tod} width={360} />
    </div>

    <div class="chart-group">
      <DemandFitChart {tod} width={360} />
    </div>

    <div class="chart-group">
      <DemandByIncomeChart {tod} width={360} />
    </div>

    <div class="note-box">
      <p><strong>Interpretation:</strong> This project’s affordable unit share is {tod.mismatchScore < 0 ? "below" : "above"} the nearby lower-income renter share by {Math.abs(tod.mismatchScore * 100).toFixed(1)} percentage points.</p>
      <p><strong>Affordable units per 100 nearby lower-income renters:</strong> {tod.affordableUnitsPer100LowIncomeRenters.toFixed(1)}</p>
      {#if tod.note}
        <p><strong>Project note:</strong> {tod.note}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  .panel {
    padding: 20px;
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
    font-size: 1.2rem;
    line-height: 1.2;
  }

  .address {
    margin: 0 0 16px 0;
    color: #5b6b7a;
    font-size: 0.9rem;
  }

  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 18px;
  }

  .stat-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
  }

  .stat-card span {
    display: block;
    font-size: 11px;
    color: #64748b;
    margin-bottom: 4px;
  }

  .stat-card strong {
    font-size: 1.05rem;
  }

  .chart-group {
    margin-bottom: 14px;
    padding: 12px;
    background: #fcfdff;
    border: 1px solid #e6ebf0;
    border-radius: 12px;
  }

  .note-box {
    margin-top: 10px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 12px;
    font-size: 0.84rem;
    color: #334155;
  }

  .note-box p {
    margin: 0 0 8px 0;
  }

  .note-box p:last-child {
    margin-bottom: 0;
  }
</style>