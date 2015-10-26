/**
 * Created by arenduchintala on 8/10/15.
 */

var sentences = []
var page = 0;
var sentences_per_page = 10
var username = null
var socket = null
var json_sentences = []
var mainview = null
var global_preview_views = []

gotoPrevPage = function () {
	console.log("go to prev page")
	page -= 1
	var st = page * sentences_per_page
	var total = json_sentences.length
	var end = st + sentences_per_page
	if (page >= 0) {
		$('#mainbody').empty()
		sentences = []
		ok_parse(st, end)
		do_precomputations()
	}
	if (page <= 0) {
		page = 0
		$('#prevbtn').prop("disabled", true)
	} else {
		$('#prevbtn').prop("disabled", false)

	}
	if (end > total) {
		end = total
		$('#nextbtn').prop("disabled", true)
	} else {
		$('#nextbtn').prop("disabled", false)
	}
}
gotoNextPage = function () {
	console.log("go to next page")
	page += 1
	var total = json_sentences.length
	var st = page * sentences_per_page
	var end = st + sentences_per_page
	if (end > total) {
		end = total
		$('#nextbtn').prop("disabled", true)
	} else {
		$('#nextbtn').prop("disabled", false)
	}
	if (page == 0) {
		$('#prevbtn').prop("disabled", true)
	} else {
		$('#prevbtn').prop("disabled", false)

	}

	$('#mainbody').empty()
	sentences = []
	ok_parse(st, end)
	do_precomputations()
}
function Node() {
	var self = this
	/*attributes from json*/
	this.id = null
	this.s = ""
	this.en_id = null  //within graph ordering
	this.de_id = null  //within graph ordering
	this.lang = null
	this.en_left = null // between graph ordering uses these
	this.en_right = null // between graph ordering uses these
	this.de_left = null  // between graph ordering uses these
	this.de_right = null // between graph ordering uses these
	this.to_en = null
	this.to_de = null
	this.ir = null
	/*attributes created in js*/
	this.view = null
	this.preview_views = []
	this.visible = false
	this.graph = null
	this.split_reorder_en = false
	this.split_reorder_de = false
	this.swap_reorder_de = false
	this.swap_reorder_en = false
	this.translate_en = false
	this.translate_de = false
	this.out_of_main_view = true
	this.out_of_preview_view = true
	this.isMouseOver = false

	this.get_view_position = function () {
		var v = self.get_view()
		return {top: v.offsetTop, left: v.offsetLeft, height: v.offsetHeight, width: v.offsetWidth}
	}
	this.get_view_text_position = function () {
		var ts = self.get_view().textSpan
		return {top: ts.offsetTop, left: ts.offsetLeft, height: ts.offsetHeight, width: ts.offsetWidth}

	}

	this.getLogObj = function () {
		var logObj = {}
		logObj['order'] = parseInt($(self.get_view()).css('order'))
		logObj['string'] = self.s
		logObj['lang'] = self.lang
		return logObj
	}

	this.update_view_reorder = function () {
		var view = this.get_view()
		console.log("s " + self.s + " id " + self.de_id + " current view id" + parseInt($(view).css('order')))
		if (self.de_id != parseInt($(view).css('order'))) {
			$(view.textSpan).addClass('enorder')
		} else {
			$(view.textSpan).removeClass('enorder')
		}
		var graph = self.graph
		$(view.external_reorder_selector_to_de).hide()
		$(view.external_reorder_selector_to_en).hide()
		self.swap_reorder_en = false
		self.swap_reorder_de = false
		$(view.split_reorder_selector_to_de).hide()
		$(view.split_reorder_selector_to_en).hide()
		self.split_reorder_de = false
		self.split_reorder_en = false
		$(view.translation_selector_to_de).hide()
		$(view.translation_selector_to_en).hide()
		self.translate_en = false
		self.translate_de = false
		if (graph.swaps) {
			var s_obj = graph.get_swap('de')
			if (s_obj != null) {
				if (s_obj.head != '0') {
					if (s_obj.head == '1' && _.contains(s_obj.other_graphs, graph.id)) {
						self.swap_reorder_de = true
					} else if (s_obj.head == '2' && _.contains(s_obj.graphs, graph.id)) {
						self.swap_reorder_de = true
					}
				} else {
					self.swap_reorder_de = true
				}
			}
			var s_obj = graph.get_swap('en')
			if (s_obj != null) {
				if (s_obj.head != '0') {
					if (s_obj.head == '1' && _.contains(s_obj.other_graphs, graph.id)) {
						self.swap_reorder_en = true
					} else if (s_obj.head == '2' && _.contains(s_obj.graphs, graph.id)) {
						self.swap_reorder_en = true
					}
				} else {
					self.swap_reorder_en = true
				}
			}
		} else {
			self.swap_reorder_de = false
			self.swap_reorder_en = false
		}
		if (graph.splits) {
			var vn_ids = _.map(this.graph.get_visible_nodes(), function (vn) {
				return vn.id
			})
			var are_equal = vn_ids.length > 1
			if (are_equal) {
				if (graph.split_to == 'en') {
					self.split_reorder_de = false
					self.split_reorder_en = true
				} else {
					self.split_reorder_de = true
					self.split_reorder_en = false
				}
			} else {
				self.split_reorder_de = false
				self.split_reorder_en = false
			}
		} else {
			self.split_reorder_de = false
			self.split_reorder_en = false
		}
		if (true) {
			if (self.graph.translate_from(self, 'de') != null) {
				self.translate_de = true
			}
			if (self.graph.translate_from(self, 'en') != null) {
				self.translate_en = true
			}
		}

		if (self.split_reorder_de) {
			$(view.split_reorder_selector_to_de).show()
		}
		if (self.split_reorder_en) {
			$(view.split_reorder_selector_to_en).show()
		}
		if (self.swap_reorder_de) {
			$(view.external_reorder_selector_to_de).show()
		}
		if (self.swap_reorder_en) {
			$(view.external_reorder_selector_to_en).show()
		}
		if (self.translate_de && !self.split_reorder_de) {
			$(view.translation_selector_to_de).show()
		} else if (self.translate_de && self.split_reorder_de) {
			//do not show translation if a split is possible...
		}
		if (self.translate_en && !self.split_reorder_en) {
			$(view.translation_selector_to_en).show()
		} else if (self.translate_en && self.split_reorder_en) {
			//do not show translation if split is possible
		}
	}

	this.unpreview_action = function () {
		_.each(global_preview_views, function (pv) {
			$(pv).remove()
		})
		global_preview_views = []
	}
	this.onPreview = function (fromview) {
		if (fromview == 'onPreview') {
			self.out_of_preview_view = false
			console.log('on preview from ' + fromview)
		} else if (fromview == 'onView') {
			self.out_of_main_view = false
			console.log('on preview from ' + fromview)
		}
	}

	this.delayed_preview = function () {
		if (self.isMouseOver) {
			self.preview_action()
		} else {
			console.log("too late")
		}
	}

	this.preview_action = function () {

		self.graph.sentence.remove_all_previews(self)
		//console.log('* *  PREVIEW REORDER ' + direction + '* *')
		var directions = ['en', 'de']
		var num_swaps = []
		_.each(directions, function (direction) {
			var pv = document.createElement('div')
			$(pv).addClass("previewDiv")
			$(pv).addClass(direction)

			/*$(pv).on('mouseleave', function () {
				//self.offView('offPreview')
				self.unpreview_action()
			})
			$(pv).on('mouseenter', function () {
				self.onPreview('onPreview')
			})*/
			/*var pv_menu = document.createElement('div')
			$(pv_menu).addClass("previewMenu")
			$(pv).append($(pv_menu))*/
			var pv_translate = document.createElement('div')
			$(pv_translate).addClass("previewTranslateContainer")
			$(pv_translate).addClass(direction)
			$(pv).append($(pv_translate))
			var pv_bounds = self.get_view_text_position()
			pv_bounds['right'] = pv_bounds.left + pv_bounds.width

			if (self.graph.swaps && self["swap_reorder_" + direction]) {
				var self_1 = false
				var self_2 = false
				var swap_obj = self.graph.get_swap(direction)
				var bounds = {'height': 0, 'left': Number.POSITIVE_INFINITY, 'right': Number.NEGATIVE_INFINITY, 'top': 0 }
				_.each(swap_obj.graphs, function (gid) {
					var g = self.graph.sentence.get_graph_by_id(gid)
					self_1 = self_1 || gid == self.graph.id
					var b = g.get_bounding_of_visible_nodes()
					if (b.left < bounds.left) {
						bounds.left = b.left
					}
					if (b.right > bounds.right) {
						bounds.right = b.right
					}
					bounds.top = b.top
					bounds.height = b.height
				})
				var other_bounds = {'height': 0, 'left': Number.POSITIVE_INFINITY, 'right': Number.NEGATIVE_INFINITY, 'top': 0 }
				_.each(swap_obj.other_graphs, function (gid) {
					var g = self.graph.sentence.get_graph_by_id(gid)
					self_2 = self_2 || gid == self.graph.id
					var b = g.get_bounding_of_visible_nodes()
					if (b.left < other_bounds.left) {
						other_bounds.left = b.left
					}
					if (b.right > other_bounds.right) {
						other_bounds.right = b.right
					}
					other_bounds.top = b.top
					other_bounds.height = b.height
				})
				var arrows = null
				var pathDiv = document.createElement('div')

				//$(pathDiv).addClass(direction)
				if (self_1 && !self_2) {
					arrows = self.get_swap_preview_view(pathDiv, bounds, other_bounds, direction)

				} else if (self_2 && !self_1) {
					arrows = self.get_swap_preview_view(pathDiv, other_bounds, bounds, direction)

				} else {
					arrows = self.get_swap_preview_view(pathDiv, bounds, other_bounds, direction)

				}

				num_swaps.push(arrows)
				/*global_preview_views.push(arrows.parent)
				var container = self.graph.sentence.get_container()
				$(container).append(arrows.parent)
				arrows.path.on('mouseenter', function () {
					arrows.path.attr('fill-opacity', '1.0').attr('stroke-opacity', '1.0')
					arrows.marker.attr('fill-opacity', '1.0').attr('stroke-opacity', '1.0')
					arrows.path.attr('class', 'arrow highlighted')
					arrows.marker.attr('class', 'arrow highlighted')
					console.log("wha whaaa!!")
				})
				arrows.path.on('mouseleave', function () {
					arrows.path.attr('fill-opacity', '0.2').attr('stroke-opacity', '0.2')
					arrows.marker.attr('fill-opacity', '0.2').attr('stroke-opacity', '0.2')
					arrows.path.attr('class', 'arrow')
					arrows.marker.attr('class', 'arrow')
					console.log("dooo doooo whaaa!!")
				})
				arrows.path.on('click', function () {
					console.log("its been clicked!!!")

					self.take_action({action: 'external reorder', direction: direction})
				})*/
				/*_.each(arrows, function (arrow) {
					$(container).append(arrow)
					global_preview_views.push(arrow)
				})*/
				/*var sd = document.createElement('div')
				$(sd).on('mouseenter', function () {
					console.log("setting css of .preview.swap")
					$('.preview.swap').css('opacity', '1.0')
				})
				$(sd).on('mouseleave', function () {
					$('.preview.swap').css('opacity', '0.2')
				})
				$(sd).on('click', function () {
					console.log("i have been clicked swap btn")
					self.take_action({action: 'external reorder', direction: direction})

				})*/
				//$(sd).addClass("swap btn")
				//$(pv_menu).append($(sd))
				//btns.push(sd)

			} else if (self.graph.splits && self["split_reorder_" + direction]) {
				//console.log("this graphs splits")
				var split_possible = false
				var gvn = _.filter(self.graph.nodes, function (node) {
					return node.visible
				})
				var target_order = self.graph['split_order_by_' + direction]
				var split_nodes = gvn
				split_nodes = _.sortBy(split_nodes, function (sn) {
					return parseInt($(sn.get_view()).css('order'))
				})

				var separator_nodes = _.map(target_order, function (t_id) {
					if (t_id != self.graph.id) {
						var s_graph = self.graph.sentence.get_graph_by_id(t_id)
						var sns = s_graph.get_visible_nodes()
						sns = _.sortBy(sns, function (sn) {
							return parseInt($(sn.get_view()).css('order'))
						})
						return sns
					} else {
						return ['INSERT HERE']
					}

				})
				separator_nodes = _.flatten(separator_nodes)
				var new_ordering_nodes = []
				var insertions = _.reduce(separator_nodes, function (memo, sn) {
					if (sn == 'INSERT HERE') {return memo + 1} else {return memo}
				}, 0)
				if (insertions == 1) {
					split_possible = true
					new_ordering_nodes = _.map(separator_nodes, function (sn) {
						if (sn == 'INSERT HERE') {
							return split_nodes
						} else {
							return sn
						}
					})

				} else if (insertions == split_nodes.length) {
					split_possible = true
					var split_ptr = 0
					new_ordering_nodes = _.map(separator_nodes, function (sn) {
						if (sn == 'INSERT HERE') {
							var split_n = split_nodes[split_ptr]
							split_ptr++
							return split_n
						} else {
							return sn
						}
					})

				}
				//Todo: will fail if more than 2 nodes are involved in a split!!
				var modified_nodes = {}
				new_ordering_nodes = _.flatten(new_ordering_nodes)
				var new_ordering_positions = _.map(new_ordering_nodes, function (nn) {
					return parseInt($(nn.get_view()).css('order'))
				})
				var st = _.min(new_ordering_positions)
				var new_pos = 0 + st
				_.each(new_ordering_nodes, function (nn) {
					var nnp = new_pos
					if (_.contains(split_nodes, nn)) {
						//self.graph.sentence.remove_nodes([nn])
						var nnpc = parseInt($(nn.get_view()).css('order'))
						console.log("adding back " + nn.s + " in position " + nnp + " current position" + nnpc)
						//self.graph.sentence.add_nodes([nn], [nnp], param)
						if (nnp == nnpc) {
							still_node = nn
							modified_nodes['still'] = nn
						} else {
							modified_nodes['moving'] = nn
							modified_nodes['moving_to'] = self.graph.sentence.get_node_by_order(nnp)
							console.log('moving to reference' + modified_nodes.moving_to.s)
							modified_nodes['is_left'] = nnpc > nnp
						}
					} else {
						console.log(nn.s + " not in split, its position " + nnp)
					}
					new_pos += 1
				})

				if (split_possible && modified_nodes.still != null && modified_nodes.moving != null && modified_nodes.moving_to != null) {
					var moving_bounds = modified_nodes.moving.get_view_text_position()
					moving_bounds['right'] = moving_bounds.left + moving_bounds.width
					var bounds = modified_nodes.still.get_view_text_position()
					bounds['right'] = bounds.left + bounds.width
					var moving_to_bounds = modified_nodes.moving_to.get_view_text_position()
					moving_to_bounds['right'] = moving_to_bounds.left + moving_to_bounds.width
					var pathDiv = document.createElement('div')
					var arrows = self.get_split_preview_view(pathDiv, bounds, moving_bounds, moving_to_bounds, direction)
					num_swaps.push(arrows)
					/*global_preview_views.push(arrows.parent)
					var container = self.graph.sentence.get_container()
					$(container).append(arrows.parent)
					//currently split and should be unsplit
					arrows.path.on('mouseenter', function () {
						self.set_path_attr(arrows, 'arrow highlighted')
						console.log("wha whaaa!!")
					})
					arrows.path.on('mouseleave', function () {
						self.set_path_attr(arrows, 'arrow')
						console.log("dooo doooo whaaa!!")
					})
					arrows.path.on('click', function () {
						console.log("its been clicked!!!")
						self.take_action({action: 'split reorder', direction: direction})
					})*/
					/*console.log("currently split and should be unsplit ")
					var sd = document.createElement('div')
					$(sd).addClass("split btn")
					$(sd).on('mouseenter', function () {
						$(".preview.split").css('opacity', '1.0')
					})
					$(sd).on('mouseleave', function () {
						$(".preview.split").css('opacity', '0.2')
					})
					$(sd).on('click', function () {
						console.log("i have been clicked split btn")
						self.take_action({action: 'split reorder', direction: direction})
					})
					btns.push(sd)*/
				}

			}

			var modified_nodes = null
			if (direction == 'de') {
				modified_nodes = self.graph.translate_from(self, 'de')
			} else {
				modified_nodes = self.graph.translate_from(self, 'en')
			}
			if (modified_nodes != null) {

				var bounds = get_bounding_of_nodes(modified_nodes.remove)

				if (Math.abs(bounds.left - bounds.right) > Math.abs(pv_bounds.left - pv_bounds.right)) {
					pv_bounds = bounds
				}
				var translation_items = self.get_translate_preview_view(modified_nodes.add, bounds)

				_.each(translation_items, function (wordSpan) {
					$(pv_translate).append(wordSpan)
					/*$(wordSpan).css('opacity', '0.0')
					$(wordSpan).animate({ opacity: "0.2" }, 500);*/

				})

				//var sd = document.createElement('div')

				$(pv_translate).on('mouseenter', function () {
					console.log("ok")
					if (direction == 'en') {
						$(".preview.translation.en").css('opacity', '1.0')
						$(".preview.translation.de").css('opacity', '0.0')

					} else {
						$(".preview.translation.en").css('opacity', '0.0')
						$(".preview.translation.de").css('opacity', '1.0')

					}
					_.each(modified_nodes.remove, function (rm) {
						$(rm.get_view().textSpan).addClass("affected")
						console.log("adding affected class")
					})

				})
				$(pv_translate).on('mouseleave', function () {
					$('.preview.translation').css('opacity', '0.2')
					_.each(modified_nodes.remove, function (rm) {
						$(rm.get_view().textSpan).removeClass("affected")
						console.log("removing affected class")
					})
				})
				$(pv_translate).on('click', function () {
					console.log("i have been clicked translation btn")
					_.each(modified_nodes.remove, function (rm) {
						$(rm.get_view().textSpan).removeClass("affected")
						console.log("removing affected class")
					})
					_.each(modified_nodes.add, function (rm) {
						$(rm.get_view().textSpan).removeClass("affected")
						console.log("removing affected class")
					})
					self.take_action({action: 'translate', direction: direction})
				})
				//$(sd).addClass("translation btn")
				//btns.push(sd)
				//$(pv_menu).append($(sd))
			}

			global_preview_views.push(pv)
			var container = self.graph.sentence.get_container()
			$(container).append($(pv))
			//$(pv).css('opacity', '0.0')
			//$(pv).animate({ opacity: "1.0" }, 1000);
			var shift = direction == 'en' ? +pv_bounds.height / 2 + 12 : -pv_bounds.height / 2 - 15
			var bounds_mid = (pv_bounds.left + pv_bounds.right) / 2
			var jspv = $(pv)
			jspv.css({
						 "top": pv_bounds.top + shift,
						 "left": bounds_mid,
						 "min-width": Math.abs(pv_bounds.left - pv_bounds.right)
					 });

		})

		if (num_swaps.length == 0) {

		} else if (num_swaps.length == 1) {
			console.log("one side reorder")
			_.each(num_swaps, function (arrows) {
				global_preview_views.push(arrows.parent)
				var container = self.graph.sentence.get_container()
				$(container).append(arrows.parent)

				//arrows.path[0][0].classList.add('highlighted')
				//arrows.marker[0][0].classList.add('highlighted')
				$(self.get_view().textSpan).on('mouseenter', function () {
					//self.set_path_attr(arrows, 'arrow highlighted')
					arrows.path[0][0].classList.add('highlighted')
					arrows.marker[0][0].classList.add('highlighted')
				})
				$(self.get_view().textSpan).on('mouseleave', function () {
					//self.set_path_attr(arrows, 'arrow')
					arrows.path[0][0].classList.remove('highlighted')
					arrows.path[0][0].classList.remove('highlighted')
				})
				arrows.path.on('mouseenter', function () {
					//self.set_path_attr(arrows, 'arrow highlighted')
					arrows.path[0][0].classList.add('highlighted')
					arrows.path[0][0].classList.add('highlighted')
				})
				arrows.path.on('mouseleave', function () {
					//self.set_path_attr(arrows, 'arrow')
					arrows.path[0][0].classList.remove('highlighted')
					arrows.path[0][0].classList.remove('highlighted')
				})
				$(self.get_view().textSpan).off('click') //THIS IS IMPORTANT SINCE WE ARE ADDING LISTENERS REPEATEDLY
				$(self.get_view().textSpan).on('click', function () {
					console.log("its been  from textSpan clicked!!!")
					self.take_action({action: arrows.type + ' reorder', direction: arrows.direction})
				})
				arrows.path.on('click', function () {
					console.log("its been clicked!!!")
					self.take_action({action: arrows.type + ' reorder', direction: arrows.direction})
				})
			})
		} else {
			console.log("multiple reorders")
			$(self.get_view().textSpan).off('click')
			//$(self.get_view().textSpan).off('mouseleave')
			//$(self.get_view().textSpan).off('mouseenter')
			_.each(num_swaps, function (arrows) {
				global_preview_views.push(arrows.parent)
				var container = self.graph.sentence.get_container()
				$(container).append(arrows.parent)

				arrows.path[0][0].classList.remove('highlighted')
				arrows.marker[0][0].classList.remove('highlighted')
				//setInterval(self.removeHighlight(arrows), 500)

				arrows.path.on('mouseenter', function () {
					//self.set_path_attr(arrows, 'arrow highlighted')
					arrows.path[0][0].classList.add('highlighted')
					arrows.path[0][0].classList.add('highlighted')
				})
				arrows.path.on('mouseleave', function () {
					//self.set_path_attr(arrows, 'arrow')
					arrows.path[0][0].classList.remove('highlighted')
					arrows.path[0][0].classList.remove('highlighted')
				})
				arrows.path.on('click', function () {
					console.log("its been clicked!!!")
					self.take_action({action: arrows.type + ' reorder', direction: arrows.direction})
				})
			})
		}

	}

	this.take_action = function (param) {
		console.log('action triggered:' + param.action + ',' + param.direction)
		self.graph.sentence.remove_all_previews(null)
		var before = JSON.stringify(self.graph.sentence.getLogObjs())
		var rule = param.action
		if (param.action == 'split reorder') {

			var gvn = _.filter(self.graph.nodes, function (node) {
				return node.visible
			})
			if (this.graph.splits) {
				console.log("this graphs splits")

				var target_order = self.graph['split_order_by_' + param.direction]
				var split_nodes = gvn
				split_nodes = _.sortBy(split_nodes, function (sn) {
					return parseInt($(sn.get_view()).css('order'))
				})

				var separator_nodes = _.map(target_order, function (t_id) {
					if (t_id != self.graph.id) {
						var s_graph = self.graph.sentence.get_graph_by_id(t_id)
						var sns = s_graph.get_visible_nodes()
						sns = _.sortBy(sns, function (sn) {
							return parseInt($(sn.get_view()).css('order'))
						})
						return sns
					} else {
						return ['INSERT HERE']
					}

				})
				separator_nodes = _.flatten(separator_nodes)
				var new_ordering_nodes = []
				var insertions = _.reduce(separator_nodes, function (memo, sn) {
					if (sn == 'INSERT HERE') {return memo + 1} else {return memo}
				}, 0)
				if (insertions == 1) {
					//currently split and should be unsplit
					new_ordering_nodes = _.map(separator_nodes, function (sn) {
						if (sn == 'INSERT HERE') {
							return split_nodes
						} else {
							return sn
						}
					})
				} else if (insertions == split_nodes.length) {
					//currently not split and should be split
					var split_ptr = 0
					new_ordering_nodes = _.map(separator_nodes, function (sn) {
						if (sn == 'INSERT HERE') {
							var split_n = split_nodes[split_ptr]
							split_ptr++
							return split_n
						} else {
							return sn
						}
					})
				}

				new_ordering_nodes = _.flatten(new_ordering_nodes)
				var new_ordering_positions = _.map(new_ordering_nodes, function (nn) {
					return parseInt($(nn.get_view()).css('order'))
				})
				var st = _.min(new_ordering_positions)
				var new_pos = 0 + st
				_.each(new_ordering_nodes, function (nn) {
					var nnp = new_pos
					if (_.contains(split_nodes, nn)) {
						self.graph.sentence.remove_nodes([nn])
						console.log("adding back " + nn.s + " in position " + nnp)
						self.graph.sentence.add_nodes([nn], [nnp], param)
					} else {
						console.log(nn.s + " not in split, its position " + nnp)
					}
					new_pos += 1
				})
				self.graph.split_to = param.direction == 'en' ? 'de' : 'en'
				_.each(split_nodes, function (i) {
					i.update_view_reorder()
				})

			}
		} else if (param.action == 'external reorder') {
			var gvn = _.filter(self.graph.nodes, function (node) {
				return node.visible
			})

			if (this.graph.swaps) {
				console.log("this graphs swaps")
				var swap_obj = self.graph.get_swap(param.direction)
				assert(swap_obj != null, 'swap object is null!!')
				var vn_group1 = []
				_.each(swap_obj.graphs, function (g_id) {
					vn_group1 = vn_group1.concat(self.graph.sentence.get_graph_by_id(g_id).get_visible_nodes())
				})
				vn_group1 = _.sortBy(vn_group1, function (vn) {
					return parseInt($(vn.get_view()).css('order'))
				})
				var vn_group1_positions = _.map(vn_group1, function (vn) {
					return parseInt($(vn.get_view()).css('order'))
				})
				var vn_group2 = []
				_.each(swap_obj.other_graphs, function (g_id) {
					vn_group2 = vn_group2.concat(self.graph.sentence.get_graph_by_id(g_id).get_visible_nodes())
				})
				vn_group2 = _.sortBy(vn_group2, function (vn) {
					return parseInt($(vn.get_view()).css('order'))
				})
				var vn_group2_positions = _.map(vn_group2, function (vn) {
					return parseInt($(vn.get_view()).css('order'))
				})
				var gvn = []
				var gvn_positions = []
				var swaps_with_nodes = []
				var swaps_with_positions = []
				if (_.contains(swap_obj.graphs, self.graph.id)) {
					gvn = vn_group1
					gvn_positions = vn_group1_positions
					swaps_with_nodes = vn_group2
					swaps_with_positions = vn_group2_positions
				} else {
					gvn = vn_group2
					gvn_positions = vn_group2_positions
					swaps_with_nodes = vn_group1
					swaps_with_positions = vn_group1_positions
				}

				self.graph.sentence.remove_nodes(gvn)
				var new_positions = _.range(gvn.length)
				if (_.min(swaps_with_positions) < _.min(gvn_positions)) {
					var st = _.min(swaps_with_positions)
					new_positions = _.map(new_positions, function (i) {
						return i + st
					})
				} else {
					swaps_with_positions = _.map(swaps_with_positions, function (i) {
						return i - gvn.length
					})
					var st = _.max(swaps_with_positions) + 1
					new_positions = _.map(new_positions, function (i) {
						return i + st
					})
				}

				self.graph.sentence.add_nodes(gvn, new_positions, param)
				self.graph.sentence.update_external_reorder_options(gvn, param)
				self.graph.sentence.update_external_reorder_options(swaps_with_nodes, param)
				_.each(swap_obj.graphs.concat(swap_obj.other_graphs), function (g_id) {
					var g = self.graph.sentence.get_graph_by_id(g_id)
					//console.log("swapping s_obj in gid" + g.id)
					var swap_flip = _.find(g['swap_toward_' + param.direction], function (so) {
						return so.equals(swap_obj)
					})
					assert(swap_flip != null, 'swap flip is null!!')
					var other_direction = param.direction == 'en' ? 'de' : 'en'
					g['swap_toward_' + param.direction] = _.without(g['swap_toward_' + param.direction], swap_flip)
					g['swap_toward_' + other_direction].push(swap_flip)

				})

				_.each(gvn, function (i) {
					i.update_view_reorder()
				})
				_.each(swaps_with_nodes, function (i) {
					i.update_view_reorder()
				})

			}
		} else if (param.action == 'translate') {
			var modified_nodes = null
			if (param.direction == 'de') {
				modified_nodes = self.graph.translate_from(self, 'de')
			} else {
				modified_nodes = self.graph.translate_from(self, 'en')
			}
			//If the translation action has changed the visible nodes, result will be true
			if (modified_nodes != null) {
				var remove_positions = []
				for (var mnr = 0; mnr < modified_nodes.remove.length; mnr++) {
					remove_positions.push(parseInt($(modified_nodes.remove[mnr].get_view()).css('order')))
				}
				gvn = self.graph.sentence.sort_within_graph(modified_nodes.add, self.graph.internal_reorder_by)
				self.graph.sentence.remove_nodes(modified_nodes.remove)
				if (modified_nodes.add.length == 1 && modified_nodes.remove.length == 1) {
					//simple case
					self.graph.sentence.add_nodes(gvn, remove_positions, param)
					self.graph.sentence.update_external_reorder_options(gvn, param)
					_.each(gvn, function (i) {
						i.update_view_reorder()
					})
				} else if (modified_nodes.add.length > 1 && modified_nodes.remove.length == 1) {
					//if many adds and 1 remove all adds placed in same position as remove
					var pos = remove_positions[0]
					var insert_idx = _.map(modified_nodes.add, function () {
						pos += 1
						return pos - 1
					})

					self.graph.sentence.add_nodes(gvn, insert_idx, param)
					self.graph.sentence.update_external_reorder_options(gvn, param)

					_.each(gvn, function (i) {
						i.update_view_reorder()
					})
				} else if (modified_nodes.add.length == 1 && modified_nodes.remove.length > 1) {

					var insert_idx = null
					if (self.graph.splits) {
						var target_order = self.graph['split_order_by_' + param.direction]
						var separator_nodes = _.map(target_order, function (t_id) {
							if (t_id == self.graph.id) {
								return ['INSERT HERE']
							} else {
								return self.graph.sentence.get_graph_by_id(t_id).get_visible_nodes()
							}
						})
						separator_nodes = _.flatten(separator_nodes)
						var separator_node_positions = _.map(separator_nodes, function (sn) {
							if (sn == 'INSERT HERE') {
								return 'INSERT HERE'
							} else {
								return parseInt($(sn.get_view()).css('order'))
							}

						})
						console.log("ok")
						var ih = _.findIndex(separator_node_positions, function (snp) {
							return snp == 'INSERT HERE'
						})
						if (ih == 0) {
							insert_idx = _.min(separator_node_positions)
						} else {
							insert_idx = separator_node_positions[ih - 1] + 1
						}
						self.graph.split_to = param.direction == 'en' ? 'de' : 'en'

						self.graph.sentence.add_nodes(modified_nodes.add, [insert_idx], param)
						self.graph.sentence.update_external_reorder_options(modified_nodes.add, param)
						_.each(modified_nodes.add, function (i) {
							i.update_view_reorder()
						})

					} else {
						assert(is_contiguous(remove_positions))
						insert_idx = [_.min(remove_positions)]
						self.graph.sentence.add_nodes(modified_nodes.add, insert_idx, param)
						self.graph.sentence.update_external_reorder_options(modified_nodes.add, param)
						_.each(modified_nodes.add, function (i) {
							i.update_view_reorder()
						})
					}
				} else {
					assert(0 > 1, 'translations from many to many is not possible anymore!!!')
				}
			}
		} else {
			//console.log("Invalid action:  " + param.action)
		}
		var after = JSON.stringify(self.graph.sentence.getLogObjs())
		var sm = new SocketMessage(username, rule, before, after)
		if (socket != null) {
			socket.emit('logEvent', sm)
		}
	}

	this.get_translate_preview_view = function (addNodes, bounds) {

		var preview_elements = {main: [], additional: []}
		/*var pv = document.createElement('div')
		$(pv).addClass('previewDiv')
		$(pv).on('mouseover', function () {
			self.onPreview()
		})
		$(pv).on('mouseleave', function () {
			self.offView('offPreview')
		})*/
		_.each(addNodes, function (an) {
			var ps = document.createElement('span')
			ps.innerHTML = an.s
			$(ps).addClass("preview translation")
			$(ps).addClass(an.lang)
			//pv.appendChild(ps)
			preview_elements.main.push(ps)
		})

		//return [pv]
		return preview_elements
	}

	this.get_transfer_preview_view = function (bounds, other_bounds, draw_up, moving_to_end) {
		var gap = Math.abs(bounds.left - other_bounds.left)
		var bounds_mid = (bounds.left + bounds.right) / 2
		var other_bounds_mid = null
		if (other_bounds.left < bounds.left) {
			other_bounds_mid = other_bounds.left
		} else {
			other_bounds_mid = other_bounds.right
		}
		var mid_x = bounds_mid < other_bounds_mid ? bounds_mid + gap / 2 : other_bounds_mid + gap / 2
		var mid_y = bounds.top + (bounds.height / 2)
		var sentence_container = this.graph.sentence.get_container()
		var curve_up = draw_up ? bounds.height + 20 : -bounds.height - 20
		var shift_up = draw_up ? 10 : -10
		var preview_view = $(sentence_container).curvedArrow({
																 p0x: bounds_mid,
																 p0y: bounds.top + bounds.height / 2 + shift_up,
																 p1x: mid_x,
																 p1y: mid_y + curve_up,
																 p2x: other_bounds_mid,
																 p2y: other_bounds.top + other_bounds.height / 2 + shift_up,
																 id: "previewOverlayArrow"
															 })
		var line = $(sentence_container).straightline({
														  p0x: bounds.left + 5,
														  p0y: bounds.top + bounds.height / 2 + 10,
														  p1x: bounds.right - 5,
														  p1y: bounds.top + bounds.height / 2 + 10,
														  id: "previewLine"
													  })
		$(preview_view).addClass("preview")
		$(line).addClass("preview")
		return [preview_view, line]

	}

	this.get_split_preview_view = function (pathDiv, still_bounds, moving_bounds, moving_to_bounds, direction) {

		return drawSwap('split', pathDiv, moving_bounds, moving_to_bounds, still_bounds, 3.5, direction, direction == 'en' ? '#028090' : '#666666');
		/*var gap = Math.abs(moving_to_bounds.left - moving_bounds.left)
		var bounds_mid = (moving_bounds.left + moving_bounds.right) / 2
		var other_bounds_mid = moving_to_bounds.left
		if (left) {
			other_bounds_mid = moving_to_bounds.left
		} else {
			other_bounds_mid = moving_to_bounds.right
		}

		var mid_x = bounds_mid < other_bounds_mid ? bounds_mid + gap / 2 : other_bounds_mid + gap / 2
		var mid_y = still_bounds.top + (still_bounds.height / 2)

		var sentence_container = this.graph.sentence.get_container()

		var preview_view = $(sentence_container).curvedArrow({
																 p0x: bounds_mid,
																 p0y: still_bounds.top + still_bounds.height / 2 - 10,
																 p1x: mid_x,
																 p1y: mid_y - still_bounds.height - 20,
																 p2x: other_bounds_mid,
																 p2y: moving_bounds.top + moving_bounds.height / 2 - 10,
																 id: "previewOverlayArrow",
																 strokeStyle: '#BD587C'
															 })

		var line = $(sentence_container).straightline({
														  p0x: still_bounds.left + 5,
														  p0y: still_bounds.top + still_bounds.height / 2 + 10,
														  p1x: still_bounds.right - 5,
														  p1y: still_bounds.top + still_bounds.height / 2 + 10,
														  size: 1,
														  id: "previewLine",
														  strokeStyle: '#BD587C'
													  })
		var line2 = $(sentence_container).straightline({
														   p0x: moving_bounds.left + 5,
														   p0y: moving_bounds.top + moving_bounds.height / 2 + 10,
														   p1x: moving_bounds.right - 5,
														   p1y: moving_bounds.top + moving_bounds.height / 2 + 10,
														   size: 1,
														   id: "previewLine",
														   strokeStyle: '#BD587C'
													   })
		$(preview_view).addClass("preview split")
		$(line).addClass("preview split")
		$(line2).addClass("preview split")
		return [preview_view, line, line2]*/
	}

	this.get_swap_preview_view = function (pathDiv, bounds, other_bounds, direction) {
		return drawSwap('external', pathDiv, bounds, other_bounds, null, 3.5, direction, direction == 'en' ? '#028090' : '#666666');
		/*var gap = Math.abs(bounds.left - other_bounds.left)
		var bounds_mid = (bounds.left + bounds.right) / 2
		var other_bounds_mid = 0

		if (other_bounds.left > bounds.left) {
			other_bounds_mid = other_bounds.right
			bounds_mid = bounds.right
		}
		if (other_bounds.left < bounds.left) {
			other_bounds_mid = other_bounds.left
			bounds_mid = bounds.left
		}

		var mid_x = bounds_mid < other_bounds_mid ? bounds_mid + gap / 2 : other_bounds_mid + gap / 2
		var shift = 0
		var shift_y = 0
		if (direction == 'en') {
			shift = -20
			shift_y = bounds.top
		} else {
			shift = 20
			shift_y = bounds.top + bounds.height
		}

		var sentence_container = this.graph.sentence.get_container()
		var preview_view = $(sentence_container).curvedArrow({
																 p0x: bounds_mid,
																 p0y: shift_y,
																 p1x: mid_x,
																 p1y: shift_y + shift,
																 p2x: other_bounds_mid,
																 p2y: shift_y,
																 doubleSided: false,
																 id: "previewOverlayArrow"
															 })

		var linebox = $(sentence_container).MyBox({
													  px: bounds.left,
													  py: bounds.top,
													  b_width: Math.abs(bounds.left - bounds.right),
													  b_height: bounds.height,
													  size: 1,
													  text: '',
													  direction: direction,
													  id: "previewBox"
												  })

		$(preview_view).addClass("preview swap")
		$(linebox).addClass("preview swap")
		return [preview_view, linebox]*/
	}

	this.offView = function (fromdiv) {

		if (fromdiv == 'offPreview') {
			//console.log("offView from preview div")
			//self.out_of_preview_view = true
		} else if (fromdiv == 'offView') {
			//console.log('off view from node menu container')
			//self.out_of_main_view = true
		}

		if (self.out_of_main_view && self.out_of_preview_view) {
			//console.log("removing preview!!")
			//self.unpreview_action()
		}
	}

	this.get_view = function () {
		if (this.view == null) {
			this.view = document.createElement('div')
			this.view.node = this
			this.view.inDom = false
			this.view.highlight_movement = false

			$(this.view).addClass('item')
			var menu_container = document.createElement('div')
			$(menu_container).addClass('node_menu_container')
			$(this.view).append($(menu_container))

			$(menu_container).on('mouseenter', function (e) {

				//self.preview_action()
			})
			$(menu_container).on('click', function (e) {

				console.log("clicked node menu container")
			})
			/*$(translation_selector).on('mouseleave', function () {
				self.unpreview_action()
			})*/

			/*if (!this.to_de) {
				$(translation_selector).hide()
			}*/
			/*var split_reorder_selector = document.createElement('div')
			$(split_reorder_selector).addClass('split_reorder_selector')
			$(menu_container).append($(split_reorder_selector))*/
			/*$(split_reorder_selector).on('click', function () {
				self.take_action({action: 'split reorder', direction: 'de'})
			})*/

			/*var external_reorder_selector = document.createElement('div')
			$(external_reorder_selector).addClass('external_reorder_selector')
			$(external_reorder_selector).addClass('tode')
			$(menu_container).append($(external_reorder_selector))
			$(external_reorder_selector).on('click', function () {
				self.take_action({action: 'external reorder', direction: 'de'})
			})*/
			/*$(menu_container).on('mouseover', function () {
				self.preview_action({action: 'external reorder', direction: 'de'})
			})*/

			/*$(external_reorder_selector).on('mouseleave', function () {
				self.unpreview_action()
			})*/

			/*this.view.translation_selector_to_de = translation_selector
			this.view.split_reorder_selector_to_de = split_reorder_selector
			this.view.external_reorder_selector_to_de = external_reorder_selector*/
			var s = document.createElement('span')
			s.innerHTML = this.s
			this.view.textSpan = s
			$(s).addClass("textspan")
			$(s).addClass(this.lang)
			$(this.view).append($(s))

			$(s).on('mouseenter', function (e) {
				//self.preview_action({action: 'external reorder', direction: 'en'})
				//self.preview_action({action: 'translate', direction: 'en'})
				self.isMouseOver = true
				setTimeout(self.delayed_preview, 500);
				//self.preview_action()
			})
			$(s).on('mouseleave', function () {
				self.isMouseOver = false
			})
			var bottom_menu_container = document.createElement('div')
			$(bottom_menu_container).addClass('node_menu_container')
			$(this.view).append($(bottom_menu_container))
			/*translation_selector = document.createElement('div')
			$(translation_selector).addClass('translation_selector')
			$(bottom_menu_container).append($(translation_selector))*/
			$(bottom_menu_container).on('mouseenter', function (e) {
				//self.preview_action({action: 'external reorder', direction: 'en'})
				//self.preview_action({action: 'translate', direction: 'en'})

				//self.preview_action('en')
			})
			$(bottom_menu_container).on('mouseleave', function (e) {
				//self.preview_action({action: 'external reorder', direction: 'en'})
				//self.preview_action({action: 'translate', direction: 'en'})
				//console.log("asking unpreview now")
				//self.unpreview_action()
			})
			$(bottom_menu_container).on('click', function (e) {

				console.log("clicked node menu container")
			})
			$(bottom_menu_container).on('mouseleave', function (e) {

				self.offView('offView')
			})
			/*$(translation_selector).on('click', function () {
				self.take_action({action: 'translate', direction: 'en'})
			})*/
			/*$(translation_selector).on('mouseover', function () {
				self.preview_action({action: 'translate', direction: 'en'})
			})*/
			/*$(translation_selector).on('mouseleave', function () {
				self.unpreview_action()
			})*/

			/*if (!this.to_en) {
				$(translation_selector).hide()
			}*/
			/*split_reorder_selector = document.createElement('div')
			$(split_reorder_selector).addClass('split_reorder_selector')
			$(bottom_menu_container).append($(split_reorder_selector))*/
			/*$(split_reorder_selector).on('click', function () {
				self.take_action({action: 'split reorder', direction: 'en'})
			})*/

			/*external_reorder_selector = document.createElement('div')
			$(external_reorder_selector).addClass('external_reorder_selector')
			$(external_reorder_selector).addClass('toen')
			$(bottom_menu_container).append($(external_reorder_selector))
			$(external_reorder_selector).on('click', function () {
				self.take_action({action: 'external reorder', direction: 'en'})
			})*/
			/*$(external_reorder_selector).on('mouseover', function () {
				self.preview_action({action: 'external reorder', direction: 'en'})
			})*/
			/*$(external_reorder_selector).on('mouseleave', function () {
				self.unpreview_action()
			})*/

			/*this.view.translation_selector_to_en = translation_selector
			this.view.split_reorder_selector_to_en = split_reorder_selector
			this.view.external_reorder_selector_to_en = external_reorder_selector*/

			return this.view
		} else {
			return this.view
		}
	}
}
function Edge() {
	this.from_id = null
	this.to_id = null
	this.direction = null
	this.graph = null
}
function Swap() {
	this.head = null
	this.graphs = []
	this.other_graphs = []

	this.equals = function (other_swap) {
		//console.log("swap equal test:" + this.graphs + " and " + this.other_graphs)
		//console.log("swap equal test:" + other_swap.graphs + " and " + other_swap.other_graphs)
		var is_eq = true
		var swap_all_graphs = this.graphs.concat(this.other_graphs)
		swap_all_graphs.sort(sortNumber)
		var other_swap_all_graphs = other_swap.graphs.concat(other_swap.other_graphs)
		other_swap_all_graphs.sort(sortNumber)
		_.each(_.zip(swap_all_graphs, other_swap_all_graphs), function (a) {
			//console.log(a[0] + "vs" + a[1])
			is_eq = is_eq && a[0] == a[1]
		})

		//console.log("returning " + is_eq)
		return is_eq
	}
}

