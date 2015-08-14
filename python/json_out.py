__author__ = 'arenduchintala'
import json


class MyNode(dict):
    def __init__(self, d1, d2, children=None):
        dict.__init__(self)
        self.__dict__ = self
        self.a1 = d1
        self.a2 = d2
        self.children = []
        if children is not None:
            self.children = children

    def add_child(self, child):
        if isinstance(child, MyNode):
            self.children.append(child)

    @staticmethod
    def from_dict(dict_):
        """ Recursively (re)construct TreeNode-based tree from dictionary. """
        root = MyNode(dict_['a1'], dict_['a2'], dict_['children'])
        root.children = list(map(MyNode.from_dict, root.children))
        return root


if __name__ == '__main__':
    n = MyNode("root", "root data")
    c = MyNode("child 1", "child 1 data")
    c1 = MyNode("child 2", "child 2 data")
    c2 = MyNode("child 3", "child 3 data")
    n.add_child(c)
    n.add_child(c1)
    c1.add_child(c2)
    print json.dumps(n, sort_keys=True, indent=4)
    json_str = json.dumps(n, sort_keys=True, indent=4)

    root = MyNode.from_dict(json.loads(json_str))
    print root.a1, root.a2, root.children