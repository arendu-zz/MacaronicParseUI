/**
 * Created by arenduchintala on 1/13/16.
 */



function TranslationAttempt(wo) {
	var self = this
	this.max_points = 0.0
	this.wo = wo
	this.view = null
	this.isCorrect = null

	this.get_view = function () {
		if (this.view == null) {
			this.view = document.createElement('input')
			$(this.view).addClass("translationAttempt")
			$(this.view).focusout(function () {
				console.log("focusout...")
				var some_guess_exits = false
				self.max_points = 0.0
				_.each(self.wo.wrapper.options, function (other_wo, k) {
					if (other_wo.allowNewAttempts) {
						self.max_points += 1
					}
					if (other_wo.getEnabledAttemptBox() != null && other_wo.getEnabledAttemptBox().val() != "") {
						some_guess_exits = true
					}
				})
				console.log("l2_node.s:", self.wo.l2_node.s, "max_points:", self.max_points)
				$(self.wo.l2_node.get_view().textSpan).removeClass("guessing")
				if (some_guess_exits) {
					//$(self.wo.wrapper.get_view().submit_guess).prop('disabled', false)
					self.wo.wrapper.enable_submit_guess()
				}

			})

			$(this.view).focusin(function () {
				$(self.wo.l2_node.get_view().textSpan).addClass("guessing")
			})
			return this.view
		} else {
			return this.view
		}
	}

	this.update_max_points = function () {
		self.max_points = 0.0
		_.each(self.wo.wrapper.options, function (other_wo, k) {
			if (other_wo.allowNewAttempts) {
				self.max_points += 1
			}
		})
		console.log("updated max points:", wo.l2_node.s, self.max_points)
	}

	this.val = function () {
		return $(this.get_view()).val().trim()
	}

	this.disable = function () {
		$(this.get_view()).prop('disabled', true)
	}
}

