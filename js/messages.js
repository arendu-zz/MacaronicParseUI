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

var equalLogs = function (log1, log2) {
	console.log("comparing:", log1, "and:", log2)
	if (log2 == null) {
		return false
	} else {
		for (var key in log1) {
			if (log1[key] != log2[key]) {
				console.log("logs are different")
				return false
			}
		}
	}
	console.log("logs are same")
	return true
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