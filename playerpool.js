const MatchMaker = require("./matchmaker.js");
const WSSManager = require("./wssmanager.js");

const axios = require("axios");

//TODO: Some kind of garbage collection for sessions that are not activated in X time

class PlayerPool extends WSSManager {
  constructor(config) {
    super(config);
    this.matchMaker = new MatchMaker();
  }

  async onAction(msg, session) {
    switch(msg) {
      case "FIND_MATCH":
      this.findMatch(session);
      break;
      case "QUIT":
      session.quit = true;
      session.send("Ending session");
      session.close();
      return "DISCONNECT";
      default:
      session.send("Unknown action");
      break;
    }
  }

  async findMatch(session) {
    try {
      //Add to match maker and see if there's a player ready
      let opp = await this.matchMaker.addPlayer(session);
      if(!opp) {
        session.send("Waiting for available player...");
        return;
      }
      //Player found, create game and remove both from match maker
      this.matchMaker.removePlayer(session.session);
      session.send("Player found, creating match...");
      this.createGame(session, opp);
    } catch (err) {
      session.send(err.message);
    }
  }

  async createGame(s1, s2) {
    //REST to Game Service
    //Dummy gameId
    console.log(s1);
    console.log(s2);
    let res = await axios.post("http://localhost:10004/create", {p1: s1.id, p2: s2.id})
    s1.send(res.data.p1);
    s2.send(res.data.p2);
    s1.quit = true;
    s2.quit = true;
    setTimeout(() => s1.close(), 1000);
    setTimeout(() => s2.close(), 1000);
  }

  async onDisconnect(session) {
    console.log(session.sessionId + " disconnected");
  }

  async onReconnect(session) {
    session.send("RECONNECTED");
  }

  async onDrop(session) {
    console.log(session.sessionId + " dropped unexpectedly!");
  }

  async onConnect(session) {
    session.send("CONNECTED");
  }

  async onError(err, session) {
    console.log(err);
    session.send(err.message);
  }


}
module.exports = PlayerPool;