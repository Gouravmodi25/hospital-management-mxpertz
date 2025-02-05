const express = require("express");
const doctorRouter = express.Router();

const doctorAuthentication = require("../middleware/doctorAuthentication.middleware.js");

const {
  registerDoctor,
  loginDoctor,
  logoutDoctor,
  getAllDoctor,
  fetchAllAppointmentOFDoctor,
} = require("../controller/doctor.controller.js");

doctorRouter.route("/register").post(registerDoctor);

doctorRouter.route("/login").post(loginDoctor);

doctorRouter.route("/logout").post(doctorAuthentication, logoutDoctor);

doctorRouter.route("/get-all-doctor").get(getAllDoctor);

doctorRouter
  .route("/fetch-all-appointment")
  .get(doctorAuthentication, fetchAllAppointmentOFDoctor);

module.exports = doctorRouter;
