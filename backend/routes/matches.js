const express = require("express");
const { getMatches } = require("../controllers/matchesController");

const router = express.Router();

router.get("/", getMatches);

module.exports = router;