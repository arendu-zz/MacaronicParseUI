/**
 * Created by arenduchintala on 8/10/15.
 */


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

    this.pick_config_closest = function (best_configs, remove_idx) {
        var win = null
        var r_min = 10000
        for (var i = 0; i < remove_idx.length; i ++) {
            if (r_min > remove_idx[i]) {
                r_min = remove_idx[i]
            }
        }
        for (var i = 0; i < best_configs.length; i ++) {
            var config = best_configs[i]
            var idx = config.indexOf(r_min)
            if (idx == - 1) {

            } else {
                win = best_configs[i]
            }
        }
        return win
    }


    this.take_action = function (param) {
        console.log('action triggered:' + param.action + ',' + param.direction)
        if (param.action == 'internal reorder') {
            var gvn = _.filter(
                self.graph.nodes, function (node) {
                    return node.visible
                })
            self.graph.sentence.remove_nodes(gvn)
            gvn = self.graph.sentence.sort_within_graph(gvn, param.direction)
            self.graph.internal_reorder_by = param.direction
            var node_idx = self.graph.sentence.get_best_configuration(gvn, self.graph.external_reorder_by)
            if (node_idx.length > 1) {
                console.log("multiple possible best configurations - internal order!!!")
            }
            self.graph.sentence.add_nodes(gvn, node_idx[0])


        } else if (param.action == 'external reorder') {

            var gvn = _.filter(
                self.graph.nodes, function (node) {
                    return node.visible
                })
            self.graph.sentence.remove_nodes(gvn)
            gvn = self.graph.sentence.sort_within_graph(gvn, self.graph.internal_reorder_by)
            self.graph.external_reorder_by = param.direction
            var node_idx = self.graph.sentence.get_best_configuration(gvn, param.direction)
            if (node_idx.length > 1) {
                console.log("multiple possible best configurations - external order!!!")
            }
            self.graph.sentence.add_nodes(gvn, node_idx[0])


        } else if (param.action == 'translate') {
            var modified_nodes = null
            if (param.direction == 'de') {
                modified_nodes = self.graph.translate_from(self, 'de')
            } else {
                modified_nodes = self.graph.translate_from(self, 'en')
            }
            //If the translation action has changed the visible nodes, result will be true
            if (modified_nodes != null) {
                var remove_idx = []
                for (var mnr = 0; mnr < modified_nodes.remove.length; mnr ++) {
                    remove_idx.push(parseInt($(modified_nodes.remove[mnr].get_view()).css('order')))
                }
                self.graph.sentence.remove_nodes(modified_nodes.remove)
                gvn = self.graph.sentence.sort_within_graph(modified_nodes.add, self.graph.internal_reorder_by)
                var node_idx = self.graph.sentence.get_best_configuration(gvn, self.graph.external_reorder_by)
                if (node_idx.length > 1) {
                    console.log("multiple possible best configurations -translate!!!")
                    node_idx = self.pick_config_closest(node_idx, remove_idx)
                    self.graph.sentence.add_nodes(gvn, node_idx)
                } else {
                    self.graph.sentence.add_nodes(gvn, node_idx[0])
                }

            }
        } else {
            console.log("Invalid action:  " + param.action)
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
            $(translation_selector).on(
                'click', function () {
                    self.take_action({action: 'translate', direction: 'de'})
                })
            if (! this.to_de) {
                $(translation_selector).hide()
            }


            var internal_reorder_selector = document.createElement('div')
            $(internal_reorder_selector).addClass('internal_reorder_selector')
            $(menu_container).append($(internal_reorder_selector))
            $(internal_reorder_selector).on(
                'click', function () {
                    self.take_action({action: 'internal reorder', direction: 'de'})
                })
            if (! this.ir) {
                $(internal_reorder_selector).hide()
            }


            var external_reorder_selector = document.createElement('div')
            $(external_reorder_selector).addClass('external_reorder_selector')
            $(menu_container).append($(external_reorder_selector))
            $(external_reorder_selector).on(
                'click', function () {
                    self.take_action({action: 'external reorder', direction: 'de'})
                })

            if (! this.graph.er) {
                $(external_reorder_selector).hide()
            }

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
            $(translation_selector).on(
                'click', function () {
                    self.take_action({action: 'translate', direction: 'en'})
                })
            if (! this.to_en) {
                $(translation_selector).hide()
            }


            var internal_reorder_selector = document.createElement('div')
            $(internal_reorder_selector).addClass('internal_reorder_selector')
            $(bottom_menu_container).append($(internal_reorder_selector))
            $(internal_reorder_selector).on(
                'click', function () {
                    self.take_action({action: 'internal reorder', direction: 'en'})
                })

            if (! this.ir) {
                $(internal_reorder_selector).hide()
            }


            var external_reorder_selector = document.createElement('div')
            $(external_reorder_selector).addClass('external_reorder_selector')
            $(bottom_menu_container).append($(external_reorder_selector))
            $(external_reorder_selector).on(
                'click', function () {
                    self.take_action({action: 'external reorder', direction: 'en'})
                })

            if (! this.graph.er) {
                $(external_reorder_selector).hide()
            }

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

function Graph() {
    var self = this
    this.id = null
    this.nodes = []
    this.edges = []
    this.sentence = null
    this.internal_reorder_by = 'en'
    this.external_reorder_by = 'en'
    this.initial_order = null

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

    this.make_transitive_closure = function (nodes_to_add, nodes_to_remove, direction) {
        var oppo_direction = (direction == 'en') ? 'de' : 'en'
        var p_l_add = nodes_to_add.length
        var p_l_remove = nodes_to_remove.length
        var stop = false
        while (! stop) {
            for (var a in nodes_to_add) {
                var na = nodes_to_add[a]

            }
        }
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

            console.log('added ' + neighbors.length + ' nodes to visible_nodes')
            var result = {}
            result.add = neighbors
            result.remove = nodes_to_remove
            return result
        } else {
            console.log('can not translate in the given direction, nothing to remove or add')
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

    this.initialize = function () {
        self.container = self.get_container()
        $(document.body).append($(self.get_container()))
        self.graphs = _.sortBy(
            self.graphs, function (graph) {
                return graph.initial_order
            })
        for (var i in self.graphs) {
            self.graphs[i].initialize(self)

        }
    }

    this.sort_visible_nodes_by_display_order = function () {
        self.visible_nodes = _.sortBy(
            self.visible_nodes, function (node) {

                return parseInt($(node.get_view()).css('order'))
            });
    }

    this.assign_display_order_by_array_order = function () {
        for (var i in self.visible_nodes) {
            $(self.visible_nodes[i].get_view()).css('order', i)
        }
    }

    this.cartesianProductOf = function (args) {
        return _.reduce(
            args, function (a, b) {
                return _.flatten(
                    _.map(
                        a, function (x) {
                            return _.map(
                                b, function (y) {
                                    return x.concat([y]);
                                });
                        }), true);
            }, [
                []
            ]);
    };

    this.get_best_site_for_node = function (node, min, max, graph_neighbor_order_by) {
        var possible_sites = _.range(min, max)
        var possible_sites_scores = {}
        for (var idx in possible_sites) {
            var ps = possible_sites[idx]
            //checking neighborhood scoring for possible site of node
            var left_neighbors_graph_ids = self.get_neighbor_graph_ids(ps, 'left', self.visible_nodes)
            var right_neighbors_graph_ids = self.get_neighbor_graph_ids(ps, 'right', self.visible_nodes)
            var score = 0
            for (var l in node[graph_neighbor_order_by + "_left"]) {
                score += (node[graph_neighbor_order_by + "_left"][l] == left_neighbors_graph_ids[l] ? 1 : - 1)
            }
            for (var r in node[graph_neighbor_order_by + "_right"]) {
                score += (node[graph_neighbor_order_by + "_right"][r] == right_neighbors_graph_ids[r] ? 1 : - 1)
            }
            possible_sites_scores[ps] = score
        }
        var max = Number.NEGATIVE_INFINITY;
        var best_ps = null
        for (var property in possible_sites_scores) {
            if (possible_sites_scores[property] > max) {
                max = possible_sites_scores[property]
                best_ps = parseInt(property)
            }
        }
        return best_ps
    }

    this.sort_within_graph = function (nodes, within_graph_ordering) {

        var nodes = _.sortBy(
            nodes, function (node) {
                if (within_graph_ordering == 'en') {
                    return node.en_id
                } else {
                    return node.de_id
                }
            });
        return nodes
    }

    this.rec = function (current_num, max_num) {
        for (var i = current_num + 1; i <= max_num; i ++) {
            self.rec((i, max_num))
        }
    }
    this.score_configuration_overlap = function (config, nodes_to_insert, g_order) {
        var visible_nodes_copy = []
        for (var v = 0; v < self.visible_nodes.length; v ++) {
            visible_nodes_copy.push(self.visible_nodes[v])
        }
        //config.sort()
        for (var c = 0; c < config.length; c ++) {
            visible_nodes_copy.splice(config[c], 0, nodes_to_insert[c])
        }
        var score = 0
        for (var c = 0; c < config.length; c ++) {
            var node_at_site = nodes_to_insert[c]
            var left_gids = self.get_neighbor_graph_ids(config[c], 'left', visible_nodes_copy)
            var right_gids = self.get_neighbor_graph_ids(config[c], 'right', visible_nodes_copy)
            var gold_left_gids = node_at_site[g_order + "_left"]
            var gold_right_gids = node_at_site[g_order + "_right"]
            var gold_left_gids_copy = []
            var gold_right_gids_copy = []
            for (var gr = 0; gr < gold_right_gids.length; gr ++) {
                gold_right_gids_copy.push(gold_right_gids[gr])
            }
            for (var gl = 0; gl < gold_left_gids.length; gl ++) {
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

            //console.log("done")
            for (var l = 0; l < gold_left_gids_copy.length; l ++) {
                score += (gold_left_gids_copy[l] == left_gids[l] ? 1 : 0)
            }


            for (var r = 0; r < gold_right_gids_copy.length; r ++) {
                score += (gold_right_gids_copy[r] == right_gids[r] ? 1 : 0)
            }

        }
        //console.log("config:" + config + " alignment:" + alignment_score)
        return score
    }
    this.remove_cosecutive_duplicate = function (list) {
        var new_list = []
        var prev = null
        for (var i = 0; i < list.length; i ++) {
            if (list[i] != prev) {
                new_list.push(list[i])
                prev = list[i]
            }
        }
        return new_list
    }

    this.score_configuration_alignment_unq = function (config, nodes_to_insert, g_order) {
        var visible_nodes_copy = []
        for (var v = 0; v < self.visible_nodes.length; v ++) {
            visible_nodes_copy.push(self.visible_nodes[v])
        }
        //config.sort()
        for (var c = 0; c < config.length; c ++) {
            visible_nodes_copy.splice(config[c], 0, nodes_to_insert[c])
        }
        var alignment_score = 0
        for (var c = 0; c < config.length; c ++) {
            var node_at_site = nodes_to_insert[c]
            var left_gids = self.remove_cosecutive_duplicate(self.get_neighbor_graph_ids(config[c], 'left', visible_nodes_copy))
            var right_gids = self.remove_cosecutive_duplicate(self.get_neighbor_graph_ids(config[c], 'right', visible_nodes_copy))
            var gold_left_gids = self.remove_cosecutive_duplicate(node_at_site[g_order + "_left"])
            var gold_right_gids = self.remove_cosecutive_duplicate(node_at_site[g_order + "_right"])

            //console.log("right:")
            var right_o = editdistance(gold_right_gids, right_gids)
            for (var r = 0; r < right_o.alignments.length; r ++) {
                var align = right_o.alignments[r]
                if (align[0] == align[1]) {
                    alignment_score += (right_o.alignments.length - r) / (right_o.alignments.length)
                } else {
                    alignment_score -= (right_o.alignments.length - r) / (right_o.alignments.length)
                }
            }
            //console.log("left:")
            var left_o = editdistance(gold_left_gids, left_gids)
            for (var l = 0; l < left_o.alignments.length; l ++) {
                var align = left_o.alignments[l]
                //console.log(align[0] + " - " + align[1])
                if (align[0] == align[1]) {
                    alignment_score += (left_o.alignments.length - l) / (left_o.alignments.length)
                } else {
                    alignment_score -= (left_o.alignments.length - l) / (left_o.alignments.length)
                }
            }
        }
        //console.log("config:" + config + " alignment:" + alignment_score)
        return alignment_score
    }


    this.score_configuration_alignment = function (config, nodes_to_insert, g_order) {
        var visible_nodes_copy = []
        for (var v = 0; v < self.visible_nodes.length; v ++) {
            visible_nodes_copy.push(self.visible_nodes[v])
        }
        //config.sort()
        for (var c = 0; c < config.length; c ++) {
            visible_nodes_copy.splice(config[c], 0, nodes_to_insert[c])
        }
        var alignment_score = 0
        for (var c = 0; c < config.length; c ++) {
            var node_at_site = nodes_to_insert[c]
            var left_gids = self.get_neighbor_graph_ids(config[c], 'left', visible_nodes_copy)
            var right_gids = self.get_neighbor_graph_ids(config[c], 'right', visible_nodes_copy)
            var gold_left_gids = node_at_site[g_order + "_left"]
            var gold_right_gids = node_at_site[g_order + "_right"]

            //console.log("right:")
            var right_o = editdistance(gold_right_gids, right_gids)
            for (var r = 0; r < right_o.alignments.length; r ++) {
                var align = right_o.alignments[r]
                if (align[0] == align[1]) {
                    alignment_score += (right_o.alignments.length - r) / (right_o.alignments.length)
                } else {
                    alignment_score -= (right_o.alignments.length - r) / (right_o.alignments.length)
                }
            }
            //console.log("left:")
            var left_o = editdistance(gold_left_gids, left_gids)
            for (var l = 0; l < left_o.alignments.length; l ++) {
                var align = left_o.alignments[l]
                //console.log(align[0] + " - " + align[1])
                if (align[0] == align[1]) {
                    alignment_score += (left_o.alignments.length - l) / (left_o.alignments.length)
                } else {
                    alignment_score -= (left_o.alignments.length - l) / (left_o.alignments.length)
                }
            }
        }
        //console.log("config:" + config + " alignment:" + alignment_score)
        return alignment_score
    }

    this.get_best_configuration = function (nodes_to_insert, g_order) {
        var configurations = get_paths(self.visible_nodes.length, nodes_to_insert.length)
        var best_config = []
        var max = Number.NEGATIVE_INFINITY
        for (var c in configurations) {
            var use_score1 = self.score_configuration_alignment(configurations[c], nodes_to_insert, g_order)
            var use_score2 = self.score_configuration_alignment_unq(configurations[c], nodes_to_insert, g_order)
            var use_score3 = self.score_configuration_overlap(configurations[c], nodes_to_insert, g_order)
            var use_score = use_score2
            console.log("alignment: " + use_score1 + " alignment_unq:" + use_score2 + " overlap:" + use_score3 + " config:" + configurations[c])
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


    this.add_nodes = function (nodes, nodes_idx) {
        self.sort_visible_nodes_by_display_order()


        for (var c = 0; c < nodes_idx.length; c ++) {
            self.visible_nodes.splice(nodes_idx[c], 0, nodes[c])
            nodes[c].visible = true
        }

        self.assign_display_order_by_array_order()
        self.update_visible_nodes()
    }

    this.get_neighbor_graph_ids = function (ps, neighbor_direction, base_array) {
        var graphs_ids = []
        //var prev = null
        if (neighbor_direction == 'right') {
            for (var i = ps + 1; i < base_array.length; i ++) {
                //if (prev != base_array[i].graph.id) {
                graphs_ids.push(base_array[i].graph.id)
                //    prev = base_array[i].graph.id
                //}
            }
            graphs_ids.push('*EN*')
        } else if (neighbor_direction == 'left') {
            for (var i = ps - 1; i >= 0; i --) {
                //if (prev != base_array[i].graph.id) {
                graphs_ids.push(base_array[i].graph.id)
                //    prev = base_array[i].graph.id
                //}
            }
            graphs_ids.push('*ST*')
        } else {
            console.log('invalid neighborhood direction')
        }

        return graphs_ids

    }

    this.remove_nodes = function (nodes) {
        for (var i in nodes) {
            var node = nodes[i]
            node.visible = false
            self.visible_nodes = _.reject(
                self.visible_nodes, function (n) {
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


    this.initial_order = function () {
        //assigns order of the visible nodes initially
        for (var i in self.visible_nodes) {
            var item = self.visible_nodes[i].get_view()
            $(item).css('order', i)
        }
    }

    this.update_visible_nodes = function () {
        console.log("drawing node items...")
        for (var i in self.visible_nodes) {

            var item = self.visible_nodes[i].get_view()

            //console.log("order :" + $(item).css('order') + "  is the order of " + item.node.s)
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
                //console.log("no movement")
            }
        }
        console.log("completed drawing node items...")
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
    for (var i in input.graphs) {
        s.graphs.push(Graph.parse(input.graphs[i]))
    }
    return s
}

function ok_parse() {
    for (var i in json_str_arr) {
        var jo = JSON.parse(json_str_arr[i])
        var s = Sentence.parse(jo)
        s.initialize()
        s.update_visible_nodes()
        s.initial_order()
    }
    console.log("done")
}
