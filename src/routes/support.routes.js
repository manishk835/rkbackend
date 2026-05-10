const express = require("express");

const router = express.Router();

const {
  createTicket,
  getMyTickets,
  getSingleTicket,
  replyTicket,
} = require("../controllers/support.controller");

const {
  protect,
} = require("../middlewares/auth.middleware");

/* ======================================================
   CREATE TICKET
====================================================== */

router.post(
  "/",
  protect,
  createTicket
);

/* ======================================================
   GET USER TICKETS
====================================================== */

router.get(
  "/my",
  protect,
  getMyTickets
);

/* ======================================================
   GET SINGLE TICKET
====================================================== */

router.get(
  "/:id",
  protect,
  getSingleTicket
);

/* ======================================================
   USER REPLY
====================================================== */

router.post(
  "/:id/reply",
  protect,
  replyTicket
);

module.exports = router;