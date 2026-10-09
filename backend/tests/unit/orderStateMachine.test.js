import { describe, it, expect } from "vitest";
const {
  ORDER_STATES,
  VALID_TRANSITIONS,
  isValidTransition,
} = require("../../services/orderStateMachine");

describe("Order State Machine Unit Tests", () => {
  it("should allow valid forward lifecycle transitions", () => {
    expect(isValidTransition("PENDING", "PAYMENT_PROCESSING")).toBe(true);
    expect(isValidTransition("PAYMENT_PROCESSING", "PAID")).toBe(true);
    expect(isValidTransition("PAID", "PROCESSING")).toBe(true);
    expect(isValidTransition("PROCESSING", "SHIPPED")).toBe(true);
    expect(isValidTransition("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("should allow cancellation from appropriate preliminary states", () => {
    expect(isValidTransition("PENDING", "CANCELLED")).toBe(true);
    expect(isValidTransition("PAYMENT_PROCESSING", "CANCELLED")).toBe(true);
    expect(isValidTransition("PAID", "CANCELLED")).toBe(true);
  });

  it("should reject invalid backward state transitions", () => {
    // Critical test: DELIVERED -> PENDING must be rejected
    expect(isValidTransition("DELIVERED", "PENDING")).toBe(false);
    expect(isValidTransition("SHIPPED", "PENDING")).toBe(false);
    expect(isValidTransition("PAID", "PENDING")).toBe(false);
    expect(isValidTransition("DELIVERED", "PROCESSING")).toBe(false);
  });

  it("should treat terminal states as immutable (no transitions allowed)", () => {
    expect(isValidTransition("CANCELLED", "PENDING")).toBe(false);
    expect(isValidTransition("CANCELLED", "PAID")).toBe(false);
    expect(isValidTransition("REFUNDED", "PAID")).toBe(false);
    expect(isValidTransition("REFUNDED", "DELIVERED")).toBe(false);
  });

  it("should allow refund from fulfilled or delivered states", () => {
    expect(isValidTransition("PAID", "REFUNDED")).toBe(true);
    expect(isValidTransition("PROCESSING", "REFUNDED")).toBe(true);
    expect(isValidTransition("SHIPPED", "REFUNDED")).toBe(true);
    expect(isValidTransition("DELIVERED", "REFUNDED")).toBe(true);
  });

  it("should handle idempotent same-state transitions gracefully", () => {
    expect(isValidTransition("PAID", "PAID")).toBe(true);
    expect(isValidTransition("PENDING", "PENDING")).toBe(true);
  });
});
