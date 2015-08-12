/**
 * Created by arenduchintala on 8/10/15.
 */


function Node() {
    var self = this
    this.id = null
    this.s = ""
    this.en_id = null
    this.de_id = null
    this.lang = null
    this.item = null
    this.visible = false
    this.graph = null


    this.take_action = function (param) {
        console.log('action triggered:' + param.action + ',' + param.direction)
        if (param.action == 'reorder') {
            var current_ref = self.graph.idx_reference
            if (param.direction == current_ref) {

            } else {
                self.graph.idx_reference = param.direction
                for (var i in self.graph.nodes) {
                    if (self.graph.nodes[i].visible) {
                        if (self.graph.nodes.length > 1 || self.graph.nodes[i].en_id != self.graph.nodes.de_id) {
                            console.log("moving node" + self.graph.nodes[i].s)
                            var item = self.graph.nodes[i].get_item()
                            item.highlight_movement = true
                        }

                    }
                }
                self.graph.sentence.update_visible_nodes()
            }

        } else {
            if (param.direction == 'de') {
                self.graph.translate_from(self, 'de')
            } else {
                self.graph.translate_from(self, 'en')
            }
        }
    }

    this.get_item = function () {
        if (this.item == null) {
            this.item = document.createElement('div')
            this.item.inDom = false
            this.item.highlight_movement = false
            $(this.item).addClass('item')

            var menu_container = document.createElement('div')
            $(menu_container).addClass('node_menu_container')
            $(this.item).append($(menu_container))

            var translation_selector = document.createElement('div')
            $(translation_selector).addClass('translation_selector')
            $(menu_container).append($(translation_selector))
            $(translation_selector).on(
                'click', function () {
                    self.take_action({action: 'translate', direction: 'de'})
                })

            var reorder_selector = document.createElement('div')
            $(reorder_selector).addClass('reorder_selector')
            $(menu_container).append($(reorder_selector))
            $(reorder_selector).on(
                'click', function () {
                    self.take_action({action: 'reorder', direction: 'de'})
                })

            var s = document.createElement('span')
            s.innerHTML = this.s
            this.item.span = s
            $(this.item).append($(s))

            var bottom_menu_container = document.createElement('div')
            $(bottom_menu_container).addClass('node_menu_container')
            $(this.item).append($(bottom_menu_container))

            var translation_selector = document.createElement('div')
            $(translation_selector).addClass('translation_selector')
            $(bottom_menu_container).append($(translation_selector))
            $(translation_selector).on(
                'click', function () {
                    self.take_action({action: 'translate', direction: 'en'})
                })

            var reorder_selector = document.createElement('div')
            $(reorder_selector).addClass('reorder_selector')
            $(bottom_menu_container).append($(reorder_selector))
            $(reorder_selector).on(
                'click', function () {
                    self.take_action({action: 'reorder', direction: 'en'})
                })

            return this.item
        } else {
            return this.item
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
    this.idx_reference = 'en'

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
    this.remove_nodes = function (nodes) {
        for (var i in nodes) {
            var node = nodes[i]
            node.visible = false
            self.sentence.visible_nodes = _.reject(
                self.sentence.visible_nodes, function (n) {
                    if (n == node) {
                        var item = node.get_item()
                        item.inDom = false
                        $(item).detach()
                        return true
                    } else {
                        return false
                    }
                });
        }

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
            self.remove_nodes(nodes_to_remove)
            for (var n in neighbors) {
                neighbors[n].visible = true
                self.sentence.visible_nodes.push(neighbors[n])
            }
            console.log('added ' + neighbors.length + ' nodes to visible_nodes')
            self.sentence.update_visible_nodes()
        } else {
            console.log('can not translate in the given direction')
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
        for (var i in self.graphs) {
            self.graphs[i].initialize(self)

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


    this.update_order_of_visible_nodes = function () {
        //TODO: right now only orders by en_id
        self.visible_nodes = _.sortBy(
            self.visible_nodes, function (node) {
                if (node.graph.idx_reference == 'en') {
                    return node.en_id
                } else {
                    return node.de_id
                }
            });
        for (var i in self.visible_nodes) {
            $(self.visible_nodes[i].get_item()).css('order', i)
        }

    }

    this.update_visible_nodes = function () {

        console.log("drawing node items...")
        self.update_order_of_visible_nodes()
        for (var i in self.visible_nodes) {
            var item = self.visible_nodes[i].get_item()
            if (item.inDom) {

            } else {

                $(self.get_container()).append($(item))
                $(item.span).css("backgroundColor", "orange");
                $(item.span).animate({ backgroundColor: "transparent" }, 2000);
                item.inDom = true
            }

            if (item.highlight_movement) {
                $(item.span).css("backgroundColor", "orange");
                $(item.span).animate({ backgroundColor: "transparent" }, 2000);
                item.highlight_movement = false
            } else {
                console.log("no movement")
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
    return n

}
Graph.parse = function (input) {
    var g = new Graph()
    g.id = input.id
    g.idx_reference = input.idx_reference
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
    var jo = JSON.parse(json_str1)
    var s = Sentence.parse(jo)
    s.initialize()
    s.update_visible_nodes()
    console.log("done")


}
