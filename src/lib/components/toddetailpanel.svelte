<script>
  import * as d3 from "d3";
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

    <div class="intro-box">
      <p>
        <strong>What this panel shows:</strong> This project is compared with nearby renter households in the surrounding buffer area shown on the map.
        The goal is to show whether the project’s affordable share appears low, similar to, or high relative to nearby lower-income renter demand.
      </p>
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

    <div class="sentence-box">
      <p>
        For <strong>{tod.project}</strong>, the affordability rate is <strong>{d3.format(".0%")(tod.affordableShare)}</strong>
        because this TOD includes <strong>{tod.affordableUnits}</strong> affordable units and
        <strong>{tod.marketRateUnits}</strong> market-rate units out of <strong>{tod.totalUnits}</strong> total units.
      </p>
    </div>

    <div class="chart-group">
      <DemandFitChart {tod} width={360} />
    </div>

    <div class="chart-group">
      <DemandByIncomeChart {tod} width={360} />
    </div>

    <div class="note-box">
      <p>
        <strong>Interpretation:</strong>
        This project’s affordable unit share is
        {tod.mismatchScore < 0 ? " below " : " above "}
        the nearby lower-income renter share by:
        <strong>{Math.abs(tod.mismatchScore * 100).toFixed(1)} percentage points</strong>.
      </p>

      <p>
        <strong>Affordable units per 100 nearby lower-income renters:</strong>
        {tod.affordableUnitsPer100LowIncomeRenters.toFixed(1)}
      </p>

      <p>
        <strong>Important note:</strong>
        This comparison is a proxy for local fit, not a full measure of whether the project meets all housing demand.
        It compares project affordability with nearby renter income distribution, not exact eligibility tiers or regional housing need.
      </p>

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

  .intro-box {
    margin-bottom: 14px;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.84rem;
    color: #334155;
    line-height: 1.45;
  }

  .intro-box p {
    margin: 0;
  }

  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
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

  .sentence-box {
    margin-bottom: 14px;
    padding: 12px;
    background: #fcfdff;
    border: 1px solid #e6ebf0;
    border-radius: 12px;
    font-size: 0.9rem;
    color: #334155;
    line-height: 1.5;
  }

  .sentence-box p {
    margin: 0;
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
    line-height: 1.45;
  }

  .note-box p {
    margin: 0 0 8px 0;
  }

  .note-box p:last-child {
    margin-bottom: 0;
  }
</style>
