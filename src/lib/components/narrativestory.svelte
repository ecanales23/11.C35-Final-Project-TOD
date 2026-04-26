<script>
  import { onMount, tick } from "svelte";

  const steps = [
    {
      eyebrow: "Step 1 · Meet Maya",
      title: "Meet Maya who is raising her daughter in Dorchester, searching for a home near the T",
      body: "Maya is 31 years old. She works as a dental hygienist in Dorchester, earns about $52,000 a year, and is raising her 4-year-old daughter Lily on her own. On weekends, she helps care for her mother who lives nearby. She's one of thousands of lower-income renters across Boston who work here, depend on the T, and are looking for housing they can actually afford near transit. Her maximum budget: $1,300/month for rent.",
      stats: [
        { label: "Annual income", val: "$52k" },
        { label: "Max rent (30%)", val: "$1,300/mo" },
        { label: "Boston AMI", val: "~50% AMI" },
      ],
    },
    {
      eyebrow: "Step 2 · What's being built",
      title: "A new TOD opens near her target station, but TOD doesn't automatically mean affordable",
      body: "A developer recently completed a 200-unit transit-oriented development half a mile from Forest Hills. TOD is an important tool for creating new housing, typically combining market-rate units with a smaller share of income-restricted homes. But for Maya, the key question isn’t how much housing is built - it’s whether any of it is affordable to her.",
      stats: [
        { label: "Total units", val: "200" },
        { label: "Affordable units", val: "20 (10%)" },
        { label: "AMI target", val: "≤80% AMI" },
      ],
    },
    {
      eyebrow: "Step 3 · The mismatch",
      title: "She qualifies, but the odds are stacked against her",
      body: "Maya earns about 50% AMI, so she qualifies for the affordable units. But those 20 units received over 400 applications in the lottery. The other 180 market-rate units start at $2,400/month which is nearly double her entire budget.",
      stats: [
        { label: "Lottery odds", val: "1 in 20" },
        { label: "Market-rate starting rent", val: "$2,400/mo" },
        { label: "Over Maya's budget by", val: "+$1,100/mo" },
      ],
    },
    {
      eyebrow: "Step 4 · The neighborhood",
      title: "She's not alone with most nearby renters facing the same gap",
      body: "Within 0.5 miles of this station, 48% of renters earn under $50k. But only 10% of the new development's units are affordable. This gap — the opportunity score — is what we measure across all Boston TODs.",
      stats: [
        { label: "Nearby renters under $50k", val: "48%" },
        { label: "Affordable share of TOD", val: "10%" },
        { label: "Opportunity score", val: "−38 pts" },
      ],
    },
    {
      eyebrow: "Step 5 · What we can do",
      title: "Understanding the gap is the first step to closing it",
      body: "Maya ends up commuting 45 minutes from Brockton because no affordable unit opened near her station. But her story doesn't have to be the norm. When TODs include more affordable units, they open doors for people like Maya and help diversify neighborhoods that have historically been out of reach for lower-income renters. The dashboard below shows where Boston's TODs are providing opportunity, and where they're falling short.",
      stats: [
        { label: "Maya's commute if priced out", val: "45 min" },
        { label: "TODs with more opportunity", val: "3 of 9" },
        { label: "TODs falling below demand", val: "6 of 9" },
      ],
    },
  ];

  let activeStep = 0;
  let stepEls = [];

  onMount(async () => {
    await tick();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) activeStep = Number(visible[0].target.dataset.step);
      },
      { root: null, threshold: [0.15, 0.4, 0.65], rootMargin: "0px 0px -30% 0px" }
    );
    stepEls.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  });
</script>

