/**
 * Created by arenduchintala on 1/13/16.
 */


var InlineTranslationAttempt = function InlineTranslationAttempt(node) {
	var self = this
	this.available_points = 0
	this.node = node
	this.view = null
	this.revealed = false

	this.copy = function (new_node) {
		var n = new InlineTranslationAttempt(new_node)
		n.available_points = self.available_points
		n.get_view(true)
		$(n.view.input_box).val($(self.view.input_box).val() + "*")
		n.revealed = self.revealed
		$(n.view.input_box).addClass('correctGuess')
		$(n.view.input_box).prop('disabled', true)
		$(n.view.input_box).off()
		$(n.view).off()
		return n
	}

	this.set_l1_translation = function (n) {
		if (n.lang == 'de') {
			var modified_nodes = n.graph.translate_from(n, 'en')
			var l1_translations = _.map(modified_nodes.addStr, function (a) {
				return a.token
			})
			return l1_translations
		} else {
			return []
		}
	}

	this.l1_translation = this.set_l1_translation(node)

	this.get_view = function (force_visible) {
		var force_visible = force_visible || false
		if (this.view == null) {
			this.view = document.createElement('div')
			$(this.view).addClass('inlineTranslation')
			this.view.empty_padding = document.createElement('div')
			$(this.view.empty_padding).addClass('emptyPadding')
			$(this.view).append($(this.view.empty_padding))
			this.view.input_box = document.createElement('input')
			//$(this.view.input_box).css.('width', self.node.s.length)
			this.view.input_box.size = self.node.s.length
			$(this.view.input_box).addClass('inlineTranslationInput')
			$(this.view).append($(this.view.input_box))

			this.view.available_points = document.createElement('span')
			$(this.view.available_points).addClass('available_points')
			$(this.view.available_points).text('0')

			$(this.view).append($(this.view.available_points))

			$(this.view.input_box).keyup(function (e) {

				self.check_to_enable_get_next_clue()
				updateMessageBox("Click 'Submit Guess' to get feeback on the guesses.<br> (correct guesses will earn points shown below each box)")
			})

			if (self.node.lang == 'en') {
				$(this.view.input_box).prop('disabled', true)
				this.view.available_points.style.visibility = 'hidden'
				$(self.view.input_box).off()
				$(self.view).off()
				if (force_visible) {
					this.view.input_box.style.visibility = 'show'
				} else {
					this.view.input_box.style.visibility = 'hidden'
				}

			} else {
				$(this.view).focusin(function () {
					self.addGuessingClass()
				})

				$(this.view).on('mouseenter', function () {
					self.addGuessingClass()

				})
				$(this.view).on('mouseleave', function () {
					self.removeGuessingClass()

				})
			}
			if (['-', ',', '?', '.', ':', '!'].indexOf(self.node.s.trim()) >= 0) {
				self.turn_off()
			}
			return this.view;
		} else {
			return this.view;
		}
	}

	this.turn_off = function () {
		$(self.view.input_box).prop('disabled', true)
		$(self.view.input_box).css('visibility', 'hidden')
		$(self.get_view().available_points).css('visibility', 'hidden')
		self.revealed = true
		$(self.view.input_box).off()
		$(self.view).off()
	}

	this.check_to_enable_get_next_clue = function () {
		var ok_to_get_clue = true
		_.each(self.node.graph.sentence.visible_nodes, function (vn) {
			if (vn.lang == "de" && $(vn.inline_translation.view.input_box).val().trim() != "" && !vn.inline_translation.revealed) {
				ok_to_get_clue = false
			}
		})
		if (ok_to_get_clue) {
			self.node.graph.sentence.wordOptionWrapper.enable_get_clue()
			self.node.graph.sentence.wordOptionWrapper.disable_submit_guess()
		} else {
			self.node.graph.sentence.wordOptionWrapper.disable_get_clue()
			self.node.graph.sentence.wordOptionWrapper.enable_submit_guess()
		}
	}

	this.get_summary = function () {
		var summary = {}
		summary.guess = $(self.view.input_box).val()
		summary.revealed = self.revealed
		summary.l2_node_id = self.node.id
		summary.l2_node_graph_id = self.node.graph.id
		summary.l2_string = self.node.s
		summary.position = parseInt($(self.node.get_view()).css('order'))
		return summary
	}

	this.get_correctness_score = function () {
		var acceptance = 0.0
		var guess_phrase = $(self.view.input_box).val().split(" ")
		_.each(self.l1_translation, function (l1_word) {
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

	this.remove_wrong_guesses = function () {
		if ($(self.view.input_box).val().trim() != "") {
			$(self.view.input_box).addClass('incorrectGuess')
			setTimeout(function () {
				$(self.view.input_box).removeClass('incorrectGuess')
				$(self.view.input_box).val("")
			}, 800)
		}

	}

	this.update_on_correct = function () {
		if (self.get_correctness_score() == 1) {
			self.revealed = true
			$(self.view.input_box).addClass('correctGuess')
			$(self.view.input_box).prop('disabled', true)
			$(self.view.input_box).off()
			$(self.view).off()

		}
	}

	this.points_from_remaining = function () {
		var p = 0
		_.each(self.node.graph.sentence.visible_nodes, function (vn) {
			if (vn.lang == 'de') {
				p += 1
			}
		});
		return p
	}

	this.points_from_frequency = function () {
		if (self.node.frequency < 1.0) {
			return -Math.log(self.node.frequency) //parseInt(10 * ( 1 - self.node.frequency))
		} else {
			return 0.0
		}

	}

	this.addGuessingClass = function () {
		_.each(self.node.graph.sentence.visible_nodes, function (vn) {
			$(vn.get_view().textSpan).removeClass('guessing')
		})
		if (self.node.visible) {
			$(self.node.get_view().textSpan).addClass("guessing")
		} else {
			_.each(self.node.graph.get_visible_nodes(), function (l2_vn) {
				$(l2_vn.get_view().textSpan).addClass("guessing")
			})
		}
	}
	this.removeGuessingClass = function () {
		if (self.node.visible) {
			$(self.node.get_view().textSpan).removeClass("guessing")
		} else {
			_.each(self.node.graph.get_visible_nodes(), function (l2_vn) {
				$(l2_vn.get_view().textSpan).removeClass("guessing")
			})
		}
	}

	this.update_avaiable_points = function () {
		if (!self.revealed) {
			self.available_points = parseInt((self.points_from_frequency()) + (self.points_from_remaining()))
			$(self.get_view().available_points).text('+' + self.available_points.toString())
		} else {
			$(self.get_view().available_points).text('+0')
			$(self.get_view().available_points).css('visibility', 'hidden')
		}

	}
}

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

function WordOptionWrapper(l2_sentence) {
	var self = this
	this.view = null
	this.l2_sentence = l2_sentence
	this.options = {}
	this.total_score = 0
	this.effort_score = 0

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
			$(this.view.submit_guess).click(this.submit_guess_inline)
			$(this.view.submit_guess).prop('disabled', true)

			this.view.get_clue = document.createElement('button')
			$(this.view.get_clue).text('Get Random Clue')
			$(this.view).append($(this.view.get_clue))
			$(this.view.get_clue).click(this.get_random_clue)

			/*this.view.calculateScore = document.createElement('button')
			$(this.view.calculateScore).text('Calculate Score')
			$(this.view.calculateScore).prop('disabled', true)
			$(this.view).append($(this.view.calculateScore))
			$(this.view.calculateScore).click(this.computeScores)*/

			/*this.view.score_holder = document.createElement('div')
			$(this.view).append($(this.view.score_holder))*/
			this.view.score_txt = document.createElement('span')
			$(this.view.score_txt).addClass("totalScore")
			$(this.view.score_txt).text('Points:')
			$(this.view).append($(this.view.score_txt))

			this.view.totalScore = document.createElement('span')
			$(this.view.totalScore).addClass("totalScore number")
			$(this.view.totalScore).text('0')
			$(this.view).append($(this.view.totalScore))

			/*this.view.effort_txt = document.createElement('span')
			$(this.view.effort_txt).addClass("totalScore")
			$(this.view.effort_txt).text('Effort:')
			$(this.view).append($(this.view.effort_txt))

			this.view.effortScore = document.createElement('span')
			$(this.view.effortScore).addClass("totalScore number")
			$(this.view.effortScore).text('0')
			$(this.view).append($(this.view.effortScore))*/

			return this.view
		} else {
			return this.view
		}
	}

	/*this.computeScores = function () {
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

	}*/

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

	this.submit_guess_inline = function () {
		updateMessageBox("Correct guesses are green and incorrect guesses will disappear! <br> you can guess them again or get more clues.")
		console.log(self.guess_state_inline())
		console.log(self.guess_state_simple())
		_.each(self.l2_sentence.visible_nodes, function (vn) {
			if (vn.lang == 'de') {
				if (vn.inline_translation.get_correctness_score() == 1) {
					vn.inline_translation.update_on_correct()
					self.total_score += vn.inline_translation.available_points
					vn.inline_translation.available_points = 0
					vn.inline_translation.update_avaiable_points()
				} else {
					vn.inline_translation.remove_wrong_guesses()

				}
				vn.inline_translation.update_avaiable_points()

			}

		})

		if ($(self.view.totalScore).text() == self.total_score.toString() && self.total_score > 0) {
			var rand = Math.random() * 10
			if (rand > self.effort_score) {
				self.effort_score += 1
			}
		} else {
			console.log("no effort...", self.effort_score, rand, self.total_score.toString(), $(self.view.totalScore).val())
		}
		$(self.view.totalScore).text(self.total_score.toString())
		//$(self.view.effortScore).text(self.effort_score.toString())
		self.l2_sentence.points_bonus = self.total_score //+ self.effort_score
		self.check_for_completion()
		self.enable_get_clue()
		self.disable_submit_guess()

		if (socket && !is_preview) {
			var guess_state = JSON.stringify(self.guess_state_inline())
			var sentence_state = JSON.stringify(self.l2_sentence.get_full_representation())
			var sentence_visible = self.l2_sentence.get_visible_string()
			var guess_visible = self.guess_state_simple()
			var gm = new GuessLogMessage(username, self.l2_sentence.id, ui_version, revealCorrectInstantly, !ignoreReorder, guess_state, sentence_state, sentence_visible, guess_visible)
			socket.emit('logGuesses', gm)

		} else {

		}

	}

	this.get_random_clue = function () {
		self.l2_sentence.get_clue()
	}

	this.submit_guess = function () {
		self.disable_submit_guess()
		/*self.l2_sentence.submit_guess(correct_nodes)*/

		$(self.view.submit_guess).prop('disabled', true)
		self.l2_sentence.get_clue()

	}

	this.guess_state_inline = function () {
		var state = {}
		state.showReorder = !ignoreReorder
		state.instantFeedBack = revealCorrectInstantly
		var sentence_guess = []

		_.each(self.l2_sentence.visible_nodes, function (vn) {
			if (vn.lang == 'de') {
				var word_guess = vn.inline_translation.get_summary()
				sentence_guess.push(word_guess)
			}

		})
		state.sentenceGuess = sentence_guess
		return state
	}

	this.guess_state_simple = function () {
		var state = {}
		state.showReorder = !ignoreReorder
		state.instantFeedBack = revealCorrectInstantly
		var sentence_guess = []
		_.each(self.l2_sentence.visible_nodes, function (vn) {
			var idx = parseInt($(vn.get_view()).css('order'))
			var word = vn.s
			var guess = ""
			if (vn.lang == 'de') {
				guess = $(vn.inline_translation.view.input_box).val()
			}
			sentence_guess.push({idx: idx, word: word, guess: guess})

		})
		sentence_guess = _.sortBy(sentence_guess, function (s) {
			return s.idx
		})

		var return_str = _.map(sentence_guess, function (s) {
			var o = { w: s.word, g: s.guess }
			return o
		})

		return_str = JSON.stringify(return_str)
		return return_str
	}

	this.stopClues = function () {
		updateMessageBox("Click 'Submit' to move to the next sentence.")
		self.disable_get_clue()
		self.disable_submit_guess()
		enable_submit()
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
		//$(this.view.get_clue).prop('disabled', true)
	}
	this.disable_submit_guess = function () {
		$(this.view.submit_guess).prop('disabled', true)
		//$(this.view.get_clue).prop('disabled', false)
	}

	this.enable_get_clue = function () {
		$(this.view.get_clue).prop('disabled', false)
		//$(this.view.submit_guess).prop('disabled', true)
	}
	this.disable_get_clue = function () {
		$(this.view.get_clue).prop('disabled', true)
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
			if (vn.lang == 'de' && !vn.inline_translation.revealed) {
				l2_words_remaining += 1
				//console.log("remaining:", vn.s, vn.inline_translation.revealed)
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
		/*var l2_remaining = []
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
		self.get_punct_clues() */
	}

	this.update_avaiable_points = function () {
		_.each(self.l2_sentence.visible_nodes, function (n) {
			if (n.lang == 'de' && !n.inline_translation.revealed) {
				n.inline_translation.update_avaiable_points()
			}
		})
	}

	this.update_tab_order = function () {
		var tb = 1
		_.each(self.l2_sentence.visible_nodes, function (n) {
			if (n.lang == 'de' && !n.inline_translation.revealed) {
				n.inline_translation.view.input_box.tabIndex = tb
				tb += 1
			}
		})
	}

	this.check_to_enable_get_next_clue = function () {
		var ok_to_get_clue = true
		_.each(self.l2_sentence.visible_nodes, function (vn) {
			if (vn.lang == "de" && $(vn.inline_translation.view.input_box).val().trim() != "" && !vn.inline_translation.revealed) {
				ok_to_get_clue = false
			}
		})
		if (ok_to_get_clue) {
			self.enable_get_clue()
			self.disable_submit_guess()
		} else {
			self.disable_get_clue()
			self.enable_submit_guess()
		}
	}

}