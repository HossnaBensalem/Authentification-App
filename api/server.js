require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/dbConn");
const corsOptions = require("./config/corsOptions");

const app = express();
const PORT = process.env.PORT || 5000;

// الاتصال بقاعدة البيانات
connectDB();

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// استضافة الملفات الثابتة
app.use("/", express.static(path.join(__dirname, "public")));

app.use("/", require("./routes/root"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/users", require("./routes/userRoutes"));
// معالجة الطلبات غير الموجودة
app.all("*", (req, res) => {
    res.status(404);
    if (req.accepts("html")) {
        res.sendFile(path.join(__dirname, "views", "404.html"));
    } else if (req.accepts("json")) {
        res.json({ message: "404 Not Found" });
    } else {
        res.type("txt").send("404 Not Found");
    }
});

// بدء تشغيل السيرفر بعد الاتصال بقاعدة البيانات
mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

// التعامل مع أخطاء الاتصال بقاعدة البيانات
mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
});
