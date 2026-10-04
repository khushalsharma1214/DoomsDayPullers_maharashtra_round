const db = require("../database/db");

const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required"
      });
    }

    const result = await db.query(
      `INSERT INTO users (name, email)
       VALUES ($1, $2)
       RETURNING *`,
      [name, email]
    );

    res.status(201).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating user:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create user"
    });
  }
};

module.exports = {
  createUser
};