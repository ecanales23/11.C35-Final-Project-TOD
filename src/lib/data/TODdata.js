import * as d3 from "d3";

const INCOME_KEYS = [
  {
    key: "lt20",
    label: "< $20k",
    field: "D_Renter-Occupied Housing Units: Less Than $20,000"
  },
  {
    key: "20to35",
    label: "$20k–$34k",
    field: "D_Renter-Occupied Housing Units: $20,000 To $34,999"
  },
  {
    key: "35to50",
    label: "$35k–$49k",
    field: "D_Renter-Occupied Housing Units: $35,000 To $49,999"
  },
  {
    key: "50to75",
    label: "$50k–$74k",
    field: "D_Renter-Occupied Housing Units: $50,000 To $74,999"
  },
  {
    key: "75plus",
    label: "$75k+",
    field: "D_Renter-Occupied Housing Units: $75,000 Or More"
  },
  {
    key: "zeroNeg",
    label: "Zero/negative",
    field: "D_Renter-Occupied Housing Units: Zero Or Negative Income"
  }
];

function num(v) {
  const n = +v;
  return Number.isFinite(n) ? n : 0;
}

function noteSaysAllAffordable(note = "") {
  return /all units affordable/i.test(note);
}

function cleanUnits(row) {
  const totalRaw = num(row["j_total units"]);
  const affordableRaw = row["j_affordable units"] === "" || row["j_affordable units"] == null
    ? NaN
    : +row["j_affordable units"];
  const note = row["j_note"] || "";

  let total = totalRaw;
  let affordable = Number.isFinite(affordableRaw) ? affordableRaw : 0;

  if (noteSaysAllAffordable(note)) {
    affordable = totalRaw;
  }

  // If total is missing but affordable exists, use affordable as total.
  if (!Number.isFinite(total) || total === 0) {
    if (Number.isFinite(affordable) && affordable > 0) {
      total = affordable;
    } else {
      total = 0;
    }
  }

  // Guard against bad rows.
  if (affordable > total) {
    affordable = total;
  }

  const marketRate = Math.max(0, total - affordable);
  const affordableShare = total > 0 ? affordable / total : 0;

  return { total, affordable, marketRate, affordableShare };
}

function getRenterIncomeBins(row) {
  return INCOME_KEYS.map(d => ({
    key: d.key,
    label: d.label,
    value: num(row[d.field])
  }));
}

function sumBins(bins, keys) {
  return d3.sum(bins.filter(d => keys.includes(d.key)), d => d.value);
}

export async function loadTodData() {
  const rows = await d3.csv("/data/TODLocation+BufferDemoAvgs.csv");

  const data = rows.map((row, i) => {
    const { total, affordable, marketRate, affordableShare } = cleanUnits(row);
    const renterBins = getRenterIncomeBins(row);

    const totalRenters = num(row["D_Renter-Occupied Housing Units"]);
    const lowerIncomeRenters = sumBins(renterBins, ["zeroNeg", "lt20", "20to35", "35to50"]);
    const moderatePlusRenters = sumBins(renterBins, ["50to75", "75plus"]);

    const lowerIncomeDemandShare = totalRenters > 0 ? lowerIncomeRenters / totalRenters : 0;

    // Simple fit metric:
    // affordable share of project units minus share of nearby renter households under $50k.
    const mismatchScore = affordableShare - lowerIncomeDemandShare;

    // Affordable units per 100 lower-income renters nearby.
    const affordableUnitsPer100LowIncomeRenters =
      lowerIncomeRenters > 0 ? (affordable / lowerIncomeRenters) * 100 : 0;

    return {
      id: `${i}-${row["j_Project"]}`,
      project: row["j_Project"],
      address: row["formatted"],
      note: row["j_note"] || "",
      source: row["j_source"] || "",
      secondSource: row["j_second source"] || "",
      totalUnits: total,
      affordableUnits: affordable,
      marketRateUnits: marketRate,
      affordableShare,
      totalRenters,
      lowerIncomeRenters,
      moderatePlusRenters,
      lowerIncomeDemandShare,
      mismatchScore,
      affordableUnitsPer100LowIncomeRenters,
      renterBins,
      raw: row
    };
  });

  return data;
}
