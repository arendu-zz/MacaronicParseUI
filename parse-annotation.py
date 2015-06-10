__author__ = 'arenduchintala'
import pdb,sys


class Node(object):
    def __init__(self, p):
        self.phrase = p
        self.children = []
        self.parent = None

    def addchild(self, node):
        self.children.append(node)

    def __str__(self):
        return self.phrase

    def get_phrase_underscore(self):
        return '_'.join(self.phrase.strip().split())

    def get_bracketed_string(self):
        if len(self.children) == 0:
            return " (" + self.get_phrase_underscore() + ")"
        elif len(self.children) == 1:
            b0 = self.children[0].get_bracketed_string()
            return " (" + self.get_phrase_underscore() + b0 + ")"
        elif len(self.children) == 2:
            b0 = self.children[0].get_bracketed_string()
            b1 = self.children[1].get_bracketed_string()
            return " (" + self.get_phrase_underscore() + b0 + " " + b1 + ")"
        else:
            return ""

    def remove_redundant(self):
        if len(self.children) == 1:
            c1 = self.children[0]
            if self.phrase.strip() == c1.phrase.strip():
                self.children = []
                for gc in c1.children:
                    self.children.append(gc)
                self.remove_redundant()
            else:
                c1.remove_redundant()

            #print 'removed', c1.phrase
            for nc in self.children:
                nc.remove_redundant()
        elif len(self.children) == 2:
            for c in self.children:
                c.remove_redundant()
        else:
            #print 'reached leaf'
            pass


if __name__ == "__main__":
    #hp = open('web/data-for-visualization.txt').read().split('\n\n')
    hp = open('web/Wien.txt').read().split('---')
    for f_idx, f in enumerate(hp):
        f = f.strip()
        f = f.split('\n')
        Q = []
        root = None
        for idx, line in enumerate(f):
            line = line.strip()
            line = ' '.join(line.split())
            #print idx, line
            divs = line.split('|')
            for n in divs:
                #print '\t', 'div', n
                merges = n.split('~')

                if len(merges) == 1:  # no actual merge yet
                    #print '\t\t', 'merges', merges[0], Q
                    if len(Q) > 0:
                        top = Q.pop(0)
                    else:
                        top = None
                    child = Node(merges[0])
                    if top is not None:
                        top.addchild(child)
                    else:
                        root = child
                    Q.append(child)
                elif len(merges) == 2:
                    #print '\t\t', 'merges', merges[0], merges[1], Q
                    top = Q.pop(0)
                    child1 = Node(merges[0])
                    child2 = Node(merges[1])
                    top.addchild(child1)
                    top.addchild(child2)
                    Q.append(child1)
                    Q.append(child2)
                else:
                    sys.stderr.write("this should not happen\n")
        root.remove_redundant()
        print root.get_bracketed_string().strip()
        sys.stderr.write("\ndone with "+ str(f_idx)+ "\n\n")

