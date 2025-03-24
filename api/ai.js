const express = require("express");
const Router = express.Router();
const { autoSignin } = require("./auth");
const pool = require("../model/pool");
const RESPONSE_MESSAGES = require("../utils/responses");

Router.get("/", async (req, res) => {
  autoSignin(req, res, async (userId) => {
    try {
      const connection = pool.promise();
      const [[userInfo]] = await connection.query(
        `SELECT user_id, name, email, is_admin FROM users WHERE user_id = ?`,
        [userId]
      );

      if (!userInfo) {
        const response = RESPONSE_MESSAGES.noUser();
        return res.status(response.status).send(response);
      }

      const term = req.query.term;
      const attempt = req.query.attempt;
      const API_KEY = process.env.AI_API_KEY;

      console.log(term, attempt);

      fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'model': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
          'messages': [
            {
              'role': 'system',
              'content': "You are a supportive mentor for teaching the meaning of financial key terrms. Your job is only to tell the user if they are right and to define the term."
            },
            {
              'role': 'assistant',
              'content': "What is the term " + term + " ?"
            },
            {
              'role': 'user',
              'content': attempt
            }
          ],
          "max_tokens": 1000,
        })
      })
        .then(response => response.json())
        .then(data => {
          console.log(data);
          const result = data["choices"][0]["message"]['content'];

          res.status(200).send({
            success: true,
            status: 200,
            data: {
              response: result
            }
          });

        });
    } catch (err) {
      console.log(err);
      const response = RESPONSE_MESSAGES.error();
      return res.status(response.status).send(response);
    }
  });
});


Router.get("/chat", async (req, res) => {
  autoSignin(req, res, async () => {
    try {

      let chatHistory = req.query.chatHistory;
      if (!!chatHistory) {
        console.log(JSON.stringify(chatHistory));
      }
      else {
        chatHistory = [];
      }
      const API_KEY = process.env.AI_API_KEY;

      fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'model': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
          'messages': [
            {
              'role': 'system',
              'content': "Please act as a financial scammer for me to practice conversing and avoiding scams, until I say stop. Don't reveal that you're a financial scammer, and make it like a realistic text conversation please. Please end with a complete sentence, and sometimes subtly give away signs that it's a scam (for example, have some spelling and capitalization and grammar errors). Be persistent and make it sound urgent too please."
            },
            ...chatHistory,
          ],
        })
      })
        .then(response => response.json())
        .then(data => {
          const result = data["choices"][0]["message"]['content'];

          res.status(200).send({
            success: true,
            status: 200,
            data: {
              response: result
            }
          });

        });
    } catch (err) {
      console.log(err);
      const response = RESPONSE_MESSAGES.error();
      return res.status(response.status).send(response);
    }
  });
});

module.exports = Router;
