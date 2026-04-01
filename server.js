require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const myRoute = require("./src/routes/routes");
const dbConnect = require("./src/config/dbConnect");
const app = express();
const port = process.env.PORT || 8000;
/* ---------------------------- DATABASE ---------------------------- */
dbConnect();
/* ---------------------------- MIDDLEWARE ---------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: "*" }));
app.use(morgan("dev"));
app.use(myRoute)
/* ---------------------------- SERVER ---------------------------- */
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
