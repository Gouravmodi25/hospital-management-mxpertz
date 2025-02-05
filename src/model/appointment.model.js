const mongoose = require("mongoose");

const appointment = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    doctorId: {
      type: String,
      required: true,
    },

    userData: {
      type: Object,
      required: true,
    },
    doctorData: {
      type: Object,
      required: true,
    },

    appointmentDate: {
      type: String,
      required: true,
    },
    cancelled: {
      type: Boolean,
      default: false,
    },

    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AppointmentModel = mongoose.model("Appointment", appointment);

module.exports = AppointmentModel;
