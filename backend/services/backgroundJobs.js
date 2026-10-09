const Order = require("../models/Order");
const Cart = require("../models/Cart");
const { transitionOrderState } = require("./orderStateMachine");

const RESERVATION_TTL_MINUTES = parseInt(
  process.env.RESERVATION_TTL_MINUTES || "15",
  10
);

// In-memory queue / event bus
class JobQueue {
  constructor() {
    this.emailQueue = [];
    this.timer = null;
  }

  // Enqueue order confirmation email job
  enqueueOrderConfirmation(order) {
    const job = {
      id: `email_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      orderId: order._id,
      user: order.user,
      total: order.total,
      queuedAt: new Date(),
    };
    this.emailQueue.push(job);
    this.processEmailJob(job);
    return job;
  }

  async processEmailJob(job) {
    try {
      // Mock sending email
      console.log(
        `[BackgroundJob:Email] Sent order confirmation email for Order #${job.orderId} (Total: ₹${job.total})`
      );
    } catch (err) {
      console.error("[BackgroundJob:Email] Failed to process email job:", err);
    }
  }

  // Automatic release of expired inventory reservations
  async releaseExpiredReservations() {
    try {
      const expirationThreshold = new Date(
        Date.now() - RESERVATION_TTL_MINUTES * 60 * 1000
      );

      const expiredOrders = await Order.find({
        status: { $in: ["PENDING", "PAYMENT_PROCESSING"] },
        createdAt: { $lte: expirationThreshold },
      });

      if (expiredOrders.length === 0) return { releasedCount: 0 };

      console.log(
        `[BackgroundJob:StockRelease] Found ${expiredOrders.length} expired reservations to release.`
      );

      for (const order of expiredOrders) {
        try {
          await transitionOrderState(order, "CANCELLED", {
            reason: `Reservation expired after ${RESERVATION_TTL_MINUTES} minutes without payment`,
          });
          console.log(
            `[BackgroundJob:StockRelease] Successfully cancelled expired Order #${order._id} and restored inventory.`
          );
        } catch (err) {
          console.error(
            `[BackgroundJob:StockRelease] Failed to release Order #${order._id}:`,
            err.message
          );
        }
      }

      return { releasedCount: expiredOrders.length };
    } catch (error) {
      console.error("[BackgroundJob:StockRelease] Error checking expired orders:", error);
      return { error: error.message };
    }
  }

  // Detection and handling of abandoned carts
  async detectAbandonedCarts() {
    try {
      const abandonedThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours
      const abandonedCarts = await Cart.find({
        updatedAt: { $lte: abandonedThreshold },
        "items.0": { $exists: true }, // has at least 1 item
      }).populate("user", "name email");

      if (abandonedCarts.length > 0) {
        console.log(
          `[BackgroundJob:AbandonedCart] Detected ${abandonedCarts.length} abandoned cart(s).`
        );
      }

      return { abandonedCount: abandonedCarts.length };
    } catch (error) {
      console.error("[BackgroundJob:AbandonedCart] Error:", error);
      return { error: error.message };
    }
  }

  startPeriodicWorkers(intervalMs = 60000) {
    if (this.timer) return;
    this.timer = setInterval(async () => {
      await this.releaseExpiredReservations();
      await this.detectAbandonedCarts();
    }, intervalMs);

    // Initial check on startup
    setTimeout(() => {
      this.releaseExpiredReservations();
    }, 5000);
  }

  stopWorkers() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

const backgroundQueue = new JobQueue();

module.exports = backgroundQueue;
