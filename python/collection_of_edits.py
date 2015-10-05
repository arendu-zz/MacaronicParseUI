__author__ = 'arenduchintala'
import json

EN_LANG = 'en'
DE_LANG = 'de'
END = '*EN*'
START = '*ST*'
REORDER_SWAP_TYPE = 'swap reorder'
REORDER_TRANSFER = 'transfer reorder'
REORDER_SEPARATES = 'separation reorder'


class Edge(dict):
    def __init__(self, from_id, to_id, direction):
        dict.__init__(self)
        self.__dict__ = self
        assert isinstance(from_id, list)
        self.from_id = from_id
        assert isinstance(to_id, list)
        self.to_id = to_id
        self.direction = direction

    def __str__(self):
        return self.direction + ',' + str(','.join([str(i) for i in self.from_id])) + '->' + str(
            ','.join([str(i) for i in self.to_id]))

    @staticmethod
    def from_dict(dict_):
        e = Edge(dict_['from_id'], dict_['to_id'], dict_['direction'])
        return e


class Node(dict):
    def __init__(self, id, s, en_id, de_id, lang, visible, en_left=[], en_right=[], de_left=[], de_right=[],
                 to_en=False, to_de=True, ir=False):
        dict.__init__(self)
        self.__dict__ = self
        self.id = id
        self.s = s
        self.en_id = en_id
        self.de_id = de_id
        self.lang = lang
        self.visible = visible
        self.en_left = en_left
        self.en_right = en_right
        self.de_left = de_left
        self.de_right = de_right
        self.graph = None
        self.er_lang = "en"
        self.to_en = to_en
        self.to_de = to_de
        self.ir = ir

    def makecopy(self):
        n = Node(self.id, self.s, self.en_id, self.de_id, self.lang, self.visible, self.en_left, self.en_right,
                 self.de_left, self.en_right, to_en=self.to_en, to_de=self.to_de)
        return n

    def __eq__(self, other):
        return self.s == other.s and self.graph.id == other.graph.id and self.id == other.id

    def __str__(self):
        return str(self.id) + ',' + self.s

    @staticmethod
    def from_dict(dict_):
        """ Recursively (re)construct TreeNode-based tree from dictionary. """
        n = Node(dict_['id'], dict_['s'], dict_['en_id'], dict_['de_id'], dict_['lang'], dict_['visible'],
                 dict_['en_left'], dict_['en_right'], dict_['de_left'], dict_['de_right'], dict_['to_en'],
                 dict_['to_de'], dict_['ir'])
        return n


class Split(dict):
    def __init__(self):
        dict.__init__(self)
        self.__dict__ = self
        self.split_order = []
        self.unsplit_order = []
        self.separators = []
        self.currently_split = []


class Swap(dict):
    def __init__(self):
        dict.__init__(self)
        self.__dict__ = self
        self.graphs = []
        self.other_graphs = []
        self.head = None

    def make_copy(self):
        s = Swap()
        s.head = self.head
        s.graphs = [i for i in self.graphs]
        s.other_graphs = [i for i in self.other_graphs]
        return s

    @staticmethod
    def from_dict(dict_):
        s = Swap()
        s.head = dict_['head']
        s.graphs = dict_['graphs']
        s.other_graphs = dict_['other_graphs']
        return s


