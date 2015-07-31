__author__ = 'arenduchintala'

import sys


'''
this.phrase = phrase;
    this.phrasePart1 = ""
    this.phrasePart2 = ""
    this.num = -1;
    this.parent = parent;
    this.areChildrenSwapped = false
    this.areParentsSwapped = false
    this.wordTable = null;
    this.isLeaf = false;
    this.phraseChildren = [];
    this.phraseSiblings = [];
    this.areLeftDescendentsSwapping = false
    this.areRightDescendentsSwapping = false
    '''


def get_splits(fullstr_list, bp):
    s1 = ''
    s2 = ''
    joined = ''
    if bp == 0:
        s1 = ''
    else:
        s1 = '_'.join(fullstr_list[:bp])
        joined = s1
    if bp == len(fullstr_list):
        s2 = ''
    else:
        s2 = '_'.join(fullstr_list[bp:])
        if joined == '':
            joined = joined + s2
        else:
            joined = joined + '_' + s2
    assert joined == '_'.join(fullstr_list)
    return s1, s2


def get_best_split(fullstring, childrenNodes, action):
    c1 = ''
    c2 = ''
    if action == "swap":
        c1 = childrenNodes[1].phrase
        c2 = childrenNodes[0].phrase
    elif action == "noswap":
        c1 = childrenNodes[0].phrase
        c2 = childrenNodes[1].phrase
    elif action == "drop2":
        c1 = childrenNodes[0].phrase
        c2 = ''
    elif action == "drop1":
        c1 = ''
        c2 = childrenNodes[1].phrase

    else:
        pass
    fullstring_list = fullstring.split('_')
    for bp in range(len(fullstring) + 1):
        s1, s2 = get_splits(fullstring_list, bp)
        ced1 = ''
    return None


class Node(object):
    def __init__(self, p):
        self.phrase = p
        self.phraseChildren = []
        self.parent = None
        self.removed = False
        self.areChildrenSwapped = False
        self.areLeftDescendentsSwapping = False
        self.areRightDescendentsSwapping = False
        self.pass_over = False


    def addchild(self, node):
        self.phraseChildren.append(node)
        node.parent = self

    def __str__(self):
        return self.phrase

    def get_phrase_underscore(self):
        return '_'.join(self.phrase.strip().split())

    def get_bracketed_string(self):
        if len(self.phraseChildren) == 0:
            return " (" + self.get_phrase_underscore() + ")"
        elif len(self.phraseChildren) >= 1:
            bkt = []
            for child in self.phraseChildren:
                bkt.append(child.get_bracketed_string())
            return " (" + self.get_phrase_underscore() + (" ").join(bkt) + ")"
        else:
            return ""


    def flag_redundant_binary_nodes(self):
        current_txt = self.phrase.strip()
        child_txt = []
        if len(self.phraseChildren) > 1:
            for child in self.phraseChildren:
                child_txt.append(child.phrase.strip())

            if ' '.join(current_txt.split()) == ' '.join(child_txt):
                sys.stderr.write("redundant bn:" + ' '.join(current_txt.split()) + " -> " + '|'.join(child_txt) + "\n")
                if self.parent is not None:
                    '''sys.stderr.write("parent is:" + self.parent.phrase + "\n")
                    sys.stderr.write("parents children are: " + str(self.parent.children) + "\n")
                    sys.stderr.write("self is" + str([self]) + "\n")'''
                    idx = self.parent.children.index(self)
                    self.parent.children.remove(self)
                    self.removed = True
                    for child in reversed(self.phraseChildren):
                        self.parent.children.insert(idx, child)
                else:
                    pass  # sys.stderr.write("cant do anything no parent of redundant\n")
            else:
                pass  # sys.stderr.write("not redundant bn:" + current_txt + " -> " + '|'.join(child_txt) + "\n")
        else:
            pass  # sys.stderr.write("ignoring uniary node\n")

        for child in self.phraseChildren:
            if not child.removed:
                child.flag_redundant_binary_nodes()


    def mark_swaps(self):
        pass


    def remove_redundant(self):
        if len(self.phraseChildren) == 1:
            c1 = self.phraseChildren[0]
            if self.phrase.strip() == c1.phrase.strip():
                self.phraseChildren = []
                for gc in c1.phraseChildren:
                    self.phraseChildren.append(gc)
                self.remove_redundant()
            else:
                c1.remove_redundant()

            # print 'removed', c1.phrase
            for nc in self.phraseChildren:
                nc.remove_redundant()
        elif len(self.phraseChildren) >= 1:
            for c in self.phraseChildren:
                c.remove_redundant()
        else:
            # print 'reached leaf'
            pass

    def add_punct_child(self):
        leaf_nodes = self.getleaves()
        for l in leaf_nodes:
            if l.phrase.strip() == "." or l.phrase.strip() == "!" or l.phrase.strip() == ",":
                n = Node(l.phrase)
                l.addchild(n)
            else:
                pass
        return True


    def getleaves(self):
        leaves = []
        if len(self.phraseChildren) == 0:
            leaves.append(self)
        else:
            stack = []
            for c in reversed(self.phraseChildren):
                stack.append(c)
            while len(stack) > 0:
                pn = stack.pop()
                if len(pn.phraseChildren) == 0:
                    leaves.append(pn)
                else:
                    for c in reversed(pn.phraseChildren):
                        stack.append(c)
        return leaves


if __name__ == "__main__":
    # hp = open('web/data-for-visualization.txt').read().split('\n\n')
    hp = open(sys.argv[1]).read().split('---')
    finallist = []
    for f_idx, f in enumerate(hp):
        f = f.strip()
        f = f.split('\n')
        Q = []
        root = None
        prevPipeTeldaCount = 0
        passed = True
        for idx, line in enumerate(f):
            line = line.strip()
            # print idx, line
            line = ' '.join(line.split())
            pipeCount = line.count('|')
            pipeTeldaCount = pipeCount + line.count('~')
            if pipeCount == prevPipeTeldaCount:
                pass
            else:
                msg = "pipe counts check failed: " + str(line) + "\n"
                msg += "prevPipeTeldaCount:" + str(prevPipeTeldaCount) + ", pipeCount:" + str(pipeCount) + "\n"
                sys.stderr.write(msg)
                passed = False
            prevPipeTeldaCount = pipeTeldaCount
            divs = line.split('|')
            for n in divs:
                # print '\t', 'div', n
                merges = n.split('~')

                if len(merges) == 1:  # no actual merge yet
                    # print '\t\t', 'merges', merges[0], Q
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
                    # print '\t\t', 'merges', merges[0], merges[1], Q
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
        root.add_punct_child()
        root.mark_swaps()
        # root.flag_redundant_binary_nodes() todo: this was causing issues with underline

        if passed:
            finallist.append('"' + root.get_bracketed_string().strip() + '"')
            sys.stderr.write("completed:" + str(f_idx) + "\n\n")
        else:
            sys.stderr.write("failed:" + str(f_idx) + "\n\n")

    sys.stderr.write("done.\n")
    print '[' + ',\n'.join(finallist) + ']'
