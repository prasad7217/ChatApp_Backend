const express = require("express");
const db_conncetion = require("../config/db_connection");
const Company = require("../schemas/company_schema");
const adminRouter = require("../routers/adminRouter");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser())

app.use("/", adminRouter);

const port = 7777;

db_conncetion().then((res) => {
    console.log("Data connection estabhlished successfully.")
    app.listen(port, () => {
        console.log("Server running at port :" + port)
    })
}).catch((err) => console.log("Connection failed : ", err));
