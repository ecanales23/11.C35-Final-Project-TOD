import * as d3 from "d3";
import { base } from "$app/paths";

const RENTER_FIELDS = {
  zeroNeg: "D_Renter-Occupied Housing Units: Zero Or Negative Income",
  lt20: "D_Renter-Occupied Housing Units: Less Than $20,000",
  x20_35: "D_Renter-Occupied Housing Units: $20,000 To $34,999",
  x35_50: "D_Renter-Occupied Housing Units: $35,000 To $49,999",
  x50_75: "D_Renter-Occupied Housing Units: $50,000 To $74,999",
  x75plus: "D_Renter-Occupied Housing Units: $75,000 Or More"
};

function num(v) {
  const n = +v;
  return Number.isFinite(n) ? n : 0;
}

function noteSaysAllAffordable(note = "") {
  return /all units affordable/i.test(note);
}

function cleanUnits(row) {
  let total = num(row["j_total units"]);
  let affordable =
    row["j_affordable units"] === "" || row["j_affordable units"] == null
      ? NaN
      : +row["j_affordable units"];

  const note = row["j_note"] || "";

  if (noteSaysAllAffordable(note)) {
    affordable = total;
  }

  if ((!Number.isFinite(total) || total === 0) && Number.isFinite(affordable) && affordable > 0) {
    total = affordable;
  }

  if (!Number.isFinite(affordable)) affordable = 0;
  if (affordable > total) affordable = total;

  const marketRate = Math.max(0, total - affordable);
  const affordableShare = total > 0 ? affordable / total : 0;

  return { total, affordable, marketRate, affordableShare };
}

function renterBins(row) {
  return [
    { key: "zeroNeg", label: "0/neg", value: num(row[RENTER_FIELDS.zeroNeg]) },
    { key: "lt20", label: "<$20k", value: num(row[RENTER_FIELDS.lt20]) },
    { key: "x20_35", label: "$20–35k", value: num(row[RENTER_FIELDS.x20_35]) },
    { key: "x35_50", label: "$35–50k", value: num(row[RENTER_FIELDS.x35_50]) },
    { key: "x50_75", label: "$50–75k", value: num(row[RENTER_FIELDS.x50_75]) },
    { key: "x75plus", label: "$75k+", value: num(row[RENTER_FIELDS.x75plus]) }
  ];
}

function demandForThreshold(bins, threshold = "50k") {
  if (threshold === "35k") {
    return d3.sum(bins.filter(d => ["zeroNeg", "lt20", "x20_35"].includes(d.key)), d => d.value);
  }
  if (threshold === "75k") {
    return d3.sum(
      bins.filter(d => ["zeroNeg", "lt20", "x20_35", "x35_50", "x50_75"].includes(d.key)),
      d => d.value
    );
  }
  return d3.sum(
    bins.filter(d => ["zeroNeg", "lt20", "x20_35", "x35_50"].includes(d.key)),
    d => d.value
  );
}

export async function loadTodData() {
  const rows = await d3.csv(`${base}/data/TODLocation+BufferDemoAvgs.csv`);

  return rows.map((row, i) => {
    const { total, affordable, marketRate, affordableShare } = cleanUnits(row);
    const bins = renterBins(row);
    const totalRenters = num(row["D_Renter-Occupied Housing Units"]);

    return {
      id: `${i}-${row["j_Project"]}`,
      project: row["j_Project"],
      address: row["formatted"] || "",
      note: row["j_note"] || "",
      source: row["j_source"] || "",
      totalUnits: total,
      affordableUnits: affordable,
      marketRateUnits: marketRate,
      affordableShare,
      totalRenters,
      renterBins: bins,
      raw: row
    };
  });
}

export function enrichTodWithThreshold(data, threshold = "50k") {
  return data.map(d => {
    const lowerIncomeRenters = demandForThreshold(d.renterBins, threshold);
    const lowerIncomeDemandShare = d.totalRenters > 0 ? lowerIncomeRenters / d.totalRenters : 0;
    const mismatchScore = d.affordableShare - lowerIncomeDemandShare;
    const affordableUnitsPer100LowIncomeRenters =
      lowerIncomeRenters > 0 ? (d.affordableUnits / lowerIncomeRenters) * 100 : 0;

    return {
      ...d,
      threshold,
      lowerIncomeRenters,
      lowerIncomeDemandShare,
      mismatchScore,
      affordableUnitsPer100LowIncomeRenters
    };
  });
}