class MatchMaker {
	constructor() {
		this.playersWaiting = [];
	}

	async addPlayer(sessionId, params) {
		//Check if player is already waiting
		if(this.playersWaiting.filter(p => p.sessionId === sessionId).length > 0) throw new Error("Already waiting for an opponent");
		//Check first if there is already a good enough player available, TODO: Implement rules for matchmaking
		if(this.playersWaiting.length > 0) return this.playersWaiting.shift().sessionId; //Remove player instantly from array to prevent double booking
		//If not add to playersWaiting
		this.playersWaiting.push({
			sessionId
		})
	}

	removePlayer(sessionId) {
		this.playersWaiting = this.playersWaiting.filter(p => p.sessionId !== sessionId);
	}
}

module.exports = MatchMaker;