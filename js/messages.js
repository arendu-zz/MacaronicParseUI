function ActivityLogMessage(user, sentence_id, ui_version, rule_type, rule, before, after, visible_before, visible_after) {
	this.username = user
	this.sentence_id = parseInt(sentence_id)
	this.ui_version = ui_version
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

function TranslationLogMessage(user, ui_version, sentence_id, state, visible_state, translation) {
	this.username = user
	this.ui_version = ui_version
	this.sentence_id = sentence_id
	this.state = state
	this.input = visible_state
	this.translation = escapeHTML(translation)
}
function CompletedTaskMessage(username, sentences_completed, ui_version, progress, points_earned, hitId, assignment_id, low_scores) {
	this.username = username
	this.sentences_completed = sentences_completed
	this.ui_version = ui_version
	this.points_earned = points_earned
	this.progress = progress
	this.hitId = hitId
	this.assignment_id = assignment_id
	this.low_scores = low_scores
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
