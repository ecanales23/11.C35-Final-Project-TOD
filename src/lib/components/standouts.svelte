<script>
  export let onApplyStep = (step) => {};
  export let activeStep = null;

  const steps = [
    {
      id: "largest-gaps",
      title: "The biggest affordability gaps",
      description: "Properties where the affordable unit share falls furthest below the surrounding share of lower-income renters."
    },
    {
      id: "high-affordable",
      title: "The strongest performers",
      description: "Properties providing more affordable units than the surrounding concentration of lower-income renters requires."
    }
  ];
</script>

<div class="guide-wrapper">
  <p class="guide-heading">Suggested ways to read the data</p>
  <div class="suggestions-list">
    {#each steps as step}
      <div
        class="suggestion"
        class:active={step.id === activeStep}
        on:click={() => onApplyStep(step.id === activeStep ? "all" : step.id)}
        on:keydown={(e) => e.key === 'Enter' && onApplyStep(step.id === activeStep ? "all" : step.id)}
        role="button"
        tabindex="0"
      >
        <strong class="title">{step.title}</strong>
        <p class="desc">{step.description}</p>
      </div>
    {/each}
  </div>
</div>

<style>
  .guide-wrapper {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .guide-heading {
    margin: 0;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #92846e;
  }

  .suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .suggestion {
    display: flex;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
    padding: 10px 12px;
    border: 1px solid #e2d8cc;
    border-radius: 10px;
    background: #faf7f0;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .suggestion:hover {
    border-color: #b45309;
    background: #fdf3e0;
  }

  .suggestion.active {
    border-color: #b45309;
    background: #fdf3e0;
  }

  .suggestion.active .title {
    color: #b45309;
  }

  .title {
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    color: #1a0f00;
    line-height: 1.3;
  }

  .desc {
    margin: 0;
    font-size: 0.72rem;
    color: #92846e;
    line-height: 1.5;
  }
</style>