class Graph(dict):
    def __init__(self, id):
        dict.__init__(self)
        self.__dict__ = self
        self.id = id
        self.nodes = []
        self.edges = []
        self.er = False
        self.initial_order = id
        self.external_reorder_by = EN_LANG
        self.internal_reorder_by = EN_LANG

        self.splits = False
        self.is_separator = False
        self.split_interaction = None

        self.swaps = False
        self.swap_toward_en = []
        self.swap_toward_de = []

        self.separators = None
        self.currently_split = False
        self.separator_positions = None

        self.split_order_by_de = None
        self.split_order_by_en = None

    @staticmethod
    def from_dict(dict_):
        g = Graph(dict_['id'])
        g.er = dict_['er']
        g.initial_order = dict_['initial_order']
        g.internal_reorder_by = dict_['internal_reorder_by']
        g.external_reorder_by = dict_['external_reorder_by']
        g.transfers = dict_['transfers']
        g.splits = dict_['splits']
        g.currently_split = dict_['currently_split']
        g.swaps = dict_['swaps']
        g.swap_toward_de = list(map(Swap.from_dict, dict_['swap_toward_de']))
        g.swap_toward_en = list(map(Swap.from_dict, dict_['swap_toward_en']))
        g.dependents = dict_['dependents']

        g.separator_positions = dict_['separator_position']
        g.separators = dict_['separators']

        g.is_separator = dict_['is_separator']
        g.split_interaction = dict_['split_interaction']

        g.split_order_by_de = dict_['split_order_by_de']
        g.split_order_by_en = dict_['split_order_by_en']
        g.nodes = list(map(Node.from_dict, dict_['nodes']))
        g.edges = list(map(Edge.from_dict, dict_['edges']))
        return g

    def __str__(self):
        return str(self.id) + ',' + ','.join([str(i) for i in self.nodes])

    def set_visibility(self):
        visiblity_dict = {}
        for n in self.nodes:
            neighbor = self.get_neighbor_nodes(n, 'en')
            if n.visible and len(neighbor) > 0:
                n.visible = False
                for ne in neighbor:
                    lst = visiblity_dict.get(ne.id, set([]))
                    lst.add(n.id)
                    visiblity_dict[ne.id] = lst
                    ne.visible = True

        while len(visiblity_dict) > 0:
            visiblity_dict = {}
            for n in self.nodes:
                neighbor = self.get_neighbor_nodes(n, 'en')
                if n.visible and len(neighbor) > 0:
                    n.visible = False
                    for ne in neighbor:
                        lst = visiblity_dict.get(ne.id, set([]))
                        lst.add(n.id)
                        visiblity_dict[ne.id] = lst
                        ne.visible = True
        return True

    def propagate_de_id(self):
        propagate_list = []
        for n in self.nodes:
            if n.de_id is not None:
                propagate_list.append(n)
        while len(propagate_list) < len(self.nodes):
            # print len(propagate_list)
            propagate_dict = {}
            for n in propagate_list:
                neighbors = self.get_neighbor_nodes(n, 'en')
                neighbors = [ne for ne in neighbors if ne.de_id is None]
                for ne in neighbors:
                    t = propagate_dict.get(ne.id, [])
                    t.append(n)
                    propagate_dict[ne.id] = t
            for n_id, nl in propagate_dict.items():
                n = self.get_node_by_id(n_id)
                n.de_id = nl[0].de_id

            propagate_list = []
            for n in self.nodes:
                if n.de_id is not None:
                    propagate_list.append(n)
        return True

    def propagate_de_order(self):
        propagate_list = []
        for n in self.nodes:
            if len(n.de_left) > 0 and len(n.de_right) > 0:
                propagate_list.append(n)
        while len(propagate_list) < len(self.nodes):
            propagate_dict = {}
            for n in propagate_list:
                neighbors = self.get_neighbor_nodes(n, 'en')
                neighbors = [ne for ne in neighbors if len(ne.de_left) == 0 and len(ne.de_right) == 0]
                for ne in neighbors:
                    t = propagate_dict.get(ne.id, [])
                    t.append(n)
                    propagate_dict[ne.id] = t
            for n_id, nl in propagate_dict.items():
                n = self.get_node_by_id(n_id)
                n.de_left = nl[0].de_left
                n.de_right = nl[0].de_right

            propagate_list = []
            for n in self.nodes:
                if len(n.de_left) > 0 and len(n.de_right) > 0:
                    propagate_list.append(n)
        return True

    def get_neighbor_nodes(self, node, direction):
        neighbor_nodes = []
        for e in self.edges:
            if e.direction == direction and node.id in e.from_id:
                for toid in e.to_id:
                    neighbor_nodes.append(self.get_node_by_id(toid))
        return neighbor_nodes

    def get_node_by_id(self, node_id):
        assert isinstance(node_id, int)
        for n in self.nodes:
            if n.id == node_id:
                return n
        return None

    def get_visible_phrase(self, vis_lang, en_sent, de_sent):

        if vis_lang == 'de':
            vns = [(n.de_id, n) for n in self.nodes if n.visible]
            vns.sort()
            phrase = ' '.join([de_sent[p] for p, n in vns])
        else:
            vns = [(n.de_id, n) for n in self.nodes if n.visible]
            vns.sort()
            phrase = ' '.join([en_sent[p] for p, n in vns])

        return phrase

    def get_visible_phrase_with_idx(self, vis_lang):
        if vis_lang == 'de':
            vns = [(n.de_id, n) for n in self.nodes if n.visible]
            vns.sort()
            vns = [n.s + '-' + str(np + 1) if n.s != '@-@'else '@' + '-' + str(np + 1) for np, n in vns]
            return vns
        else:
            vns = [(n.de_id, n) for n in self.nodes if n.visible]
            vns.sort()
            vns = [n.s + '-' + str(np + 1) if n.s != '@-@'else '@' + '-' + str(np + 1) for np, n in vns]
            return vns


