const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

class REST {
  constructor(components, config) {
    this.playerPool = components.playerPool;
    this.tokenService = components.tokenService;
    this.api = express();
    this.api.use(bodyParser.json());
    this.api.use(cors());
    this.api.post("/join", (req, res) => this.join(req, res));
    this.api.listen(config.port);
    console.log(`Listening on ${config.port}`);
  }

  async join(req, res) {
    try {
      if (!req.body.token) throw new Error("Token not set");
      //Check token
      let userId = await this.tokenService.check(req.body.token);
      //TODO: Check user info
      let sessionId = await this.playerPool.join(userId);
      //Apply in to pool
      res.send({ sessionId });
    } catch (err) {
      console.log(err);
      res.status(400).send(err.message);
    }
  }
}

module.exports = REST;