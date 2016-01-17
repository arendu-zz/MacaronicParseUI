/**
 * Created by arenduchintala on 1/13/16.
 */



function TranslationAttempt(wo) {
	var self = this
	this.max_points = 0.0
	this.wo = wo
	this.view = null

	this.get_view = function () {
		if (this.view == null) {
			this.view = document.createElement('input')
			this.view.size = self.wo.l2_word.length
			$(this.view).focusout(function () {
				console.log("focusout...")
				self.max_points = 0.0
				_.each(self.wo.wrapper.options, function (other_wo, k) {
					if (other_wo.allowNewAttempts) {
						self.max_points += 1
					}
				})
				console.log("l2_word:", self.wo.l2_word, "max_points:", self.max_points)
			})
			return this.view
		} else {
			return this.view
		}
	}

	this.val = function () {
		return $(this.get_view()).val().trim()
	}

	this.disable = function () {
		$(this.get_view()).prop('disabled', true)
	}
}

function WordOption(id, l2_word, l1_translations, wrapper) {
	var self = this
	this.id = id
	this.l2_word = l2_word
	this.l1_translation = l1_translations.join([separator = " "])
	this.score = 0.0
	this.view = null
	this.attempts = []
	this.allowNewAttempts = true
	this.wrapper = wrapper

	this.get_view = function () {
		if (this.view == null) {
			this.view = document.createElement('div')
			$(this.view).addClass('wordOption')
			this.view.prompt = document.createElement('span')

			$(this.view.prompt).addClass('wordOption prompt')
			$(this.view.prompt).text(this.l2_word)

			$(this.view).append($(this.view.prompt))
			this.view.attemptContainer = document.createElement('div')
			$(this.view.attemptContainer).addClass('wordOptionAttemptContainer')
			$(this.view).append($(this.view.attemptContainer))
			//Adding the input field for the first attempt
			var translationAttempt = new TranslationAttempt(self)
			$(this.view.attemptContainer).append($(translationAttempt.get_view()))
			self.attempts.push(translationAttempt)

			return this.view
		} else {
			return this.view
		}
	}

	this.getEnabledAttemptBox = function () {
		var r = null
		_.each(self.attempts, function (t) {
			if (!$(t.view).prop('disabled')) {
				r = t
			} else {
				console.log($(t.view).val(), "is disabled!!")
			}
		})
		return r
	}

	this.computeScore = function () {
		var maxscore_attempt = new TranslationAttempt(self)
		_.each(self.attempts, function (t_attempt) {
			console.log("comparing:", t_attempt.val().toLowerCase(), t_attempt.wo.l1_translation.toLowerCase())
			if (t_attempt.val().toLowerCase() == t_attempt.wo.l1_translation.toLowerCase()) {

				maxscore_attempt = t_attempt.max_points > maxscore_attempt.max_points ? t_attempt : maxscore_attempt
			}
		})
		self.set_score(maxscore_attempt.max_points)
		$(maxscore_attempt.view).addClass('correct')
	}

	this.set_score = function (score) {
		this.score = score
		this.view.promptScore = document.createElement('span')
		$(this.view.promptScore).addClass('wordOption score')
		$(this.view.promptScore).text(score)
		$(this.view).append($(this.view.promptScore))
	}

	this.disablePreviousAttempts = function () {
		_.each(self.attempts, function (t_attempt) {
			console.log(t_attempt.val(), 'is now disabled....')
			t_attempt.disable()

		})
	}

	this.addAttempt = function () {
		console.log('in add attempt')
		var attemptsSoFar = _.map(self.attempts, function (attemptInput) {
			return  attemptInput.val()
		})

		var hasBeenAttempted = !(attemptsSoFar.indexOf("") >= 0)
		console.log(self.l2_word, "previous attempts?", attemptsSoFar, attemptsSoFar.indexOf(""))
		console.log(self.l2_word, "has previously been attempted?", hasBeenAttempted)
		console.log(self.l2_word, "allow new attempts?", self.allowNewAttempts)
		if (self.allowNewAttempts) {
			if (!hasBeenAttempted) {
				console.log("skippppp...")
			} else {
				self.disablePreviousAttempts()
				var translationAttempt = new TranslationAttempt(self)
				$(self.get_view().attemptContainer).append($(translationAttempt.get_view()))
				self.attempts.push(translationAttempt)
			}

		} else {
			console.log(self.l2_word, "has been clicked")
			self.disablePreviousAttempts()
		}
	}

}