class Sentence(dict):
    def __init__(self, id, en, de, alignment):
        dict.__init__(self)
        self.__dict__ = self
        self.id = id
        self.en = en
        self.de = de
        self.alignment = alignment
        self.initial_order_by = EN_LANG
        self.graphs = []

    def get_graph_by_id(self, gid):
        for g in self.graphs:
            if g.id == gid:
                return g
        return None

    @staticmethod
    def from_dict(dict_):
        s = dict_['id']
        s.initial_order_by = dict_['initial_order_by']
        s.graphs = list(map(Sentence.from_dict, dict_['graphs']))
        return s


def get_edges(n1, n2):
    e1 = Edge([n1.id], [n2.id], DE_LANG)
    e2 = Edge([n2.id], [n1.id], EN_LANG)
    return [e1, e2]


def propagate(graph):
    for n in graph.nodes:
        if n.de_id is None or n.de_left is None or n.de_right is None:
            de_neighbors = graph.get_neighbor_nodes(n, DE_LANG)
            de_n = de_neighbors[0]
            assert de_n.de_left is not None and de_n.de_right is not None and de_n.de_id is not None
            n.de_id = de_n.de_id
            n.de_right = [i for i in de_n.de_right]
            n.de_left = [i for i in de_n.de_left]

        if n.en_id is None or n.en_left is None or n.en_right is None:
            en_neighbors = graph.get_neighbor_nodes(n, EN_LANG)
            en_n = en_neighbors[0]
            assert en_n.en_id is not None and en_n.en_left is not None and en_n.en_right is not None
            n.en_id = en_n.en_id
            n.en_right = [i for i in en_n.en_right]
            n.en_left = [i for i in en_n.en_left]


