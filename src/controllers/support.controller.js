const SupportTicket = require("../models/SupportTicket");

/* ======================================================
   CREATE TICKET
====================================================== */

exports.createTicket = async (req, res) => {

  try {

    const {
      subject,
      category,
      priority,
      message,
    } = req.body;

    const ticket =
      await SupportTicket.create({

        user: req.user._id,

        subject,

        category,

        priority,

        messages: [
          {
            sender: "user",
            message,
          },
        ],

      });

    res.status(201).json(ticket);

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to create ticket",
    });

  }

};

/* ======================================================
   GET USER TICKETS
====================================================== */

exports.getMyTickets = async (req, res) => {

  try {

    const tickets =
      await SupportTicket.find({

        user: req.user._id,

      }).sort({
        createdAt: -1,
      });

    res.json(tickets);

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch tickets",
    });

  }

};

/* ======================================================
   GET SINGLE TICKET
====================================================== */

exports.getSingleTicket = async (req, res) => {

  try {

    const ticket =
      await SupportTicket.findOne({

        _id: req.params.id,

        user: req.user._id,

      });

    if (!ticket) {

      return res.status(404).json({
        message: "Ticket not found",
      });

    }

    res.json(ticket);

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch ticket",
    });

  }

};

/* ======================================================
   USER REPLY
====================================================== */

exports.replyTicket = async (req, res) => {

  try {

    const { message } = req.body;

    const ticket =
      await SupportTicket.findOne({

        _id: req.params.id,

        user: req.user._id,

      });

    if (!ticket) {

      return res.status(404).json({
        message: "Ticket not found",
      });

    }

    ticket.messages.push({

      sender: "user",

      message,

    });

    ticket.status = "Open";

    await ticket.save();

    res.json(ticket);

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Reply failed",
    });

  }

};