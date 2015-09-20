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


class Reorder(dict):
    def __init__(self):
        dict.__init__(self)
        self.__dict__ = self
        self.type = None  #
        self.anchor = None

    @staticmethod
    def from_dict(dict_):
        r = Reorder()
        r.type = dict_['type']
        r.anchor = dict_['anchor']
        return r


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
        self.transfers = False
        self.swaps = False

        self.swaps_with = None
        self.separators = None
        self.currently_split = False
        self.separator_positions = None

        self.split_ordering = None
        self.unsplit_ordering = None

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
        g.separator_positions = dict_['separator_position']
        g.separators = dict_['separators']
        g.is_separator = dict_['is_separator']
        g.split_interaction = dict_['split_interaction']
        g.swaps_with = dict_['swaps_with']
        g.unsplit_ordering = dict_['unsplit_ordering']
        g.split_ordering = dict_['split_ordering']
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
    '''en = "please shut the door"
    de = "bitte mach die tur zu"
    alignment = "blank"
    g0 = Graph(0)
    n0 = Node(0, 'please', 0, 0, EN_LANG, True, [START], [1, 2, 2, END], [START], [1, 2, 2, 1, END], to_de=True,
              to_en=False)
    n1 = Node(1, 'bitte', 0, 0, DE_LANG, False, [START], [1, 2, 2, END], [START], [1, 2, 2, 1, END], to_de=False,
              to_en=True)
    g0.nodes = [n0, n1]
    g0.edges = get_edges(n0, n1)

    g1 = Graph(1)
    n0 = Node(0, 'shut', 0, 0, EN_LANG, True, [0, START], [2, 2, END], [0, START], [2, 2, END], to_de=True, to_en=False)
    n1 = Node(1, 'make', 0, 0, EN_LANG, False, [0, START], [1, 2, 2, END], [0, START], [2, 2, 1, END], to_de=True,
              to_en=True)
    n2 = Node(3, 'mach', 0, 0, DE_LANG, False, [0, START], [1, 2, 2, END], [0, START], [2, 2, 1, END], to_de=False,
              to_en=True)
    n3 = Node(2, 'close', 1, 1, EN_LANG, False, [1, 0, START], [2, 2, END], [2, 2, 1, 0, START], [END], to_de=True,
              to_en=True)
    n4 = Node(4, 'zu', 1, 1, DE_LANG, False, [1, 0, START], [2, 2, END], [2, 2, 1, 0, START], [END], to_de=False,
              to_en=True)
    g1.er = True
    g1.nodes = [n0, n1, n2, n3, n4]
    g1.edges = get_edges(n0, n1) + get_edges(n0, n3) + get_edges(n1, n2) + get_edges(n3, n4)

    g2 = Graph(2)
    n0 = Node(0, 'the', 0, 0, EN_LANG, True, [1, 0, START], [2, END], [1, 0, START], [2, 1, END], to_de=True,
              to_en=False)
    n1 = Node(2, 'die', 0, 0, DE_LANG, False, [1, 0, START], [2, END], [1, 0, START], [2, 1, END], to_de=False,
              to_en=True)
    n2 = Node(1, 'door', 1, 1, EN_LANG, True, [2, 1, 0, START], [END], [2, 1, 0, START], [1, END], to_de=True,
              to_en=False)
    n3 = Node(3, 'tur', 1, 1, DE_LANG, False, [2, 1, 0, START], [END], [2, 1, 0, START], [1, END], to_de=False,
              to_en=True)

    g2.nodes = [n0, n1, n2, n3]
    g2.edges = get_edges(n0, n1) + get_edges(n2, n3)
    g2.er = True

    s0 = Sentence(0, en, de, alignment)
    s0.graphs = [g0, g1, g2]


    # json_n3 = json.dumps(n3, indent=4)
    # n_load = Node.from_dict(json.loads(json_n3))
    # print n_load.en_left

    json_sentence_str = json.dumps(s0, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))
    # print json_sentence_str

    en = "I like to eat chocolate cake"
    de = "Ich mag zu Schokoladenkuchen essen"
    alignment = "blank"
    g0 = Graph(0)
    n0 = Node(5, 'I', 0, 0, EN_LANG, True, [START], [0, 0, 1, 2, 2, END], [START], [0, 0, 2, 1, END], to_en=False,
              to_de=True)
    n1 = Node(4, 'Ich', 0, 0, DE_LANG, False, [START], [0, 0, 1, 2, 2, END], [START], [0, 0, 2, 1, END], to_en=True,
              to_de=False)
    n2 = Node(3, 'like', 1, 1, EN_LANG, True, [0, START], [0, 1, 2, 2, END], [0, START], [0, 2, 1, END], to_en=False,
              to_de=True)
    n3 = Node(2, 'mag', 1, 1, DE_LANG, False, [0, START], [0, 1, 2, 2, END], [0, START], [0, 2, 1, END], to_en=True,
              to_de=False)
    n4 = Node(1, 'to', 2, 2, EN_LANG, True, [0, 0, START], [1, 2, 2, END], [0, 0, START], [2, 1, END], to_en=False,
              to_de=True)
    n5 = Node(0, 'zu', 2, 2, DE_LANG, False, [0, 0, START], [1, 2, 2, END], [0, 0, START], [2, 1, END], to_en=True,
              to_de=False)
    g0.nodes = [n0, n1, n2, n3, n4, n5]
    g0.edges = get_edges(n0, n1) + get_edges(n2, n3) + get_edges(n4, n5)

    g1 = Graph(1)
    n0 = Node(0, 'eat', 0, 0, EN_LANG, True, [0, 0, 0, START], [2, 2, END], [2, 0, 0, 0, START], [END], to_en=False,
              to_de=True)
    n1 = Node(1, 'essen', 0, 0, DE_LANG, False, [0, 0, 0, START], [2, 2, END], [2, 0, 0, 0, START], [END], to_en=True,
              to_de=False)
    g1.nodes = [n0, n1]
    g1.edges = get_edges(n0, n1)
    g1.er = True

    g2 = Graph(2)
    n0 = Node(0, 'chocolate', 0, 0, EN_LANG, True, [1, 0, 0, 0, START], [2, END], [0, 0, 0, START], [2, 1, END],
              to_en=False, to_de=True)
    n1 = Node(1, 'Schokolade', 0, 0, DE_LANG, False, [1, 0, 0, 0, START], [2, END], [0, 0, 0, START], [2, 1, END],
              to_en=True, to_de=True)
    n2 = Node(2, 'cake', 1, 1, EN_LANG, True, [2, 1, 0, 0, 0, START], [END], [2, 0, 0, 0, START], [1, END], to_en=False,
              to_de=True)
    n3 = Node(3, 'kuchen', 1, 1, DE_LANG, False, [2, 1, 0, 0, 0, START], [END], [2, 0, 0, 0, START], [1, END],
              to_en=True, to_de=True)
    n4 = Node(4, 'SchocoladenKuchen', 0, 0, DE_LANG, False, [1, 0, 0, 0, START], [END], [0, 0, 0, START], [1, END],
              to_en=True, to_de=False)
    g2.nodes = [n0, n1, n2, n3, n4]
    g2.edges = get_edges(n0, n1) + get_edges(n2, n3) + get_edges(n1, n4) + get_edges(n3, n4)
    g2.er = True

    s1 = Sentence(1, en, de, alignment)
    s1.graphs = [g0, g1, g2]

    json_sentence_str = json.dumps(s1, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))
    # print 'var json_str_arr = ', all_sent
    # print json_sentence_str

    s2 = Sentence(2, en, de, alignment)
    g0 = Graph(0)
    n0 = Node(0, 'A', 0, 0, EN_LANG, True, [START], [0, 0, 1, END], [START], [0, 1, 1, END], to_en=False, to_de=True)
    n1 = Node(1, 'B', 1, 1, EN_LANG, True, [0, START], [0, 1, END], [START], [1, 1, END], to_en=False, to_de=True)
    n2 = Node(2, 'C', 2, 2, EN_LANG, True, [0, 0, START], [1, END], [0, START], [1, 1, END], to_en=False, to_de=True)
    n3 = Node(3, '1', 0, 0, DE_LANG, False, [START], [0, 0, 1, END], [START], [0, 1, 1, END], to_en=True, to_de=False)
    n4 = Node(4, '2', 1, 1, DE_LANG, False, [0, START], [1, END], [START], [0, 1, 1, END], to_en=True, to_de=False)
    g0.nodes = [n0, n1, n2, n3, n4]
    g0.edges = get_edges(n0, n3) + get_edges(n1, n4) + get_edges(n2, n4)
    g0.er = False

    g1 = Graph(1)
    n0 = Node(0, 'D', 0, 0, EN_LANG, True, [0, 0, 0, START], [END], [0, 0, START], [END], to_en=False, to_de=True)
    n1 = Node(1, '3', 0, 0, DE_LANG, False, [0, 0, 0, START], [END], [0, 0, START], [2, 1, END], to_en=True,
              to_de=False)
    n2 = Node(2, '4', 1, 1, DE_LANG, False, [0, 0, 0, START], [END], [2, 1, 0, 0, START], [END], to_en=True,
              to_de=False)
    g1.nodes = [n0, n1, n2]
    g1.edges = get_edges(n0, n1) + get_edges(n0, n2)
    g1.er = False

    g2 = Graph(2)
    n0 = Node(0, 'E', 0, 0, EN_LANG, True, [1, 0, 0, 0, START], [END], [1, 0, 0, START], [1, END], to_de=True,
              to_en=False)
    n1 = Node(1, '3.5', 0, 0, DE_LANG, False, [1, 0, 0, 0, START], [END], [1, 0, 0, START], [1, END], to_de=False,
              to_en=True)
    g2.nodes = [n0, n1]
    g2.edges = get_edges(n0, n1)
    g2.er = True
    s2.graphs = [g0, g1, g2]

    json_sentence_str = json.dumps(s2, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))

    s3 = Sentence(3, en, de, alignment)
    g0 = Graph(0)
    n0 = Node(0, 'A', 0, 0, EN_LANG, True, [START], [0, 0, 1, END], [START], [0, 1, 1, END], to_en=False, to_de=True)
    n1 = Node(1, 'B', 1, 1, EN_LANG, True, [0, START], [0, 1, END], [START], [1, 1, END], to_en=False, to_de=True)
    n2 = Node(2, 'C', 2, 2, EN_LANG, True, [0, 0, START], [1, END], [0, START], [1, 1, END], to_en=False, to_de=True)
    n3 = Node(3, '1', 0, 0, DE_LANG, False, [START], [0, 0, 1, END], [START], [0, 1, 1, END], to_en=True, to_de=False)
    n4 = Node(4, '2', 1, 1, DE_LANG, False, [0, START], [1, END], [START], [0, 1, 1, END], to_en=True, to_de=False)
    g0.nodes = [n0, n1, n2, n3, n4]
    g0.edges = get_edges(n0, n3) + get_edges(n1, n3) + get_edges(n1, n4) + get_edges(n2, n4)
    g0.er = False

    g1 = Graph(1)
    n0 = Node(0, 'D', 0, 0, EN_LANG, True, [0, 0, 0, START], [END], [0, 0, START], [END], to_en=False, to_de=True)
    n1 = Node(1, '3', 0, 0, DE_LANG, False, [0, 0, 0, START], [END], [0, 0, START], [2, 1, END], to_en=True,
              to_de=False)
    n2 = Node(2, '4', 1, 1, DE_LANG, False, [0, 0, 0, START], [END], [2, 1, 0, 0, START], [END], to_en=True,
              to_de=False)
    g1.nodes = [n0, n1, n2]
    g1.edges = get_edges(n0, n1) + get_edges(n0, n2)
    g1.er = False

    g2 = Graph(2)
    n0 = Node(0, 'E', 0, 0, EN_LANG, True, [1, 0, 0, 0, START], [END], [1, 0, 0, START], [1, END], to_de=True,
              to_en=False)
    n1 = Node(1, '3.5', 0, 0, DE_LANG, False, [1, 0, 0, 0, START], [END], [1, 0, 0, START], [1, END], to_de=False,
              to_en=True)
    g2.nodes = [n0, n1]
    g2.edges = get_edges(n0, n1)
    g2.er = True
    s3.graphs = [g0, g1, g2]

    json_sentence_str = json.dumps(s3, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))
    '''
    s0 = Sentence(0, "A B C", "1 3 2", None)
    g0 = Graph(0)
    n0 = Node(0, 'A', 0, 0, EN_LANG, True, [START], [1, 2, 3, END], [START], [2, 1, 3, END], to_en=False, to_de=True)
    n1 = Node(1, '1', 0, 0, DE_LANG, False, [START], [1, 2, 3, END], [START], [2, 1, 3, END], to_en=True, to_de=False)

    g0.nodes = [n0, n1]
    g0.edges = get_edges(n0, n1)
    propagate(g0)
    s0.graphs.append(g0)

    g1 = Graph(1)
    n0 = Node(0, 'B', 1, 2, EN_LANG, True, [0, START], [2, END], [2, 0, START], [END], to_en=False, to_de=True)
    n1 = Node(1, '2', 1, 2, DE_LANG, False, [0, START], [2, END], [2, 0, START], [END], to_en=True, to_de=False)
    g1.nodes = [n0, n1]
    g1.edges = get_edges(n0, n1)
    propagate(g1)
    s0.graphs.append(g1)

    g2 = Graph(2)
    n0 = Node(0, 'C', 2, 1, EN_LANG, True, [1, 0, START], [END], [0, START], [1, END], to_en=False, to_de=True)
    n1 = Node(1, '3', 1, 2, DE_LANG, False, [1, 0, START], [END], [0, START], [1, END], to_en=True, to_de=False)

    g2.nodes = [n0, n1]
    g2.edges = get_edges(n0, n1)
    g1.swaps = True
    g2.swaps = True
    g1.swaps_with = [g2.id]
    g2.swaps_with = [g1.id]
    propagate(g2)
    s0.graphs.append(g2)

    json_sentence_str = json.dumps(s0, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))

    s1 = Sentence(1, "A B C D E F", "1 4 2 3 6 5", None)
    g0 = Graph(0)
    n0 = Node(0, 'A', 0, 0, EN_LANG, True, [START], [1, 2, 3, END], [START], [3, 1, 2, END], to_en=False, to_de=True)
    n1 = Node(1, '1', 0, 0, DE_LANG, False, [START], [1, 2, 3, END], [START], [3, 1, 2, END], to_en=True, to_de=False)

    g0.nodes = [n0, n1]
    g0.edges = get_edges(n0, n1)
    propagate(g0)
    s1.graphs.append(g0)

    g1 = Graph(1)
    n0 = Node(0, 'B', 1, 2, EN_LANG, True, [0, START], [2, 3, END], [3, 1, 0, START], [2, END], to_en=False, to_de=True)
    n1 = Node(1, '2', 1, 2, DE_LANG, False, [0, START], [2, 3, END], [3, 1, 0, START], [2, END], to_en=True,
              to_de=False)

    g1.nodes = [n0, n1]
    g1.edges = get_edges(n0, n1)
    propagate(g1)
    s1.graphs.append(g1)

    g2 = Graph(2)
    n0 = Node(0, 'C', 2, 1, EN_LANG, True, [1, 0, START], [3, END], [1, 3, 0, START], [END], to_en=False, to_de=True)
    n1 = Node(1, '3', 1, 2, DE_LANG, False, [1, 0, START], [3, END], [1, 3, 0, START], [END], to_en=True, to_de=False)

    g2.nodes = [n0, n1]
    g2.edges = get_edges(n0, n1)
    propagate(g2)
    s1.graphs.append(g2)

    g3 = Graph(3)
    n0 = Node(0, 'D', 3, 1, EN_LANG, True, [2, 1, 0, START], [4, 5, END], [0, START], [1, 2, 4, 5, END], to_en=False,
              to_de=True)
    n1 = Node(1, '4', 3, 1, DE_LANG, False, [2, 1, 0, START], [END], [0, START], [1, 2, 4, 5, END], to_en=True,
              to_de=False)

    g3.nodes = [n0, n1]
    g3.edges = get_edges(n0, n1)
    g3.transfers = True
    propagate(g3)
    s1.graphs.append(g3)

    g4 = Graph(4)
    n0 = Node(0, 'E', 4, 5, EN_LANG, True, [None], [None], [None], [None], to_en=False, to_de=True)
    n1 = Node(1, '5', 4, 5, DE_LANG, False, [None], [None], [None], [None], to_en=False, to_de=True)
    g4.nodes = [n0, n1]
    g4.edges = get_edges(n0, n1)
    g5 = Graph(5)
    n0 = Node(0, 'F', 5, 4, EN_LANG, True, [None], [None], [None], [None], to_en=False, to_de=True)
    n1 = Node(1, '6', 5, 4, DE_LANG, False, [None], [None], [None], [None], to_en=False, to_de=True)
    g5.nodes = [n0, n1]
    g5.edges = get_edges(n0, n1)
    g4.swaps = True
    g4.swaps_with = [g5.id]

    g5.swaps = True
    g5.swaps_with = [g4.id]
    propagate(g4)
    propagate(g5)
    s1.graphs.append(g4)
    s1.graphs.append(g5)

    json_sentence_str = json.dumps(s1, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))

    s2 = Sentence(2, "A B C", "1 21 3 22", None)
    g0 = Graph(0)
    n0 = Node(0, 'A', 0, 0, EN_LANG, True, [START], [1, 2, END], [START], [1, 2, 1, END], to_en=False, to_de=True)
    n1 = Node(1, '1', 0, 0, DE_LANG, False, [START], [1, 2, END], [START], [1, 2, 1, END], to_en=True, to_de=False)
    g0.nodes = [n0, n1]
    g0.edges = get_edges(n0, n1)
    propagate(g0)
    s2.graphs.append(g0)

    g1 = Graph(1)
    n0 = Node(0, 'B', 1, 1, EN_LANG, True, [0, START], [2, END], [0, START], [2, END], to_de=True, to_en=False)
    n1 = Node(1, '2a', 1, 1, DE_LANG, False, [0, START], [2, END], [0, START], [END], to_de=False, to_en=True)
    n2 = Node(2, '2b', 1, 3, DE_LANG, False, [0, START], [2, END], [0, START], [END], to_de=False, to_en=True)
    g1.nodes = [n0, n1, n2]
    g1.edges = get_edges(n0, n1) + get_edges(n0, n2)

    g2 = Graph(2)
    n0 = Node(0, 'C', 2, 2, EN_LANG, True, [1, 2, START], [END], [1, 0, START], [1, END], to_de=True, to_en=False)
    n1 = Node(1, '3', 2, 2, DE_LANG, False, [1, 2, START], [END], [1, 0, START], [1, END], to_de=False, to_en=True)
    g2.nodes = [n0, n1]
    g2.edges = get_edges(n0, n1)
    propagate(g2)
    s2.graphs.append(g2)

    g1.splits = True
    g1.separators = [g2.id]
    g1.separator_positions = ['right']
    g1.split_ordering = [g1.id, g2.id, g1.id]
    g1.unsplit_ordering = [g1.id, g2.id]
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
    g2.split_ordering = [g2.id, g1.id, g3.id, g2.id]
    g2.unsplit_ordering = [g1.id, g2.id, g3.id]
    propagate(g2)
    s3.graphs.append(g2)

    json_sentence_str = json.dumps(s3, indent=4, sort_keys=True)
    all_sent.append(' '.join(json_sentence_str.split()))

    s4 = Sentence(4, "A1 A2 B A3 C D", "1 2 3 4", None)
    s4.initial_order_by = EN_LANG
    g0 = Graph(0)
    n0 = Node(0, 'A1', 0, 0, EN_LANG, True, to_en=False, to_de=True)
    n1 = Node(1, 'A2', 1, 0, EN_LANG, True, to_en=False, to_de=True)
    n2 = Node(2, 'A3', 3, 0, EN_LANG, True, to_en=False, to_de=True)
    n3 = Node(3, '1', 0, 0, DE_LANG, False, to_en=True, to_de=False)
    g0.nodes = [n0, n1, n2, n3]
    g0.edges = get_edges(n0, n3) + get_edges(n1, n3) + get_edges(n2, n3)
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
    g0.split_ordering = [g0.id, g0.id, g1.id, g0.id]
    g0.unsplit_ordering = [g0.id, g1.id]
    g0.currently_split = True
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








