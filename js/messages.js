function SocketMessage(user, rule, before, after) {
	this.workerId = user
	this.displayname = user
	this.rule = rule
	this.state_before = before
	this.state_after = after
}