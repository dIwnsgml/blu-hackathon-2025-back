const express = require("express");
const Router = express.Router();
const { autoSignin } = require("./auth");
const pool = require("../model/pool");
const RESPONSE_MESSAGES = require("../utils/responses");
const { generateRandomId } = require("../utils/tools");

Router.get("/", async (req, res) => {
  autoSignin(req, res, async (userId) => {
    try {
    } catch (err) {
      console.log(err);
      const response = RESPONSE_MESSAGES.error();
      return res.status(response.status).send(response);
    }
  });
});

Router.put("/", async (req, res) => {
  autoSignin(req, res, async (userId) => {
    try {
      const { name, balance, goal, saved, monthly_amount, goal_date } =
        req.body;

      if (!name || !goal || !goal_date) {
        return res.status(400).send({ message: "Missing required fields" });
      }

      const connection = pool.promise();

      const finance_id = generateRandomId();

      await connection.query(
        `INSERT INTO finances (id, name, balance, goal, saved, monthly_amount, goal_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [finance_id, name, balance, goal, saved, monthly_amount, goal_date]
      );

      const newFinance = {
        name,
        balance,
        goal,
        saved,
        monthly_amount,
        goal_date,
        finance_id,
      };

      return res
        .status(201)
        .send({
          message: "Finance info added successfully",
          success: true,
          code: 200,
          data: { finance: newFinance },
        });
    } catch (err) {
      console.log(err);
      const response = RESPONSE_MESSAGES.error();
      return res.status(response.status).send(response);
    }
  });
});