function Graph() {
	var self = this
	this.id = null
	this.nodes = []
	this.edges = []
	this.sentence = null
	this.internal_reorder_by = 'en'
	this.external_reorder_by = 'en'
	this.initial_order = null

	this.swaps = false
	this.swap_toward_de = []
	this.swap_toward_en = []

	this.splits = false
	this.separators = null
	this.separator_positions = null
	this.is_separator = false
	this.split_interactions = null

	this.split_order_by_en = null
	this.split_order_by_de = null
	this.split_to = null

	this.get_swap = function (direction) {
		var swap_sized = _.sortBy(self['swap_toward_' + direction], function (s) {
			return s.graphs.length + s.other_graphs.length
		})
		return swap_sized[swap_sized.length - 1]

	}

	this.get_bounding_of_visible_nodes = function () {
		var my_vn = self.get_visible_nodes()
		var first = my_vn[0].get_view_text_position()
		var last = my_vn[my_vn.length - 1].get_view_text_position()
		return {top: first.top, left: first.left, right: last.left + last.width, height: first.height}
	}

	this.set_initial_view = function () {
		for (var i = 0; i < this.nodes.length; i++) {
			var n = this.nodes[i]
			if (n.visible) {
				n.update_view_reorder()
			}
		}
	}
	this.get_visible_nodes = function () {
		var result = []
		for (var i in this.nodes) {
			if (this.nodes[i].visible) {
				result.push(this.nodes[i])
			}
		}
		result = _.sortBy(result, function (n) {
			return parseInt($(n.get_view()).css('order'))
		})
		return result
	}
	this.get_node_by_ids = function (ids) {
		var result = []
		for (var i in ids) {
			for (var n in self.nodes) {
				if (self.nodes[n].id == ids[i]) {
					result.push(self.nodes[n])
				}
			}
		}
		return result
	}
	this.get_visible_directional_neighbors = function (node, direction) {
		var neighbors = []
		for (var i in self.edges) {
			if (self.edges[i].from_id == node.id && self.edges[i].direction == direction) {
				var n = self.get_node_by_ids([self.edges[i].to_id])[0]
				if (n.visible) {
					neighbors.push(n)
				} else {
					neighbors = neighbors.concat(self.get_visible_directional_neighbors(n, direction))
				}
			}
		}
		return neighbors
	}
	this.get_directional_neighbors = function (node, direction) {
		var neighbor_ids = []
		for (var i in self.edges) {
			if (self.edges[i].from_id == node.id && self.edges[i].direction == direction) {
				neighbor_ids.push(self.edges[i].to_id)
			}
		}
		return self.get_node_by_ids(neighbor_ids)
	}
	this.translate_from = function (node, direction) {
		var neighbors = self.get_directional_neighbors(node, direction)
		if (neighbors.length > 0) {
			var nodes_to_remove = []
			//remove inverse neighbors of the nodes going to be added
			for (var i in neighbors) {
				var inv_neighbors = self.get_visible_directional_neighbors(neighbors[i], direction == 'en' ? 'de' : 'en')
				nodes_to_remove = nodes_to_remove.concat(inv_neighbors)
			}
			nodes_to_remove = _.uniq(nodes_to_remove)
			//self.remove_nodes(nodes_to_remove)
			//console.log('added ' + neighbors.length + ' nodes to visible_nodes')
			var result = {}
			result.add = neighbors
			result.remove = nodes_to_remove
			return result
		} else {
			//console.log('can not translate in the given direction, nothing to remove or add')
			return null
		}
	}
	this.initializeGraph = function (sentence) {
		self.sentence = sentence
		for (var i in self.nodes) {
			self.nodes[i].graph = self
			if (self.nodes[i].visible) {
				self.sentence.visible_nodes.push(self.nodes[i]) //adds visible nodes to main sentence.visible_nodes
			}
		}
		for (var i in self.edges) {
			self.edges[i].graph = self
		}
	}
}
function Sentence() {
	var self = this
	this.en = ""
	this.de = ""
	this.id = null
	this.alignment = null
	this.graphs = []
	this.visible_nodes = []
	this.container = null
	this.initial_order_by = null

	this.remove_all_previews = function (exception) {
		_.each(self.visible_nodes, function (vn) {
			if (exception != null) {
				if (exception.s != vn.s) {
					//console.log('removing ' + vn.s + ' exception is ' + exception.s)
					vn.unpreview_action()
				}
			} else {
				//console.log('removing ' + vn.s + " NULL is exception")
				vn.unpreview_action()
			}
		})
	}

	this.get_graph_by_id = function (gid) {
		for (var i = 0; i < this.graphs.length; i++) {
			var g = this.graphs[i]
			if (g.id == gid) {
				return g
			}
		}
	}

	this.initialize = function (mainview) {
		self.container = self.get_container()
		mainview.append($(self.get_container()))
		self.graphs = _.sortBy(self.graphs, function (graph) {
			return graph.initial_order
		})
		for (var i in self.graphs) {
			self.graphs[i].initializeGraph(self)
		}

	}
	this.sort_visible_nodes_by_display_order = function () {
		self.visible_nodes = _.sortBy(self.visible_nodes, function (node) {
			return parseInt($(node.get_view()).css('order'))
		});
	}
	this.assign_display_order_by_array_order = function () {
		for (var i in self.visible_nodes) {
			$(self.visible_nodes[i].get_view()).css('order', i)
		}
	}
	this.sort_within_graph = function (nodes, within_graph_ordering) {
		var nodes = _.sortBy(nodes, function (node) {
			if (within_graph_ordering == 'en') {
				return node.en_id
			} else {
				return node.de_id
			}
		});
		return nodes
	}
	this.rec = function (current_num, max_num) {
		for (var i = current_num + 1; i <= max_num; i++) {
			self.rec((i, max_num))
		}
	}
	this.score_configuration_overlap = function (config, nodes_to_insert, g_order, nodes_to_ignore) {
		var visible_nodes_copy = []
		for (var v = 0; v < self.visible_nodes.length; v++) {
			if ($.inArray(self.visible_nodes[v], nodes_to_ignore) == -1) {
				visible_nodes_copy.push(self.visible_nodes[v])
			}
		}
		//config.sort()
		for (var c = 0; c < config.length; c++) {
			visible_nodes_copy.splice(config[c], 0, nodes_to_insert[c])
		}
		var score = 0
		for (var c = 0; c < config.length; c++) {
			var node_at_site = nodes_to_insert[c]
			var left_gids = self.get_neighbor_graph_ids(config[c], 'left', visible_nodes_copy)
			var right_gids = self.get_neighbor_graph_ids(config[c], 'right', visible_nodes_copy)
			var gold_left_gids = node_at_site[g_order + "_left"]
			var gold_right_gids = node_at_site[g_order + "_right"]
			var gold_left_gids_copy = []
			var gold_right_gids_copy = []
			for (var gr = 0; gr < gold_right_gids.length; gr++) {
				gold_right_gids_copy.push(gold_right_gids[gr])
			}
			for (var gl = 0; gl < gold_left_gids.length; gl++) {
				gold_left_gids_copy.push(gold_left_gids[gl])
			}
			if (left_gids.length < gold_left_gids_copy) {
				left_gids = pad_array(left_gids, gold_left_gids_copy.length)
			} else if (left_gids.length > gold_left_gids_copy) {
				gold_left_gids_copy = pad_array(gold_left_gids_copy, left_gids.length)
			} else {
			}
			if (right_gids.length < gold_right_gids_copy.length) {
				right_gids = pad_array(right_gids, gold_right_gids_copy.length)
			} else if (right_gids.length > gold_right_gids_copy.length) {
				gold_right_gids_copy = pad_array(gold_right_gids_copy, right_gids.length)
			} else {
			}
			var score = 0
			////console.log("done")
			for (var l = 0; l < gold_left_gids_copy.length; l++) {
				score += (gold_left_gids_copy[l] == left_gids[l] ? 1 : 0)
			}
			for (var r = 0; r < gold_right_gids_copy.length; r++) {
				score += (gold_right_gids_copy[r] == right_gids[r] ? 1 : 0)
			}
		}
		////console.log("config:" + config + " alignment:" + alignment_score)
		return score
	}

	this.remove_cosecutive_duplicate = function (list) {
		var new_list = []
		var prev = null
		for (var i = 0; i < list.length; i++) {
			if (list[i] != prev) {
				new_list.push(list[i])
				prev = list[i]
			}
		}
		return new_list
	}

	this.score_configuration_alignment_unq = function (config, nodes_to_insert, g_order, nodes_to_ignore) {
		var visible_nodes_copy = []
		for (var v = 0; v < self.visible_nodes.length; v++) {
			if ($.inArray(self.visible_nodes[v], nodes_to_ignore) == -1) {
				visible_nodes_copy.push(self.visible_nodes[v])
			}
		}
		//config.sort()
		for (var c = 0; c < config.length; c++) {
			visible_nodes_copy.splice(config[c], 0, nodes_to_insert[c])
		}
		var alignment_score = 0
		for (var c = 0; c < config.length; c++) {
			var node_at_site = nodes_to_insert[c]
			var left_gids = self.remove_cosecutive_duplicate(self.get_neighbor_graph_ids(config[c], 'left', visible_nodes_copy))
			var right_gids = self.remove_cosecutive_duplicate(self.get_neighbor_graph_ids(config[c], 'right', visible_nodes_copy))
			var gold_left_gids = self.remove_cosecutive_duplicate(node_at_site[g_order + "_left"])
			var gold_right_gids = self.remove_cosecutive_duplicate(node_at_site[g_order + "_right"])

			var z = _.zip(left_gids, gold_left_gids)
			for (var zidx = 0; zidx < z.length; zidx++) {
				var currrent_neighbor_ids = z[zidx][0]
				var gold_neighbor_id = z[zidx][1]
				if (currrent_neighbor_ids != null && gold_neighbor_id != null) {
					if ($.inArray(gold_neighbor_id, currrent_neighbor_ids) != -1) {
						alignment_score += Math.exp(-zidx)
					} else {
						alignment_score -= Math.exp(-zidx)
					}
				} else {
					alignment_score -= Math.exp(-zidx)
				}
			}

			var z = _.zip(right_gids, gold_right_gids)
			for (var zidx = 0; zidx < z.length; zidx++) {
				var currrent_neighbor_ids = z[zidx][0]
				var gold_neighbor_id = z[zidx][1]
				if (currrent_neighbor_ids != null && gold_neighbor_id != null) {
					if ($.inArray(gold_neighbor_id, currrent_neighbor_ids) != -1) {
						alignment_score += Math.exp(-zidx)
					} else {
						alignment_score -= Math.exp(-zidx)
					}
				} else {
					alignment_score -= Math.exp(-zidx)
				}
			}
		}
		////console.log("config:" + config + " alignment:" + alignment_score)
		return alignment_score
	}
	this.get_best_configuration = function (nodes_to_insert, g_order, nodes_to_ignore) {
		var configurations = get_possible_configurations(self.visible_nodes.length - nodes_to_ignore.length, nodes_to_insert.length, 0)
		var best_config = []
		var max = Number.NEGATIVE_INFINITY
		for (var c in configurations) {
			//var use_score1 = self.score_configuration_alignment(configurations[c], nodes_to_insert, g_order)
			var use_score2 = self.score_configuration_alignment_unq(configurations[c], nodes_to_insert, g_order, nodes_to_ignore)
			//var use_score3 = self.score_configuration_overlap(configurations[c], nodes_to_insert, g_order, nodes_to_ignore)
			var use_score = use_score2 //(use_score2 * 0.9) + (use_score3 * 0.1)
			//console.log("config:" + configurations[c] + " a_unq:" + use_score2)
			if (use_score > max) {
				max = use_score
				best_config = []
				best_config.push(configurations[c])
			} else if (use_score == max) {
				best_config.push(configurations[c])
			} else {
			}
		}
		return best_config
	}
	this.update_external_reorder_options = function (nodes, param) {
		for (var c = 0; c < nodes.length; c++) {
			var n = nodes[c]
			if (n.graph.transfers && param.action == 'external reorder') {
				n.graph.external_reorder_by = param.direction
			}
			if (n.graph.swaps && param.action == 'external reorder') {
				n.graph.external_reorder_by = param.direction

			}

		}
	}
	this.getLogObjs = function () {
		var logObjs = []
		_.each(self.visible_nodes, function (vn) {
			logObjs.push(vn.getLogObj())
		})
		return logObjs
	}
	this.add_nodes = function (nodes, nodes_idx, param) {
		self.sort_visible_nodes_by_display_order()
		for (var c = 0; c < nodes_idx.length; c++) {
			self.visible_nodes.splice(nodes_idx[c], 0, nodes[c])
			nodes[c].visible = true
		}
		self.assign_display_order_by_array_order()
		self.update_visible_nodes()
	}
	this.get_neighbor_graph_ids = function (ps, neighbor_direction, base_array) {
		var graphs_ids = []
		if (neighbor_direction == 'right') {
			for (var i = ps + 1; i < base_array.length; i++) {
				var g = base_array[i].graph
				var lst = [g.id]
				if (g.swaps) {
					lst = lst.concat(g.swaps_with)
				}
				if (g.splits) {
					lst = lst.concat(g.separators)
				}
				if (g.is_separator) {
					lst = lst.concat(g.split_interactions)
				}
				graphs_ids.push(lst)

			}
			graphs_ids.push(['*EN*'])
		} else if (neighbor_direction == 'left') {
			for (var i = ps - 1; i >= 0; i--) {
				var g = base_array[i].graph
				var lst = [g.id]
				if (g.swaps) {
					lst = lst.concat(g.swaps_with)
				}
				if (g.splits) {
					lst = lst.concat(g.separators)
				}
				if (g.is_separator) {
					lst = lst.concat(g.split_interactions)
				}
				graphs_ids.push(lst)
			}
			graphs_ids.push(['*ST*'])
		} else {
			//console.log('invalid neighborhood direction')
		}
		return graphs_ids
	}
	this.remove_nodes = function (nodes) {
		for (var i in nodes) {
			var node = nodes[i]
			node.visible = false
			self.visible_nodes = _.reject(self.visible_nodes, function (n) {
				if (n == node) {
					var item = node.get_view()
					item.inDom = false
					$(item).detach()
					return true
				} else {
					return false
				}
			});
		}
		self.assign_display_order_by_array_order()
		self.update_visible_nodes()
	}
	this.get_container = function () {
		if (this.container == null) {
			this.container = document.createElement('div')
			$(this.container).addClass('container')
			$(this.container).on('mouseleave', function () {
				$(self.remove_all_previews(null))
			})
			return this.container
		} else {
			return this.container
		}
	}
	this.set_initial_view = function () {
		for (var i = 0; i < this.graphs.length; i++) {
			this.graphs[i].set_initial_view()
		}
	}
	this.initial_order = function () {
		//assigns order of the visible nodes initially
		console.log('ok')
		for (var i in self.visible_nodes) {
			var item = self.visible_nodes[i].get_view()
			$(item).css('order', i)
		}
	}

	this.update_visible_nodes = function () {
		for (var i in self.visible_nodes) {
			var item = self.visible_nodes[i].get_view()
			////console.log("order :" + $(item).css('order') + "  is the order of " + item.node.s)
			if (item.inDom) {
			} else {
				$(self.get_container()).append($(item))
				$(item.span).css("backgroundColor", "orange");
				$(item.span).animate({ backgroundColor: "transparent" }, 400);
				item.inDom = true
			}
			if (item.highlight_movement) {
				$(item.span).css("backgroundColor", "orange");
				$(item.span).animate({ backgroundColor: "transparent" }, 400);
				item.highlight_movement = false
			} else {
				////console.log("no movement")
			}
		}
	}
	this.get_node_by_order = function (order) {
		var found_node = null
		_.each(self.visible_nodes, function (vn) {
			if (order == parseInt($(vn.get_view()).css('order'))) {
				found_node = vn
			}
		})
		return found_node
	}
}
Edge.parse = function (input) {
	var e = new Edge()
	e.from_id = input.from_id
	e.to_id = input.to_id
	e.direction = input.direction
	return e
}
Node.parse = function (input) {
	var n = new Node()
	n.id = input.id
	n.s = input.s
	n.en_id = input.en_id
	n.de_id = input.de_id
	n.lang = input.lang
	n.visible = input.visible
	n.en_left = input.en_left
	n.en_right = input.en_right
	n.de_left = input.de_left
	n.de_right = input.de_right
	n.to_en = input.to_en
	n.to_de = input.to_de
	n.ir = input.ir
	return n
}
Swap.parse = function (input) {
	var s = new Swap()
	s.head = input.head
	s.graphs = input.graphs
	s.other_graphs = input.other_graphs
	s.graphs.sort(sortNumber)
	s.other_graphs.sort(sortNumber)
	return s
}

