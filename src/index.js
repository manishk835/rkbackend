// src/index.js

const express = require(
  "express"
);

const cors = require(
  "cors"
);

const dotenv = require(
  "dotenv"
);

dotenv.config();

const helmet = require(
  "helmet"
);

const rateLimit = require(
  "express-rate-limit"
);

const cookieParser =
  require(
    "cookie-parser"
  );

const morgan = require(
  "morgan"
);

const passport = require(
  "passport"
);

require(
  "./config/passport"
);

const connectDB =
  require(
    "./config/db"
  );

/* ======================================================
   DATABASE
====================================================== */

connectDB();

/* ======================================================
   EXPRESS APP
====================================================== */

const app =
  express();

/* ======================================================
   TRUST PROXY
====================================================== */

app.set(
  "trust proxy",
  1
);

/* ======================================================
   WEBHOOK RAW BODY
====================================================== */

/*
IMPORTANT:
Webhook route MUST come before express.json()
otherwise Razorpay signature verification fails
*/

app.use(
  "/api/webhook",

  express.raw({
    type:
      "application/json",
  })
);

/* ======================================================
   BODY PARSERS
====================================================== */

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,

    limit: "10mb",
  })
);

app.use(
  cookieParser()
);

/* ======================================================
   PASSPORT
====================================================== */

app.use(
  passport.initialize()
);

/* ======================================================
   LOGGER
====================================================== */

if (
  process.env
    .NODE_ENV !==
  "production"
) {

  app.use(
    morgan("dev")
  );
}

/* ======================================================
   CORS
====================================================== */

const allowedOrigins =
  [
    "http://localhost:3000",

    process.env
      .FRONTEND_URL,
  ].filter(Boolean);

app.use(
  cors({
    origin:
      function (
        origin,
        callback
      ) {

        /* ================= POSTMAN / MOBILE ================= */

        if (!origin) {
          return callback(
            null,
            true
          );
        }

        /* ================= ALLOWED ================= */

        if (
          allowedOrigins.includes(
            origin
          )
        ) {

          return callback(
            null,
            true
          );
        }

        console.error(
          "Blocked CORS Origin:",
          origin
        );

        return callback(
          new Error(
            "CORS not allowed"
          )
        );
      },

    credentials:
      true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders:
      [
        "Content-Type",
        "Authorization",
      ],
  })
);

/* ======================================================
   SECURITY HEADERS
====================================================== */

app.use(
  helmet({
    crossOriginResourcePolicy:
      false,

    contentSecurityPolicy:
      false,
  })
);

/* ======================================================
   BASIC SANITIZATION
====================================================== */

app.use(
  (
    req,
    res,
    next
  ) => {

    if (
      req.body &&
      typeof req.body ===
        "object"
    ) {

      Object.keys(
        req.body
      ).forEach(
        (key) => {

          if (
            key.includes(
              "$"
            ) ||
            key.includes(
              "."
            )
          ) {

            delete req.body[
              key
            ];
          }
        }
      );
    }

    next();
  }
);

/* ======================================================
   GLOBAL RATE LIMITER
====================================================== */

const limiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    max: 300,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "Too many requests, please try again later",
    },
  });

app.use(
  limiter
);

/* ======================================================
   AUTH LIMITER
====================================================== */

const authLimiter =
  rateLimit({
    windowMs:
      10 *
      60 *
      1000,

    max: 15,

    skipSuccessfulRequests:
      true,

    message: {
      message:
        "Too many authentication attempts. Try again later.",
    },
  });

app.use(
  "/api/auth",
  authLimiter
);

/* ======================================================
   HEALTH CHECK
====================================================== */

app.get(
  "/health",

  (
    req,
    res
  ) => {

    res.status(200).json(
      {
        success:
          true,

        status:
          "OK",

        service:
          "RK Fashion API",

        uptime:
          process.uptime(),

        timestamp:
          new Date(),
      }
    );
  }
);

/* ======================================================
   API ROUTES
====================================================== */

app.use(
  "/api/auth",
  require(
    "./routes/auth.routes"
  )
);

app.use(
  "/api/admin",
  require(
    "./routes/admin.routes"
  )
);

app.use(
  "/api/products",
  require(
    "./routes/product.routes"
  )
);

app.use(
  "/api/orders",
  require(
    "./routes/order.routes"
  )
);

app.use(
  "/api/cart",
  require(
    "./routes/cart.routes"
  )
);

app.use(
  "/api/wishlist",
  require(
    "./routes/wishlist.routes"
  )
);

app.use(
  "/api/upload",
  require(
    "./routes/upload.routes"
  )
);

app.use(
  "/api/address",
  require(
    "./routes/address.routes"
  )
);

app.use(
  "/api/seller",
  require(
    "./routes/seller.routes"
  )
);

app.use(
  "/api/vendors",
  require(
    "./routes/vendor.routes"
  )
);

app.use(
  "/api/categories",
  require(
    "./routes/category.routes"
  )
);

app.use(
  "/api/webhook",
  require(
    "./routes/webhook.routes"
  )
);

app.use(
  "/api/coupons",
  require(
    "./routes/coupon.routes"
  )
);

app.use(
  "/api/withdrawals",
  require(
    "./routes/withdrawal.routes"
  )
);

app.use(
  "/api/bulk",
  require(
    "./routes/bulk.routes"
  )
);

app.use(
  "/api/ai",
  require(
    "./routes/ai.routes"
  )
);

/* ======================================================
   404 HANDLER
====================================================== */

app.use(
  (
    req,
    res
  ) => {

    return res.status(
      404
    ).json({
      success:
        false,

      message:
        "Route not found",
    });
  }
);

/* ======================================================
   GLOBAL ERROR HANDLER
====================================================== */

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      "SERVER ERROR:",
      err
    );

    /* ================= MULTER ================= */

    if (
      err.name ===
      "MulterError"
    ) {

      return res.status(
        400
      ).json({
        message:
          err.message,
      });
    }

    /* ================= JSON ================= */

    if (
      err instanceof
      SyntaxError &&
      err.status ===
        400 &&
      "body" in err
    ) {

      return res.status(
        400
      ).json({
        message:
          "Invalid JSON payload",
      });
    }

    /* ================= DEFAULT ================= */

    const status =
      err.status ||
      500;

    return res.status(
      status
    ).json({
      success:
        false,

      message:
        process.env
          .NODE_ENV ===
        "production"
          ? "Something went wrong"
          : err.message,
    });
  }
);

/* ======================================================
   START SERVER
====================================================== */

const PORT =
  process.env.PORT ||
  5000;

app.listen(
  PORT,

  () => {

    console.log(
      `🚀 RK Fashion Backend running on port ${PORT}`
    );
  }
);