export const EMISSION_FACTORS = {
  transport: {
    car: 0.21,      // kg CO2 per km
    bus: 0.11,      // kg CO2 per km
    train: 0.04,     // kg CO2 per km
    flight: 0.25     // kg CO2 per km
  },
  energy: {
    electricity: 0.233, // kg CO2 per kWh
    gas: 2.04,          // kg CO2 per therm
    oil: 10.15          // kg CO2 per gallon
  },
  food: {
    beef: 27.0,       // kg CO2 per kg
    pork: 12.0,       // kg CO2 per kg
    chicken: 6.9,     // kg CO2 per kg
    fish: 12.0,       // kg CO2 per kg
    rice: 2.7,        // kg CO2 per kg
    vegetables: 1.0,  // kg CO2 per kg
    dairy: 7.0        // kg CO2 per kg
  },
  shopping: {
    clothing: 10.0,    // kg CO2 per item
    electronics: 100.0 // kg CO2 per item
  },
  waste: {
    landfill: 0.5,     // kg CO2 per kg
    recycled: 0.1      // kg CO2 per kg
  }
};

export const TOKEN_AWARDS = {
  walked_instead_of_car: 50,
  carpool: 100,
  meal_under_5kg_co2: 25,
  streak_7day: 200,
  monthly_goal_achieved: 500,
  bill_scanned: 75
};

export const getNFTStage = (totalSavedKg: number): { name: string; icon: string; min: number } => {
  if (totalSavedKg < 50) return { name: "Seed", icon: "🌱", min: 0 };
  if (totalSavedKg < 100) return { name: "Sprout", icon: "🌿", min: 50 };
  if (totalSavedKg < 250) return { name: "Tree", icon: "🌳", min: 100 };
  if (totalSavedKg < 500) return { name: "Forest", icon: "🌲", min: 250 };
  if (totalSavedKg < 1000) return { name: "Wildlife", icon: "🦁", min: 500 };
  return { name: "Ecosystem", icon: "🌍", min: 1000 };
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};
