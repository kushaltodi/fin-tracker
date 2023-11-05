const express = require("express");
const app = express();
const cors = require("cors");

const userRoutes = require('./routes/userRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

app.use(cors());
app.use(express.json());

//Routes

//Users
app.use('/users', userRoutes);

//Accounts
app.use('/accounts', accountRoutes);

//Transactions
app.use('/transactions', transactionRoutes);

app.listen(5000, () => {
  console.log("Server is running on port 5000.");
});
