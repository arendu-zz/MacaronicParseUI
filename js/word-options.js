/**
 * Created by arenduchintala on 1/13/16.
 */


//var punct = ['-', ',', '?', '.', ':', '!']
//var punct = []
function TranslationAttempt(wo) {
	var self = this
	this.max_points = 0.0
	this.wo = wo
	this.view = null
	this.isCorrect = false
	this.after_reveal = false

	this.get_correctness_score = function () {
		var acceptance = 0.0
		var guess_phrase = self.val().split(" ")
		_.each(self.wo.l1_translation, function (l1_word) {
			_.each(guess_phrase, function (guess_word) {
				if (guess_word.toLowerCase() == l1_word.toLowerCase()) {
					acceptance += (1.0 / guess_phrase.length )
				} else if (stemmer(guess_word.toLowerCase()) == stemmer(l1_word.toLowerCase())) {
					acceptance += (1.0 / guess_phrase.length )
				} else {

				}
			})
		})
		return acceptance
	}

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
					if (other_wo.get_enabled_attempt() != null && other_wo.get_enabled_attempt().val() != "") {
						some_guess_exits = true
					}
				})
				//console.log("l2_node.s:", self.wo.l2_node.s, "max_points:", self.max_points)
				self.removeGuessingClass()
				if (some_guess_exits) {
					//$(self.wo.wrapper.get_view().submit_guess).prop('disabled', false)
					self.wo.wrapper.enable_submit_guess()
				}

			})

			$(this.view).focusin(function () {
				self.addGuessingClass()
			})

			$(this.view).on('mouseenter', function () {
				self.addGuessingClass()

			})
			$(this.view).on('mouseleave', function () {
				self.removeGuessingClass()
			})

			$(this.view).keyup(function () {
				updateMessageBox("Once you make guesses, click 'Submit Guess'<br>")
			})
			return this.view
		} else {
			return this.view
		}
	}

	this.addGuessingClass = function () {
		_.each(self.wo.wrapper.l2_sentence.visible_nodes, function (vn) {
			$(vn.get_view().textSpan).removeClass('guessing')
		})
		if (self.wo.l2_node.visible) {
			$(self.wo.l2_node.get_view().textSpan).addClass("guessing")
		} else {
			_.each(self.wo.l2_node.graph.get_visible_nodes(), function (l2_vn) {
				$(l2_vn.get_view().textSpan).addClass("guessing")
			})
		}
	}
	this.removeGuessingClass = function () {
		if (self.wo.l2_node.visible) {
			$(self.wo.l2_node.get_view().textSpan).removeClass("guessing")
		} else {
			_.each(self.wo.l2_node.graph.get_visible_nodes(), function (l2_vn) {
				$(l2_vn.get_view().textSpan).removeClass("guessing")
			})
		}
	}

	this.fadeIn_new_attempt = function () {
		//$(self.view).css("backgroundColor", "#FFFF00");
		if (self.after_reveal) {
			//$(self.view).animate({ backgroundColor: "transparent" }, 800);
			//$(self.view).css("background", "transparent");
			//$(self.view).css("background", "lightblue");
			$(self.view).addClass('revealed')
			//$(self.view).animate({ backgroundColor: "#ADD8E6" }, 100);
		} else {
			//$(self.view).animate({ backgroundColor: "transparent" }, 100);
		}

	}

	this.update_max_points = function () {
		self.max_points = 0.0
		_.each(self.wo.wrapper.options, function (other_wo, k) {
			if (other_wo.allowNewAttempts) {
				self.max_points += 1
			}
		})
		//console.log("updated max points:", wo.l2_node.s, self.max_points)
	}

	this.val = function () {
		return $(this.get_view()).val().trim()
	}

	this.set_val = function (txt) {
		$(this.get_view()).val(txt)
	}

	this.disable = function () {
		this.get_view().tabIndex = parseInt(-1)
		$(this.get_view()).prop('readOnly', true)
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
	this.reveal = false
	this.wrapper = wrapper

	this.get_summary = function () {
		var WordGuess = {}
		WordGuess.guess = self.get_enabled_attempt().val()
		WordGuess.revealed = self.reveal
		WordGuess.l2_node_id = self.l2_node.id
		WordGuess.l2_node_graph_id = self.l2_node.graph.id
		WordGuess.l2_string = self.l2_node.s
		WordGuess.position = parseInt($(self.get_view()).css('order'))
		return WordGuess
	}

	this.get_view = function () {
		if (this.view == null) {
			this.view = document.createElement('div')
			$(this.view).width(this.l2_node.get_view_position().width * 1)
			$(this.view).addClass('wordOption')
			this.view.prompt = document.createElement('span')
			$(this.view.prompt).addClass('wordOption prompt')
			$(this.view.prompt).text(this.l2_node.s)
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

	this.update_max_points = function () {
		var e_attempt = self.get_enabled_attempt()
		if (e_attempt != null) {
			e_attempt.update_max_points()
		}
	}

	this.get_enabled_attempt = function () {
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
		var score = 0.0
		_.each(self.attempts, function (a) {
			if (a.isCorrect && !a.after_reveal) {
				score += 1
			}
		})
		return score
	}
	this.reveal_correct = function () {
		_.each(self.attempts, function (a) {
			$(a.view).removeClass('correct')
			$(a.view).removeClass('incorrect')

			if (a.isCorrect) {
				$(a.view).addClass('correct')
			} else {
				$(a.view).addClass('incorrect')
			}

			if (a.after_reveal) {
				$(a.view).removeClass('correct')
				$(a.view).removeClass('incorrect')
				$(a.view).addClass('revealed')
			}
		})
	}
	this.set_score = function (score) {
		this.score = score
		this.view.promptScore = document.createElement('span')
		$(this.view.promptScore).addClass('wordOption score')
		$(this.view.promptScore).text(score)
		$(this.view).append($(this.view.promptScore))
	}

	this.disable_attempts = function (keep_last) {
		var keep_last = keep_last || false
		var disable_list = []
		if (keep_last) {
			disable_list = self.attempts.slice(0, self.attempts.length)
		} else {
			disable_list = self.attempts.slice(0, self.attempts.length + 1)
		}
		_.each(disable_list, function (t_attempt) {
			//console.log(t_attempt.val(), 'is now disabled....')
			t_attempt.disable()
			//$(t_attempt.view).hide()

		})
	}
	this.set_correctness = function () {
		_.each(self.attempts, function (a) {

			a.isCorrect = a.get_correctness_score() == 1.0

		})
	}

	this.add_attempt = function () {
		var previous_txt = null
		if (self.reveal) {
			previous_txt = self.l1_translation.join(separator = [" "])
		} else {
			previous_txt = self.get_enabled_attempt().val()
		}

		self.disable_attempts()
		self.set_correctness()
		var translationAttempt = new TranslationAttempt(self)
		$(self.get_view().attemptContainer).append($(translationAttempt.get_view()))

		self.attempts.push(translationAttempt)
		translationAttempt.set_val(previous_txt)
		translationAttempt.after_reveal = self.reveal

		translationAttempt.fadeIn_new_attempt()
		if (!self.allowNewAttempts) {
			self.disable_attempts()
			self.set_correctness()
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
			$(this.view).addClass('wordOptionContainer-Container')
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
			$(this.view.get_clue).hide()

			this.view.calculateScore = document.createElement('button')
			$(this.view.calculateScore).text('Calculate Score')
			$(this.view.calculateScore).prop('disabled', true)
			$(this.view).append($(this.view.calculateScore))
			$(this.view.calculateScore).click(this.computeScores)
			this.view.totalScore = document.createElement('span')
			$(this.view.totalScore).addClass("totalScore")
			$(this.view.totalScore).hide()
			$(this.view).append($(this.view.totalScore))
			return this.view
		} else {
			return this.view
		}
	}

	this.computeScores = function () {
		self.reveal_correct()
		self.total_score = 0.0
		_.each(self.options, function (wo, k) {
			wo.disable_attempts()
			self.total_score += wo.computeScore()
		})
		$(self.get_view().totalScore).text(self.total_score)
		$(self.get_view().totalScore).show()
		self.l2_sentence.points_earned = 0
		self.l2_sentence.points_bonus = self.total_score
		$(self.view.calculateScore).prop('disabled', true)
		$(self.view.submit_guess).prop('disabled', true)
		enable_submit()

	}

	this.reveal_correct = function () {
		_.each(self.options, function (wo, k) {
			wo.reveal_correct()
		})
	}

	this.get_punct_clues = function () {
		var single_punct_nodes = []
		_.each(self.l2_sentence.visible_nodes, function (vn) {
			var gvns = vn.graph.get_visible_nodes()
			if (vn.lang == 'de' && gvns.length == 1 && ['-', ',', '?', '.', ':', '!'].indexOf(vn.s) >= 0) {
				single_punct_nodes.push({action: true, node: vn, delay: 10})
			} else {
				console.log(vn.s, gvns.length)
			}
		})
		if (single_punct_nodes.length > 0) {
			self.l2_sentence.get_clue(single_punct_nodes)
		}

	}

	this.submit_guess = function () {
		self.disable_submit_guess()
		/*self.l2_sentence.submit_guess(correct_nodes)*/
		if (socket) {
			var guess_state = JSON.stringify(self.guess_state())
			var sentence_state = JSON.stringify(self.l2_sentence.get_full_representation())
			var sentence_visible = self.l2_sentence.get_visible_string()
			//var guess_message = new GuessLogMessage(username, self.l2_sentence.id, ui_version, revealCorrectInstantly, !ignoreReorder, "tmp", "tmp", "tmp")
			var gm = new GuessLogMessage(username, self.l2_sentence.id, ui_version, revealCorrectInstantly, !ignoreReorder, guess_state, sentence_state, sentence_visible)
			socket.emit('logGuesses', gm)
		} else {

		}

		$(self.view.submit_guess).prop('disabled', true)
		self.l2_sentence.get_clue()

	}

	this.guess_state = function () {
		var state = {}
		state.showReorder = !ignoreReorder
		state.instantFeedBack = revealCorrectInstantly
		var sentence_guess = []

		_.each(self.options, function (wo, k) {
			var word_guess = wo.get_summary()
			sentence_guess.push(word_guess)
		})
		state.sentenceGuess = sentence_guess
		return state
	}

	this.stopClues = function () {
		console.log("in stop clues...")
		$(this.view.submit_guess).prop('disabled', true)
		$(this.view.get_clue).prop('disabled', true)
		$(this.view.calculateScore).prop('disabled', false)
		updateMessageBox("Click 'Calculate Score' to see your score and correct answers")
	}

	this.get_correct_attempts = function () {
		var correct_attempts = []
		_.each(self.options, function (wo, k) {
			if (!wo.reveal) {
				var last_attempt = wo.get_enabled_attempt()
				var correctness = wo.correctness_score(last_attempt)
				if (correctness == 1.0) {
					last_attempt.isCorrect = true
					//wo.allowNewAttempts = false
					//$(attempt.get_view()).addClass('correct')
					correct_attempts.push(last_attempt)
				}

			}
		})
		return correct_attempts
	}

	this.mark_correctness = function () {
		_.each(self.options, function (wo, k) {
			wo.set_previous_attempt_correctness()
		})
	}
	this.make_focus_button = function () {
		//$(this.view.submit_guess).focus()
		$('input[tabindex=1]').focus()
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
		//$(this.view.get_clue).prop('disabled', false)
		//$(this.view.submit_guess).prop('disabled', true)
	}
	this.disable_get_clue = function () {
		//$(this.view.get_clue).prop('disabled', true)
		//$(this.view.submit_guess).prop('disabled', false)
	}

	this.update_max_points = function () {
		_.each(self.options, function (wo, k) {
			wo.update_max_points()
		})
	}

	this.check_for_completion = function () {
		var l2_words_remaining = 0

		_.each(self.l2_sentence.visible_nodes, function (vn) {
			if (vn.lang == 'de') {
				l2_words_remaining += 1
			}
		})
		if (l2_words_remaining == 0) {
			self.l2_sentence.stopClues = true
			self.stopClues()
		}
	}

	this.setOptionsByOrder = function () {
		_.each(self.options, function (wo, k) {
			$(wo.get_view()).css('order', -1)
		})
		_.each(self.options, function (wo, k) {
			if (parseInt($(wo.get_view()).css('order')) == -1) {

				var current_vn_pos = _.map(wo.l2_node.graph.get_visible_nodes(), function (gvn) {
					return parseInt($(gvn.get_view()).css('order'))
				})
				var idx = current_vn_pos[0]
				$(wo.get_view()).css('order', idx)

				if (wo.allowNewAttempts) {
					wo.get_enabled_attempt().view.tabIndex = parseInt(idx) + 1
					console.log(wo.l2_node.s, wo.allowNewAttempts, parseInt(idx) + 1)
				}

			}
		})
	}

	this.update_attemptability = function () {
		var l2_remaining = []
		var newOrder = []
		var current_idx = 0
		_.each(self.l2_sentence.visible_nodes, function (n) {
			if (n.lang == 'de') {
				var wo_id = n.graph.id + "," + n.id
				l2_remaining.push({wo_id: wo_id, position: current_idx})
				newOrder.push(wo_id)
			}
			current_idx += 1
		})
		_.each(self.options, function (wo, k) {
			wo.reveal = !(newOrder.indexOf(k) >= 0)
			wo.allowNewAttempts = !wo.reveal
			wo.add_attempt()
		})

		self.setOptionsByOrder()
	}

	this.removeOldAttempts = function () {
		_.each(self.options, function (wo, k) {
			a = wo.attempts.shift()
			$(a.view).remove()
			delete a
		})
	}
	this.initialOptions = function () {
		var l2_remaining = []
		var current_idx = 0
		_.each(self.l2_sentence.visible_nodes, function (n) {
			if (n.lang == 'de') {
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

		self.setOptionsByOrder()
		self.get_punct_clues()
	}

}