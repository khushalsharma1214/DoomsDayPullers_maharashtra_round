const express = require("express");
const { createUser } = require("../controllers/usersController");

const router = express.Router();

router.post("/", createUser);

module.exports = router;