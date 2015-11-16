function ActivityLogMessage(user, rule_type, rule, before, after, visible_before, visible_after) {
	this.workerId = user
	this.displayname = user
	this.rule_type = rule_type
	this.rule = rule
	this.state_before = before
	this.state_after = after
	this.visible_before = visible_before
	this.visible_after = visible_after
}

function TranslationLogMessage(user, state, visible_state, translation) {
	this.workerId = user
	this.state = state
	this.input = visible_state
	console.log("hmm" + translation)
	this.translation = escapeHTML(translation)
	console.log(this.translation)
}

function unescapeHTML(safe_str) {
	return decodeURI(safe_str).replace(/\\"/g, '"').replace(/\\'/g, "'");
}

function escapeHTML(unsafe_str) {
	return encodeURI(unsafe_str).replace(/\"/g, '\"').replace(/\'/g, '\'');
}

function ListTranslationLogMessage(listTLM) {
	this.listTLM = listTLM
}