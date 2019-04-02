class MatchMaker {
	constructor() {
		this.playersWaiting = [];
	}

	async addPlayer(session) {
		//Check if player is already waiting
		if(this.playersWaiting.filter(p => p.session === session).length > 0) throw new Error("Already waiting for an opponent");
		//Check first if there is already a good enough player available, TODO: Implement rules for matchmaking
		if(this.playersWaiting.length > 0) return this.playersWaiting.shift().session; //Remove player instantly from array to prevent double booking
		//If not add to playersWaiting
		this.playersWaiting.push({
			session
		})
	}

	removePlayer(session) {
		this.playersWaiting = this.playersWaiting.filter(p => p.session !== session);
	}
}

module.exports = MatchMaker;