function WordOptionWrapper(l2_sentence) {
	var self = this
	this.view = null
	this.l2_sentence = l2_sentence
	this.options = {}

	this.get_view = function () {
		if (this.view == null) {
			this.view = document.createElement('div')
			this.view.optionContainer = document.createElement('div')
			$(this.view.optionContainer).addClass('wordOptionContainer')
			$(this.view).append($(this.view.optionContainer))
			this.view.getClue = document.createElement('button')
			$(this.view.getClue).text('Get Clue')
			$(this.view).append($(this.view.getClue))
			$(this.view.getClue).click(this.getClue)
			this.view.calculateScore = document.createElement('button')
			$(this.view.calculateScore).text('Calculate Score')
			$(this.view.calculateScore).prop('disabled', true)
			$(this.view).append($(this.view.calculateScore))
			$(this.view.calculateScore).click(this.computeScores)
			return this.view
		} else {
			return this.view
		}
	}

	this.computeScores = function () {
		_.each(self.options, function (wo, k) {
			wo.disablePreviousAttempts()
			wo.computeScore()
		})
	}

	this.getClue = function () {
		//console.log("in get clue wo")
		$(self.view.getClue).prop('disabled', true)
		setTimeout(function () {
			$(self.view.getClue).prop('disabled', false)
		}, 500)
		self.l2_sentence.getClue()
	}

	this.stopClues = function () {
		$(this.view.getClue).prop('disabled', true)
		$(this.view.calculateScore).prop('disabled', false)
	}

	this.setOptionsByOrder = function (l2_remaining) {
		_.each(l2_remaining, function (l2, wo_id) {
			console.log(l2)
			var idx = l2.position
			var wo = self.options[l2.wo_id]
			$(wo.get_view()).css('order', idx)
			var r = wo.getEnabledAttemptBox()
			wo.getEnabledAttemptBox().view.tabIndex = parseInt(idx) + 1

		})
	}

	this.updateOptions = function () {
		/*var newOrder = []
		_.each(self.l2_sentence.visible_nodes, function (n) {
			if (n.lang == 'de' && ['-', ',', '?', '.', ':', '!'].indexOf(n.s) < 0) {
				//console.log('in here...')
				var wo_id = n.graph.id + "," + n.id
				newOrder.push(wo_id)
			}
		})*/

		var l2_remaining = []
		var newOrder = []
		var current_idx = 0
		_.each(self.l2_sentence.visible_nodes, function (n) {
			if (n.lang == 'de' && ['-', ',', '?', '.', ':', '!'].indexOf(n.s) < 0) {
				var wo_id = n.graph.id + "," + n.id
				l2_remaining.push({wo_id: wo_id, position: current_idx})
				newOrder.push(wo_id)
			}
			current_idx += 1
		})

		//console.log("new order:", newOrder)
		_.each(self.options, function (wo, k) {
			wo.allowNewAttempts = (newOrder.indexOf(k) >= 0)
			//console.log(wo.l2_word, wo.id, k, "in new order?", newOrder.indexOf(k))
			//console.log(wo.l2_word, wo.id, k, "has been clicked?", newOrder.indexOf(k))
			wo.addAttempt()
		})

		self.setOptionsByOrder(l2_remaining)

	}

	this.initialOptions = function () {
		//self.l2_sentence.sort_visible_nodes_by_display_order()
		var l2_remaining = []
		var current_idx = 0
		_.each(self.l2_sentence.visible_nodes, function (n) {
			if (n.lang == 'de' && ['-', ',', '?', '.', ':', '!'].indexOf(n.s) < 0) {
				var modified_nodes = n.graph.translate_from(n, 'en')
				var wo_id = n.graph.id + "," + n.id
				var l1_translations = _.map(modified_nodes.addStr, function (a) {
					return a.token
				})
				var wo = new WordOption(wo_id, n.s, l1_translations, self)
				self.options[wo_id] = wo
				l2_remaining.push({wo_id: wo_id, position: current_idx})
			}
			current_idx += 1
		})

		_.each(self.options, function (wo, k) {
			$(self.get_view().optionContainer).append(wo.get_view())
		})

		self.setOptionsByOrder(l2_remaining)
	}

}