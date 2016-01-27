/**
 * Created by arenduchintala on 8/10/15.
 */

var sentences = []
var sentence_ids = []
var page = 0;
var sentences_per_page = 50
var username = null
var points_earned = 0
var progress = 0
var ui_version = 0
var is_preview = false
var socket = null
var json_sentences = []
var mainview = null
var workerId_span = null
var userType_span = null
var pointsEarned_span = null
var global_preview_views = []
var global_preview_classes = []
var previous_log_event = null
var num_of_low_scores
var hitId = 'HIT_ID_NOT_AVAILABLE'
var assignmentId = 'ASSIGNMENT_ID_NOT_AVAILABLE'
var chain_of_nodes = []
var ignoreReorder = false //make this false to use reordering
var revealCorrectInstantly = true

$.fn.stars = function (i) {
	return i.each(function () {
		i.html($('<span />').width(Math.max(0, (Math.min(5, parseFloat(i.html())))) * 16));
	});
}

emitUserTabOut = function () {
	if (socket) {
		socket.emit('userTabbed', {username: username, ui_version: ui_version, sentence_id: sentence_ids[0], assignmentId: assignmentId, hitId: hitId})
	}
}
updateMessageBox = function (message) {
	if (message == $('#messageBox').html()) {
		console.log("same message...")
	} else {
		console.log('MESSAGE BOX' + $('#messageBox').html())
		$('#messageBox').html(message)
		$('#messageBox').css("backgroundColor", "yellow");
		$('#messageBox').animate({ backgroundColor: "transparent" }, 800);
	}

}
scaleIn = function (item) {
	$(item).show("scale", {percent: 100}, 2000)
}

logEventWrapper = function (socket, sm) {
	if (sm.username === "GUEST") {
		console.log("ignore guest logs...")
	} else {
		if (!equalLogs(sm, previous_log_event)) {

			if (socket.disconnected) {
				console.log("socket not connected (log event)")
			} else {
				console.log("logging  event...")
				socket.emit('logEvent', sm)
				previous_log_event = sm
			}

		} else {
			console.log("ignoring same event...")
		}
	}

}

enable_submit = function () {
	/*if (sentences.length > 0 && !is_preview) {
		var points = _.map(sentences, function (s) {
			return parseFloat(s.points_bonus).toFixed(1)
		})
		var product = _.reduce(points, function (memo, num) {
			console.log('product ', num, memo)
			return memo && num >= 4.0;
		}, true);
		console.log(sentences.length + " number of s")
		console.log('submit?', product)
		$('#confirmInput').prop('disabled', !product)
	} else {
		$('#confirmInput').prop('disabled', true)
	}*/
	if (sentences.length > 0 && !is_preview) {
		var points = _.map(sentences, function (s) {
			return parseFloat(s.points_bonus).toFixed(1)
		})
		var product = _.reduce(points, function (memo, num) {
			console.log('product ', num, memo)
			return memo && num >= 4.0;
		}, true);
		console.log(sentences.length + " number of s")
		console.log('submit?', product)
		if (num_of_low_scores >= 10 && !product) {
			$('#confirmInput').prop('disabled', true)
		} else {
			$('#confirmInput').prop('disabled', false)
			updateMessageBox("Click Submit to get your next hit.")
		}
	}
}

logTranslation = function (s) {
	if (username == "GUEST") {
		console.log("ignore guest translations")
	} else {
		var tlm = new TranslationLogMessage(username, ui_version, parseInt(s.id), JSON.stringify(s.get_full_representation()), s.get_visible_string(), s.get_user_translation())
		if (socket.disconnected) {
			console.log("socket not connected (log translation)")
		} else {
			console.log("logging translation...")
			socket.emit('logTranslation', tlm)
		}

	}

}

get_post_parameters = function () {
	var sent_ids = []
	_.each(sentences, function (s) {
		sent_ids.push(s.id)
	});
	sent_ids.toString()
	var metadata = {sentence_id: sent_ids}
	return metadata
}

completedTask = function () {
	console.log("ok now do some things....")
	var total_new_points = 0
	var low_scores = 0
	var sentences_completed = []
	_.each(sentences, function (s) {
		total_new_points += s.points_remaining + s.points_bonus
		if (s.points_bonus <= 1.0) {
			low_scores += 1
		}
		var p = {id: s.id, points_bonus: parseInt(Math.round(parseFloat(s.points_bonus))), points_earned: s.points_remaining}
		sentences_completed.push(p)
	});
	var pp = points_earned + parseFloat(total_new_points)
	var total_ls = num_of_low_scores + low_scores
	console.log("points_earned:", pp, " low scores so far:", total_ls, num_of_low_scores, low_scores)
	var ctm = new CompletedTaskMessage(username, sentences_completed, ui_version, progress + 1, pp, hitId, assignmentId, parseInt(total_ls))
	socket.emit('completedTask', ctm)

}

get_new_task = function (sentence_prefered) {

	if (sentence_prefered != null && sentence_prefered != "") {
		console.log("requesting specific sentence...", sentence_prefered)
		socket.emit('requestSentence', {username: username, sentence_prefered: parseInt(sentence_prefered)})
	} else {
		console.log("emitting user progress request, workerId:" + username)
		socket.emit('requestUserProgress', {username: username})

	}

}

