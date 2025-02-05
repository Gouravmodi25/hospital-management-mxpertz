const mongoose = require("mongoose");
const dotenv = require("dotenv");
const DB_NAME = "hospital-management";

dotenv.config({ path: ".env" });

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      "MONGO DB!! Database is connected to server at ",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log(`MONGO DB connection error ${error}`);
    process.exit(1);
  }
};

module.exports = connectDB;
