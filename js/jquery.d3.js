drawArrow = function (parentDiv, x1, y1, x2, y2, x3, y3, lineWidth) {
	var x_min = _.min([x1, x2, x3]) - lineWidth
	var y_min = _.min([y1, y2, y3]) - lineWidth
	var width = _.max([x1, x2, x3]) - _.min([x1, x2, x3]) + lineWidth
	var height = _.max([y1, y2, y3]) - _.min([y1, y2, y3]) + lineWidth
	var lineData = [
		{ "x": x1 - x_min, "y": y1 - y_min + (2 * lineWidth)},
		{ "x": x2 - x_min, "y": y2 - y_min + (2 * lineWidth)},
		{ "x": x3 - x_min, "y": y3 - y_min + (2 * lineWidth)}
	];

	//This is the accessor function we talked about above
	var curveFunction = d3.svg.line().x(function (d) {
		return d.x;
	}).y(function (d) {
		return d.y;
	}).interpolate("basis");

	$(parentDiv).addClass('arrowContainer')
	$(parentDiv).css({
						 left: x_min,
						 top: y_min,
						 "min-width": width,
						 "min-height": height
					 })
	var divElem = d3.select(parentDiv);
	var svgcanvas = divElem.append("svg:svg").attr("width", width).attr("height", height).attr('id', 'svgObj');
	var defs = svgcanvas.append("defs")
	defs.append("marker").attr({
								   "viewBox": "0 -5 10 10",
								   "refX": 5,
								   "refY": 0,
								   "markerWidth": 4,
								   "markerHeight": 4,
								   "orient": "auto"
							   }).append("path").attr("d", "M0,-5L10,0L0,5").attr("class", "arrow").attr("stroke", "blue").attr('fill', 'blue').attr('fill-opacity', '0.2').attr('stroke-opacity', '0.2');

	var lineGraph = svgcanvas.append("path").attr('class', 'arrow').attr("d", curveFunction(lineData)).attr("stroke", "blue").attr("stroke-width", lineWidth).attr('fill', 'none').attr('fill-opacity', '0.2').attr('stroke-opacity', '0.2').attr("marker-end", "url(#arrow)");
	$(lineGraph).css({
						 "color": "blue"
					 })
	return lineGraph
}

drawLineAndArrow = function (parentDiv, x0, y0, x1, y1, x2, y2, x3, y3, lineWidth, direction, color, stillLineStPt, stillLineEndPt) {
	var fill1 = {}
	var fill2 = {}
	var type = 'external'
	if (stillLineStPt == null || stillLineEndPt == null) {
		fill1.x = x0
		fill1.y = y0
		fill2.x = x0
		fill2.y = y0
	} else {
		fill1.x = stillLineStPt.x
		fill1.y = stillLineStPt.y
		fill2.x = stillLineEndPt.x
		fill2.y = stillLineEndPt.y
		type = 'split'
	}
	var x_min = _.min([x0, x1, x2, x3, fill1.x, fill2.x]) - lineWidth
	var y_min = _.min([y0, y1, y2, y3, fill1.y, fill2.y]) - lineWidth
	var x_max = _.max([x0, x1, x2, x3, fill1.x, fill2.x]) + lineWidth
	var y_max = _.max([y0, y1, y2, y3, fill1.y, fill2.y]) + lineWidth
	var width = x_max - x_min
	var height = y_max - y_min
	var shift = direction == 'en' ? -0 : 0
	var stillLineDataStr = ""
	if (stillLineEndPt == null || stillLineStPt == null) {

	} else {
		stillLineDataStr = ['M', stillLineStPt.x - x_min, stillLineStPt.y - y_min + shift , 'L' , stillLineEndPt.x - x_min, stillLineEndPt.y - y_min + shift].join([separator = ' '])

	}
	var lineData = [
		{ "x": x0 - x_min, "y": y0 - y_min + shift},
		{ "x": x1 - x_min, "y": y1 - y_min + shift}
	];
	var gap = (x3 - x1) / 6
	var curveData = [
		{ "x": x1 - x_min, "y": y1 - y_min + shift},
		{ "x": x1 + (gap) - x_min, "y": y2 - y_min + shift},
		{ "x": x1 + (5 * gap) - x_min, "y": y2 - y_min + shift},
		{ "x": x3 - x_min, "y": y3 - y_min + shift}
	];

	var lineFunction = d3.svg.line().x(function (d) {
		return d.x
	}).y(function (d) {
		return d.y
	}).interpolate("linear");

	var curveFunction = d3.svg.line().x(function (d) {
		return d.x;
	}).y(function (d) {
		return d.y;
	}).interpolate("basis");

	$(parentDiv).addClass('arrowContainer')
	$(parentDiv).css({
						 left: x_min,
						 top: y_min,
						 "min-width": width,
						 "min-height": height
					 })
	var divElem = d3.select(parentDiv);
	var svgcanvas = divElem.append("svg:svg").attr("width", width).attr("height", height).attr('id', 'svgObj');
	var marker_id = ['marker', x0, x1, x2, x3].join([separator = ','])
	var marker = svgcanvas.append("marker").attr({
													 "id": marker_id,
													 "viewBox": "0 -5 10 10",
													 "refX": 5,
													 "refY": 0,
													 "markerWidth": 4,
													 "markerHeight": 4,
													 "orient": "auto"
												 }).append("path").attr("d", "M0,-5L10,0L0,5").attr("class", "arrow").attr("stroke", color).attr('fill', 'none').attr("stroke-width", lineWidth);

	var wtf_hack = "url(#" + marker_id + ")"
	var lineGraph = svgcanvas.append("path").attr('class', 'arrow').attr("d", stillLineDataStr + lineFunction(lineData) + curveFunction(curveData)).attr("stroke", color).attr("stroke-width", lineWidth).attr('fill', 'none').attr("marker-end", wtf_hack);
	$(lineGraph).css({
						 "color": "blue"
					 })

	return {type: type, parent: parentDiv, path: lineGraph, marker: marker, direction: direction}
}

