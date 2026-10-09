import { describe, it, expect } from "vitest";
const {
  roundMoney,
  calculateUnitPrice,
} = require("../../services/checkoutService");

describe("Pricing and Totals Calculation Unit Tests", () => {
  it("should calculate flat discount accurately", () => {
    const discounted = calculateUnitPrice(1000, "flat", 150);
    expect(discounted).toBe(850);
  });

  it("should calculate percentage discount accurately", () => {
    const discounted = calculateUnitPrice(1000, "percentage", 20);
    expect(discounted).toBe(800);
  });

  it("should not allow unit price to become negative", () => {
    const discounted = calculateUnitPrice(100, "flat", 200);
    expect(discounted).toBe(0);
  });

  it("should properly round money amounts to two decimal points", () => {
    expect(roundMoney(19.999)).toBe(20);
    expect(roundMoney(19.994)).toBe(19.99);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it("should compute tax at 5% rate", () => {
    const subtotal = 1000;
    const taxRate = 0.05;
    const tax = roundMoney(subtotal * taxRate);
    expect(tax).toBe(50);
  });
});
