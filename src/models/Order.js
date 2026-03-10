const mongoose = require("mongoose");

/* ================= ORDER STATUS ================= */

const allowedStatuses = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

/* ================= ORDER ITEM ================= */

const OrderItemSchema = new mongoose.Schema(
{
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true,
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  title: {
    type: String,
    required: true,
    trim: true,
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  commission: {
    type: Number,
    default: 10,
    min: 0,
    max: 100,
  },

  sellerEarning: {
    type: Number,
    default: 0,
    min: 0,
  },

},
{ _id: false }
);

/* ================= MAIN ORDER ================= */

const OrderSchema = new mongoose.Schema(
{
  /* ================= ORDER NUMBER ================= */

  orderNumber: {
    type: String,
    unique: true,
    index: true,
  },

  /* ================= USER ================= */

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  /* ================= ITEMS ================= */

  items: {
    type: [OrderItemSchema],
    required: true,
    validate: [(v) => v.length > 0, "Order must have items"],
  },

  /* ================= CUSTOMER ================= */

  customer: {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    pincode: {
      type: String,
      required: true,
    },
  },

  /* ================= PRICING ================= */

  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },

  discount: {
    type: Number,
    default: 0,
    min: 0,
  },

  platformCommission: {
    type: Number,
    default: 0,
    min: 0,
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },

  /* ================= PAYMENT ================= */

  paymentMethod: {
    type: String,
    enum: ["COD", "RAZORPAY"],
    required: true,
  },

  paymentStatus: {
    type: String,
    enum: ["PENDING", "INITIATED", "PAID", "FAILED"],
    default: "PENDING",
    index: true,
  },

  /* ================= ORDER STATUS ================= */

  status: {
    type: String,
    enum: allowedStatuses,
    default: "Pending",
    index: true,
  },

  statusHistory: [
    {
      status: {
        type: String,
        enum: allowedStatuses,
      },

      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  estimatedDelivery: Date,

  /* ================= RETURN ================= */

  isReturnRequested: {
    type: Boolean,
    default: false,
  },

  returnReason: String,

  /* ================= RAZORPAY ================= */

  razorpay: {
    orderId: String,
    paymentId: String,
    signature: String,
  },

  /* ================= PAYMENT LOGS ================= */

  paymentLogs: [
    {
      event: String,
      payload: Object,

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

},
{ timestamps: true }
);

/* ================= INDEXES ================= */

OrderSchema.index({ "items.seller": 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });

/* ================= ORDER NUMBER GENERATOR ================= */

OrderSchema.pre("save", function () {

  if (!this.orderNumber) {

    const timestamp = Date.now().toString().slice(-6);

    this.orderNumber = "RK" + timestamp;

  }

});

/* ================= AUTO COMMISSION ================= */

OrderSchema.pre("save", function () {

  let totalCommission = 0;

  if (!this.items || this.items.length === 0) return;

  this.items.forEach((item) => {

    const itemTotal = item.price * item.quantity;

    const commissionAmount =
      (itemTotal * item.commission) / 100;

    item.sellerEarning = itemTotal - commissionAmount;

    totalCommission += commissionAmount;

  });

  this.platformCommission = totalCommission;

});

/* ================= STATUS HISTORY ================= */

OrderSchema.pre("save", function () {

  if (this.isModified("status")) {

    this.statusHistory.push({
      status: this.status,
      updatedAt: new Date(),
    });

  }

});

module.exports =
  mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);