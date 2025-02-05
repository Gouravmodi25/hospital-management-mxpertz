const UserModel = require("../model/user.model");

const asyncHandler = require("../utils/asyncHandler");

const jwt = require("jsonwebtoken");

const ApiResponse = require("../utils/ApiResponse");

const userAuthentication = asyncHandler(async (req, res, next) => {
  const token = req.header("Authorization") || req.cookies?.accessToken;

  try {
    if (!token) {
      return res
        .status(401)
        .json(new ApiResponse(401, "Not Authorized Login Again"));
    }

    let decodedToken;

    try {
      decodedToken = await jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      return res
        .status(401)
        .json(
          new ApiResponse(401, "Invalid or expired token. Please log in again.")
        );
    }

    const user = await UserModel.findById(decodedToken._id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json(
          new ApiResponse(
            401,
            "Error verifying token data. Please log in again."
          )
        );
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json(new ApiResponse(401, "Not Authorized Login Again"));
  }
});

module.exports = userAuthentication;