gotoPrevPage = function () {
	console.log("go to prev page")
	page -= 1
	var st = page * sentences_per_page
	var total = json_sentences.length
	var end = st + sentences_per_page
	if (page >= 0) {
		$(mainview).empty()
		sentences = []
		sentence_ids = []
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

	$(mainview).empty()
	sentences = []
	sentence_ids = []
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
	//this.en_left = null // between graph ordering uses these
	//this.en_right = null // between graph ordering uses these
	//this.de_left = null  // between graph ordering uses these
	//this.de_right = null // between graph ordering uses these
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

	this.get_full_representation = function () {
		/*self.id = id
        n.id = input.id
		n.s = input.s
		if (input.s == '@-@') {
			n.s = '-'
		} else {
			n.s = input.s
		}
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
		*/
		var obj = {}
		obj.id = self.id
		if (self.s == '-') {
			obj.s = '@-@'
		} else {
			obj.s = self.s
		}
		obj.en_id = self.en_id
		obj.de_id = self.de_id
		obj.lang = self.lang
		obj.visible = self.visible
		obj.visible_order = self.visible_order
		obj.en_left = self.en_left
		obj.en_right = self.en_right
		obj.de_left = self.de_left
		obj.de_right = self.de_right
		obj.to_en = self.to_en
		obj.to_de = self.to_de
		obj.ir = self.ir
		return obj

	}

	this.get_summarized_obj = function () {
		var logObj = {}
		logObj['order'] = parseInt($(self.get_view()).css('order'))
		logObj['id'] = self.id
		logObj['s'] = self.s
		logObj['visible'] = self.visible
		logObj['lang'] = self.lang
		return logObj
	}

	this.update_view_reorder = function () {
		var view = this.get_view()
		//console.log("s " + self.s + " id " + self.de_id + " current view id" + parseInt($(view).css('order')))
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
		_.each(global_preview_classes, function (pc) {
			$(pc).removeClass('tmpAccept')
		})
		global_preview_classes = []
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
		if (self.isMouseOver && !self.graph.sentence.stopClues) {
			self.preview_action()
		} else {
			console.log("too late")
		}
	}

	this.take_default_action = function (default_type) {

		var default_type = default_type || 'reorder'
		console.log(self.graph.sentence.possibleActions.length + " possible actions...")
		_.each(self.graph.sentence.possibleActions, function (p) {
			console.log('p:', p)
		})
		if (self.graph.sentence.possibleActions.length == 1) {
			var pa = self.graph.sentence.possibleActions[0]
			pa.node.take_action({action: pa.action, direction: pa.direction})
		} else {
			var default_direction = _.filter(self.graph.sentence.possibleActions, function (p) {
				return p.direction == 'en';
			})
			if (default_direction.length == 1) {
				var pa = default_direction[0]
				pa.node.take_action({action: pa.action, direction: pa.direction})
			} else {

				var default_direction_action = _.filter(default_direction, function (p) {
					return p.action.endsWith(default_type)
					//return p.action.endsWith('translate')
				})
				if (default_direction_action.length > 0) {
					console.log('direction_action filter', default_direction_action.length)
					var pa = default_direction_action[0]
					pa.node.take_action({action: pa.action, direction: pa.direction})
				}

			}
		}
	}

	this.has_possible_actions = function (direction) {

		if (self.graph.swaps && self["swap_reorder_" + direction] && !ignoreReorder) {
			return true
		} else if (self.graph.splits && self["split_reorder_" + direction] && !ignoreReorder) {
			return true
		} else {

		}
		var modified_nodes = self.graph.translate_from(self, direction)
		if (modified_nodes != null) {
			return true
		}

		return false

	}

	this.preview_action = function (onlyDefault) {

		var onlyDefault = onlyDefault || false;
		console.log("in preview clearing possible actions")
		self.graph.sentence.possibleActions = []
		self.graph.sentence.remove_all_previews(self)

		//console.log('* *  PREVIEW REORDER ' + direction + '* *')
		var directions = ['en', 'de'] //only show previews in en direction
		if (onlyDefault) {
			directions = ['en']
		}
		var num_swaps = []

		_.each(directions, function (direction) {
			var pv = document.createElement('div')
			$(pv).addClass("previewDiv")
			$(pv).addClass(direction)

			var pv_translate = document.createElement('div')
			$(pv_translate).addClass("previewTranslateContainer")
			$(pv_translate).addClass(direction)

			$(pv).append($(pv_translate))
			var pv_bounds = self.get_view_text_position()
			pv_bounds['right'] = pv_bounds.left + pv_bounds.width

			if (self.graph.swaps && self["swap_reorder_" + direction] && !ignoreReorder) {
				var self_1 = false
				var self_2 = false
				var swap_obj = self.graph.get_swap(direction)
				var bounds = {'height': 0, 'left': Number.POSITIVE_INFINITY, 'right': Number.NEGATIVE_INFINITY, 'top': 0 }
				var bounds_str = []
				_.each(swap_obj.graphs, function (gid) {
					var g = self.graph.sentence.get_graph_by_id(gid)
					self_1 = self_1 || gid == self.graph.id
					var b = g.get_bounding_of_visible_nodes()
					bounds_str.push(g.get_visible_string())
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
				var other_bounds_str = []
				_.each(swap_obj.other_graphs, function (gid) {
					var g = self.graph.sentence.get_graph_by_id(gid)
					self_2 = self_2 || gid == self.graph.id
					var b = g.get_bounding_of_visible_nodes()
					other_bounds_str.push(g.get_visible_string())
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

				var rule_type = JSON.stringify({type: "preview", action: "swap", direction: direction, token: self.s, lang: self.lang})
				var rule = JSON.stringify({selected: bounds_str, swaps: other_bounds_str, direction: direction})
				var visible_before = self.graph.sentence.get_visible_string()
				var full_state = JSON.stringify(self.graph.sentence.get_full_representation())
				//console.log(self.graph.sentence.get_full_representation())
				var sm = new ActivityLogMessage(username, self.graph.sentence.id, ui_version, rule_type, rule, full_state, null, visible_before, null)
				if (socket != null) {
					logEventWrapper(socket, sm)
				}

				if (onlyDefault) {
					num_swaps.push(arrows)
				}

			} else if (self.graph.splits && self["split_reorder_" + direction] && !ignoreReorder) {
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

					if (onlyDefault) {
						num_swaps.push(arrows)
					}

					//TODO log preview of split!

				}

			}

			var modified_nodes = null
			if (direction == 'de') {
				modified_nodes = self.graph.translate_from(self, 'de')
			} else {
				modified_nodes = self.graph.translate_from(self, 'en')
			}
			if (modified_nodes != null) {
				if (self.isTranslationSame(modified_nodes) && false) {
					_.each(modified_nodes.remove, function (tmp) {
						$(tmp.get_view().textSpan).addClass('tmpAccept')
						global_preview_classes.push(tmp.get_view().textSpan)
					})

				} else {
					//do usual
					var bounds = get_bounding_of_nodes(modified_nodes.remove)

					if (Math.abs(bounds.left - bounds.right) > Math.abs(pv_bounds.left - pv_bounds.right)) {
						pv_bounds = bounds
					}

					var translation_items = self.get_translate_preview_view(modified_nodes.add, bounds, direction)
					var rule_type = JSON.stringify({type: "preview", action: "translate", direction: direction, token: self.s, lang: self.lang})
					var rule = JSON.stringify({add: modified_nodes.addStr, remove: modified_nodes.removeStr, direction: direction})
					var visible_before = self.graph.sentence.get_visible_string()
					var full_state = JSON.stringify(self.graph.sentence.get_full_representation)
					var sm = new ActivityLogMessage(username, self.graph.sentence.id, ui_version, rule_type, rule, full_state, null, visible_before, null)
					if (socket != null) {
						logEventWrapper(socket, sm)
					}

					if (onlyDefault) {
						if (num_swaps.length == 0 && direction == 'en') {
							console.log("show translations... ONLY WHEN NO SWAP")
							_.each(translation_items, function (wordSpan) {
								$(pv_translate).append(wordSpan)

							})
							self.graph.sentence.possibleActions.push({node: self, action: 'translate', direction: direction})
						} else {
							console.log("not showing translation...")
						}
					} else {
						console.log("show all translations...")
						_.each(translation_items, function (wordSpan) {
							$(pv_translate).append(wordSpan)

						})
						self.graph.sentence.possibleActions.push({node: self, action: 'translate', direction: direction})
					}

					$(pv_translate).on('mouseenter', function () {
						_.each(document.getElementsByClassName("arrow"), function (arrow) {
							arrow.classList.remove('highlighted')
						})
						if (direction == 'en') {
							$(".preview.translation.enPosition").css('opacity', '1.0')
							$(".preview.translation.dePosition").css('opacity', '0.6')

						} else {
							$(".preview.translation.enPosition").css('opacity', '0.6')
							$(".preview.translation.dePosition").css('opacity', '1.0')

						}
						_.each(modified_nodes.remove, function (rm) {
							$(rm.get_view().textSpan).addClass("affected")
						})

					})
					$(pv_translate).on('mouseleave', function () {
						$('.preview.translation').css('opacity', '0.6')
						_.each(modified_nodes.remove, function (rm) {
							$(rm.get_view().textSpan).removeClass("affected")
						})
					})
					$(pv_translate).on('click', function () {

						_.each(modified_nodes.remove, function (rm) {
							$(rm.get_view().textSpan).removeClass("affected")

						})
						_.each(modified_nodes.add, function (rm) {
							$(rm.get_view().textSpan).removeClass("affected")

						})
						if (direction == 'en') {
							self.take_action({action: 'translate', direction: direction})
						} else {
							console.log("not taking action:", direction)
						}

					})

				}

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
				var is_only_move = true
				_.each(self.graph.sentence.possibleActions, function (pa_so_far) {
					console.log(pa_so_far, " so far!")
					if (pa_so_far.direction == arrows.direction && pa_so_far.action == 'translate') {
						//dont highlight
						is_only_move = false
					}
				})
				if (is_only_move) {

				} else {
					arrows.path[0][0].classList.remove('highlighted')
					arrows.path[0][0].classList.remove('highlighted')
				}
				console.log(is_only_move, "is only movie???")

				$(self.get_view().textSpan).on('mouseenter', function () {
					//self.set_path_attr(arrows, 'arrow highlighted')
					//arrows.path[0][0].classList.add('highlighted')
					//arrows.marker[0][0].classList.add('highlighted')
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
					console.log("left arrows!!!")
					arrows.path[0][0].classList.remove('highlighted')
					arrows.path[0][0].classList.remove('highlighted')
				})
				self.graph.sentence.possibleActions.push({ node: self, action: arrows.type + ' reorder', direction: arrows.direction})
				arrows.path.on('click', function () {
					if (arrows.direction == 'en') {
						console.log("its been clicked!!!")
						self.take_action({action: arrows.type + ' reorder', direction: arrows.direction})

					} else {
						console.log("not taking action:", arrows.direction)
					}
				})
			})
		} else {
			console.log("multiple reorders")
			//$(self.get_view().textSpan).off('click')
			_.each(num_swaps, function (arrows) {
				global_preview_views.push(arrows.parent)
				var container = self.graph.sentence.get_container()
				$(container).append(arrows.parent)

				arrows.path.on('mouseenter', function () {
					//self.set_path_attr(arrows, 'arrow highlighted')
					arrows.path[0][0].classList.add('highlighted')
					arrows.path[0][0].classList.add('highlighted')
					_.each(num_swaps, function (other_arrows) {
						if (!_.isEqual(other_arrows, arrows)) {
							other_arrows.path[0][0].classList.remove('highlighted')
							other_arrows.path[0][0].classList.remove('highlighted')
						}
					})
				})
				arrows.path.on('mouseleave', function () {
					//self.set_path_attr(arrows, 'arrow')
					arrows.path[0][0].classList.remove('highlighted')
					arrows.path[0][0].classList.remove('highlighted')
				})
				self.graph.sentence.possibleActions.push({ node: self, action: arrows.type + ' reorder', direction: arrows.direction})
				arrows.path.on('click', function () {
					if (arrows.direction == 'en' || true) {
						console.log("its been clicked!!!")
						self.take_action({action: arrows.type + ' reorder', direction: arrows.direction})

					}
				})
			})
		}
	}

	this.take_action = function (param) {
		if (!self.graph.sentence.stopClues || ui_version == 0) {
			console.log('action triggered:' + param.action + ',' + param.direction)
			self.graph.sentence.remove_all_previews(null)
			var before = JSON.stringify(self.graph.sentence.get_full_representation())
			var visible_before = self.graph.sentence.get_visible_string()
			var rule_type = JSON.stringify({type: "action", action: param.action, direction: param.direction, token: self.s, lang: self.lang})
			var rule = null
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

					var split_nodes_str = _.map(split_nodes, function (sn) {
						return sn.s
					})
					rule = JSON.stringify({splitNodes: split_nodes_str, direction: param.direction})

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
					var vn_group1_str = _.map(vn_group1, function (vn) {
						return vn.s
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
					var vn_group2_str = _.map(vn_group2, function (vn) {
						return vn.s
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
						rule = JSON.stringify({selected: vn_group1_str, swaps: vn_group2_str, direction: param.direction})
					} else {
						gvn = vn_group2
						gvn_positions = vn_group2_positions
						swaps_with_nodes = vn_group1
						swaps_with_positions = vn_group1_positions
						rule = JSON.stringify({selected: vn_group2_str, swaps: vn_group1_str, direction: param.direction})
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
					rule = JSON.stringify({add: modified_nodes.addStr, remove: modified_nodes.removeStr, direction: modified_nodes.direction})
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
			var after = JSON.stringify(self.graph.sentence.get_full_representation())
			var visible_after = self.graph.sentence.get_visible_string()
			var sm = new ActivityLogMessage(username, self.graph.sentence.id, ui_version, rule_type, rule, before, after, visible_before, visible_after)
			if (socket != null) {
				logEventWrapper(socket, sm)
			}
			if (ui_version == 0) {
				if (self.graph.sentence.points_remaining > 0) {
					var p = self.graph.sentence.points_remaining - ( 10.0 / self.graph.sentence.get_node_count('en'))
					self.graph.sentence.points_remaining = Math.max(0, p)
					self.graph.sentence.changePointsRemaining(parseFloat(self.graph.sentence.points_remaining).toFixed(1))
				}
			} else {
				/*var l2_words_remaining = 0
				_.each(self.graph.sentence.visible_nodes, function (vn) {
					if (vn.lang == 'de' && punct.indexOf(vn.s) == -1) {
						l2_words_remaining += 1
					}
				})
				if (l2_words_remaining == 0) {
					self.graph.sentence.stopClues = true
					self.graph.sentence.wordOptionWrapper.stopClues()
				}*/
			}
		} else {
			console.log("no more clues!!!!")
		}

	}

	this.isTranslationSame = function (modifiedNodes) {
		var addStr = []
		var removeStr = []
		_.each(modifiedNodes.add, function (an) {
			addStr.push(an.s)
		})
		_.each(modifiedNodes.remove, function (rn) {
			removeStr.push(rn.s)
		})
		if (addStr.join([separator = ',']) == removeStr.join([separator = ','])) {
			return true
		} else {
			return false
		}
	}

	this.get_translate_preview_view = function (addNodes, bounds, direction) {

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
			$(ps).addClass(direction + "Position")
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
	}

	this.get_swap_preview_view = function (pathDiv, bounds, other_bounds, direction) {
		return drawSwap('external', pathDiv, bounds, other_bounds, null, 3.5, direction, direction == 'en' ? '#028090' : '#666666');
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
			$(menu_container)

			$(menu_container).on('mouseenter', function (e) {

				//self.preview_action()
			})
			$(menu_container).on('click', function (e) {

				console.log("clicked node menu container")
			})

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
				//setTimeout(self.delayed_preview, 10);
				//self.preview_action()
			})
			$(s).on('mouseleave', function () {
				//self.isMouseOver = false
			})
			var bottom_menu_container = document.createElement('div')
			$(bottom_menu_container).addClass('node_menu_container')
			$(this.view).append($(bottom_menu_container))
			$(this.view.textSpan).on('click', function (e) {
				console.log("take default action...")
				//self.take_default_action()

			})
			$(this.view).on('mouseover', function (e) {
				self.isMouseOver = true
				if (self.lang == 'en') {
					self.preview_action()
				}

				//setTimeout(self.delayed_preview, 100);
			})
			$(this.view).on('mouseleave', function (e) {
				self.isMouseOver = false

			})
			return this.view
		} else {
			return this.view
		}
	}
}
function Edge() {
	var self = this
	this.from_id = null
	this.to_id = null
	this.direction = null
	this.graph = null

	this.get_summarized_obj = function () {
		var obj = {}
		obj['from_id'] = self.from_id
		obj['to_id'] = self.to_id
		obj['direction'] = self.direction
		return obj
	}

	this.get_full_representation = function () {
		/*
		e.from_id = input.from_id
		e.to_id = input.to_id
		e.direction = input.direction
		 */
		return self.get_summarized_obj()

	}
}
function Swap() {
	var self = this
	this.head = null
	this.graphs = []
	this.other_graphs = []

	this.get_full_representation = function () {
		/*
		s.head = input.head
		s.graphs = input.graphs
		s.other_graphs = input.other_graphs
		 */
		var obj = {}
		obj.head = self.head
		obj.graphs = self.graphs
		obj.other_graphs = self.other_graphs
		return obj
	}

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

	this.get_full_representation = function () {
		/*
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
		 */
		var obj = {}
		obj.id = self.id
		obj.er = self.er
		obj.ir = self.ir
		obj.internal_reorder_by = self.internal_reorder_by
		obj.external_reorder_by = self.external_reorder_by
		obj.splits = self.splits
		obj.swaps = self.swaps
		obj.separators = self.separators
		obj.separator_positions = self.separator_positions
		obj.is_separator = self.is_separator
		obj.split_interactions = self.split_interactions
		obj.split_order_by_en = self.split_order_by_en
		obj.split_order_by_de = self.split_order_by_de
		obj.split_to = self.split_to
		obj.swap_toward_de = []
		for (var i in self.swap_toward_de) {
			obj.swap_toward_de.push(self.swap_toward_de[i].get_full_representation())
		}
		obj.swap_toward_en = []
		for (var i in self.swap_toward_en) {
			obj.swap_toward_en.push(self.swap_toward_en[i].get_full_representation())
		}
		obj.nodes = []
		for (var i in self.nodes) {
			obj.nodes.push(self.nodes[i].get_full_representation())
		}
		obj.edges = []
		for (var i in self.edges) {
			obj.edges.push(self.edges[i].get_full_representation())
		}
		return obj
	}

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
	this.get_visible_string = function () {
		var vs = _.map(self.get_visible_nodes(), function (n) {
			return n.s
		})
		return vs.join(' ')
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
			var add_str_list = []
			_.each(neighbors, function (n) {
				add_str_list.push({token: n.s, lang: n.lang})
			})
			//result.addStr = add_str_list.join(' ')
			result.addStr = add_str_list
			result.direction = direction

			result.remove = nodes_to_remove
			var remove_str_list = []
			_.each(nodes_to_remove, function (n) {
				remove_str_list.push({token: n.s, lang: n.lang})
			})
			//result.removeStr = remove_str_list.join(' ')
			result.removeStr = remove_str_list
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
	this.outer_container = null
	this.points_container = null
	this.wordOptionWrapper = null
	this.initial_order_by = null
	this.points_remaining = 0;
	this.points_bonus = 0.0;
	this.stopClues = false

	this.get_clue = function (nodes) {
		self.wordOptionWrapper.disable_get_clue()
		chain_of_nodes = nodes || []
		if (chain_of_nodes.length == 0) {
			var chain_of_node_ids = []
			console.log("in sentence get clue")
			var visible_nodes_l2 = []
			_.each(self.visible_nodes, function (n) {
				if (n.lang == 'de') {
					visible_nodes_l2.push(n)
				}
			})

			var actionable_graphs = {}
			_.each(self.graphs, function (g) {
				var actionable = false
				var because_of = null
				_.each(g.get_visible_nodes(), function (gvn) {

					if (gvn.has_possible_actions('en')) {
						actionable = true
						because_of = gvn

					}
				})
				if (actionable) {
					actionable_graphs[g.id] = g
					console.log("graph", g.id, "is actionable because of", because_of.s)
				} else {
					console.log("graph", g.id, "is NOT actionable.")
				}
			})

			actionable_graphs = _.map(actionable_graphs, function (g, k) {
				var g_frequency = 0.0
				var l2_node_count = 0
				_.each(g.nodes, function (gn) {
					if (gn.lang == 'de') {
						l2_node_count += 1
						g_frequency += gn.frequency
					}

				})
				var g_actionable_nodes = _.sortBy(g.get_visible_nodes(), function (gvn) {
					if (gvn.lang == 'de') {
						return 1.0 - gvn.frequency
					} else if (gvn.land == 'en') {
						return 0.0
					} else {
						return 1.0
					}
				})

				return {id: k, graph: g, frequency: 1.0 - (g_frequency / l2_node_count), actionable_node: g_actionable_nodes[0]}
			})
			var graph_freq = _.map(actionable_graphs, function (o) {
				return 1.0 - parseFloat(o.frequency)
			})
			var sums = graph_freq.reduce(function (pv, cv) {
				return pv + cv
			}, 0);
			var graph_freq_norm = _.map(graph_freq, function (gf) {
				return gf / sums
			})
			var disc = SJS.Discrete(graph_freq_norm);
			var random_graph_idx = disc.draw()
			var random_graph = actionable_graphs[random_graph_idx]
			if (random_graph) {
				var n_best = random_graph.actionable_node
				var n_best_id = n_best.id + ',' + random_graph.graph.id
				chain_of_nodes.push({action: true, node: n_best, delay: 600})
				chain_of_node_ids.push(n_best_id)
			}

			/*var sorted_actionable_graphs = _.sortBy(actionable_graphs, function (o) {
				return o.frequency
			})
			var sorted_actionable_nodes = _.filter(sorted_actionable_graphs, function (o) {
				return true //punct.indexOf(o.actionable_node.s) < 0
			})

			if (sorted_actionable_nodes.length > 0) {
				var n_best = sorted_actionable_nodes[0].actionable_node
				var n_best_id = n_best.id + ',' + sorted_actionable_nodes[0].graph.id
				chain_of_nodes.push({action: true, node: n_best, delay: 600})
				chain_of_node_ids.push(n_best_id)
			}*/
			self.preview_chain("get_clue")
		} else {
			self.preview_chain("reveal_get_clue")
		}

	}

	this.submit_guess = function (additional_nodes) {
		throw {name: "ShouldNotBeUsed", message: "actually calls get_clue()"};
		chain_of_nodes = []
		var chain_of_node_ids = []
		var additional_nodes = additional_nodes || []
		_.each(additional_nodes, function (an) {
			//an.preview_action(true)
			//an.take_default_action('translate')
			chain_of_nodes.push({action: false, node: an, delay: 0})
			var an_id = an.id + ',' + an.graph.id
			chain_of_node_ids.push(an_id)

		})

		//self.preview_chain("submit_guess")
		self.wordOptionWrapper.update_attemptability()
		self.wordOptionWrapper.update_max_points()
		self.wordOptionWrapper.enable_get_clue()
		self.wordOptionWrapper.check_for_completion()

	}

	this.preview_chain = function (chain_type) {
		if (chain_of_nodes.length > 0) {
			var current = chain_of_nodes.shift()
			if (current.node.visible) {
				console.log('PREVIEWING CHAIN ACTION:', current.node.s, current.action, current.delay)
				current.node.preview_action(current.action)
				setTimeout(function () {
					self.translate_chain(current, chain_type)
				}, current.delay)
			}

		} else {
			if (chain_type == "submit_guess") {
				//do something...
				throw {name: "ShouldNotBeUsed", message: "actually calls get_clue()"};
				self.wordOptionWrapper.update_attemptability()
				self.wordOptionWrapper.update_max_points()
				self.wordOptionWrapper.enable_get_clue()
				self.wordOptionWrapper.check_for_completion()
			} else if (chain_type == "get_clue") {
				self.wordOptionWrapper.update_attemptability()
				self.wordOptionWrapper.update_max_points()
				if (revealCorrectInstantly) {
					self.wordOptionWrapper.reveal_correct()
				}
				self.wordOptionWrapper.enable_submit_guess()
				self.wordOptionWrapper.check_for_completion()
				self.wordOptionWrapper.make_focus_button()
				updateMessageBox("One (or more) foreign words have been revealed (in blue)<br> do you want to change your previous guess? (or submit the same guesses again)")
			} else if (chain_type == "reveal_get_clue") {
				self.wordOptionWrapper.update_attemptability()
				self.wordOptionWrapper.update_max_points()
				self.wordOptionWrapper.enable_submit_guess()
				self.wordOptionWrapper.check_for_completion()
				self.wordOptionWrapper.make_focus_button()
				self.wordOptionWrapper.removeOldAttempts()
			}

		}
	}

	this.translate_chain = function (current, chain_type) {
		current.node.take_default_action(current.action)

		setTimeout(function () {
			self.preview_chain(chain_type)
		}, 20)

	}
	this.get_full_representation = function () {
		/*
			s.en = input.en
			s.de = input.de
			s.id = input.id
			s.alignment = input.alignment
			s.initial_order_by = input.initial_order_by
			for (var i in input.graphs) {
				s.graphs.push(Graph.parse(input.graphs[i]))
			}
			return s
		 */
		var obj = {}
		obj.id = self.id
		obj.en = self.en
		obj.de = self.de
		obj.alignment = self.alignment
		obj.initial_order_by = self.initial_order_by
		obj.graphs = []
		for (var i in self.graphs) {
			obj.graphs.push(self.graphs[i].get_full_representation())
		}
		return obj
	}

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

	this.post_parameters = function () {
		var post_params = {}
		post_params.points = self.points_remaining + self.points_bonus
		post_params.state = self.get_visible_string()
	}

	this.initialize = function (mainview, i) {
		i = i || null
		self.container = self.get_container()
		self.outer_container = self.get_outside_container(i)
		mainview.append($(self.get_outside_container()))
		//mainview.append($(self.get_container()))

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
			self.visible_nodes[i].visible_order = i
			//console.log("visible order updates in node:", self.visible_nodes[i], " visible_order:", self.visible_nodes[i].visible_order)
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

	this.get_summarized_obj = function () {
		var logObjs = []
		_.each(self.visible_nodes, function (vn) {
			logObjs.push(vn.get_summarized_obj())
		})
		return logObjs
	}
	this.get_visible_string = function () {
		self.sort_visible_nodes_by_display_order()
		var s = []
		_.each(self.visible_nodes, function (vn) {
			s.push(vn.s)
		})
		return s.join([separator = " "]);

	}
	this.get_user_translation = function () {
		var o = self.get_text_container().text_area
		return o.value
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
			node.visible_order = null
			self.visible_nodes = _.reject(self.visible_nodes, function (n) {
				if (n == node) {
					var item = node.get_view()
					item.inDom = false
					$(item).detach()
					//$(item).fadeOut(500, function () {
					//	$(item).detach()
					//})
					return true
				} else {
					return false
				}
			});
		}
		self.assign_display_order_by_array_order()
		self.update_visible_nodes()
	}
	this.get_outside_container = function () {
		if (this.outer_container == null) {
			this.outer_container = document.createElement('div')
			$(this.outer_container).addClass('outerContainer')
			var column_container = document.createElement('div')
			$(this.outer_container).on('mouseenter', function () {
				console.log("over sentence id:" + self.id)
			})
			$(column_container).addClass('colContainer')
			var c = self.get_container()
			$(column_container).append($(c))
			//var t = self.get_text_container()
			//$(column_container).append($(t))
			//this.outer_container.text_container = t
			this.outer_container.macaronic_container = c
			var wol = new WordOptionWrapper(self)
			this.wordOptionWrapper = wol
			$(column_container).append(wol.get_view())
			$(this.outer_container).append($(column_container))
			//this.points_container = self.get_points_container()
			//$(this.outer_container).append($(this.points_container))

			return this.outer_container
		} else {
			return this.outer_container
		}
	}
	this.get_node_count = function (lang) {

		var c = 0
		_.each(self.graphs, function (g) {
			_.each(g.nodes, function (n) {
				if (typeof  lang === "undefined") {
					c += 1
				} else {
					if (n.lang === lang) {
						c += 1
					}
				}
			})
		})
		return c
	}

	this.changePointsRemaining = function (newPoints) {
		self.get_points_container().pr.innerHTML = newPoints
		if (newPoints == 0) {
			$(self.get_points_container().pr).addClass('stop')
		}
	}

	this.updateStar = function (newPoints) {
		if (newPoints == 0) {
			console.log('stars: ' + (parseFloat(newPoints) / 4.0))
			$(self.get_points_container().ps).html('<span class="stars"></span>');
			$('span.stars').stars($('span.stars'));
		} else {
			console.log('stars: ' + (parseFloat(newPoints) / 4.0))
			$(self.get_points_container().ps).html('<span class="stars">' + Math.round((parseFloat(newPoints) / 4.0)) + '</span>');
			$('span.stars').stars($('span.stars'));
		}

	}

	this.changePointsBonus = function (newPoints) {
		self.get_points_container().pb.innerHTML = newPoints
		//self.updateStar(newPoints)
		enable_submit()
	}

	this.get_points_container = function () {
		if (this.points_container == null) {
			this.points_container = document.createElement('div')
			$(this.points_container).addClass('pointsContainer')
			var pr = document.createElement('div')
			$(pr).addClass('pointsRemaining')
			var pb = document.createElement('div')
			$(pb).addClass('pointsBonus')
			var ps = document.createElement('p')
			$(ps).addClass('star')
			$(this.points_container).append($(pr))
			$(this.points_container).append($(pb))
			$(this.points_container).append($(ps))

			this.points_container.pr = pr
			this.points_container.pb = pb
			this.points_container.ps = ps
			if (ui_version == 0) {
				self.points_remaining = 10
			} else {
				self.points_remaining = 0 //parseInt(this.get_node_count('de') * 0.7)
			}

			self.changePointsRemaining(self.points_remaining)
			self.changePointsBonus(parseFloat(0.0).toFixed(1))
			return this.points_container
		} else {
			return this.points_container
		}
	}

	this.get_text_container = function () {
		if (this.text_container == null) {
			this.text_container = document.createElement('div')
			$(this.text_container).addClass('textContainer')
			var understood = document.createElement('button')

			this.text_container.understood_btn = understood
			$(this.text_container.understood_btn).text("Attempt Translation")
			$(this.text_container).append($(understood))

			var translation_input = document.createElement('textarea')
			$(translation_input).addClass("translationInput")
			$(this.text_container).append($(translation_input))
			var score = document.createElement('button')
			this.text_container.score_btn = score
			$(this.text_container.score_btn).text("Score Translation")

			$(this.text_container.score_btn).height(20)
			$(this.text_container).append($(score))
			$(this.text_container.score_btn).hide()
			this.text_container.text_area = translation_input
			$(this.text_container.text_area).hide()
			$(this.text_container.understood_btn).on('click', function () {
				$(self.text_container.understood_btn).hide()
				$(self.text_container.text_area).show()
				$(self.text_container.score_btn).show()
				self.stopClues = true
				updateMessageBox("Type your translation guess, then click 'score translation'.");
				//var bla = self.get_full_representation()
				//var bbb = JSON.stringify(bla)
				//console.log(bbb)

			})
			$(this.text_container.score_btn).on('click', function () {
				var bleu = simple_bleu(self.text_container.text_area.value, self.de)
				self.points_bonus = bleu * 20
				self.changePointsBonus(self.points_bonus.toFixed(1))
				self.text_container.text_area.disabled = true
				self.text_container.score_btn.disabled = true
				logTranslation(self)
				if (self.points_bonus <= 4.0) {
					if ($('.instructions').is(':hidden')) {
						$('.instructions').toggle()
					}
					updateMessageBox("This is a low scoring translation! You are only allowed a limited number of low score submissions. <br> <b>next time try using more clues!</b>");
				}
				$('#confirmInput').prop('disabled', false)

			})
			$(this.text_container.text_area).keyup(function () {
				//var bleu = simple_bleu(self.text_container.text_area.value, self.de)
				//self.points_bonus = bleu * 20
				//self.changePointsBonus(self.points_bonus.toFixed(1))
			})
			$(this.text_container.text_area).focusout(function () {
				console.log("time to log tlm....")

			})
			return this.text_container
		} else {
			return this.text_container
		}
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
		self.initial_order()
		for (var i = 0; i < this.graphs.length; i++) {
			this.graphs[i].set_initial_view()
		}

	}
	this.initial_order = function () {
		//assigns order of the visible nodes initially
		for (var i in self.visible_nodes) {
			var item = self.visible_nodes[i].get_view()
			assert(self.visible_nodes[i].visible_order != null, "no information on visible order")
			//console.log(self.visible_nodes[i].s, "initial order:" + self.visible_nodes[i].visible_order, "de_order", self.visible_nodes[i].de_id)
			$(item).css('order', parseInt(self.visible_nodes[i].visible_order))
		}
	}

	this.update_visible_nodes = function () {
		for (var i in self.visible_nodes) {
			var item = self.visible_nodes[i].get_view()
			if (item.inDom) {
			} else {
				//$(self.get_container()).append($(item))
				//$(item).css('transform', 'scale(0.5)');
				//$(item).animate({ scale: '1.0'}, 500);
				//$(item).appendTo($(self.get_container()))
				//$(item).hide()
				//$(item).show("scale", {percent: 100}, 2000)
				$(item).hide().appendTo($(self.get_container())).fadeIn(1000)

				//$(item).appendTo(self.get_container())

				//$(self.get_container()).append($(item)).show("scale", {percent: 100}, 2000)
				//$(item).attr("scale", {percent: 0})
				//$(item).show("scale", {percent: 100}, 2000)
				//$(item).animate({scale: 1}, 500)
				//$(item.span).css("backgroundColor", "orange");
				//$(item.span).animate({ backgroundColor: "transparent" }, 400);
				item.inDom = true
			}
			if (item.highlight_movement) {
				$(item.span).css("backgroundColor", "orange");
				$(item.span).animate({ backgroundColor: "transparent" }, 500);
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
	if (input.s == '@-@') {
		n.s = '-'
	} else {
		n.s = input.s
	}
	n.en_id = input.en_id
	n.de_id = input.de_id
	n.lang = input.lang
	n.visible = input.visible
	n.frequency = input.frequency
	n.visible_order = input.visible_order
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

function wordOptionsComp(i) {
	var s = sentences[i]
	s.wordOptionWrapper.initialOptions()
}

function do_precomputations() {
	for (var i = 0; i < sentences.length; i++) {
		async(precomputations, i, null)
	}
}
function do_wordOptionWrapper() {
	for (var i = 0; i < sentences.length; i++) {
		async(wordOptionsComp, i, null)
	}
}

function receivedJsonSentence(msg) {
	console.log(msg)
	json_sentences = msg
	ok_parse(0, 10)
	do_precomputations()
}
function receivedPreview(msg) {
	$(mainview).empty()
	sentences = []
	sentence_ids = []
	json_sentences = msg.data
	console.log('size of page is ' + json_sentences.length)
	ok_parse(0, 1)
	do_precomputations()
}

function receivedUserProgress(msg) {
	console.log("user received progress:", msg)
	updateMessageBox("For each foreign word, guess its meaning in the text box below it<br>")
	$(mainview).empty()
	$('#confirmInput').prop('disabled', true)
	sentences = []
	sentence_ids = []
	console.log("got user progress...")
	json_sentences = msg.data
	console.log('size of page is ' + json_sentences.length)
	points_earned = msg.points_earned
	num_of_low_scores = msg.low_scores

	if (num_of_low_scores > 15) {
		tooManyLowScores()
	} else {
		console.log("low score:", num_of_low_scores)
		progress = msg.progress
		pointsEarned_span.text(parseFloat(points_earned).toFixed(1));
		ok_parse(0, 1)
		do_precomputations()
		do_wordOptionWrapper()
	}

}

function noMoreHits(msg) {
	$(mainview).empty()
	points_earned = msg.points_earned
	progress = msg.progress
	pointsEarned_span.text(parseFloat(points_earned).toFixed(1));
	$(mainview).append("There are no more hits at this point of time for you. <br> Please check back in tomorrow. Thank you!")
	$('#confirmInput').remove()
}

function thankyouPage(msg) {
	console.log("display thank you received...")
	$(mainview).empty()
	if (msg.username === "GUEST") {
		$(mainview).append("<p><b> Preview Completed</b></p><p>please logout and log back in as a registered user</p>")
		$('#confirmInput').prop('disabled', true)
	} else {
		$(mainview).append("<p><b> All hits completed... Thank you!</b></p>Your comepletion confirmation code is: <b>" + msg.confirmation + "</b>")
		points_earned = msg.points_earned
		pointsEarned_span.text(parseFloat(points_earned).toFixed(1));
		$('#confirmInput').prop('disabled', true)
	}

	$('#confirmInput').remove()
}

function tooManyLowScores() {
	$('.instructions').hide()
	$(mainview).append("<p><b> You have too many low scoring submissions to continue further.")
	$('#confirmInput').prop('disabled', true)
	$('#confirmInput').remove()

}

function ok_parse(st, end) {
	end = sentences_per_page < json_sentences.length ? end : json_sentences.length
	for (var i = st; i < end; i++) {
		var jj = json_sentences
		var jji = json_sentences[i]
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
		//s.assign_display_order_by_array_order()
		s.update_visible_nodes()
		///s.wordOptionWrapper.update_attemptability()
		sentences.push(s)
		sentence_ids.push(s.id)
	}
}

function setup_direct(workerId, socketObj, UI_version, full_data) {
	mainview = $('#mainbody')
	userType_span = null
	workerId_span = null
	pointsEarned_span = null
	ui_version = UI_version
	username = workerId
	socket = socketObj
	json_sentences = full_data
	ok_parse(0, 50)
	do_precomputations()
}

function updateLowScores(msg) {
	num_of_low_scores = msg.low_scores
}

function setup(workerId, socketObj, UI_version, isPreview, sentence_prefered) {
	mainview = $('#mainbody')
	userType_span = "learner"
	workerId_span = $('#workerId')
	pointsEarned_span = $('#pointsEarned')
	ui_version = UI_version
	$('#confirmInput').prop('disabled', true)
	console.log('input button should be disabled...')
	username = workerId
	socket = socketObj
	is_preview = isPreview
	if (isPreview) {
		console.log("case 2")
		console.log(socket)
		/*$(mainview).empty()
		sentences = []
		sentence_ids = []
		console.log("preview mode ui")
		json_sentences = json_str_arr.slice(14, 15)
		points_earned = 0
		progress = 0
		pointsEarned_span.text(parseFloat(points_earned).toFixed(1));
		ok_parse(0, 1)
		do_precomputations()*/
		socket.emit('requestPreview', {username: workerId})
		socket.on('previewContent', receivedPreview)
	} else {
		if (socket != null && username != null) {
			console.log("case 1")
			//get json_sentences from server
			//first get user progress
			if (sentence_prefered != null && sentence_prefered != "") {
				console.log("requesting specific sentence...", sentence_prefered)
				socket.emit('requestSentence', {username: workerId, sentence_prefered: parseInt(sentence_prefered)})
			} else {
				console.log("emitting user progress request, workerId:" + workerId)
				socket.emit('requestUserProgress', {username: workerId})

			}
			socket.on('userProgress', receivedUserProgress)
			socket.on('noMoreHitsForUser', noMoreHits)
			socket.on('thankyou', thankyouPage)

			//socket.emit('requestJsonSentences', 'please')
			//console.log("requested sentences from server...")
			//socket.on('JsonSentences', receivedJsonSentence);
		}
	}

	console.log('user name is ' + username)
}
