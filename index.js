const REST = require("./rest.js");
const config = require("./config.json");
const PlayerPool = require("./playerpool.js");
const TokenService = require("./tokenservice.js");
const WSServer = require("./wsserver.js");


class MMService {
    constructor() {
        this.init();
    }

    async init() {
        this.playerPool = new PlayerPool();
        this.wsServer = new WSServer(this.playerPool, config.ws);
        this.tokenService = new TokenService(config.tokenService);
        this.rest = new REST({userDB: this.userDB, tokenService: this.tokenService, playerPool: this.playerPool}, config.rest);
    }
}

new MMService();