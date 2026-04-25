const express = require("express");
const db_conncetion = require("../config/db_connection");
const Company = require("../schemas/company_schema");
const adminRouter = require("../routers/adminRouter");
const userRouter = require("../routers/userRouter");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors")

dotenv.config();

const app = express();

app.use(cors({
    origin : "http://localhost:5173",
    credentials:true
}))
app.use(express.json());
app.use(cookieParser())

app.use("/", adminRouter);
app.use("/", userRouter);

db_conncetion().then((res) => {
    console.log("Data connection estabhlished successfully.")
    app.listen(process.env.PORT, () => {
        console.log("Server running at port :" + process.env.PORT)
    })
}).catch((err) => console.log("Connection failed : ", err));
