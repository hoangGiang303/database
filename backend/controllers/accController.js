const { Account, Profile } = require("../model/model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const resetCodes = new Map();
const nodemailer = require("nodemailer");
const e = require("express");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const accController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (typeof username !== "string" || typeof password !== "string") {
        return res
          .status(400)
          .json({ error: "Username và Password phải là chuỗi" });
      }

      const user = await Account.findOne({ username });

      if (!user) {
        return res.status(401).json({ status: false, error: "Invalid email" });
      }

      const result = await bcrypt.compare(password, user.password);
      const hashedPassword = await bcrypt.hash(password, 10);

      if (!result) {
        return res
          .status(401)
          .json({ status: false, error: "Invalid password" });
      }

      const accessToken = jwt.sign(
        { id: user._id, admin: user.admin },
        process.env.SECRET_KEY,
        { expiresIn: "3h" }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        status: true,
        message: "Login success",
        accessToken,
        refreshToken,
        id: user._id,
        admin: user.admin,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  refreshAccessToken: async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      const user = await Account.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      const newAccessToken = jwt.sign(
        { id: user._id, admin: user.admin },
        process.env.SECRET_KEY,
        { expiresIn: "15m" } // 15 phút
      );

      res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
      res.status(403).json({ message: "Invalid or expired refresh token" });
    }
  },

  addAccount: async (req, res) => {
    try {
      const { username, password } = req.body;

      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!emailRegex.test(username)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must have at least 6 characters" });
      }

      const existingAccount = await Account.findOne({ username });
      if (existingAccount) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newAcc = new Account({ username, password: hashedPassword });
      const savedAcc = await newAcc.save();

      res
        .status(201)
        .json({ message: "Account created successfully", data: savedAcc });
    } catch (err) {
      console.error("Add account error: ", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getAllAccount: async (req, res) => {
    try {
      const accounts = await Account.find().populate("profile");
      res.status(200).json({
        data: accounts,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  },

  getAnAccount: async (req, res) => {
    try {
      const accounts = await Account.findById(req.params.id).populate(
        "profile"
      );
      res.status(200).json({ data: accounts });
    } catch (err) {
      res.status(500).json(err);
    }
  },

  setRoleAdmin: async (req, res) => {
    try {
      const { admin } = req.body;
      const accounts = await Account.findById(req.params.id);
      if (!accounts) {
        return res.status(404).json({ message: "Account not found" });
      }

      accounts.admin = admin;
      await accounts.save();

      res.status(200).json({ message: "Role updated successfully", accounts });
    } catch (err) {
      res.status(500).json(err);
    }
  },

  createProfile: async (req, res) => {
    try {
      const { name, address, phone, img } = req.body;
      const defaultImageUrl = "https://via.placeholder.com/150";

      const profileImage = img || defaultImageUrl;
      if (!name || !address || !phone) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ thông tin name, address và phone",
        });
      }

      if (!/^0\d{9}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message:
            "Số điện thoại không hợp lệ. Vui lòng nhập số bắt đầu bằng 0 và có 10 chữ số",
        });
      }

      const accounts = await Account.findById(req.params.id);

      if (!accounts.profile) {
        const newProfile = new Profile({
          name,
          address,
          phone,
          img: profileImage,
        });

        const savedProfile = await newProfile.save();

        await Account.findByIdAndUpdate(
          req.params.id,
          { profile: savedProfile._id },
          { new: true }
        );

        return res.status(201).json({
          success: true,
          message: "Tạo mới profile thành công",
          data: savedProfile,
        });
      }

      await Profile.findOneAndUpdate(
        { _id: accounts.profile },
        {
          $set: {
            name,
            address,
            phone,
            img: profileImage,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      const accountsWithProfile = await Account.findById(
        req.params.id
      ).populate("profile");

      res.status(200).json({
        success: true,
        message: "Cập nhật profile thành công",
        data: accountsWithProfile,
      });
    } catch (err) {
      res.status(500).json(err);
    }
  },

  changePass: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;

      const accounts = await Account.findById(req.params.id);

      const isPasswordValid = await bcrypt.compare(
        oldPassword,
        accounts.password
      );
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "New password must be at least 6 characters long" });
      }

      if (oldPassword === newPassword) {
        return res.status(400).json({
          error: "New password cannot be the same as the old password",
        });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      accounts.password = hashedNewPassword;
      await accounts.save();

      res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
      res.status(500).json(err);
    }
  },
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  try {
    if (!normalizedEmail) {
      return res.status(400).json({
        error: "Vui lòng cung cấp email xác nhận",
      });
    }
    const account = await Account.findOne({ username: normalizedEmail });
    if (!account) {
      return res.status(404).json({ error: "Tài khoản không tồn tại" });
    }
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`Reset code set for ${normalizedEmail}: ${resetCode}`);
    
    const resetData = {
      code: resetCode,
      expires: Date.now() + 60000, // 1 phút
      email: normalizedEmail
    };
    resetCodes.set(normalizedEmail, resetData);

    setTimeout(() => {
      resetCodes.delete(normalizedEmail);
    }, 120000);

    await transporter.sendMail({
      to: normalizedEmail,
      subject: "Mã Đặt Lại Mật Khẩu",
      html: `<p>Mã đặt lại mật khẩu của bạn là: <strong>${resetCode}</strong>. Mã này sẽ hết hạn sau 1 phút.</p>`,
    });

    res.status(200).json({
      message: "Mã đặt lại mật khẩu đã được gửi đến email của bạn",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};

const resetPassword = async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  try {
    const normalizedEmail = email.trim().toLowerCase();

    if (!email || !resetCode) {
      return res.status(400).json({
        error: "Vui lòng cung cấp email và mã đặt lại mật khẩu",
      });
    }

    const account = await Account.findOne({ username: normalizedEmail });
    if (!account) {
      return res.status(404).json({
        error: "Tài khoản không tồn tại",
      });
    }

    const storedCode = resetCodes.get(normalizedEmail);
    // let emailValue = storedCode.email;
    //  console.log("Email:", emailValue);
    console.log("All reset codes:", resetCodes);

    if (!storedCode) {
      return res.status(400).json({
        error: "Email xác thực không hợp lệ hoặc không tìm thấy mã",
      });
    }

    if (storedCode.code !== resetCode) {
      return res.status(400).json({
        error: "Mã đặt lại mật khẩu không chính xác",
      });
    }

    if (storedCode.expires < Date.now()) {
      resetCodes.delete(normalizedEmail);
      return res.status(400).json({
        error: "Mã đặt lại mật khẩu đã hết hạn",
      });
    }

   
    const isPasswordSame = await bcrypt.compare(newPassword, account.password);
    if (isPasswordSame) {
      return res.status(400).json({
        error: "Mật khẩu mới không được trùng với mật khẩu cũ",
      });
    }


    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    account.password = hashedNewPassword;
    await account.save();

    resetCodes.delete(normalizedEmail);

    res.status(200).json({
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

module.exports = { accController, forgotPassword, resetPassword };
