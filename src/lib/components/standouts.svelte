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

<div class="story">
  <p class="eyebrow">Story mode</p>
  <h3>Suggested ways to read the data</h3>

  <div class="steps">
    {#each steps as step}
      <button on:click={() => onApplyStep(step.id)}>
        <strong>{step.title}</strong>
        <span>{step.description}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .story {
    padding: 18px;
  }

  .eyebrow {
    margin: 0 0 6px 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    font-weight: 700;
  }

  h3 {
    margin: 0 0 12px 0;
    font-size: 1rem;
  }

  .steps {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  button {
    text-align: left;
    border: 1px solid #d9e0e7;
    background: white;
    border-radius: 14px;
    padding: 12px;
    cursor: pointer;
  }

  button:hover {
    background: #f8fafc;
  }

  strong {
    display: block;
    margin-bottom: 6px;
    font-size: 0.9rem;
  }

  span {
    display: block;
    font-size: 0.78rem;
    color: #64748b;
    line-height: 1.35;
  }

  @media (max-width: 1000px) {
    .steps {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>