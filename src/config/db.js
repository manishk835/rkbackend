// src/config/db.js

const mongoose = require(
  "mongoose"
);

/* ======================================================
   CONNECT DATABASE
====================================================== */

const connectDB =
  async () => {
    try {

      /* ================= URI CHECK ================= */

      if (
        !process.env
          .MONGO_URI
      ) {

        throw new Error(
          "MONGO_URI missing in environment variables"
        );
      }

      /* ================= CONNECTION ================= */

      const conn =
        await mongoose.connect(
          process.env
            .MONGO_URI,

          {
            maxPoolSize:
              10,

            serverSelectionTimeoutMS:
              5000,

            socketTimeoutMS:
              45000,

            autoIndex:
              true,
          }
        );

      console.log(
        `🟢 MongoDB Connected: ${conn.connection.host}`
      );

    } catch (error) {

      console.error(
        "❌ MongoDB Connection Failed:",
        error.message
      );

      /* ================= RETRY ================= */

      setTimeout(
        connectDB,
        5000
      );
    }
  };

/* ======================================================
   CONNECTION EVENTS
====================================================== */

mongoose.connection.on(
  "connected",

  () => {

    console.log(
      "📦 MongoDB connection established"
    );
  }
);

mongoose.connection.on(
  "error",

  (err) => {

    console.error(
      "🔥 MongoDB error:",
      err.message
    );
  }
);

mongoose.connection.on(
  "disconnected",

  () => {

    console.warn(
      "⚠ MongoDB disconnected"
    );
  }
);

mongoose.connection.on(
  "reconnected",

  () => {

    console.log(
      "🔄 MongoDB reconnected"
    );
  }
);

/* ======================================================
   MONGOOSE SETTINGS
====================================================== */

mongoose.set(
  "strictQuery",
  true
);

/* ======================================================
   GRACEFUL SHUTDOWN
====================================================== */

const gracefulShutdown =
  async (
    signal
  ) => {
    try {

      await mongoose.connection.close();

      console.log(
        `🛑 MongoDB connection closed (${signal})`
      );

      process.exit(0);

    } catch (err) {

      console.error(
        "Shutdown DB error:",
        err
      );

      process.exit(1);
    }
  };

process.on(
  "SIGINT",

  () =>
    gracefulShutdown(
      "SIGINT"
    )
);

process.on(
  "SIGTERM",

  () =>
    gracefulShutdown(
      "SIGTERM"
    )
);

/* ======================================================
   EXPORT
====================================================== */

module.exports =
  connectDB;