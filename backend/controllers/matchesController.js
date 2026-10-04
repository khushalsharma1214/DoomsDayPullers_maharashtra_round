const db = require("../database/db");

const getMatches = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM matches ORDER BY match_date ASC"
    );

    res.json({
      success: true,
      matches: result.rows
    });
  } catch (error) {
    console.error("Error fetching matches:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch matches"
    });
  }
};

module.exports = {
  getMatches
};