function WordOption(id, l2_node, l1_translations, wrapper) {
	var self = this
	this.id = id
	this.l2_node = l2_node
	this.l1_translation = l1_translations
	this.score = 0.0
	this.view = null
	this.attempts = []
	this.allowNewAttempts = true
	this.wrapper = wrapper

	this.get_view = function () {
		if (this.view == null) {
			this.view = document.createElement('div')
			$(this.view).width(this.l2_node.get_view_position().width)
			$(this.view).addClass('wordOption')
			this.view.prompt = document.createElement('span')
			//$(this.view.prompt).addClass('wordOption prompt')
			//$(this.view.prompt).text(this.l2_node.s)
			//$(this.view).append($(this.view.prompt))
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

	this.update_max_points = function () {
		var e_attempt = self.getEnabledAttemptBox()
		if (e_attempt != null) {
			e_attempt.update_max_points()
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

	this.guess_correctness = function (attempt) {
		var acceptance = 0.0
		var guess_phrase = attempt.val().split(" ")
		_.each(attempt.wo.l1_translation, function (l1_word) {
			_.each(guess_phrase, function (guess_word) {
				if (guess_word.toLowerCase() == l1_word.toLowerCase()) {
					acceptance += (1.0 / guess_phrase.length )
				} else if (stemmer(guess_word.toLowerCase()) == stemmer(l1_word.toLowerCase())) {
					acceptance += (0.5 / guess_phrase.length )
				} else {

				}
			})
		})
		return acceptance
	}

	this.computeScore = function () {
		var maxscore_attempt = new TranslationAttempt(self)
		_.each(self.attempts, function (t_attempt) {
			var correctness = self.guess_correctness(t_attempt)
			maxscore_attempt = t_attempt.max_points * correctness > maxscore_attempt.max_points ? t_attempt : maxscore_attempt
		})
		self.set_score(maxscore_attempt.max_points)
		$(maxscore_attempt.view).addClass('correct')
		return maxscore_attempt.max_points
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
			//console.log(t_attempt.val(), 'is now disabled....')
			t_attempt.disable()

		})
	}

	this.addAttempt = function (reveal) {
		//console.log('in add attempt')
		var attemptsSoFar = _.map(self.attempts, function (attemptInput) {
			return  attemptInput.val()
		})

		var hasBeenAttempted = !(attemptsSoFar.indexOf("") >= 0)
		//var hasCorrectAttempt = false
		/*_.each(self.attempts, function (attemptInput) {
			if (attemptInput.val().toLowerCase() == self.l1_translation.toLowerCase()) {
				hasCorrectAttempt = true
				$(attemptInput.view).addClass('correct')
				self.allowNewAttempts = false
			}
		})*/
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
			//console.log(self.l2_node.s, "has been clicked")
			self.disablePreviousAttempts()
		}
	}

}

function WordOptionWrapper(l2_sentence) {
	var self = this
	this.view = null
	this.l2_sentence = l2_sentence
	this.options = {}
	this.total_score = null

	this.get_view = function () {
		if (this.view == null) {
			this.view = document.createElement('div')
			this.view.optionContainer = document.createElement('div')
			$(this.view.optionContainer).addClass('wordOptionContainer')
			$(this.view).append($(this.view.optionContainer))
			this.view.submit_guess = document.createElement('button')
			//$(this.view.submit_guess).text('Submit Guess')
			this.view.submit_guess = document.createElement('button')
			$(this.view.submit_guess).text('Submit Guess')
			$(this.view).append($(this.view.submit_guess))
			$(this.view.submit_guess).click(this.submit_guess)
			$(this.view.submit_guess).prop('disabled', true)

			this.view.get_clue = document.createElement('button')
			$(this.view.get_clue).text('Get Clue')
			$(this.view).append($(this.view.get_clue))
			$(this.view.get_clue).click(this.get_clue)
			$(this.view.get_clue).prop('disabled', false)

			this.view.calculateScore = document.createElement('button')
			$(this.view.calculateScore).text('Calculate Score')
			$(this.view.calculateScore).prop('disabled', true)
			$(this.view).append($(this.view.calculateScore))
			$(this.view.calculateScore).click(this.computeScores)
			this.view.totalScore = document.createElement('span')
			$(this.view.totalScore).hide()
			$(this.view).append($(this.view.totalScore))
			return this.view
		} else {
			return this.view
		}
	}

	this.computeScores = function () {
		self.total_score = 0.0
		_.each(self.options, function (wo, k) {
			wo.disablePreviousAttempts()
			self.total_score += wo.computeScore()
		})
		$(self.get_view().totalScore).text(self.total_score)
		$(self.get_view().totalScore).show()

	}

	this.get_clue = function () {
		self.l2_sentence.get_clue()
		$(self.view.submit_guess).prop('disabled', true)
	}
	this.submit_guess = function () {
		var correct_nodes = _.filter(self.get_correct_attempt_nodes(), function (cn) {
			return cn.visible
		})
		self.disable_submit_guess()
		self.l2_sentence.submit_guess(correct_nodes)
	}

	this.stopClues = function () {
		console.log("in stop clues...")
		$(this.view.submit_guess).prop('disabled', true)
		$(this.view.get_clue).prop('disabled', true)
		$(this.view.calculateScore).prop('disabled', false)
	}

	this.get_correct_attempt_nodes = function () {
		var correct_nodes = []
		_.each(self.options, function (wo, k) {
			_.each(wo.attempts, function (attempt) {
				var correctness = wo.guess_correctness(attempt)
				if (correctness == 1.0) {
					attempt.isCorrect = true
					wo.allowNewAttempts = false
					$(attempt.get_view()).addClass('correct')
					correct_nodes.push(wo.l2_node)
				}
			})
		})
		return correct_nodes
	}

	this.enable_submit_guess = function () {
		$(this.view.submit_guess).prop('disabled', false)
		$(this.view.get_clue).prop('disabled', true)
	}
	this.disable_submit_guess = function () {
		$(this.view.submit_guess).prop('disabled', true)
		$(this.view.get_clue).prop('disabled', false)
	}

	this.enable_get_clue = function () {
		$(this.view.get_clue).prop('disabled', false)
		$(this.view.submit_guess).prop('disabled', true)
	}
	this.disable_get_clue = function () {
		$(this.view.get_clue).prop('disabled', true)
		$(this.view.submit_guess).prop('disabled', false)
	}

	this.update_max_points = function () {
		_.each(self.options, function (wo, k) {
			wo.update_max_points()
		})
	}

	this.check_for_completion = function () {
		var l2_words_remaining = 0
		var punct = ['-', ',', '?', '.', ':', '!']
		_.each(self.l2_sentence.visible_nodes, function (vn) {
			if (vn.lang == 'de' && punct.indexOf(vn.s) == -1) {
				l2_words_remaining += 1
			}
		})
		if (l2_words_remaining == 0) {
			self.l2_sentence.stopClues = true
			self.stopClues()
		}
	}
	this.setOptionsByOrder = function (l2_remaining) {
		_.each(l2_remaining, function (l2, wo_id) {
			//console.log(l2)
			var idx = l2.position
			var wo = self.options[l2.wo_id]
			$(wo.get_view()).css('order', idx)
			var r = wo.getEnabledAttemptBox()
			if (r === null) {

			} else {
				wo.getEnabledAttemptBox().view.tabIndex = parseInt(idx) + 1
			}

		})
	}

	this.update_attemptability = function () {
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
		_.each(self.options, function (wo, k) {
			wo.allowNewAttempts = (newOrder.indexOf(k) >= 0) && wo.allowNewAttempts
			wo.addAttempt()
		})

		self.setOptionsByOrder(l2_remaining)
	}

	this.reveal_correct_guesses = function () {
		self.update_attemptability()
	}

	this.initialOptions = function () {
		var l2_remaining = []
		var current_idx = 0
		_.each(self.l2_sentence.visible_nodes, function (n) {
			if (n.lang == 'de' && ['-', ',', '?', '.', ':', '!'].indexOf(n.s) < 0) {
				var modified_nodes = n.graph.translate_from(n, 'en')
				var wo_id = n.graph.id + "," + n.id
				var l1_translations = _.map(modified_nodes.addStr, function (a) {
					return a.token
				})
				var wo = new WordOption(wo_id, n, l1_translations, self)
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