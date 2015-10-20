(function ($) {
	$.fn.straightline = function (options) {
		var settings = $.extend({
									p0x: 50,
									p0y: 50,
									p1x: 70,
									p1y: 10,
									size: 5,
									padding: 0,
									lineWidth: 0,
									strokeStyle: '#028090'
								}, options);

		var canvas = document.createElement('canvas');
		canvas.id = options.id

		var padding = settings.size - settings.lineWidth;

		var x_min = _.min([settings.p0x, settings.p1x]) - padding;
		var x_max = _.max([settings.p0x, settings.p1x]) + padding;
		var y_min = _.min([settings.p0y, settings.p1y]) - padding;
		var y_max = _.max([settings.p0y, settings.p1y]) + padding;

		var p0x = settings.p0x - x_min;
		var p0y = settings.p0y - y_min;
		var p1x = settings.p1x - x_min;
		var p1y = settings.p1y - y_min;

		canvas.style.position = 'absolute';
		canvas.style.top = y_min + 'px';
		canvas.style.left = x_min + 'px';
		canvas.width = x_max - x_min;
		canvas.height = y_max - y_min;

		/*var ctx = canvas.getContext('2d');
		ctx.translate(0.5, 0.5);
		// Styling
		ctx.strokeStyle = settings.strokeStyle;
		ctx.lineWidth = 5;
		//ctx.lineJoin = 'round';
		//ctx.lineCap = 'round';

		ctx.beginPath();
		ctx.moveTo(p0x, p0y);
		ctx.lineTo(p1x, p1y);
		ctx.stroke();*/

		return $(canvas).addClass('straight_line');
	}

}(jQuery));
