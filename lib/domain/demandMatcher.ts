import { CatchmentSite, DemandCategory, DemandMatchResult } from './types';

// Standard per-hectare/per-capita non-potable secondary demand baseline assumptions (ML/day)
// Tagged explicitly as ASSUMED parameters in compliance with scientific integrity rules
export interface DemandBaselineAssumptions {
  toiletFlushingMLDPerHectare: number;
  coolingTowerHVACMLDPerHectare: number;
  horticultureParkMLDPerHectare: number;
  fireAndConstructionMLDPerHectare: number;
}

export const DEFAULT_DEMAND_ASSUMPTIONS: DemandBaselineAssumptions = {
  toiletFlushingMLDPerHectare: 0.12,
  coolingTowerHVACMLDPerHectare: 0.18,
  horticultureParkMLDPerHectare: 0.08,
  fireAndConstructionMLDPerHectare: 0.05,
};

/**
 * Calculates secondary non-potable demand across municipal categories.
 * All assumptions are explicitly tagged and adjustable.
 */
export function calculateSecondaryDemand(
  site: CatchmentSite,
  assumptions: DemandBaselineAssumptions = DEFAULT_DEMAND_ASSUMPTIONS
): DemandCategory[] {
  const area = site.areaHectares;

  const categories: DemandCategory[] = [
    {
      category: 'TOILET_FLUSHING',
      dailyDemandML: Number((area * assumptions.toiletFlushingMLDPerHectare).toFixed(3)),
      priority: 1,
      qualityRequired: 'SECONDARY_FILTERED',
      description: 'Institutional & commercial gravity-fed toilet flushing',
      provenance: 'ASSUMED',
    },
    {
      category: 'COOLING_TOWERS',
      dailyDemandML: Number((area * assumptions.coolingTowerHVACMLDPerHectare).toFixed(3)),
      priority: 2,
      qualityRequired: 'TERTIARY_TREATED',
      description: 'Commercial HVAC cooling tower makeup water',
      provenance: 'ASSUMED',
    },
    {
      category: 'URBAN_HORTICULTURE',
      dailyDemandML: Number((area * assumptions.horticultureParkMLDPerHectare).toFixed(3)),
      priority: 3,
      qualityRequired: 'RAW_RAINWATER',
      description: 'Municipal medians, eco-parks & Maidan tree-line watering',
      provenance: 'ASSUMED',
    },
    {
      category: 'FIRE_AND_ROAD_WASHING',
      dailyDemandML: Number((area * assumptions.fireAndConstructionMLDPerHectare).toFixed(3)),
      priority: 4,
      qualityRequired: 'RAW_RAINWATER',
      description: 'Emergency hydrants, dust-suppression mist canons',
      provenance: 'ASSUMED',
    },
  ];

  return categories;
}

/**
 * Allocates harvestable rainwater to secondary demands in order of priority.
 * Invariant: allocatedDemandML <= harvestableSupplyML.
 */
export function matchDemand(
  harvestableSupplyML: number,
  categories: DemandCategory[]
): DemandMatchResult {
  let remainingSupply = harvestableSupplyML;
  let totalAllocated = 0;
  const totalDemand = categories.reduce((acc, cat) => acc + cat.dailyDemandML, 0);

  const matchedBreakdown = categories.map((cat) => {
    const allocated = Math.min(remainingSupply, cat.dailyDemandML);
    remainingSupply = Math.max(0, remainingSupply - allocated);
    totalAllocated += allocated;
    const satisfactionRate = cat.dailyDemandML > 0 ? (allocated / cat.dailyDemandML) * 100 : 100;

    return {
      category: cat.category,
      demandML: cat.dailyDemandML,
      allocatedML: Number(allocated.toFixed(3)),
      satisfactionRate: Number(satisfactionRate.toFixed(1)),
      priority: cat.priority,
    };
  });

  const overallSatisfactionRate =
    totalDemand > 0 ? Number(((totalAllocated / totalDemand) * 100).toFixed(1)) : 100;

  return {
    totalSupplyML: Number(harvestableSupplyML.toFixed(3)),
    totalDemandML: Number(totalDemand.toFixed(3)),
    totalAllocatedML: Number(totalAllocated.toFixed(3)),
    unmetDemandML: Number(Math.max(0, totalDemand - totalAllocated).toFixed(3)),
    surplusWaterML: Number(remainingSupply.toFixed(3)),
    overallSatisfactionRate,
    breakdown: matchedBreakdown,
  };
}
