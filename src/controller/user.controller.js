const asyncHandler = require("../utils/asyncHandler.js");

const UserModel = require("../model/user.model.js");

const validator = require("validator");

const ApiResponse = require("../utils/ApiResponse.js");
const DoctorModel = require("../model/doctor.model.js");
const AppointmentModel = require("../model/appointment.model.js");

const generateAccessToken = async (userId) => {
  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json(new ApiResponse(404, "User not found"));
    }

    const accessToken = user.generateAccessToken();
    user.accessToken = accessToken;
    await user.save({ validateBeforeSave: false });
    return accessToken;
  } catch (error) {
    console.log("Error while generating access token", error.message);
    return null;
  }
};

const registerUser = asyncHandler(async (req, res, next) => {
  const { name, username, email, password } = req.body;

  if (
    [name, email, username, password].some(
      (item) => String("" || item).trim() === ""
    )
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, "All the fields are required"));
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json(new ApiResponse(400, "Invalid email"));
  }

  const existedUser = await UserModel.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    return res.status(400).json(new ApiResponse(400, "User already exists"));
  }

  const user = await UserModel.create({
    name,
    username,
    email,
    password,
  });

  if (!user) {
    return res
      .status(404)
      .json(new ApiResponse(404, "Error While registering user"));
  }

  const newUser = await UserModel.findById(user._id).select("-password");

  return res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", newUser));
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if ([email, password].some((item) => String("" || item).trim() === "")) {
    return res
      .status(400)
      .json(new ApiResponse(400, "All the fields are required"));
  }

  console.log(email, password);

  const user = await UserModel.findOne({ email: email });

  console.log(user);

  if (!user) {
    return res
      .status(404)
      .json(new ApiResponse(404, "User not found Please register user"));
  }

  const isCorrectPassword = await user.isCorrectPassword(password);

  if (!isCorrectPassword) {
    return res.status(400).json(new ApiResponse(400, "Password is incorrect"));
  }

  const accessToken = await generateAccessToken(user._id);

  const option = {
    secure: true,
    httpOnly: true,
  };

  const loggedInUser = await UserModel.findById(user._id).select("-password");

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .json(new ApiResponse(200, "User logged in successfully", loggedInUser));
});

const logoutUser = asyncHandler(async (req, res) => {
  const { user } = req;

  const loggedInUser = await UserModel.findByIdAndUpdate(
    user._id,
    { $unset: { accessToken: 1 } },
    { new: true }
  ).select("-password");

  if (!loggedInUser) {
    return res
      .status(404)
      .json(new ApiResponse(404, "Error while logging out"));
  }

  const option = {
    secure: true,
    httpOnly: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .json(new ApiResponse(200, "User logged out successfully", loggedInUser));
});

const toBookedAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate } = req.body;

  // Validate input fields
  if (
    [doctorId, appointmentDate].some((item) => String(item || "").trim() === "")
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, "All the fields are required"));
  }

  // Validate date format
  if (
    !validator.isDate(appointmentDate, {
      format: "DD-MM-YYYY",
      strictMode: true,
    })
  ) {
    return res.status(400).json(new ApiResponse(400, "Invalid date"));
  }

  const { user } = req;
  const userId = user._id;

  const doctorData = await DoctorModel.findById(doctorId).select(
    "-doctorPassword"
  );

  console.log("doctorData", doctorData);

  if (!doctorData) {
    return res.status(404).json(new ApiResponse(404, "Doctor not found"));
  }

  if (doctorData.availability === "Un Available") {
    return res
      .status(400)
      .json(new ApiResponse(400, "Doctor is not available"));
  }

  const userData = await UserModel.findById(userId).select("-password");
  if (!userData) {
    return res.status(404).json(new ApiResponse(404, "User not found"));
  }

  // Check if the appointment already exists for the same date and time
  const existingAppointment = await AppointmentModel.findOne({
    doctorId,
    appointmentDate,
    cancelled: false,
  });

  if (existingAppointment) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Appointment already booked"));
  }

  const appointmentData = {
    userId,
    doctorId,
    userData,
    doctorData: {
      ...doctorData.toObject(),
      slot: undefined,
    },
    appointmentDate,
    amount: doctorData.amount,
  };

  const newAppointment = await AppointmentModel.create(appointmentData);

  console.log(newAppointment);

  await DoctorModel.findByIdAndUpdate(
    doctorId,
    {
      $push: {
        slot: { appointmentDate, userId, userData },
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment Booked", newAppointment));
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;

  const { user } = req;
  const userId = user._id;

  const appointment = await AppointmentModel.findById(appointmentId);

  if (!appointment) {
    return res.status(404).json(new ApiResponse(404, "Appointment not found"));
  }

  if (appointment.userId.toString() !== userId.toString()) {
    return res
      .status(403)
      .json(new ApiResponse(403, "You can only cancel your own appointments"));
  }

  const doctorId = appointment.doctorId;
  const appointmentDate = appointment.appointmentDate;

  await DoctorModel.findByIdAndUpdate(
    doctorId,
    {
      $pull: { slot: { appointmentDate, userId } },
    },
    { new: true }
  );

  const cancelledAppointment = await AppointmentModel.findByIdAndUpdate(
    appointmentId,
    { cancelled: true },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Appointment canceled successfully ",
        cancelledAppointment
      )
    );
});

const getAllUser = asyncHandler(async (req, res) => {
  const getAllUser = await UserModel.find({}).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "Successfully get all user", getAllUser));
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  toBookedAppointment,
  cancelAppointment,
  getAllUser,
};