<section class="maya-container">
  <div class="scrolly-grid">

    <div class="sticky-panel">
      <div class="panel-inner">
        <div class="visual-area">

          {#if activeStep === 0}
            <p class="vis-title">Meet Maya</p>
            <div class="profile-card">
              <div class="avatar-row">
                <div class="avatar">
                  <svg viewBox="0 0 48 48" width="48" height="48">
                    <circle cx="24" cy="18" r="10" fill="#fcd34d"/>
                    <path d="M6 46c0-9.9 8.1-18 18-18s18 8.1 18 18" fill="#fcd34d"/>
                  </svg>
                </div>
                <div class="avatar-info">
                  <p class="avatar-name">Maya, 31</p>
                  <p class="avatar-job">Early childhood educator · Roxbury</p>
                </div>
              </div>
              <div class="family-row">
                <div class="family-item">
                  <span class="family-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#f59e0b"><circle cx="12" cy="7" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
                  </span>
                  <span>Raising <strong>Lily</strong>, age 4, on her own</span>
                </div>
                <div class="family-item">
                  <span class="family-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#a3a3a3"><circle cx="12" cy="7" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
                  </span>
                  <span>Helps care for her <strong>mother</strong> on weekends</span>
                </div>
                <div class="family-item">
                  <span class="family-icon">🚇</span>
                  <span>No car — depends on the Orange Line</span>
                </div>
              </div>
              <div class="budget-card">
                <div class="budget-row">
                  <span class="budget-label">Annual income</span>
                  <span class="budget-val">$52,000 <span class="budget-ami">~50% AMI</span></span>
                </div>
                <div class="budget-divider"></div>
                <div class="budget-row">
                  <span class="budget-label">Max affordable rent (30%)</span>
                  <span class="budget-val highlight">$1,300/mo</span>
                </div>
              </div>
            </div>

          {:else if activeStep === 1}
            <p class="vis-title">200 units: who are they for?</p>
            <div class="building-wrap">
              <div class="building">
                {#each Array(20) as _, i}
                  <div class="floor floor-market" class:floor-affordable={i < 2}></div>
                {/each}
              </div>
              <div class="building-legend">
                <div class="bleg-row">
                  <span class="bleg-dot affordable"></span>
                  <div>
                    <strong>20 affordable units</strong>
                    <p>Reserved for renters ≤80% AMI<br>like Maya — via lottery</p>
                  </div>
                </div>
                <div class="bleg-row">
                  <span class="bleg-dot market"></span>
                  <div>
                    <strong>180 market-rate units</strong>
                    <p>Starting at $2,400/mo —<br>3× Maya's budget</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="budget-callout">
              Only <strong>1 in 10</strong> units in this "mixed-income" building is actually affordable
            </div>

          {:else if activeStep === 2}
            <p class="vis-title">Where does Maya's money go?</p>
            <div class="budget-breakdown">
              <p class="breakdown-label">Maya's monthly income: <strong>$4,333</strong></p>
              <div class="breakdown-bar-wrap">
                <div class="breakdown-segment rent" style="flex: 2400">
                  <span class="seg-label">Rent<br><strong>$2,400</strong><br><span class="seg-pct">55%</span></span>
                </div>
                <div class="breakdown-segment left" style="flex: 1933">
                  <span class="seg-label-small">$1,933<br>remaining</span>
                </div>
              </div>
              <div class="breakdown-note">
                <strong>$1,933 left for everything else</strong> — but in Boston, Lily's daycare alone can cost $2,000+/month. After childcare, food, healthcare, and transportation, there's almost nothing left.
              </div>
            </div>
            <div class="budget-callout">
              At market rate, Maya would spend <strong>55% of her income</strong> on rent, well above the 30% affordability threshold, and that's before childcare
            </div>

          {:else if activeStep === 3}
            <p class="vis-title">Supply vs. demand near this station</p>
            <div class="gap-visual">
              <div class="gap-col">
                <p class="gap-col-label renters">Nearby lower-income renters</p>
                <div class="gap-people">
                  {#each Array(48) as _}
                    <svg class="gap-person renters" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>
                  {/each}
                </div>
                <p class="gap-pct renters">48%</p>
              </div>
              <div class="gap-vs">vs</div>
              <div class="gap-col">
                <p class="gap-col-label supply">Affordable TOD units</p>
                <div class="gap-houses">
                  {#each Array(10) as _}
                    <svg class="gap-house supply" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                  {/each}
                </div>
                <p class="gap-pct supply">10%</p>
              </div>
            </div>
            <div class="mismatch-badge">
              Opportunity score: <strong>−38 points</strong>
            </div>

          {:else if activeStep === 4}
            <p class="vis-title">Maya's options</p>
            <div class="options-compare">
              <div class="option cant">
                <div class="option-icon">🏙️</div>
                <p class="option-place">Near the TOD</p>
                <p class="option-rent cant-rent">$2,400/mo</p>
                <p class="option-note">10 min commute</p>
                <p class="option-burden cant-burden">55% of income</p>
                <div class="option-tag cant-tag">Out of reach</div>
              </div>
              <div class="option-arrow">→</div>
              <div class="option forced">
                <div class="option-icon">🏘️</div>
                <p class="option-place">Brockton</p>
                <p class="option-rent ok-rent">$1,200/mo</p>
                <p class="option-note">45 min commute</p>
                <p class="option-burden ok-burden">45% of income</p>
                <div class="option-tag forced-tag">Still cost-burdened</div>
              </div>
            </div>
            <div class="budget-callout">
              Moving to Brockton gets Maya under 30%, but she loses nearly <strong>90 minutes a day</strong> commuting, less time with Lily, and less time for her mother
            </div>
          {/if}

        </div>

        <div class="progress-track">
          {#each steps as _, i}
            <div class="progress-dot" class:active={i === activeStep} class:past={i < activeStep}></div>
          {/each}
          <p class="progress-label">Step {activeStep + 1} of {steps.length}</p>
        </div>

      </div>
    </div>

    <div class="text-stream">
      {#each steps as step, i}
        <article
          class="step-card"
          class:active={i === activeStep}
          bind:this={stepEls[i]}
          data-step={i}
        >
          <div class="step-content">
            <p class="step-eyebrow">
              <span class="year-badge">{step.eyebrow.split(' · ')[0]}</span>
              <span class="eyebrow-text">{step.eyebrow.split(' · ')[1]}</span>
            </p>
            <h3 class="step-title">{step.title}</h3>
            <p class="step-body">{step.body}</p>
            <div class="stat-row">
              {#each step.stats as stat}
                <div class="stat-pill">
                  <strong>{stat.val}</strong>
                  {stat.label}
                </div>
              {/each}
            </div>
          </div>
        </article>
      {/each}
      <div class="spacer"></div>
    </div>

  </div>
</section>

<style>
  .maya-container { background: #faf7f0; }

  .scrolly-grid {
    display: flex;
    position: relative;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .sticky-panel {
    flex: 1.3;
    height: 100vh;
    position: sticky;
    top: 0;
    padding: 32px;
    display: flex;
    align-items: center;
  }

  .panel-inner {
    background: white;
    border-radius: 28px;
    border: 1px solid #e8e0d4;
    box-shadow: 0 20px 40px -12px rgba(80,40,0,0.10);
    padding: 32px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .visual-area { width: 100%; }

  .vis-title {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #92846e;
    margin: 0 0 14px;
  }

  .profile-card { display: flex; flex-direction: column; gap: 14px; }

  .avatar-row { display: flex; align-items: center; gap: 14px; }
  .avatar {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: #fff7ed;
    border: 2px solid #fed7aa;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .avatar-name { font-family: 'Lora', Georgia, serif; font-size: 1.1rem; font-weight: 700; color: #1a0f00; margin: 0 0 2px; }
  .avatar-job { font-size: 0.82rem; color: #92846e; margin: 0; }

  .family-row { display: flex; flex-direction: column; gap: 8px; }
  .family-item { display: flex; align-items: flex-start; gap: 10px; font-size: 0.88rem; color: #5a5040; line-height: 1.4; }
  .family-icon { flex-shrink: 0; display: flex; align-items: center; margin-top: 1px; }

  .budget-card {
    background: #faf7f0;
    border: 1px solid #e8e0d4;
    border-radius: 12px;
    padding: 14px 16px;
  }
  .budget-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
  .budget-label { font-size: 0.82rem; color: #5a5040; }
  .budget-val { font-size: 0.9rem; font-weight: 800; color: #1a0f00; }
  .budget-val.highlight { color: #2563eb; font-size: 1rem; }
  .budget-ami {
    font-size: 0.72rem;
    font-weight: 700;
    color: #b45309;
    background: #fff7ed;
    border: 1px solid #ffedd5;
    padding: 2px 6px;
    border-radius: 5px;
    margin-left: 6px;
    vertical-align: middle;
  }
  .budget-divider { height: 1px; background: #e8e0d4; margin: 6px 0; }

  .building-wrap { display: flex; gap: 16px; align-items: flex-end; margin-bottom: 14px; }
  .building {
    display: flex;
    flex-direction: column-reverse;
    gap: 3px;
    flex-shrink: 0;
  }
  .floor {
    width: 40px;
    height: 14px;
    border-radius: 3px;
    background: #e8e0d4;
  }
  .floor-affordable { background: #2563eb; }

  .building-legend { display: flex; flex-direction: column; gap: 14px; }
  .bleg-row { display: flex; gap: 10px; align-items: flex-start; }
  .bleg-dot {
    width: 12px; height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
    margin-top: 3px;
  }
  .bleg-dot.affordable { background: #2563eb; }
  .bleg-dot.market { background: #e8e0d4; border: 1px solid #d6cfc3; }
  .bleg-row strong { font-size: 0.88rem; color: #1a0f00; display: block; margin-bottom: 2px; }
  .bleg-row p { margin: 0; font-size: 0.78rem; color: #92846e; line-height: 1.4; }

  .budget-breakdown { margin-bottom: 12px; }
  .breakdown-label { font-size: 0.82rem; color: #5a5040; margin: 0 0 10px; }

  .breakdown-bar-wrap {
    display: flex;
    height: 64px;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 12px;
    gap: 2px;
  }

  .breakdown-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    padding: 6px;
  }

  .breakdown-segment.rent {
    background: #fee2e2;
    border: 1px solid #fecaca;
  }

  .breakdown-segment.left {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    flex-shrink: 0;
    min-width: 60px;
  }

  .seg-label {
    font-size: 0.7rem;
    line-height: 1.3;
    color: #7f1d1d;
    text-align: center;
  }
  .seg-label strong { font-size: 0.85rem; }
  .seg-pct { font-size: 0.7rem; color: #b91c1c; }

  .seg-label-small {
    font-size: 0.7rem;
    line-height: 1.3;
    color: #14532d;
    text-align: center;
    font-weight: 700;
  }

  .breakdown-note {
    background: #faf7f0;
    border: 1px solid #e8e0d4;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.82rem;
    color: #5a5040;
    line-height: 1.5;
  }

  .gap-visual { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 12px; }

  .gap-col { flex: 1; text-align: center; }
  .gap-col-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 8px;
  }
  .gap-col-label.renters { color: #b45309; }
  .gap-col-label.supply { color: #15803d; }

  .gap-people, .gap-houses {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    justify-content: center;
    margin-bottom: 6px;
  }

  .gap-person {
    width: 14px; height: 14px;
    fill: #f59e0b;
  }
  .gap-house {
    width: 16px; height: 16px;
    fill: #16a34a;
  }

  .gap-pct { font-size: 1.3rem; font-weight: 800; margin: 0; }
  .gap-pct.renters { color: #b45309; }
  .gap-pct.supply { color: #15803d; }

  .gap-vs {
    font-size: 0.9rem;
    font-weight: 800;
    color: #d6cfc3;
    padding-bottom: 24px;
    flex-shrink: 0;
  }

  .mismatch-badge {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.88rem;
    color: #92400e;
    text-align: center;
  }
  .mismatch-badge strong { color: #b45309; }

  .options-compare {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .option {
    flex: 1;
    text-align: center;
    padding: 14px 10px;
    border-radius: 16px;
  }

  .option.cant {
    background: #fef2f2;
    border: 1px solid #fecaca;
  }

  .option.forced {
    background: #fafaf9;
    border: 1px solid #e8e0d4;
  }

  .option-icon { font-size: 1.5rem; margin-bottom: 4px; }
  .option-place { font-size: 0.75rem; font-weight: 700; color: #5a5040; margin: 0 0 4px; }
  .option-rent { font-size: 1.1rem; font-weight: 800; margin: 0 0 2px; }
  .cant-rent { color: #ef4444; }
  .ok-rent { color: #16a34a; }
  .option-note { font-size: 0.72rem; color: #92846e; margin: 2px 0; }
  .option-burden { font-size: 0.72rem; font-weight: 700; margin: 2px 0; }
  .cant-burden { color: #ef4444; }
  .ok-burden { color: #b45309; }
  .option-tag {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 99px;
    margin-top: 6px;
  }
  .cant-tag { background: #fee2e2; color: #991b1b; }
  .forced-tag { background: #fff7ed; color: #92400e; }

  .option-arrow { font-size: 1.2rem; color: #d6cfc3; flex-shrink: 0; }

  .budget-callout {
    background: #faf7f0;
    border: 1px solid #e8e0d4;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.82rem;
    color: #5a5040;
    line-height: 1.5;
  }
  .budget-callout strong { color: #1a0f00; }

  .progress-track { display: flex; align-items: center; gap: 8px; }
  .progress-dot { width: 8px; height: 8px; border-radius: 50%; background: #e8e0d4; transition: background 0.4s ease, transform 0.3s ease; }
  .progress-dot.past { background: #fcd34d; }
  .progress-dot.active { background: #b45309; transform: scale(1.4); }
  .progress-label { font-size: 0.68rem; font-weight: 700; color: #92846e; margin: 0 0 0 8px; text-transform: uppercase; letter-spacing: 0.08em; }

  .text-stream { flex: 0.7; padding: 0 40px 0 0; }

  .step-card {
    min-height: 100vh;
    display: flex;
    align-items: center;
    opacity: 0.12;
    transition: opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1);
    transform: translateY(20px);
  }
  .step-card.active { opacity: 1; transform: translateY(0); }

  .step-content {
    background: white;
    padding: 36px;
    border-radius: 24px;
    box-shadow: 0 16px 24px -8px rgba(80,40,0,0.07);
    border: 1px solid #e8e0d4;
    width: 100%;
  }

  .step-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }

  .year-badge {
    background: #faf7f0;
    color: #7c5e38;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    border: 1px solid #e8d5b8;
    transition: all 0.4s ease;
  }
  .active .year-badge { background: #fff7ed; color: #b45309; border-color: #ffedd5; }

  .eyebrow-text { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #92846e; }

  .step-title {
    font-family: 'Lora', Georgia, serif;
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.25;
    margin: 0 0 14px;
    color: #1a0f00;
    letter-spacing: -0.01em;
  }

  .step-body { font-size: 1rem; line-height: 1.65; color: #5a5040; margin: 0; }

  .stat-row { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
  .stat-pill {
    background: #faf7f0;
    border: 1px solid #e8e0d4;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.8rem;
    color: #5a5040;
    flex: 1;
    min-width: 80px;
  }
  .stat-pill strong { display: block; font-size: 1.15rem; font-weight: 800; color: #b45309; margin-bottom: 2px; }

  .spacer { height: 50vh; }

  @media (max-width: 900px) {
    .scrolly-grid { flex-direction: column; }
    .sticky-panel { position: sticky; height: auto; padding: 12px; top: 0; z-index: 10; }
    .panel-inner { border-radius: 20px; padding: 20px; }
    .text-stream { padding: 0 20px; }
    .step-card { min-height: auto; margin-bottom: 60px; opacity: 1; transform: none; }
  }
</style>
