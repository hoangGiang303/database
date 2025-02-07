const express = require("express");
const path = require('path');
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
var bodyParser = require("body-parser");
const morgan = require("morgan");
const dotenv = require("dotenv");
const fs = require('fs');
const crypto = require('crypto');
const accRouter = require('./backend/routers/account');
const authorRouter = require('./backend/routers/author');
const bookRouter = require('./backend/routers/book');
const imageRouter = require('./backend/routers/image_link');
const {authenticateToken} = require('./backend/middleWare/middleware');


dotenv.config();

if (!process.env.SECRET_KEY) {
  const secretKey = crypto.randomBytes(64).toString('hex');
  
  fs.appendFileSync('.env', `\nSECRET_KEY=${secretKey}\n`);
  
  console.log('SECRET_KEY đã được tạo và lưu vào .env');
} else {
  console.log('SECRET_KEY đã tồn tại trong .env');
}

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Đã kết nối MongoDB thành công"));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
app.use(morgan("common"));


//routers
app.use("/api/v1",accRouter);
app.use("/api/v1/author",authenticateToken, authorRouter);
app.use("/api/v1/book",authenticateToken,bookRouter);
app.use("/api/v1/image",authenticateToken,imageRouter);


app.get("/", (req, res) => {
    res.send("Server đang hoạt động");
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log("Server is running on port " + port);
});
