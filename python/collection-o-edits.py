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
    def __init__(self, id, s, en_id, de_id, lang, visible, en_left, en_right, de_left, de_right):
        dict.__init__(self)
        self.__dict__ = self
        self.id = id
        self.s = s
        self.en_id = en_id
        self.de_id = de_id
        self.lang = lang
        self.visible = visible
        self.en_left = en_left + ['*ST*']
        self.en_right = en_right + ['*EN*']
        self.de_left = de_left + ['*ST*']
        self.de_right = de_right + ['*EN*']

    @staticmethod
    def from_dict(dict_):
        """ Recursively (re)construct TreeNode-based tree from dictionary. """
        n = Node(dict_['id'], dict_['s'], dict_['en_id'], dict_['de_id'], dict_['lang'], dict_['visible'],
                 dict_['en_left'], dict_['en_right'], dict_['de_left'], dict_['de_right'])
        return n


class Graph(dict):
    def __init__(self, id):
        dict.__init__(self)
        self.__dict__ = self
        self.id = id
        self.nodes = []
        self.edges = []


    @staticmethod
    def from_dict(dict_):
        g = Graph(dict_['id'])
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


if __name__ == '__main__':
    all_sent = []
    en = "please shut the door"
    de = "bitte mach die tur zu"
    alignment = "blank"
    g0 = Graph(0)
    n0 = Node(0, 'please', 0, 0, EN_LANG, True, [], [1, 2], [], [1, 2])
    n1 = Node(1, 'bitte', 0, 0, DE_LANG, False, [], [1, 2], [], [1, 2])
    g0.nodes = [n0, n1]
    g0.edges = get_edges(n0, n1)

    g1 = Graph(1)
    n0 = Node(0, 'shut', 0, 0, EN_LANG, True, [0], [2], [0], [2])
    n1 = Node(1, 'make', 0, 0, EN_LANG, False, [0], [2], [0], [2])
    n2 = Node(2, 'mach', 0, 0, DE_LANG, False, [0], [2], [0], [2])
    n3 = Node(3, 'close', 1, 1, EN_LANG, False, [1, 0], [2], [2, 1, 0], [])
    n4 = Node(4, 'zu', 1, 1, DE_LANG, False, [1, 0], [2], [2, 1, 0], [])
    g1.nodes = [n0, n1, n2, n3, n4]
    g1.edges = get_edges(n0, n1) + get_edges(n0, n3) + get_edges(n1, n2) + get_edges(n3, n4)

    g2 = Graph(2)
    n0 = Node(0, 'the', 0, 0, EN_LANG, True, [1, 0], [2], [1, 0], [2, 1])
    n1 = Node(1, 'die', 0, 0, DE_LANG, False, en_left=[1, 0], en_right=[2], de_left=[1, 0], de_right=[2, 1])
    n2 = Node(2, 'door', 1, 1, EN_LANG, True, en_left=[2, 1, 0], en_right=[], de_left=[2, 1, 0], de_right=[1])
    n3 = Node(3, 'tur', 1, 1, DE_LANG, False, en_left=[2, 1, 0], en_right=[], de_left=[2, 1, 0], de_right=[1])

    g2.nodes = [n0, n1, n2, n3]
    g2.edges = get_edges(n0, n1) + get_edges(n2, n3)

    s0 = Sentence(0, en, de, alignment)
    s0.graphs = [g0, g1, g2]


    # json_n3 = json.dumps(n3, indent=4)
    # n_load = Node.from_dict(json.loads(json_n3))
    # print n_load.en_left

    json_sentence_str = json.dumps(s0, indent=4)
    all_sent.append(' '.join(json_sentence_str.split()))

    en = "I like to eat chocolate cake"
    de = "Ich mag zu Schokoladenkuchen essen"
    alignment = "blank"
    g0 = Graph(0)
    n0 = Node(0, 'I', 0, 0, EN_LANG, True, [], [0, 1, 2], [], [0, 2, 1])
    n1 = Node(1, 'Ich', 0, 0, DE_LANG, False, [], [0, 1, 2], [], [0, 2, 1])
    n2 = Node(2, 'like', 1, 1, EN_LANG, True, [0], [0, 1, 2], [0], [0, 2, 1])
    n3 = Node(3, 'mag', 1, 1, DE_LANG, False, [0], [0, 1, 2], [0], [0, 2, 1])
    n4 = Node(4, 'to', 2, 2, EN_LANG, True, [0], [1, 2], [0], [2, 1])
    n5 = Node(5, 'to', 2, 2, DE_LANG, False, [0], [1, 2], [0], [2, 1])
    g0.nodes = [n0, n1, n2, n3, n4, n5]
    g0.edges = get_edges(n0, n1) + get_edges(n2, n3) + get_edges(n4, n5)

    g1 = Graph(1)
    n0 = Node(0, 'eat', 0, 0, EN_LANG, True, [0], [2], [0, 2], [])
    n1 = Node(1, 'essen', 0, 0, DE_LANG, False, [0], [2], [0, 2], [])
    g1.nodes = [n0, n1]
    g1.edges = get_edges(n0, n1)

    g2 = Graph(2)
    n0 = Node(0, 'chocolate', 0, 0, EN_LANG, True, [1, 0], [2], [0], [2, 1])
    n1 = Node(1, 'Schokolade', 0, 0, DE_LANG, False, [1, 0], [2], [0], [2, 1])
    n2 = Node(2, 'cake', 1, 1, EN_LANG, True, [2, 1, 0], [], [2, 0], [1])
    n3 = Node(3, 'kuchen', 1, 1, DE_LANG, False, [2, 1, 0], [], [2, 0], [1])
    n4 = Node(4, 'SchocoladenKuchen', 0, 0, DE_LANG, False, [1, 0], [], [0], [1])
    g2.nodes = [n0, n1, n2, n3, n4]
    g2.edges = get_edges(n0, n1) + get_edges(n2, n3) + get_edges(n1, n4) + get_edges(n3, n4)

    s1 = Sentence(1, en, de, alignment)
    s1.graphs = [g0, g1, g2]

    json_sentence_str = json.dumps(s1, indent=4)
    all_sent.append(' '.join(json_sentence_str.split()))
    print 'var json_str_arr = ', all_sent





