const express = require("express");

const userRouter = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  toBookedAppointment,
  cancelAppointment,
  getAllUser,
} = require("../controller/user.controller.js");
const userAuthentication = require("../middleware/userAuthentication.middleware.js");

// for register

userRouter.route("/register").post(registerUser);

userRouter.route("/login").post(loginUser);

userRouter.route("/logout").post(userAuthentication, logoutUser);

userRouter
  .route("/book-appointment")
  .post(userAuthentication, toBookedAppointment);

userRouter
  .route("/cancel-appointment")
  .post(userAuthentication, cancelAppointment);

userRouter.route("/all-user").get(getAllUser);
module.exports = userRouter;
