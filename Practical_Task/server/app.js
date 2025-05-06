const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
dotenv.config({ path: "./.env" });
const app = express();
const cookieParser = require("cookie-parser");
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.ETHEREAL_USER, 
    pass: process.env.ETHEREAL_PASS, 
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Error with Ethereal config:", error);
  } else {
    console.log("Ethereal is ready to send emails");
  }
});
const generateToken = () => crypto.randomBytes(20).toString("hex");

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // Allowing requests from only this origin
    credentials: true,
  })
);

// DB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/auth_app")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schema for User
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "admin"], required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
});

const User = mongoose.model("User", userSchema);

// Register User/Admi

app.post("/api/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const verificationToken = generateToken();


    const user = new User({
      firstName,
      lastName,
      email,
      password: await bcrypt.hash(password, 10),
      role: role || "customer", 
      isVerified: false,
      verificationToken,
      verificationTokenExpires: Date.now() + 3600000, // 1 hour expiration
    });

    await user.save();

    // Send verification email
    const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: '"Your App" <noreply@example.com>',
      to: email,
      subject: "Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Email Verification</h2>
          <p>Please click the link below to verify your email:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>This link will expire in 1 hour.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res.status(201).json({
      message: "Registration successful! Please check your email.",
      previewUrl: nodemailer.getTestMessageUrl(info),
      success: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Registration failed. Please try again.",
      error: error.message,
    });
  }
});

app.post("/api/verify-email", async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({
      message: "Email verified successfully! You can now log in.",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

//  Login - Admin
app.post("/api/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You are not allowed to login from here" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "Please verify your email first. Check your inbox or request a new verification email.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// Get all customers
app.get("/api/customers", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const customers = await User.find({ role: "customer" }).select(
      "-password -verificationToken"
    ); // Basically when you select -password, it will exclude password from response

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
