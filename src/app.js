const express = require("express");
const db_conncetion = require("../config/db_connection");
const Company = require("../schemas/company_schema");
const adminRouter = require("../routers/adminRouter");
const userRouter = require("../routers/userRouter");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser())

app.use("/", adminRouter);
app.use("/", userRouter)

db_conncetion().then((res) => {
    console.log("Data connection estabhlished successfully.")
    app.listen(process.env.PORT, () => {
        console.log("Server running at port :" + process.env.PORT)
    })
}).catch((err) => console.log("Connection failed : ", err));