drawSwap = function (parentDiv, bounds, other_bounds, still_bounds, lineWidth, direction, color) {
	var lineStPt = {}
	var lineEndPt = {}
	var curveStPt = {}
	var curveMidPt = {}
	var curveEndPt = {}
	var stillLineStPt = null
	var stillLineEndPt = null

	if (still_bounds != null) {
		stillLineStPt = {x: still_bounds.left, y: still_bounds.top + (direction == 'en' ? still_bounds.height : 0)}
		stillLineEndPt = {x: still_bounds.right, y: still_bounds.top + (direction == 'en' ? still_bounds.height : 0)}
	}

	if (bounds.left < other_bounds.left) {
		lineStPt = {x: bounds.left, y: bounds.top + (direction == 'en' ? bounds.height : 0)}
		lineEndPt = {x: bounds.right, y: bounds.top + (direction == 'en' ? bounds.height : 0)}
		curveStPt = {x: lineEndPt.x, y: lineEndPt.y}
		curveEndPt = {x: other_bounds.right, y: other_bounds.top + (direction == 'en' ? 0 : other_bounds.height)}
		var mid_x = curveStPt.x + Math.abs(curveStPt.x - curveEndPt.x) / 2
		curveMidPt = {x: mid_x, y: curveStPt.y + (direction == 'en' ? -40 : 40)}
	} else {
		lineStPt = {x: bounds.right, y: bounds.top + (direction == 'en' ? bounds.height : 0)}
		lineEndPt = {x: bounds.left, y: bounds.top + (direction == 'en' ? bounds.height : 0)}
		curveStPt = {x: lineEndPt.x, y: lineEndPt.y}
		curveEndPt = {x: other_bounds.left, y: other_bounds.top + (direction == 'en' ? 0 : other_bounds.height)}
		var mid_x = curveStPt.x - Math.abs(curveStPt.x - curveEndPt.x) / 2
		curveMidPt = {x: mid_x, y: curveStPt.y + (direction == 'en' ? -40 : 40)}
	}

	return drawLineAndArrow(parentDiv, lineStPt.x, lineStPt.y, curveStPt.x, curveStPt.y, curveMidPt.x, curveMidPt.y, curveEndPt.x, curveEndPt.y, lineWidth, direction, color, stillLineStPt, stillLineEndPt)
}
