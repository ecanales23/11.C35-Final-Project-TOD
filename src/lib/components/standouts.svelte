<script>
  export let onApplyStep = (step) => {};

  const steps = [
    {
      id: "all",
      title: "All projects",
      description: "Start with the full set of TOD projects."
    },
    {
      id: "largest-gaps",
      title: "Largest local gaps",
      description: "Highlight projects where affordable share falls furthest below nearby lower-income demand."
    },
    {
      id: "high-affordable",
      title: "Mostly affordable projects",
      description: "Show projects with high affordable shares."
    },
    {
      id: "large-projects",
      title: "Large projects only",
      description: "Focus on high-unit developments that likely have larger neighborhood impact."
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
        <div class="number-rail">
          <span class="line"></span>
          <span class="dot">{i + 1}</span>
        </div>
        <div class="content">
          <strong class="title">{step.title}</strong>
          <p class="desc">{step.description}</p>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .guide-wrapper {
    padding: 32px 40px;
    background: #ffffff;
    border-radius: 24px;
  }

  .guide-intro {
    margin-bottom: 32px;
  }

  .eyebrow {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #3b82f6;
    margin-bottom: 8px;
  }

  h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
  }

  .suggestions-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  .suggestion {
    display: flex;
    flex-direction: column;
    gap: 16px;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .suggestion:hover {
    transform: translateY(-2px);
  }

  .suggestion:hover .dot {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .number-rail {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .line {
    height: 1px;
    flex-grow: 1;
    background: #e2e8f0;
  }

  .dot {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    font-size: 10px;
    font-weight: 800;
    color: #94a3b8;
    transition: all 0.2s ease;
  }

  .content {
    padding-right: 12px;
  }

  .title {
    display: block;
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 8px;
    line-height: 1.3;
  }

  .desc {
    margin: 0;
    font-size: 0.875rem;
    color: #64748b;
    line-height: 1.6;
  }

  @media (max-width: 1200px) {
    .suggestions-grid {
      grid-template-columns: 1fr 1fr;
    }
    .line { display: none; }
  }

  @media (max-width: 600px) {
    .suggestions-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
