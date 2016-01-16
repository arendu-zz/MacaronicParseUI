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

	this.computeScore = function () {
		var maxscore = 0.0
		_.each(self.attempts, function (t_attempt) {
			console.log("comparing:", t_attempt.val().toLowerCase(), t_attempt.wo.l1_translation.toLowerCase())
			if (t_attempt.val().toLowerCase() == t_attempt.wo.l1_translation.toLowerCase()) {

				maxscore = t_attempt.max_points > maxscore ? t_attempt.max_points : maxscore
			}
		})
		self.set_score(maxscore)
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
			this.view.calculateScore = document.createElement('button')
			$(this.view.calculateScore).text('Calculate Score')
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

	this.setOptionsByOrder = function (newOrder) {
		_.each(newOrder, function (no_id) {
			var idx = newOrder.indexOf(no_id)
			var wo = self.options[no_id]
			$(wo.get_view()).css('order', idx)

		})
	}

	this.updateOptions = function () {
		var newOrder = []
		_.each(self.l2_sentence.visible_nodes, function (n) {
			if (n.lang == 'de' && ['-', ',', '?', '.', ':', '!'].indexOf(n.s) < 0) {
				//console.log('in here...')
				var wo_id = n.graph.id + "," + n.id
				newOrder.push(wo_id)
			}
		})

		self.setOptionsByOrder(newOrder)
		console.log("new order:", newOrder)
		_.each(self.options, function (wo, k) {
			wo.allowNewAttempts = (newOrder.indexOf(k) >= 0)
			console.log(wo.l2_word, wo.id, k, "in new order?", newOrder.indexOf(k))
			console.log(wo.l2_word, wo.id, k, "has been clicked?", newOrder.indexOf(k))
			wo.addAttempt()
		})

	}

	this.initialOptions = function () {
		//self.l2_sentence.sort_visible_nodes_by_display_order()
		var newOrder = []
		_.each(self.l2_sentence.visible_nodes, function (n) {
			if (n.lang == 'de' && ['-', ',', '?', '.', ':', '!'].indexOf(n.s) < 0) {
				var modified_nodes = n.graph.translate_from(n, 'en')
				var wo_id = n.graph.id + "," + n.id
				var l1_translations = _.map(modified_nodes.addStr, function (a) {
					return a.token
				})
				var wo = new WordOption(wo_id, n.s, l1_translations, self)
				self.options[wo_id] = wo
				newOrder.push(wo_id)
			}
		})

		_.each(self.options, function (wo, k) {
			$(self.get_view().optionContainer).append(wo.get_view())
		})

		self.setOptionsByOrder(newOrder)
	}

}