const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const doctorSchema = new mongoose.Schema(
  {
    doctorName: {
      type: String,
      required: true,
    },
    doctorEmail: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true,
    },
    doctorPassword: {
      type: String,
      required: true,
      minlength: 6,
    },
    specialization: {
      type: String,
      required: true,
    },
    degree: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },
    availability: {
      type: String,
      required: true,
      enum: ["Available", "Un Available"],
      default: "Available",
    },
    accessToken: {
      type: String,
    },
    slot: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("doctorPassword")) {
    return next();
  }

  this.doctorPassword = await bcrypt.hash(this.doctorPassword, 10);
  next();
});

doctorSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "1d",
    }
  );
};

doctorSchema.methods.isCorrectPassword = async function (password) {
  return await bcrypt.compare(password, this.doctorPassword);
};

const DoctorModel = mongoose.model("Doctor", doctorSchema);

module.exports = DoctorModel;
