<script>
  import UnitSplitChart from "./todunitsplit.svelte";
  import DemandByIncomeChart from "./demandbyincome.svelte";
  import DemandFitChart from "./demandbyhousingstock.svelte";

  export let tod = null;
</script>

{#if tod}
  <div class="panel">
    <h2>{tod.project}</h2>
    <p>{tod.address}</p>

    <div class="stat-row">
      <div><strong>{tod.totalUnits}</strong><span>Total units</span></div>
      <div><strong>{tod.affordableUnits}</strong><span>Affordable units</span></div>
      <div><strong>{tod.marketRateUnits}</strong><span>Market-rate units</span></div>
    </div>

    <UnitSplitChart {tod} />
    <DemandByIncomeChart {tod} />
    <DemandFitChart {tod} />

    {#if tod.note}
      <p class="note"><strong>Note:</strong> {tod.note}</p>
    {/if}
  </div>
{/if}

<style>
  .panel {
    padding: 1rem;
    border-left: 1px solid #e5e7eb;
    background: #fff;
    overflow-y: auto;
  }
  h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
  }
  p {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: #444;
  }
  .stat-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .stat-row div {
    background: #f8fafc;
    border-radius: 8px;
    padding: 0.75rem;
  }
  .stat-row strong {
    display: block;
    font-size: 1.1rem;
  }
  .stat-row span {
    font-size: 0.75rem;
    color: #666;
  }
  .note {
    font-size: 0.8rem;
    background: #f8fafc;
    padding: 0.75rem;
    border-radius: 8px;
  }
</style>