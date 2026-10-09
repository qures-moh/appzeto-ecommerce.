import React from "react";
import {
  Clock,
  CreditCard,
  CheckCircle,
  PackageCheck,
  Truck,
  CheckCheck,
  AlertTriangle,
  XCircle,
  RotateCcw,
} from "lucide-react";

const STEPS = [
  { key: "PENDING", label: "Pending", icon: Clock },
  { key: "PAYMENT_PROCESSING", label: "Payment Processing", icon: CreditCard },
  { key: "PAID", label: "Paid", icon: CheckCircle },
  { key: "PROCESSING", label: "Processing", icon: PackageCheck },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCheck },
];

export default function OrderStepper({ status }) {
  const isFailed = status === "PAYMENT_FAILED";
  const isCancelled = status === "CANCELLED";
  const isRefunded = status === "REFUNDED";

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  if (isFailed || isCancelled || isRefunded) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          borderLeft: `4px solid ${
            isFailed ? "#ef4444" : isCancelled ? "#6b7280" : "#ec4899"
          }`,
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: isFailed
              ? "rgba(239, 68, 68, 0.15)"
              : isCancelled
              ? "rgba(107, 114, 128, 0.15)"
              : "rgba(236, 72, 153, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isFailed && <AlertTriangle size={24} color="#ef4444" />}
          {isCancelled && <XCircle size={24} color="#9ca3af" />}
          {isRefunded && <RotateCcw size={24} color="#ec4899" />}
        </div>
        <div>
          <h4
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: isFailed ? "#f87171" : isCancelled ? "#d1d5db" : "#f472b6",
            }}
          >
            {isFailed
              ? "Payment Failed"
              : isCancelled
              ? "Order Cancelled"
              : "Order Refunded"}
          </h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {isFailed
              ? "The simulated payment gateway was declined or expired. You can retry payment below."
              : isCancelled
              ? "This order was cancelled. Reserved inventory was automatically released back to catalog stock."
              : "This order was refunded to original payment method."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", padding: "1rem 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        {/* Background track line */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            right: "20px",
            height: "3px",
            background: "rgba(255, 255, 255, 0.1)",
            zIndex: 1,
          }}
        />

        {/* Active track line */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            height: "3px",
            width: `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%`,
            background: "var(--accent-gradient)",
            zIndex: 2,
            transition: "width 0.4s ease",
          }}
        />

        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <div
              key={step.key}
              style={{
                position: "relative",
                zIndex: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                width: "80px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: isCurrent
                    ? "var(--accent-gradient)"
                    : isCompleted
                    ? "#10b981"
                    : "#1e293b",
                  border: isCurrent
                    ? "3px solid #c7d2fe"
                    : isCompleted
                    ? "2px solid #34d399"
                    : "2px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: isCurrent
                    ? "0 0 16px rgba(99, 102, 241, 0.7)"
                    : "none",
                  transition: "all 0.3s ease",
                }}
              >
                <StepIcon size={18} />
              </div>

              <span
                style={{
                  fontSize: "0.75rem",
                  marginTop: "0.5rem",
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent
                    ? "#ffffff"
                    : isCompleted
                    ? "#34d399"
                    : "var(--text-muted)",
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
