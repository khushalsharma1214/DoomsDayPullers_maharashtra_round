const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database/db");

const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: "Name, password, and either email or phone are required"
      });
    }

    if (email && phone) {
      return res.status(400).json({
        success: false,
        message: "Provide either email or phone, not both"
      });
    }

    const existingUser = email
      ? await db.query(
          "SELECT id FROM users WHERE email = $1",
          [email]
        )
      : await db.query(
          "SELECT id FROM users WHERE phone = $1",
          [phone]
        );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `
      INSERT INTO users (
        name,
        email,
        phone,
        password_hash
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, phone, created_at
      `,
      [
        name,
        email || null,
        phone || null,
        passwordHash
      ]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to register user"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or phone and password are required"
      });
    }

    if (email && phone) {
      return res.status(400).json({
        success: false,
        message: "Provide either email or phone, not both"
      });
    }

    const result = email
      ? await db.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        )
      : await db.query(
          "SELECT * FROM users WHERE phone = $1",
          [phone]
        );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        userId: user.id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    res.json({
      success: true,
      message: "Login successful",
      token
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to login"
    });
  }
};

module.exports = {
  register,
  login
};