const express = require("express");
const db_conncetion = require("../config/db_connection");
const Company = require("../schemas/company_schema");
const adminRouter = require("../routers/adminRouter");
<<<<<<< HEAD
const userRouter = require("../routers/userRouter");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();
=======
const cookieParser = require("cookie-parser");
>>>>>>> dad99379e8b10191491f734a6ec052ba6af13f2d

const app = express();
app.use(express.json());
app.use(cookieParser())

app.use("/", adminRouter);
<<<<<<< HEAD
app.use("/", userRouter)

db_conncetion().then((res) => {
    console.log("Data connection estabhlished successfully.")
    app.listen(process.env.PORT, () => {
        console.log("Server running at port :" + process.env.PORT)
=======

const port = 7777;

db_conncetion().then((res) => {
    console.log("Data connection estabhlished successfully.")
    app.listen(port, () => {
        console.log("Server running at port :" + port)
>>>>>>> dad99379e8b10191491f734a6ec052ba6af13f2d
    })
}).catch((err) => console.log("Connection failed : ", err));
