const express = require("express");
const db_conncetion = require("../config/db_connection");
const Company = require("../schemas/company_schema");
const adminRouter = require("../routers/adminRouter");
const userRouter = require("../routers/userRouter");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const requestRouter = require("../routers/requestRouter");
const paymentRouter = require("../routers/payments");
const http = require("http");
const initializeSocket = require("../utils/socket");
const messagesRouter = require("../routers/messagesRouter");

dotenv.config();

const app = express();

const server = http.createServer(app);

initializeSocket(server);

app.use(cors({
    origin : ["http://localhost:5173", "http://13.49.64.158", "http://192.168.6.3:5173"],
    credentials:true
}))
app.use(express.json());
app.use(cookieParser())

app.use("/", adminRouter);
app.use("/", userRouter);
app.use("/", requestRouter);
app.use("/", paymentRouter);
app.use("/", messagesRouter);

db_conncetion().then((res) => {
    console.log("Data connection estabhlished successfully.")
    server.listen(process.env.PORT, () => {
        console.log("Server running at port :" + process.env.PORT)
    })
}).catch((err) => console.log("Connection failed : ", err));
