/**
 * Created by arenduchintala on 7/31/15.
 */
(function ($) {
    $.fn.MyBox = function (options) {
        var settings = $.extend(
            {
                py: 50,
                px: 50,
                b_height: 100,
                b_width: 200,
                lineWidth: 2,
                strokeStyle: 'grey'
            }, options);

        var canvas = document.createElement('canvas')
        canvas.id = options.id
        var padding = 0;
        var x_min = settings.px - padding
        var x_max = settings.px + settings.b_width + padding

        var y_min = settings.py - padding
        var y_max = settings.py + settings.b_height + padding


        canvas.style.position = 'absolute'
        canvas.style.padding = '0px'
        canvas.style.top = y_min + 'px'
        canvas.style.left = x_min + 'px'
        canvas.width = x_max - x_min
        canvas.height = y_max - y_min
        //canvas.style.border = settings.strokeStyle + " " + settings.lineWidth + "px solid"
        canvas.style.background = settings.strokeStyle

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