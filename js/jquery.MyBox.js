/**
 * Created by arenduchintala on 7/31/15.
 */
(function ($) {
	$.fn.MyBox = function (options) {
		var settings = $.extend({
									py: 50,
									px: 50,
									b_height: 100,
									b_width: 200,
									lineWidth: 2,
									strokeStyle: '#028090',
									direction: 'en',
									text: 'sometext'
								}, options);

		var canvas = document.createElement('canvas')
		canvas.id = options.id

		var padding = settings.lineWidth;
		var x_min = settings.px - (padding )
		var x_max = settings.px + settings.b_width

		var y_min = settings.py - (padding )
		var y_max = settings.py + settings.b_height

		var ctx = canvas.getContext('2d')
		canvas.style.position = 'absolute'
		canvas.style.padding = '0px'
		canvas.style.top = y_min + 'px'
		canvas.style.left = x_min + 'px'
		canvas.width = settings.b_width
		canvas.height = settings.b_height
		if (settings.direction == 'en') {
			canvas.style["border-bottom"] = settings.strokeStyle + " " + settings.lineWidth + "px solid"
			canvas.style["border-top"] = "transparent " + settings.lineWidth + "px solid"
			console.log("facing up")
		} else {
			canvas.style["border-bottom"] = "transparent " + settings.lineWidth + "px solid"
			canvas.style["border-top"] = settings.strokeStyle + " " + settings.lineWidth + "px solid"
			console.log("facing down")
		}

		canvas.style["border-left"] = settings.strokeStyle + " " + settings.lineWidth + "px solid"
		canvas.style["border-right"] = settings.strokeStyle + " " + settings.lineWidth + "px solid"
		ctx.textAlign = "center"
		ctx.fillText(settings.text, (x_max - x_min) / 2, (y_max - y_min) / 2);
		/*canvas.style.background = settings.strokeStyle*/

		/*var ctx = canvas.getContext('2d')
		ctx.strokeStyle = settings.strokeStyle
		ctx.lineWidth = settings.lineWidth
		ctx.lineJoin = 'round'
		ctx.lineCap = 'round'

		ctx.beginPath()
		ctx.moveTo(0, 0)
		ctx.lineTo(0, canvas.width)
		ctx.lineTo(canvas.height, canvas.width)
		ctx.lineTo(canvas.height, 0)
		ctx.lineTo(0, 0)
		ctx.stroke()*/

		return $(canvas).addClass('mybox')

	}
}(jQuery));