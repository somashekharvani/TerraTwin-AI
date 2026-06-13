import prisma from "../config/db";

export interface TwinCategoryStats {
  category: string;
  currentValue: number;
  optimizedValue: number;
  unit: string;
}

export interface PredictionPoint {
  day: number;
  date: string;
  baseline: number;
  optimized: number;
}

export interface TwinState {
  currentTotal: number;
  optimizedTotal: number;
  monthlyGoal: number;
  categories: TwinCategoryStats[];
  predictions: PredictionPoint[];
}

export class CarbonTwinService {
  /**
   * Generates the entire TerraTwin state, predictions, and optimized forecasts.
   */
  static async getTwinState(userId: string): Promise<TwinState> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyGoal: true }
    });
    
    const monthlyGoal = user?.monthlyGoal || 200;

    // Get carbon entries in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await prisma.carbonEntry.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Default baseline values (in kg CO2) if user doesn't have sufficient logs
    const defaultStats: Record<string, number> = {
      transport: 135.5,
      energy: 95.2,
      food: 72.8,
      shopping: 35.0,
      waste: 15.0
    };

    // Calculate actual totals per category in the last 30 days
    const categoryTotals: Record<string, number> = {
      transport: 0,
      energy: 0,
      food: 0,
      shopping: 0,
      waste: 0
    };

    let hasEntries = false;
    entries.forEach(entry => {
      const cat = entry.category.toLowerCase();
      if (cat in categoryTotals) {
        categoryTotals[cat] += entry.carbonEmitted;
        hasEntries = true;
      }
    });

    // If no entries, use default stats. Otherwise, use what they have
    const statsToUse = hasEntries ? categoryTotals : defaultStats;

    // Define optimized reductions (percentage saved)
    // Swapping car trips for walking/train (40% reduction)
    // Smart meter and turning off appliances (25% reduction)
    // Eating chicken/vegetables instead of beef (30% reduction)
    // Mindful shopping and recycling (20% reduction)
    const reductionFactors: Record<string, number> = {
      transport: 0.40, // 40% reduction potential
      energy: 0.25,    // 25% reduction potential
      food: 0.30,      // 30% reduction potential
      shopping: 0.20,  // 20% reduction potential
      waste: 0.20      // 20% reduction potential
    };

    const categories: TwinCategoryStats[] = Object.keys(statsToUse).map(cat => {
      const current = Math.round(statsToUse[cat] * 100) / 100;
      const reduction = reductionFactors[cat] || 0.20;
      const optimized = Math.round(current * (1 - reduction) * 100) / 100;

      return {
        category: cat,
        currentValue: current,
        optimizedValue: optimized,
        unit: "kg CO₂"
      };
    });

    const currentTotal = Math.round(categories.reduce((sum, c) => sum + c.currentValue, 0) * 100) / 100;
    const optimizedTotal = Math.round(categories.reduce((sum, c) => sum + c.optimizedValue, 0) * 100) / 100;

    // Generate daily cumulative projections for the next 30 days
    // Baseline grows linearly based on daily rate (current total / 30)
    // Optimized grows linearly based on optimized daily rate (optimized total / 30)
    const dailyBaselineRate = currentTotal / 30;
    const dailyOptimizedRate = optimizedTotal / 30;

    const predictions: PredictionPoint[] = [];
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      const dateString = forecastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      predictions.push({
        day: i,
        date: dateString,
        baseline: Math.round(dailyBaselineRate * i * 100) / 100,
        optimized: Math.round(dailyOptimizedRate * i * 100) / 100
      });
    }

    const baselineTotal = predictions[predictions.length - 1]?.baseline || currentTotal;
    const optimizedTotalProj = predictions[predictions.length - 1]?.optimized || optimizedTotal;
    const potentialSavingsPercentage = Math.round(((baselineTotal - optimizedTotalProj) / (baselineTotal || 1)) * 100);

    return {
      currentTotal,
      optimizedTotal,
      monthlyGoal,
      categories,
      predictions,
      
      // Frontend TwinData alignment:
      breakdown: {
        transport: statsToUse.transport,
        energy: statsToUse.energy,
        food: statsToUse.food,
        shopping: statsToUse.shopping,
        waste: statsToUse.waste
      },
      totalCarbonEmitted: currentTotal,
      projections: {
        baselineCurve: predictions.map(p => p.baseline),
        recommendedCurve: predictions.map(p => p.optimized),
        labels: predictions.map(p => p.date),
        daysCount: 30
      },
      summary: {
        baselineTotal,
        optimizedTotal: optimizedTotalProj,
        potentialSavingsPercentage
      }
    } as any;
  }
}
