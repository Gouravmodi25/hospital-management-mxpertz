const asyncHandler = require("../utils/asyncHandler.js");

const ApiResponse = require("../utils/ApiResponse.js");

const validator = require("validator");
const DoctorModel = require("../model/doctor.model.js");
const AppointmentModel = require("../model/appointment.model.js");

const generateAccessToken = async (doctorID) => {
  try {
    const doctor = await DoctorModel.findById(doctorID);

    if (!doctor) {
      return res.status(404).json(new ApiResponse(404, "User not found"));
    }

    const accessToken = doctor.generateAccessToken();
    doctor.accessToken = accessToken;
    await doctor.save({ validateBeforeSave: false });
    return accessToken;
  } catch (error) {
    console.log("Error while generating access token", error.message);
    return null;
  }
};

// for register doctor

const registerDoctor = asyncHandler(async (req, res) => {
  const {
    doctorName,
    doctorEmail,
    doctorPassword,
    specialization,
    degree,
    amount,
    availability,
  } = req.body;

  if (
    [
      doctorName,
      doctorEmail,
      doctorPassword,
      specialization,
      degree,
      amount,
      availability,
    ].some((item) => String("" || item).trim() === "")
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, "All fields are required"));
  }

  if (!validator.isEmail(doctorEmail)) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Invalid Email Please Enter valid email"));
  }

  const existedDoctor = await DoctorModel.findOne({ doctorEmail });

  if (existedDoctor) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Doctor is already registered"));
  }

  const doctor = await DoctorModel.create({
    doctorName,
    doctorEmail,
    doctorPassword,
    specialization,
    degree,
    amount,
    availability,
  });

  if (!doctor) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Error While Registering User"));
  }

  const newDoctor = await DoctorModel.findById(doctor._id).select("-password");

  return res
    .status(201)
    .json(new ApiResponse(201, "Doctor registered successfully", newDoctor));
});

const loginDoctor = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if ([email, password].some((item) => String("" || item).trim() === "")) {
    return res
      .status(400)
      .json(new ApiResponse(400, "All the fields are required"));
  }

  console.log(email, password);

  const doctor = await DoctorModel.findOne({ doctorEmail: email });
  console.log(doctor);

  if (!doctor) {
    return res
      .status(404)
      .json(new ApiResponse(404, "Doctor not found Please register user"));
  }

  const isCorrectPassword = await doctor.isCorrectPassword(password);

  if (!isCorrectPassword) {
    return res.status(400).json(new ApiResponse(400, "Password is incorrect"));
  }

  const accessToken = await generateAccessToken(doctor._id);

  const option = {
    secure: true,
    httpOnly: true,
  };

  const loggedInDoctor = await DoctorModel.findById(doctor._id).select(
    "-password"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .json(new ApiResponse(200, "User logged in successfully", loggedInDoctor));
});

const logoutDoctor = asyncHandler(async (req, res) => {
  const { doctor } = req;

  const loggedInDoctor = await DoctorModel.findByIdAndUpdate(
    doctor._id,
    { $unset: { accessToken: 1 } },
    { new: true }
  ).select("-password");

  if (!loggedInDoctor) {
    return res
      .status(400)
      .json(new ApiResponse(400, "Error while logging out"));
  }

  const option = {
    secure: true,
    httpOnly: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .json(
      new ApiResponse(200, "Doctor logged out successfully", loggedInDoctor)
    );
});

const getAllDoctor = asyncHandler(async (req, res) => {
  const doctors = await DoctorModel.find({}).select("-password");
  return res.status(200).json(new ApiResponse(200, "All Doctors", doctors));
});

const fetchAllAppointmentOFDoctor = asyncHandler(async (req, res) => {
  const doctor = req.doctor;

  const appointments = await AppointmentModel.find({ doctorId: doctor._id });

  return res
    .status(200)
    .json(new ApiResponse(200, "All Appointments", appointments));
});

module.exports = {
  registerDoctor,
  loginDoctor,
  logoutDoctor,
  getAllDoctor,
  fetchAllAppointmentOFDoctor,
};
