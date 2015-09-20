/**
 * Created by arenduchintala on 8/10/15.
 */

var sentences = []
var page = 0;
var sentences_per_page = 10

gotoPrevPage = function () {
	console.log("go to prev page")
	page -= 1
	if (page >= 0) {
		var total = json_str_arr.length
		var st = page * sentences_per_page
		var end = st + sentences_per_page
		$('#mainbody').empty()
		sentences = []
		ok_parse(st, end)
		do_precomputations()
	}
}
gotoNextPage = function () {
	console.log("go to next page")
	page += 1
	var total = json_str_arr.length
	var st = page * sentences_per_page
	var end = st + sentences_per_page
	if (end > total) {
		end = total
		$('#nextbtn').prop("disabled", true)
	}else{
		$('#nextbtn').prop("disabled", false)
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
	this.visible = false
	this.graph = null
	this.reorder_precompute = {from: null, to: null}

	this.update_view_reorder = function () {
		var view = this.get_view()
		var graph = this.graph
		if (graph.swaps || graph.transfers) {
			if (graph.external_reorder_by == 'en') {
				$(view.external_reorder_selector_to_en).hide()
				$(view.external_reorder_selector_to_de).show()
			} else {
				$(view.external_reorder_selector_to_en).show()
				$(view.external_reorder_selector_to_de).hide()
			}
		} else if (graph.splits) {
			var vn_ids = _.map(this.graph.get_visible_nodes(), function (vn) {
				return vn.id
			})
			var are_equal = vn_ids.length > 1

			if (are_equal) {
				if (graph.external_reorder_by == 'en') {
					$(view.external_reorder_selector_to_en).hide()
					$(view.external_reorder_selector_to_de).show()
				} else {
					$(view.external_reorder_selector_to_en).show()
					$(view.external_reorder_selector_to_de).hide()
				}
			} else {
				$(view.external_reorder_selector_to_en).hide()
				$(view.external_reorder_selector_to_de).hide()
			}
		} else {
			$(view.external_reorder_selector_to_en).hide()
			$(view.external_reorder_selector_to_de).hide()
		}
	}
	this.precompute_transfer_possibility = function (param) {
		if (param.action == 'external reorder') {
			var gvn = _.filter(self.graph.nodes, function (node) {
				return node.visible
			})
			//gvn = self.graph.sentence.sort_within_graph(gvn, self.graph.internal_reorder_by)
			var original_external_reorder_by = self.graph.external_reorder_by
			self.graph.external_reorder_by = param.direction
			var node_idx = self.graph.sentence.get_best_configuration(gvn, param.direction, gvn)
			for (var i = 0; i < gvn.length; i++) {
				var preview_n = gvn[i]
				var destination_position = parseInt(node_idx[0]) + parseInt(i)
				var from_pos = parseInt($(preview_n.get_view()).css('order'))
				//console.log('precomputed movement ' + param.direction + ' :' + preview_n.s + 'from ' + from_pos + ' to ' + destination_position)
				var p = 'reorder_precompute_' + param.direction
				preview_n[p] = {from: parseInt(from_pos), to: parseInt(destination_position)}
				//console.log('precompute will move ' + preview_n.s + 'from ' + from_pos + ' to ' + destination_position)
				var p2 = 'reorder_precompute_' + (param.direction == 'en' ? 'de' : 'en')
				preview_n[p2] = {from: null, to: null}
			}
			if (node_idx.length > 1) {
				//console.log("multiple possible best configurations - external order!!!")
			}
			self.graph.external_reorder_by = original_external_reorder_by
		}
	}
	this.preview_action = function (param) {
		console.log('* *  PREVIEW REORDER ' + param.direction + '* *')
		console.log(this.s + ' with action:' + param.action + ' ' + param.direction)
		if (param.action == 'external reorder') {
			if (self.graph.transfers) {
				var gvn = _.filter(self.graph.nodes, function (node) {
					return node.visible
				})
				_.each(gvn, function (n) {
					var from = parseInt($(n.get_view()).css('order'))
					var to = self.graph.sentence.get_best_configuration([n], param.direction, [n])
					console.log('precomputed next possible transfer for ' + n.s)
					console.log('from:' + from + ' to:' + to[0])
				})
			} else if (self.graph.swaps) {
				console.log("this graph swaps with " + self.graph.swaps_with)
			} else if (self.graph.splits) {
				if (self.graph.currently_split) {
					console.log("this graph will unsplit" + self.graph.unsplit_ordering)
				} else {
					console.log("this graph splits with " + self.graph.split_ordering)
				}

			}
		}

	}
	this.get_swaps_with_nodes = function (gvn) {
		var g_ids = []
		for (var i = 0; i < gvn.length; i++) {
			if (gvn[i].graph.swaps_with != null) {
				g_ids = g_ids.concat(gvn[i].graph.swaps_with)
			}
		}
		g_ids = _.uniq(g_ids);
		var swaps_with_vn = []
		for (var i = 0; i < g_ids.length; i++) {
			var g = this.graph.sentence.get_graph_by_id(g_ids[i])
			swaps_with_vn = swaps_with_vn.concat(g.get_visible_nodes())
		}
		return swaps_with_vn
	}

	this.get_split_merge_position = function (place_position, separator_nodes_positions) {
		var merge_pos = null
		var zip = _.zip(place_position, separator_nodes_positions)
		for (var z = 0; z < zip.length; z++) {
			var step = zip[z][0]
			var pos = zip[z][1]
			if (step == 'left') {
				merge_pos = pos
			} else {
				return pos
			}
		}
		return pos + 1
	}
	this.take_action = function (param) {
		console.log('action triggered:' + param.action + ',' + param.direction)
		if (param.action == 'internal reorder') {
			var gvn = _.filter(self.graph.nodes, function (node) {
				return node.visible
			})
			self.graph.sentence.remove_nodes(gvn)
			gvn = self.graph.sentence.sort_within_graph(gvn, param.direction)
			self.graph.internal_reorder_by = param.direction
			var node_idx = self.graph.sentence.get_best_configuration(gvn, self.graph.external_reorder_by, gvn)
			if (node_idx.length > 1) {
				//console.log("multiple possible best configurations - internal order!!!")
			}
			self.graph.sentence.add_nodes(gvn, node_idx[0], param)
		} else if (param.action == 'external reorder') {
			var gvn = _.filter(self.graph.nodes, function (node) {
				return node.visible
			})

			if (this.graph.splits) {
				console.log("this graphs splits")
				var target_order = []
				if (self.graph.currently_split) {
					target_order = self.graph.unsplit_ordering
				} else {
					target_order = self.graph.split_ordering
				}
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
				if (self.graph.currently_split) {
					var insertions = _.reduce(separator_nodes, function (memo, sn) {
						if (sn == 'INSERT HERE') {return memo + 1} else {return memo}
					}, 0)
					assert(insertions == 1, 'during un-splitting number insert sites 1')
					new_ordering_nodes = _.map(separator_nodes, function (sn) {
						if (sn == 'INSERT HERE') {
							return split_nodes
						} else {
							return sn
						}
					})

				} else {
					var insertions = _.reduce(separator_nodes, function (memo, sn) {
						if (sn == 'INSERT HERE') {return memo + 1} else {return memo}
					}, 0)
					assert(insertions == split_nodes.length, 'during splitting number insert sites should be number of split nodes')
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
				self.graph.sentence.update_external_reorder_options(split_nodes, param)
				_.each(split_nodes, function (i) {
					i.update_view_reorder()
				})
				self.graph.currently_split = !self.graph.currently_split

			} else if (this.graph.swaps) {
				console.log("this graphs swaps")
				var swaps_with_nodes = self.get_swaps_with_nodes(gvn)
				var swaps_with_positions = _.map(swaps_with_nodes, function (sn) {
					return parseInt($(sn.get_view()).css('order'))
				})
				var gvn_positions = _.map(gvn, function (gn) {
					return parseInt($(gn.get_view()).css('order'))
				})

				self.graph.sentence.remove_nodes(gvn)
				var new_positions = _.range(gvn.length)
				if (_.min(swaps_with_positions) < _.min(gvn_positions)) {
					//move gvns to the left of swap nodes
					var st = _.min(swaps_with_positions)
					new_positions = _.map(new_positions, function (i) {
						return i + st
					})
				} else {
					//move gvns to the right of swap nodes
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
				_.each(gvn, function (i) {
					i.update_view_reorder()
				})
				_.each(swaps_with_nodes, function (i) {
					i.update_view_reorder()
				})
			} else if (this.graph.transfers) {
				console.log("this graphs transfers")

				var node_idx = self.graph.sentence.get_best_configuration(gvn, param.direction, gvn)
				self.graph.sentence.remove_nodes(gvn)
				if (node_idx.length > 1) {
					//console.log("multiple possible best configurations - external order!!!")
				}
				self.graph.sentence.add_nodes(gvn, node_idx[0], param)
				self.graph.sentence.update_external_reorder_options(gvn, param)
				_.each(gvn, function (i) {
					i.update_view_reorder()
				})

				_.each(gvn, function (n) {
					var from = parseInt($(n.get_view()).css('order'))
					var new_direction = param.direction == 'en' ? 'de' : 'en'
					var to = self.graph.sentence.get_best_configuration([n], new_direction, [n])
					n.reorder_precompute = {'from': from, 'to': parseInt(to[0])}
					console.log('precomputed next possible transfer for ' + n.s)
					console.log('from:' + from + ' to:' + to[0])

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
				//var node_idx = self.graph.sentence.get_best_configuration(gvn, self.graph.external_reorder_by, modified_nodes.remove)

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
					if (self.graph.splits && self.graph.currently_split) {
						self.graph.currently_split = false
						self.graph.external_reorder_by = self.graph.external_reorder_by == 'en' ? 'de' : 'en'
					}
					self.graph.sentence.add_nodes(gvn, insert_idx, param)
					self.graph.sentence.update_external_reorder_options(gvn, param)

					_.each(gvn, function (i) {
						i.update_view_reorder()
					})
				} else if (modified_nodes.add.length == 1 && modified_nodes.remove.length > 1) {
					console.log("ok")
					var insert_idx = null
					if (self.graph.splits) {
						var target_order = self.graph.unsplit_ordering
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

						self.graph.sentence.add_nodes(modified_nodes.add, [insert_idx], param)
						self.graph.sentence.update_external_reorder_options(modified_nodes.add, param)
						_.each(modified_nodes.add, function (i) {
							i.update_view_reorder()
						})

						if (self.graph.currently_split) {
							self.graph.currently_split = false
							self.graph.external_reorder_by = self.graph.external_reorder_by == 'en' ? 'de' : 'en'
						}

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
			var translation_selector = document.createElement('div')
			$(translation_selector).addClass('translation_selector')
			$(menu_container).append($(translation_selector))
			$(translation_selector).on('click', function () {
				self.take_action({action: 'translate', direction: 'de'})
			})
			if (!this.to_de) {
				$(translation_selector).hide()
			}
			var internal_reorder_selector = document.createElement('div')
			$(internal_reorder_selector).addClass('internal_reorder_selector')
			$(menu_container).append($(internal_reorder_selector))
			$(internal_reorder_selector).on('click', function () {
				self.take_action({action: 'internal reorder', direction: 'de'})
			})
			if (!this.ir) {
				$(internal_reorder_selector).hide()
			}
			var external_reorder_selector = document.createElement('div')
			$(external_reorder_selector).addClass('external_reorder_selector')
			$(external_reorder_selector).addClass('tode')
			$(menu_container).append($(external_reorder_selector))
			$(external_reorder_selector).on('click', function () {
				self.take_action({action: 'external reorder', direction: 'de'})
			})
			$(external_reorder_selector).on('mouseover', function () {
				self.preview_action({action: 'external reorder', direction: 'de'})
			})
			if (this.graph.external_reorder_by == 'de') {
				$(external_reorder_selector).hide()
			}
			this.view.translation_selector_to_de = translation_selector
			this.view.internal_reorder_selector_to_de = internal_reorder_selector
			this.view.external_reorder_selector_to_de = external_reorder_selector
			var s = document.createElement('span')
			s.innerHTML = this.s
			this.view.span = s
			$(s).addClass(this.lang == 'en' ? 'spanen' : 'spande')
			$(this.view).append($(s))
			var bottom_menu_container = document.createElement('div')
			$(bottom_menu_container).addClass('node_menu_container')
			$(this.view).append($(bottom_menu_container))
			var translation_selector = document.createElement('div')
			$(translation_selector).addClass('translation_selector')
			$(bottom_menu_container).append($(translation_selector))
			$(translation_selector).on('click', function () {
				self.take_action({action: 'translate', direction: 'en'})
			})
			if (!this.to_en) {
				$(translation_selector).hide()
			}
			var internal_reorder_selector = document.createElement('div')
			$(internal_reorder_selector).addClass('internal_reorder_selector')
			$(bottom_menu_container).append($(internal_reorder_selector))
			$(internal_reorder_selector).on('click', function () {
				self.take_action({action: 'internal reorder', direction: 'en'})
			})
			if (!this.ir) {
				$(internal_reorder_selector).hide()
			}
			var external_reorder_selector = document.createElement('div')
			$(external_reorder_selector).addClass('external_reorder_selector')
			$(external_reorder_selector).addClass('toen')
			$(bottom_menu_container).append($(external_reorder_selector))
			$(external_reorder_selector).on('click', function () {
				self.take_action({action: 'external reorder', direction: 'en'})
			})
			$(external_reorder_selector).on('mouseover', function () {
				self.preview_action({action: 'external reorder', direction: 'en'})
			})
			if (this.graph.external_reorder_by == 'en') {
				$(external_reorder_selector).hide()
			}
			this.view.translation_selector_to_en = translation_selector
			this.view.internal_reorder_selector_to_en = internal_reorder_selector
			this.view.external_reorder_selector_to_en = external_reorder_selector
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
function Reorder() {
	this.type = null
	this.anchor = null
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
	this.swaps_with = null
	this.transfers = false
	this.splits = false
	this.currently_split = false
	this.separators = null
	this.separator_positions = null
	this.is_separator = false
	this.split_interactions = null

	this.split_ordering = null
	this.unsplit_ordering = null

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
	this.initialize = function (sentence) {
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

	this.get_graph_by_id = function (gid) {
		for (var i = 0; i < this.graphs.length; i++) {
			var g = this.graphs[i]
			if (g.id == gid) {
				return g
			}
		}
	}
	this.initialize = function () {
		self.container = self.get_container()
		$('#mainbody').append($(self.get_container()))
		self.graphs = _.sortBy(self.graphs, function (graph) {
			return graph.initial_order
		})
		for (var i in self.graphs) {
			self.graphs[i].initialize(self)
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
			if (n.graph.splits && param.action == 'external reorder') {
				n.graph.external_reorder_by = param.direction
			}

		}
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
				//if (prev != base_array[i].graph.id) {
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
				//    prev = base_array[i].graph.id
				//}
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
		//console.log("drawing node items...")
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
		//console.log("completed drawing node items...")
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

Graph.parse = function (input) {
	var g = new Graph()
	g.id = input.id
	g.er = input.er
	g.ir = input.ir
	g.internal_reorder_by = input.internal_reorder_by
	g.external_reorder_by = input.external_reorder_by
	g.initial_order = input.initial_order
	g.transfers = input.transfers
	g.splits = input.splits
	g.swaps = input.swaps
	g.separators = input.separators
	g.currently_split = input.currently_split
	g.swaps_with = input.swaps_with
	g.separator_positions = input.separator_positions
	g.is_separator = input.is_separator
	g.split_interactions = input.split_interactions
	g.split_ordering = input.split_ordering
	g.unsplit_ordering = input.unsplit_ordering
	for (var i in input.nodes) {
		g.nodes.push(Node.parse(input.nodes[i]))
	}
	for (var i in input.edges) {
		g.edges.push(Edge.parse(input.edges[i]))
	}
	//g.reorder = Reorder.parse(input.reorder)
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

function precomputations(i) {
	var s = sentences[i]
	s.set_initial_view()
}

function do_precomputations() {
	for (var i = 0; i < sentences.length; i++) {
		async(precomputations, i, null)
	}
}

function ok_parse(st, end) {
	for (var i = st; i < end; i++) {
		var jo = JSON.parse(json_str_arr[i])
		var s = Sentence.parse(jo)
		s.initialize()
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
