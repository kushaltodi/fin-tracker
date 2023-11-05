const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./database/db");
var users = require("./interface/users");
const { v4: uuidv4 } = require("uuid");

app.use(cors());
app.use(express.json());

//Routes

//Users
app.post("/users", async (req, res) => {
  try {
    const { userName, email, password, name, createdOn } = req.body;
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

app.get("/users", async (req, res) => {
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

app.put("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { userName, email, password, name, createdOn } = req.body;
    const updatedUser = await pool.query(
      `UPDATE public."Users"
          SET  "userName"=$1, email=$2, password=$3, name=$4, "createdOn"=$5
          WHERE "userId"= $6
          RETURNING *; `,
      [userName, email, password, name, createdOn, userId]
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/users/:id", async (req, res) => {
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

//Accounts

//Transactions

app.listen(5000, () => {
  console.log("Server is running on port 5000.");
});