Graph.parse = function (input) {
	var g = new Graph()
	g.id = input.id
	g.er = input.er
	g.ir = input.ir
	g.internal_reorder_by = input.internal_reorder_by
	g.external_reorder_by = input.external_reorder_by
	g.initial_order = input.initial_order
	g.splits = input.splits
	g.swaps = input.swaps
	g.separators = input.separators

	g.separator_positions = input.separator_positions
	g.is_separator = input.is_separator
	g.split_interactions = input.split_interactions
	g.split_order_by_en = input.split_order_by_en
	g.split_order_by_de = input.split_order_by_de
	g.split_to = input.split_to

	for (var i in input.swap_toward_de) {
		g.swap_toward_de.push(Swap.parse(input.swap_toward_de[i]))
	}
	for (var i in input.swap_toward_en) {
		g.swap_toward_en.push(Swap.parse(input.swap_toward_en[i]))
	}
	for (var i in input.nodes) {
		g.nodes.push(Node.parse(input.nodes[i]))
	}
	for (var i in input.edges) {
		g.edges.push(Edge.parse(input.edges[i]))
	}
	return g
}
Sentence.parse = function (input) {
	var s = new Sentence()
	s.en = input.en
	s.de = input.de
	s.id = input.id
	s.alignment = input.alignment
	s.initial_order_by = input.initial_order_by
	for (var i in input.graphs) {
		s.graphs.push(Graph.parse(input.graphs[i]))
	}
	return s
}
function async(your_function, arg, callback) {
	setTimeout(function () {
		your_function(arg);
		if (callback) {
			callback();
		}
	}, 0);
}

