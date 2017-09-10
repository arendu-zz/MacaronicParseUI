/**
 * Created by arenduchintala on 3/22/16.
 */


var PreviewGuessRequest = function PreviewGuessRequest(node) {
	var self = this
	this.view = null
	this.node = node
	this.isVisible = false
	this.guessed = false
	this.skipped = false
	this.has_partial = false

	this.get_view = function () {
		if (this.view == null) {
			this.view = document.createElement('div')
			$(this.view).addClass('inlineTranslation')
			this.view.empty_padding = document.createElement('div')
			$(this.view.empty_padding).addClass('emptyPadding')
			this.view.input_box = document.createElement('input')
			this.view.input_box.size = self.node.s.length
			$(this.view.input_box).addClass('inlineTranslationInput')
			$(this.view).append($(this.view.input_box))
			this.view.style.visibility = 'hidden'
			this.isVisible = false
			return this.view;
		} else {
			return this.view;
		}
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

	this.l1_translation = self.set_l1_translation(node)

	this.requestGuess = function (params) {

		self.set_visibility(true)
		self.skipped = true
		$(this.view).keyup(function (e) {
			var code = e.which;
			console.log("typing:" + self.node.lang + " : " + self.node.s + "code:" + code)
			if (code == 13) {
				var g = $(self.view.input_box).val().trim()
				//this.node.logRequestGuess(g)
				if (g != '') {

					//should log guess to db here
					//$(self.get_view().input_box).addClass('correctGuess')
					var score = self.get_cosine_sim()
					if (isNaN(score)) {
						self.flashClass('incorrectGuess', params)
					} else if (score < 0.75) {
						self.flashClass('incorrectGuess', params)
					} else if (score < 0.9) {
						self.flashClass('closeGuess', params)
					} else {
                        params["forceGuess"] = false
                        self.skipped = false
                        self.guessed = true
						self.flashClass('correctGuess', params)

					}

				}

			}
		})

		$(this.view).on('mouseenter', function () {
			//self.addGuessingClass()

		})
		$(this.view).on('mouseleave', function () {
			//self.removeGuessingClass()

		})

	}

	this.removeRequest = function () {

		$(self.view).unbind('keyup')

		$(self.view).off('mouseenter', function () {
			//self.addGuessingClass()

		})
		$(self.view).off('mouseleave', function () {
			//self.removeGuessingClass()

		})
	}
	this.remove_as_preview = function () {
		if (self.isVisible) {
			var g = $(self.view.input_box).val().trim()
			if (g != '') {
				self.has_partial = true
			}
			self.set_visibility(false)
		}

	}
	this.set_visibility = function (v) {
		if (v) {
			this.view.style.visibility = 'visible'
			this.isVisible = true
			$(this.view.input_box).focus()
		} else {
			this.view.style.visibility = 'hidden'
			this.isVisible = false
		}

	}

	this.flashClass = function (c, params) {
		params['guess_result'] = c
		var delay = c == 'incorrectGuess' ? 700 : 700;
		if ($(self.view.input_box).val().trim() != "") {
			$(self.view.input_box).addClass(c)
			setTimeout(function () {
				$(self.view.input_box).removeClass(c)
				setTimeout(function () {
					self.node.completeTranslation(params)
				}, 300)
			}, delay)
		}

	}

	this.get_cosine_sim = function () {
		var g = $(self.view.input_box).val().trim()
		var c = self.l1_translation

		if (g.indexOf(' ') >= 0) {
			g = g.split([separator = ' '])
		} else {
			g = [g]
		}
		var g_glove = get_glove_vec(g)
		var c_glove = get_glove_vec(c)
		var cosine_sim = null
		if (g_glove == null || c_glove == null) {
			console.log("g", g, "c", c)
			if (str_match(g, c)) {
				return 1.0
			} else {
				return 0.0
			}
		} else {
			if (str_match(g, c)) {
				return 1.0
			} else {
				cosine_sim = cosine_similarity(g_glove, c_glove)
				return cosine_sim
			}
		}

	}

}

str_match = function (l1, l2) {
	console.log("comparing", l1, l2)
	var r = false
	_.each(l1, function (w1) {
		_.each(l2, function (w2) {
			console.log("comparing", w1.toLowerCase(), w2.toLowerCase())
			if (w1.toLowerCase() == w2.toLowerCase()) {
				console.log("ok true?!")
				r = true
			}
		})
	})
	return r
}
