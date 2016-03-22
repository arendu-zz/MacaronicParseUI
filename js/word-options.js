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

	this.requestGuess = function (params) {
		self.set_visibility(true)

		$(this.view).keyup(function (e) {
			var code = e.which;
			console.log("typing something..." + self.node.lang + " : " + self.node.s + "code:" + code)
			if (code == 13) {
				var g = $(self.view.input_box).val().trim()
				//this.node.logRequestGuess(g)
				params["forceGuess"] = false
				self.node.completeTranslation(params)
				self.guessed = true
				self.skipped = false
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
		this.skipped = true
		self.set_visibility(false)
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
}