if __name__ == '__main__':
    all_sent = []

    s0 = Sentence(0, "A B C", "1 3 2", None)
    g0 = Graph(0)
    n0 = Node(0, 'A', 0, 0, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '1', 0, 0, DE_LANG, False, to_en=True, to_de=False)

    g0.nodes = [n0, n1]
    g0.edges = get_edges(n0, n1)
    propagate(g0)
    s0.graphs.append(g0)

    g1 = Graph(1)
    n0 = Node(0, 'B', 1, 2, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '2', 1, 2, DE_LANG, False, to_en=True, to_de=False)
    g1.nodes = [n0, n1]
    g1.edges = get_edges(n0, n1)
    propagate(g1)
    s0.graphs.append(g1)

    g2 = Graph(2)
    n0 = Node(0, 'C', 2, 1, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '3', 1, 2, DE_LANG, False, to_en=True, to_de=False)

    g2.nodes = [n0, n1]
    g2.edges = get_edges(n0, n1)
    g1.swaps = True
    g2.swaps = True
    s_obj = Swap()
    s_obj.graphs = [g1.id]
    s_obj.other_graphs = [g2.id]
    s_obj.head = 1
    g1.swap_toward_de = [s_obj.make_copy()]
    g2.swap_toward_de = [s_obj.make_copy()]
    g1.swap_toward_en = []
    g2.swap_toward_en = []

    propagate(g2)
    s0.graphs.append(g2)

    json_sentence_str = json.dumps(s0, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))

    s1 = Sentence(1, "A B C D E F", "1 4 2 3 6 5", None)
    g0 = Graph(0)
    n0 = Node(0, 'A', 0, 5, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '1', 0, 5, DE_LANG, False, to_en=True, to_de=False)

    g0.nodes = [n0, n1]
    g0.edges = get_edges(n0, n1)

    g1 = Graph(1)
    n0 = Node(0, 'B', 1, 1, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '2', 1, 1, DE_LANG, False, to_en=True,
              to_de=False)

    g1.nodes = [n0, n1]
    g1.edges = get_edges(n0, n1)
    propagate(g1)
    s1.graphs.append(g1)

    g2 = Graph(2)
    n0 = Node(0, 'C', 2, 2, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '3', 2, 2, DE_LANG, False, to_en=True, to_de=False)

    g2.nodes = [n0, n1]
    g2.edges = get_edges(n0, n1)
    propagate(g2)
    s1.graphs.append(g2)

    g3 = Graph(3)
    n0 = Node(0, 'D', 3, 0, EN_LANG, True, to_en=False,
              to_de=True)
    n1 = Node(1, '4', 3, 0, DE_LANG, False, to_en=True,
              to_de=False)

    g3.nodes = [n0, n1]
    g3.edges = get_edges(n0, n1)
    g3.swaps = True
    g1.swaps = True
    g2.swaps = True
    s_obj = Swap()
    s_obj.graphs = [g1.id, g2.id]
    s_obj.other_graphs = [g3.id]
    s_obj.head = 2
    g3.swap_toward_de = [s_obj.make_copy()]
    g3.swap_toward_en = []
    g1.swap_toward_de = [s_obj.make_copy()]
    g1.swap_toward_en = []
    g2.swap_toward_de = [s_obj.make_copy()]
    g2.swap_toward_en = []
    propagate(g3)
    s1.graphs.append(g3)

    g4 = Graph(4)
    n0 = Node(0, 'E', 4, 4, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '5', 4, 4, DE_LANG, False, to_en=True, to_de=False)
    g4.nodes = [n0, n1]
    g4.edges = get_edges(n0, n1)

    g5 = Graph(5)
    n0 = Node(0, 'F', 5, 3, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '6', 5, 3, DE_LANG, False, to_en=True, to_de=False)
    g5.nodes = [n0, n1]
    g5.edges = get_edges(n0, n1)

    s_obj = Swap()
    s_obj.graphs = [g5.id]
    s_obj.other_graphs = [g4.id]
    s_obj.head = 2
    g5.swaps = True
    g4.swaps = True
    g4.swap_toward_de = [s_obj.make_copy()]
    g5.swap_toward_de = [s_obj.make_copy()]
    g4.swap_toward_en = []
    g5.swap_toward_en = []
    propagate(g4)
    propagate(g5)
    s1.graphs.append(g4)
    s1.graphs.append(g5)

    g0.swaps = True
    s_obj = Swap()
    s_obj.graphs = [g0.id]
    s_obj.other_graphs = [g1.id, g2.id, g3.id, g4.id, g5.id]
    s_obj.head = 0
    g0.swap_toward_de = [s_obj.make_copy()]
    g0.swap_toward_en = []
    g1.swap_toward_de.append(s_obj.make_copy())
    g2.swap_toward_de.append(s_obj.make_copy())
    g3.swap_toward_de.append(s_obj.make_copy())
    g4.swap_toward_de.append(s_obj.make_copy())
    g5.swap_toward_de.append(s_obj.make_copy())

    propagate(g0)
    s1.graphs.append(g0)

    json_sentence_str = json.dumps(s1, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))

    s2 = Sentence(2, "A B C", "1 21 3 22", None)
    g0 = Graph(0)
    n0 = Node(0, 'A', 0, 0, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '1', 0, 0, DE_LANG, False, to_en=True, to_de=False)
    g0.nodes = [n0, n1]
    g0.edges = get_edges(n0, n1)
    propagate(g0)
    s2.graphs.append(g0)

    g1 = Graph(1)
    n0 = Node(0, 'B', 1, 1, EN_LANG, True, to_de=True, to_en=False)
    n1 = Node(1, '2a', 1, 1, DE_LANG, False, to_de=False, to_en=True)
    n2 = Node(2, '2b', 1, 3, DE_LANG, False, to_de=False, to_en=True)
    g1.nodes = [n0, n1, n2]
    g1.edges = get_edges(n0, n1) + get_edges(n0, n2)

    g2 = Graph(2)
    n0 = Node(0, 'C', 2, 2, EN_LANG, True, to_de=True, to_en=False)
    n1 = Node(1, '3', 2, 2, DE_LANG, False, to_de=False, to_en=True)
    g2.nodes = [n0, n1]
    g2.edges = get_edges(n0, n1)
    propagate(g2)
    s2.graphs.append(g2)

    g1.splits = True
    g1.separators = [g2.id]
    g1.separator_positions = ['right']
    g1.split_order_by_de = [g1.id, g2.id, g1.id]
    g1.split_order_by_en = [g1.id, g2.id]
    g1.split_to = 'de'
    propagate(g1)
    s2.graphs.append(g1)

    json_sentence_str = json.dumps(s2, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))

    s3 = Sentence(3, "A B C D", "1 31 2 32 4", None)
    g0 = Graph(0)
    n0 = Node(0, 'A', 0, 0, EN_LANG, True, [START], [1, 2, END], [START], [1, 2, 1, END], to_en=False, to_de=True)
    n1 = Node(1, '1', 0, 0, DE_LANG, False, [START], [1, 2, END], [START], [1, 2, 1, END], to_en=True, to_de=False)
    g0.nodes = [n0, n1]
    g0.edges = get_edges(n0, n1)
    propagate(g0)
    s3.graphs.append(g0)

    g1 = Graph(1)
    n0 = Node(0, 'B', 1, 2, EN_LANG, True, [0, START], [2, END], [0, START], [2, END], to_de=True, to_en=False)
    n1 = Node(1, '2', 1, 2, DE_LANG, False, [0, START], [2, END], [0, START], [END], to_de=False, to_en=True)
    g1.nodes = [n0, n1]
    g1.edges = get_edges(n0, n1)
    propagate(g1)
    s3.graphs.append(g1)

    g3 = Graph(3)
    n0 = Node(0, 'D', 3, 4, EN_LANG, True, [2, 1, 0, START], [END], [2, 1, 2, 0, START], [END], to_de=True, to_en=False)
    n1 = Node(1, '4', 3, 4, DE_LANG, False, [2, 1, 0, START], [END], [2, 1, 2, 0, START], [END], to_de=False,
              to_en=True)
    g3.nodes = [n0, n1]
    g3.edges = get_edges(n0, n1)
    propagate(g3)
    s3.graphs.append(g3)

    g2 = Graph(2)
    n0 = Node(0, 'C', 2, 2, EN_LANG, True, [1, 0, START], [3, END], [1, 0, START], [4, END], to_de=True, to_en=False)
    n1 = Node(1, 'C1', 2, 1, DE_LANG, False, [1, 2, START], [END], [0, START], [1, 2, 3, END], to_de=False, to_en=True)
    n2 = Node(2, 'C4', 2, 3, DE_LANG, False, [1, 2, START], [END], [1, 2, START], [1, END], to_de=False, to_en=True)
    g2.nodes = [n0, n1, n2]
    g2.edges = get_edges(n0, n1) + get_edges(n0, n2)
    g2.splits = True

    g2.currently_split = False
    g2.separators = [g1.id, g3.id]
    g1.is_separator = True
    g1.split_interaction = [g2.id, g3.id]
    g3.is_separator = True
    g3.split_interaction = [g2.id, g1.id]
    g2.separator_positions = ['left', 'right']
    g2.split_order_by_de = [g2.id, g1.id, g3.id, g2.id]
    g2.split_order_by_en = [g1.id, g2.id, g3.id]
    g2.split_to = 'de'
    propagate(g2)
    s3.graphs.append(g2)

    json_sentence_str = json.dumps(s3, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))

    s4 = Sentence(3, "A B C D", "1 31 2 32 4", None)
    g0 = Graph(0)
    n0 = Node(0, 'A', 0, 0, EN_LANG, True, [START], [1, 2, END], [START], [1, 2, 1, END], to_en=False, to_de=True)
    n1 = Node(1, '1', 0, 0, DE_LANG, False, [START], [1, 2, END], [START], [1, 2, 1, END], to_en=True, to_de=False)
    g0.nodes = [n0, n1]
    g0.edges = get_edges(n0, n1)
    propagate(g0)
    s4.graphs.append(g0)

    g1 = Graph(1)
    n0 = Node(0, 'B', 1, 2, EN_LANG, True, [0, START], [2, END], [0, START], [2, END], to_de=True, to_en=False)
    n1 = Node(1, '2', 1, 2, DE_LANG, False, [0, START], [2, END], [0, START], [END], to_de=False, to_en=True)
    g1.nodes = [n0, n1]
    g1.edges = get_edges(n0, n1)
    propagate(g1)
    s4.graphs.append(g1)

    g3 = Graph(3)
    n0 = Node(0, 'D', 3, 4, EN_LANG, True, [2, 1, 0, START], [END], [2, 1, 2, 0, START], [END], to_de=True, to_en=False)
    n1 = Node(1, '4', 3, 4, DE_LANG, False, [2, 1, 0, START], [END], [2, 1, 2, 0, START], [END], to_de=False,
              to_en=True)
    g3.nodes = [n0, n1]
    g3.edges = get_edges(n0, n1)
    propagate(g3)
    s4.graphs.append(g3)

    g2 = Graph(2)
    n0 = Node(0, 'C', 2, 2, EN_LANG, True, [1, 0, START], [3, END], [1, 0, START], [4, END], to_de=True, to_en=False)
    n1 = Node(1, 'C1', 2, 1, DE_LANG, False, [1, 2, START], [END], [0, START], [1, 2, 3, END], to_de=False, to_en=True)
    n2 = Node(2, 'C4', 2, 3, DE_LANG, False, [1, 2, START], [END], [1, 2, START], [1, END], to_de=False, to_en=True)
    g2.nodes = [n0, n1, n2]
    g2.edges = get_edges(n0, n1) + get_edges(n0, n2)
    g2.splits = True

    g2.currently_split = False
    g2.separators = [g1.id, g3.id]
    g1.is_separator = True
    g1.split_interaction = [g2.id, g3.id]
    g3.is_separator = True
    g3.split_interaction = [g2.id, g1.id]
    g2.separator_positions = ['left', 'right']
    g2.split_order_by_de = [g2.id, g1.id, g3.id, g2.id]
    g2.split_order_by_en = [g1.id, g2.id, g3.id]
    g2.split_to = 'de'
    propagate(g2)
    s4.graphs.append(g2)

    s_obj = Swap()
    s_obj.graphs = [g0.id]
    s_obj.other_graphs = [g1.id, g2.id, g3.id]
    s_obj.head = 0
    for g in [g0, g1, g2, g3]:
        g.swaps = True
        g.swap_toward_de = [s_obj.make_copy()]

    json_sentence_str = json.dumps(s4, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))

    s4 = Sentence(4, "A Ab B Ac C D", "1 2 3 4", None)
    s4.initial_order_by = EN_LANG
    g0 = Graph(0)
    n0 = Node(0, 'Aa', 0, 0, EN_LANG, False, to_en=False, to_de=True)
    n4 = Node(4, 'A', 0, 0, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, 'Ab', 1, 0, EN_LANG, True, to_en=False, to_de=True)
    n2 = Node(2, 'Ac', 3, 0, EN_LANG, True, to_en=False, to_de=True)
    n3 = Node(3, '1', 0, 0, DE_LANG, False, to_en=True, to_de=False)
    g0.nodes = [n0, n1, n2, n3, n4]
    g0.edges = get_edges(n0, n3) + get_edges(n1, n3) + get_edges(n2, n3) + get_edges(n4, n0)
    g0.splits = True
    propagate(g0)

    g1 = Graph(1)
    n0 = Node(0, 'B', 2, 1, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '2', 1, 1, DE_LANG, False, to_en=True, to_de=False)
    g1.nodes = [n0, n1]
    g1.edges = get_edges(n0, n1)
    g0.separators = [g1.id]
    g1.split_interaction = [g1.id]
    g1.is_separator = True
    g0.split_order_by_en = [g0.id, g0.id, g1.id, g0.id]
    g0.split_order_by_de = [g0.id, g1.id]
    g0.split_to = 'de'
    propagate(g1)

    g2 = Graph(2)
    n0 = Node(0, 'C', 4, 2, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '3', 4, 2, DE_LANG, False, to_en=True, to_de=False)
    g2.nodes = [n0, n1]
    g2.edges = get_edges(n0, n1)
    propagate(g2)

    g3 = Graph(3)
    n0 = Node(0, 'D', 5, 3, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, '4', 5, 3, DE_LANG, False, to_en=True, to_de=False)
    g3.nodes = [n0, n1]
    g3.edges = get_edges(n0, n1)
    propagate(g3)

    s4.graphs = [g0, g1, g2, g3]
    json_sentence_str = json.dumps(s4, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))
    print 'var json_str_arr = ', all_sent











