const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const userRouter = require("../src/routes/user.routes.js");
const connectDB = require("./db/dbConnection.js");
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const doctorRouter = require("../src/routes/doctor.routes.js");

require("dotenv").config({ path: ".env" });

app.use(cookieParser());
app.use(cors());
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(`Error: ${error.message}`);
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection error", error);
  });

app.use("/api/user", userRouter);
app.use("/api/doctor", doctorRouter);

module.export = app;
