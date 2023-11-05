const express = require("express");
const pool = require("../database/db");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

//create user
router.post("/", async (req, res) => {
  try {
    const { userName, email, password, name } = req.body;
    const createdOn = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const newUser = await pool.query(
      `INSERT INTO public."Users"(
            "userId", "userName", email, password, name, "createdOn")
             VALUES ($1, $2, $3, $4, $5, $6); `,
      [uuidv4(), userName, email, password, name, createdOn]
    );
    res.status(200).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get all users
router.get("/", async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT * FROM public."Users"
        ORDER BY "userId" ASC `
    );
    res.status(200).json(user.rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//get user by id
router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await pool.query(
      `SELECT * FROM public."Users"
        WHERE "userId" = $1 `,
      [userId]
    );
    res.status(200).json(user.rows);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//update user
router.put("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { userName, email, password, name, createdOn } = req.body;
    const updatedUser = await pool.query(
      `UPDATE public."Users"
          SET  "userName"=$1, email=$2, password=$3, name=$4
          WHERE "userId"= $5
          RETURNING *; `,
      [userName, email, password, name, userId]
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//delete user
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await pool.query(
      `DELETE FROM public."Users"
              WHERE "userId"= $1
              RETURNING *; `,
      [userId]
    );
    res.status(200).json(deletedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
