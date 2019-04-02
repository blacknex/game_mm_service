const WebSocket = require("ws");

//TODO: WSServer on different service?
//TODO: Secure Websockets!!!
//TODO: Session handler to kick out inactive connections
//TODO: Less harsh way to punish wrong actions

class WSServer {
	constructor(playerPool, config) {
		this.playerPool = playerPool;
		this.wss = new WebSocket.Server(config);
		this.listen();
		this.wsArray = [];
		this.wsLink = [];
		console.log(`Websocket listening on ${config.port}`);
		this.newConnection = this.newConnection.bind(this);
	}

	async listen() {
		this.wss.on("connection", ws => this.newConnection(ws));
	}

	async newConnection(ws) {
		let sessionId = null;
		ws.on('message', async message => {
			console.log(sessionId);
			try {
				//Verify that packet is a JSON
				let packet = JSON.parse(message);
				if(sessionId !== null) {
					//Connection already established and authenticated -> Pass to playerPool
					if(!packet.action) throw new Error("No action specified");
					let res = await this.playerPool.handleAction(sessionId, packet.action, packet.params);
					//Check if client wants to quit 
					if(res === "DISCONNECT") {
						ws.close();
					}
					return;
				}
				//Connection not yet authenticated
				if(!packet.sessionId) throw new Error("Session not specified");
				//Check if session is available to authenticate (throws error if already authenticated)
				await this.playerPool.checkSession(packet.sessionId);
				//Push connection to connection array
				sessionId = packet.sessionId;
				this.playerPool.linkSession(msg => ws.send(msg), () => ws.close(), packet.sessionId);
				ws.send("Joined successfully!");
			} catch (err) {
				ws.send(err.message);
				setTimeout(() => ws.close(), 500);
			}
		})
		ws.on('close', () => {
			this.cleanConnection(sessionId);
		})
	}

	async cleanConnection(sessionId) {
		if(!sessionId) return;
		await this.playerPool.sessionDisconnect(sessionId);
	}
}


module.exports = WSServer;