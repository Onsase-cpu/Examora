import { describe, expect, it } from "vitest";
import { calculateFare, canCapturePayment, canRateRide, estimateRoute, findNearestDriver, formatCurrency, isValidRideTransition, type DriverCandidate } from "./ride";

describe("Drivana ride utilities", () => {
  const pickup = { lat: 40.7421, lng: -73.9921 };
  const destination = { lat: 40.7587, lng: -73.9856 };

  it("estimates a positive route with a usable polyline", () => {
    const route = estimateRoute(pickup, destination);
    expect(route.distanceKm).toBeGreaterThan(0);
    expect(route.durationMinutes).toBeGreaterThan(0);
    expect(route.route).toHaveLength(5);
    expect(route.route[0]).toEqual(pickup);
    expect(route.route.at(-1)).toEqual(destination);
  });

  it("keeps higher service tiers more expensive than standard", () => {
    const route = estimateRoute(pickup, destination);
    const standard = calculateFare("standard", route);
    const comfort = calculateFare("comfort", route);
    const xl = calculateFare("xl", route);
    expect(comfort.fare).toBeGreaterThan(standard.fare);
    expect(xl.fare).toBeGreaterThan(comfort.fare);
    expect(standard.currency).toBe("USD");
  });

  it("matches the closest driver that supports the selected category", () => {
    const candidates: DriverCandidate[] = [
      { id: "far", name: "Far Driver", vehicle: "Sedan", plate: "FAR 001", category: "comfort", rating: 5, etaMinutes: 9, location: { lat: 40.77, lng: -73.97 }, accent: "#fff", available: true },
      { id: "near", name: "Near Driver", vehicle: "Sedan", plate: "NEAR 002", category: "comfort", rating: 4.8, etaMinutes: 3, location: { lat: 40.743, lng: -73.992 }, accent: "#fff", available: true },
      { id: "wrong-tier", name: "Wrong Tier", vehicle: "Van", plate: "XL 003", category: "xl", rating: 5, etaMinutes: 1, location: pickup, accent: "#fff", available: false },
    ];
    expect(findNearestDriver(candidates, pickup, "comfort")?.id).toBe("near");
  });

  it("enforces an ordered trip lifecycle", () => {
    expect(isValidRideTransition("matching", "driver_assigned")).toBe(true);
    expect(isValidRideTransition("driver_arriving", "in_progress")).toBe(true);
    expect(isValidRideTransition("completed", "in_progress")).toBe(false);
    expect(isValidRideTransition("cancelled", "completed")).toBe(false);
  });

  it("only allows payment capture after completion", () => {
    expect(canCapturePayment("in_progress")).toBe(false);
    expect(canCapturePayment("completed")).toBe(true);
  });

  it("only accepts ratings for completed rides and the assigned driver", () => {
    expect(canRateRide("in_progress", 7, 7)).toBe(false);
    expect(canRateRide("completed", 7, 8)).toBe(false);
    expect(canRateRide("completed", 7, 7)).toBe(true);
  });

  it("formats simulated payment totals as currency", () => {
    expect(formatCurrency(18.64)).toBe("$18.64");
  });
});
