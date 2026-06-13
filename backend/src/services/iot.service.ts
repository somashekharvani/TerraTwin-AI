import { Server } from "socket.io";
import prisma from "../config/db";
import { EMISSION_FACTORS } from "../utils/carbonCalculators";

export class IotService {
  private static ioInstance: Server | null = null;
  private static simulationInterval: NodeJS.Timeout | null = null;
  private static tickCount = 0;

  // Initialize service with Socket.io server
  static init(io: Server) {
    this.ioInstance = io;
    this.startEnergySimulation();
  }

  /**
   * Simulates a Smart Home power meter generating real-time power usages
   */
  private static startEnergySimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }

    // Default base wattage values for appliances
    const appliances = {
      lights: 150,       // 150 W
      ac: 1200,          // 1.2 kW
      fridge: 250,       // 250 W
      entertainment: 300 // 300 W
    };

    this.tickCount = 0;

    this.simulationInterval = setInterval(async () => {
      if (!this.ioInstance) return;

      // Add slight random fluctuations to simulate actual live power draw
      const lightsDraw = Math.round(appliances.lights + (Math.random() - 0.5) * 20);
      const fridgeDraw = Math.round(appliances.fridge + (Math.random() - 0.5) * 10);
      
      // AC cycles on and off sometimes to show dynamic peaks
      const minutes = new Date().getMinutes();
      const acActive = minutes % 6 < 4; // AC active for 4 mins, idle for 2 mins
      const acDraw = acActive ? Math.round(appliances.ac + (Math.random() - 0.5) * 100) : 0;
      
      const entertainmentDraw = Math.round(appliances.entertainment + (Math.random() - 0.5) * 40);

      const totalWatts = lightsDraw + fridgeDraw + acDraw + entertainmentDraw;
      const totalKw = totalWatts / 1000;

      // Carbon rate: (kW * 0.233) = kg CO2 per hour
      const carbonPerHour = totalKw * EMISSION_FACTORS.energy.electricity;

      const payload = {
        timestamp: new Date().toISOString(),
        powerUsageKw: Math.round(totalKw * 100) / 100,
        carbonRateKgPerHour: Math.round(carbonPerHour * 100) / 100,
        breakdown: {
          lights: lightsDraw,
          ac: acDraw,
          fridge: fridgeDraw,
          entertainment: entertainmentDraw
        }
      };

      // Broadcast to all connected clients
      this.ioInstance.emit("energy:update", payload);

      this.tickCount++;

      // Proactively save to the database every 3 ticks (approx 9 seconds)
      // to populate the SmartDevice logs for analytics in real time
      if (this.tickCount % 3 === 0) {
        try {
          // Find first user to log to for demo purposes
          const user = await prisma.user.findFirst();
          if (user) {
            await prisma.smartDevice.create({
              data: {
                userId: user.id,
                deviceId: "smart-meter-home-01",
                deviceName: "Main Power Meter",
                powerUsage: payload.powerUsageKw
              }
            });

            // Also log a CarbonEntry representing the incremental energy usage
            const kwhConsumed = payload.powerUsageKw * (9 / 3600); // consumed in last 9 seconds (3 ticks)
            const co2 = kwhConsumed * EMISSION_FACTORS.energy.electricity;

            await prisma.carbonEntry.create({
              data: {
                userId: user.id,
                category: "energy",
                type: "electricity",
                value: Math.round(kwhConsumed * 10000) / 10000,
                unit: "kWh",
                carbonEmitted: Math.round(co2 * 10000) / 10000,
                source: "iot",
                automatic: true,
                metadata: JSON.stringify({ confidence: 0.99 }) // energy iot is 99% confident
              }
            });

            // Notify clients of carbon update
            this.ioInstance.emit("carbon:updated", {
              userId: user.id,
              message: `Smart home IoT logged ${payload.powerUsageKw} kW usage.`
            });
          }
        } catch (err) {
          // Ignore db insert failures in case schema isn't migrated yet
        }
      }
    }, 3000);
  }

  static stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}
