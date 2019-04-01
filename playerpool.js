const MatchMaker = require("./matchmaker.js");

//TODO: Some kind of garbage collection for sessions that are not activated in X time

class PlayerPool {
  constructor() {
    this.sessions = [];
    this.matchMaker = new MatchMaker();
  }

  join(userId) {
    //TODO: Figure out what to do if user is already in a session
    //If session found and is active throw error
    if(this.sessions.filter(s => s.userId === userId && s.authenticated).length > 0) throw new Error("Active session already exists!");
    //Check if session found but is not active
    let existing = this.sessions.filter(s => s.userId === userId);
    if(existing.length > 0) {
      console.log("Returning existing sessionId");
      return existing[0].sessionId;
    }
    //Create new session
    let newSession = {
      authenticated: false,
      userId,
      sessionId: parseInt(Math.random()*10000000), //TODO: better id
      send: () => {}, //For achieving actual full-duplex connection,
      close: () => {},
      quit: false, //This is used to check if disconnect is on purpose or should we keep waiting for reconnect
      timeout: null, //Used for stopping clean-up timer in case of not reconnecting
    }
    this.sessions.push(newSession);
    console.log(this.sessions);
    return newSession.sessionId;
  }

  async checkSession(sessionId) {
    let found = this.sessions.filter(s => s.sessionId === sessionId && !s.authenticated);
    if(found.length < 1) throw new Error("No joinable sessions found");
    return found[0];
  }

  async handleAction(sessionId, action, params) {
    let session = this.findSession(sessionId);
    switch(action) {
      case "FIND_MATCH":
      this.findMatch(session, params);
      break;
      case "QUIT":
      session.quit = true;
      session.send("Ending session");
      return "DISCONNECT";
      default:
      session.send("Unknown action");
      break;
    }
  }

  async findMatch(session, params) {
    try {
      //Add to match maker and see if there's a player ready
      let oppId = await this.matchMaker.addPlayer(session.sessionId, params);
      console.log("------");
      console.log(oppId);
      if(!oppId) {
        session.send("Waiting for available player...");
        return;
      }
      //Player found, create game and remove both from match maker
      this.matchMaker.removePlayer(session.sessionId);
      session.send("Player found, creating match...");
      let s1 = this.findSession(session.sessionId);
      let s2 = this.findSession(oppId);
      this.createGame(s1, s2);
    } catch (err) {
      session.send(err.message);
    }
  }

  async createGame(s1, s2) {
    //REST to Game Service
    //Dummy gameId
    let gameId = parseInt(Math.random()*100000)
    s1.send(gameId);
    s2.send(gameId);
    s1.quit = true;
    s2.quit = true;
    setTimeout(() => s1.close(), 1000);
    setTimeout(() => s2.close(), 1000);
  }

  async linkSession(sendFunc, closeFunc, sessionId) {
    let session = this.findSession(sessionId);
    session.authenticated = true;
    session.send = sendFunc;
    session.close = closeFunc;
    //If rejoining, lets remove kick timeout
    if(session.timeout) {
      console.log(`${session.sessionId}: reconnected`);
      clearTimeout(session.timeout);
      session.timeout = null;
    }
  }

  findSession(sessionId) {
    let found = this.sessions.filter(s => s.sessionId === sessionId);
    return found[0];
  }

  async sessionDisconnect(sessionId) {
    let session = this.findSession(sessionId);
    //TODO: What about session reconnecting? Maybe queue timeouts?
    if(session.quit) {
      //Purposely quit, clean up connection
      //Remove from matchmaker
      this.matchMaker.removePlayer(session.sessionId);
      this.sessions = this.sessions.filter(s => s !== session);
      console.log(`Kicking session ${session.sessionId}`);
    } else {
      //Maybe connection crashed? Let's make session rejoinable
      //TODO: Remember to read timeout times from config
      session.authenticated = false;
      session.timeout = setTimeout(() => {
        session.quit = true;
        this.sessionDisconnect(session.sessionId);
      }, 20000);
      console.log(`${session.sessionId}: Unexpected disconnect, timeout set`)
    }
  }


}
module.exports = PlayerPool;