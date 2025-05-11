const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // التحقق مما إذا كان المستخدم موجودًا بالفعل
    const foundUser = await User.findOne({ email }).exec();
    if (foundUser) {
        return res.status(409).json({ message: "User already exists" });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء المستخدم في قاعدة البيانات
    const user = await User.create({
        first_name,
        last_name,
        email,
        password: hashedPassword,
    });

    // إنشاء توكن الوصول
    const accessToken = jwt.sign(
        { 
            UserInfo: {
                id: user._id,
            },
         },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );

    // إنشاء توكن التحديث
    const refreshToken = jwt.sign(
        { 
            UserInfo: {
                id: user._id,
            },
         },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    // حفظ التوكن في الكوكيز
    res.cookie("jwt", refreshToken, {
        httpOnly: true, // يمكن الوصول إليه فقط من السيرفر
        secure: true,   // يتطلب HTTPS
        sameSite: "None", // يسمح بالاستخدام عبر المواقع
        maxAge: 7 * 24 * 60 * 60 * 1000, // أسبوع واحد
    });

    // إرسال الاستجابة
    res.json({
        accessToken,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // التحقق مما إذا كان المستخدم موجودًا بالفعل
    const foundUser = await User.findOne({ email }).exec();
    if (!foundUser) {
        return res.status(404).json({ message: "User does not exist" });
    }

    // التحقق من كلمة المرور
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) return res.status(401).json({ message: "Wrong Password" });

    // إنشاء توكن الوصول
    const accessToken = jwt.sign(
        { 
            UserInfo: {
                id: foundUser._id, 
            },
         },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );

    // إنشاء توكن التحديث
    const refreshToken = jwt.sign(
        { 
            UserInfo: {
                id: foundUser._id, 
            },
         },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    // حفظ التوكن في الكوكيز
    res.cookie("jwt", refreshToken, {
        httpOnly: true, // يمكن الوصول إليه فقط من السيرفر
        secure: true,   // يتطلب HTTPS
        sameSite: "None", // يسمح بالاستخدام عبر المواقع
        maxAge: 7 * 24 * 60 * 60 * 1000, // أسبوع واحد
    });

    // إرسال الاستجابة
    res.json({
        accessToken,
        email: foundUser.email, 
    });
};
const refresh = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

    const refreshToken = cookies.jwt;
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ message: "Forbidden" });

        const foundUser = await User.findById(decoded.UserInfo.id).exec();
        if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

        // إنشاء توكن الوصول
        const accessToken = jwt.sign(
            { 
                UserInfo: {
                    id: foundUser._id, 
                },
             },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" } // يمكنك تغيير المدة هنا
        );

        res.json({ accessToken });
    });
};
const logout = (req,res) => {
   const cookies = req.cookies;
   if(!cookies?.jwt) return res.sendStatus(204);  //no content
   res.clearCookie("jwt",{
    httpOnly: true,
    sameSite: "None",
    secure: true,
   });
   res.json({ message: "Cookies cleared" });
   };

module.exports = {
    register,
    login,
    refresh,
    logout,
};
