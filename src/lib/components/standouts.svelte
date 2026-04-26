<script>
  export let onApplyStep = (step) => {};

  const steps = [
    {
      id: "all",
      title: "All projects",
      description: "Start with the full set of TOD projects across Greater Boston."
    },
    {
      id: "largest-gaps",
      title: "Less opportunity than demand",
      description: "Projects where affordable share falls furthest below local lower-income renter share."
    },
    {
      id: "high-affordable",
      title: "More opportunity than demand",
      description: "Projects providing more affordable housing than local lower-income renter share requires."
    },
    {
      id: "large-projects",
      title: "Large projects only",
      description: "Focus on high-unit developments with the largest neighborhood impact."
    }
  ];
</script>

<div class="guide-wrapper">
  <div class="guide-intro">
    <span class="eyebrow">Story mode</span>
    <h3>Suggested ways to read the data</h3>
  </div>

  <div class="suggestions-grid">
    {#each steps as step, i}
      <div
        class="suggestion"
        on:click={() => onApplyStep(step.id)}
        role="button"
        tabindex="0"
      >
        <span class="dot">{i + 1}</span>
        <strong class="title">{step.title}</strong>
        <p class="desc">{step.description}</p>
      </div>
    {/each}
  </div>
</div>

<style>
  .guide-wrapper {
    padding: 16px;
    background: #ffffff;
    border-radius: 16px;
  }

  .guide-intro {
    margin-bottom: 12px;
  }

  .eyebrow {
    display: block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #3b82f6;
    margin-bottom: 4px;
  }

  h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  .suggestions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .suggestion {
    display: flex;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    transition: border-color 0.2s ease, background 0.2s ease;
  }

  .suggestion:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .suggestion:hover .dot {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .dot {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    font-size: 9px;
    font-weight: 800;
    color: #94a3b8;
    margin-bottom: 4px;
    transition: all 0.2s ease;
  }

  .title {
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.3;
  }

  .desc {
    margin: 0;
    font-size: 0.72rem;
    color: #64748b;
    line-height: 1.5;
  }
</style>
