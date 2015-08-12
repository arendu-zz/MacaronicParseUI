__author__ = 'arenduchintala'
import json

EN_LANG = 'en'
DE_LANG = 'de'


class Edge(dict):
    def __init__(self, from_id, to_id, direction):
        dict.__init__(self)
        self.__dict__ = self
        self.from_id = from_id
        self.to_id = to_id
        self.direction = direction

    @staticmethod
    def from_dict(dict_):
        e = Edge(dict_['from_id'], dict_['to_id'], dict_['direction'])
        return e


class Node(dict):
    def __init__(self, id, s, en_id, de_id, lang, visible):
        dict.__init__(self)
        self.__dict__ = self
        self.id = id
        self.s = s
        self.en_id = en_id
        self.de_id = de_id
        self.lang = lang
        self.visible = visible

    @staticmethod
    def from_dict(dict_):
        """ Recursively (re)construct TreeNode-based tree from dictionary. """
        n = Node(dict_['id'], dict_['s'], dict_['en_id'], dict_['de_id'], dict_['lang'], dict_['visible'])
        return n


class Graph(dict):
    def __init__(self, id, idx_reference):
        dict.__init__(self)
        self.__dict__ = self
        self.id = id
        self.nodes = []
        self.edges = []
        self.idx_reference = 'en'


    @staticmethod
    def from_dict(dict_):
        g = Graph(dict_['id'], dict_['idx_reference'])
        g.nodes = list(map(Node.from_dict, dict_['nodes']))
        g.edges = list(map(Edge.from_dict, dict_['edges']))
        return g


class Sentence(dict):
    def __init__(self, id, en, de, alignment):
        dict.__init__(self)
        self.__dict__ = self
        self.id = id
        self.en = en
        self.de = de
        self.alignment = alignment
        self.graphs = []

    @staticmethod
    def from_dict(dict_):
        s = dict_['id']
        s.graphs = list(map(Sentence.from_dict, dict_['graphs']))
        return s


def get_edges(n1, n2):
    e1 = Edge(n1.id, n2.id, 'de')
    e2 = Edge(n2.id, n1.id, 'en')
    return [e1, e2]


def make_simple_graph(idx, en_s, de_s, position_en, position_de=None):
    if position_de is None:
        position_de = position_en
    en_n = Node(0, en_s, position_en, position_de, 'en', True)
    de_n = Node(1, de_s, position_en, position_de, 'de', False)
    e1 = Edge(0, 1, 'de')
    e2 = Edge(1, 0, 'en')
    g = Graph(idx, 'en')
    g.nodes = [en_n, de_n]
    g.edges = [e1, e2]
    return g


if __name__ == '__main__':
    all_sent = []
    en = "please shut the door"
    de = "bitte mach die tur zu"
    alignment = "0-0 1-1 1-4 2-2 3-3"
    g0 = make_simple_graph(0, 'please', 'bitte', 0)
    g1 = Graph(1, 'en')
    n0 = Node(0, 'shut', 1, 1, EN_LANG, True)
    n1 = Node(1, 'make', 1, 1, EN_LANG, False)
    n2 = Node(2, 'mach', 1, 1, DE_LANG, False)
    n3 = Node(3, 'shut', 1.1, 4, EN_LANG, False)
    n4 = Node(4, 'close', 1.1, 4, EN_LANG, False)
    n5 = Node(5, 'zu', 1.1, 4, DE_LANG, False)
    g1.nodes = [n0, n1, n2, n3, n4, n5]
    g1.edges = get_edges(n0, n1) + get_edges(n0, n3) + get_edges(n1, n2) + get_edges(n3, n4) + get_edges(n4, n5)
    g2 = make_simple_graph(2, 'the', 'die', 2)
    g3 = make_simple_graph(3, 'door', 'tur', 3)
    s = Sentence(0, en, de, alignment)
    s.graphs = [g0, g1, g2, g3]
    json_sentence_str = json.dumps(s, indent=4)
    # print json_sentence_str
    all_sent.append(' '.join(json_sentence_str.split()))

    en = "I like to eat chocolate cake"
    de = "Ich mag zu Schokoladenkuchen essen"
    alignment = "0-0 1-1 2-2 3-4 4-3 5-3"
    g0 = make_simple_graph(0, 'I', 'Ich', 0)
    g1 = make_simple_graph(1, 'like', 'mag', 1)
    g2 = make_simple_graph(2, 'to', 'zu', 2)
    g3 = make_simple_graph(3, 'eat', 'essen', 3, 5.5)
    g4 = Graph(4, 'en')
    n0 = Node(0, 'chocolate', 4, 4, EN_LANG, True)
    n1 = Node(1, 'cake', 5, 5, EN_LANG, True)
    n2 = Node(2, 'Shokolade', 4, 4, DE_LANG, False)
    n3 = Node(3, 'Kuchen', 5, 5, DE_LANG, False)
    n4 = Node(4, 'Shokoladenkuchen', 4, 4, DE_LANG, False)
    g4.nodes = [n0, n1, n2, n3, n4]
    g4.edges = get_edges(n0, n2) + get_edges(n1, n3) + get_edges(n2, n4) + get_edges(n3, n4)
    s = Sentence(1, en, de, alignment)
    s.graphs = [g0, g1, g2, g3, g4]
    json_sentence_str = json.dumps(s, indent=4)
    all_sent.append(' '.join(json_sentence_str.split()))

    print all_sent