function get_bounding_of_nodes(list_of_nodes) {
	var min_left = Number.POSITIVE_INFINITY
	var max_right = 0
	var max_height = 0
	var min_top = Number.POSITIVE_INFINITY
	_.each(list_of_nodes, function (mvn) {
		var pos = mvn.get_view_text_position() //  mvn.get_view_position()
		min_left = min_left < pos.left ? min_left : pos.left
		max_right = max_right > pos.left + pos.width ? max_right : pos.left + pos.width
		min_top = min_top < pos.top ? min_top : pos.top
		max_height = max_height > pos.height ? max_height : pos.height
	})
	return {top: min_top, left: min_left, right: max_right, height: max_height}
}

function precomputations(i) {
	var s = sentences[i]
	s.set_initial_view()
}

function do_precomputations() {
	for (var i = 0; i < sentences.length; i++) {
		async(precomputations, i, null)
	}
}

function receivedJsonSentence(msg) {
	console.log(msg)
	json_sentences = msg
	ok_parse(0, 10)
	do_precomputations()
}

function ok_parse(st, end) {
	end = sentences_per_page < json_sentences.length ? end : json_sentences.length
	for (var i = st; i < end; i++) {
		var jo = JSON.parse(json_sentences[i])
		var s = Sentence.parse(jo)
		s.initialize(mainview)
		s.visible_nodes = _.sortBy(s.visible_nodes, function (vn) {
			if (s.initial_order_by == 'en') {
				return vn.en_id
			} else {
				return vn.de_id
			}
		})
		s.assign_display_order_by_array_order()
		s.update_visible_nodes()
		sentences.push(s)
	}
}

function setup(mview, uname, socketObj) {
	mainview = mview
	username = uname
	socket = socketObj
	if (socket != null) {
		//get json_sentences from server
		socket.emit('requestJsonSentences', 'please')
		console.log("requested sentences from server...")
		socket.on('JsonSentences', receivedJsonSentence);
	} else {
		json_sentences = json_str_arr
		ok_parse(0, 10)
		do_precomputations()

		/*var end = sentences_per_page < json_str_arr.length ? sentences_per_page : json_str_arr.length
		var st = 0
		for (var i = st; i < end; i++) {
			var jo = JSON.parse(json_str_arr[i])
			var s = Sentence.parse(jo)
			s.initialize(mainview)
			s.visible_nodes = _.sortBy(s.visible_nodes, function (vn) {
				if (s.initial_order_by == 'en') {
					return vn.en_id
				} else {
					return vn.de_id
				}
			})
			s.assign_display_order_by_array_order()
			s.update_visible_nodes()
			sentences.push(s)
		}*/
	}

	console.log('user name is ' + username)
}
