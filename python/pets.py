__author__ = 'arenduchintala'
from nltk.tree import Tree
from itertools import groupby, chain, product
from collection_of_edits import Sentence, Graph, Node
from pprint import pprint
from operator import itemgetter
import pdb


class SplitNode(object):
    def __init__(self, sp1, sp2, o_idx1, o_idx2, g_idx1, g_idx2, swap, head=0):
        assert isinstance(sp1, list)
        assert isinstance(sp2, list)
        assert len(sp1) == len(o_idx1)
        assert len(sp2) == len(o_idx2)
        self.split1 = sp1
        self.o_idx1 = o_idx1
        self.o_idx2 = o_idx2
        self.g_idx1 = g_idx1
        self.g_idx2 = g_idx2
        self.split2 = sp2
        self.parent = None
        self.children1 = []
        self.children2 = []
        self.swap = swap
        self.head = head

    def keep_one(self):
        self.children1 = self.children1[:1]
        self.children2 = self.children2[:1]
        for c in self.children1:
            c.keep_one()
        for c in self.children2:
            c.keep_one()
        return True

    def get_one_derivation(self, p, rules=[]):
        rules.append((self.swap, self.g_idx1, self.g_idx2, p, self.head))
        for c in self.children1:
            c.get_one_derivation(self.split1, rules)
        for c in self.children2:
            c.get_one_derivation(self.split2, rules)
        return rules

    def add_child(self, sn, id):
        assert isinstance(sn, SplitNode)
        assert isinstance(id, int)
        sn.parent = self
        assert isinstance(sn, SplitNode)
        if id == 1:
            self.children1.append(sn)
        else:
            self.children2.append(sn)


def splits_to_str(sp1, sp2, s_idx1, s_idx2):
    str_sp1 = ','.join([str(i) for i in sp1])
    str_sp2 = ','.join([str(i) for i in sp2])
    str_s_idx1 = ','.join([str(i) for i in s_idx1])
    str_s_idx2 = ','.join([str(i) for i in s_idx2])
    return '|'.join([str_sp1, str_sp2, str_s_idx1, str_s_idx2])


def str_to_splits(str_splits):
    [str_sp1, str_sp2, str_s_idx1, str_s_idx2] = str_splits.split('|')
    sp1 = [int(i) for i in str_sp1.split(',')]
    sp2 = [int(i) for i in str_sp2.split(',')]
    s_idx1 = [int(i) for i in str_s_idx1.split(',')]
    s_idx2 = [int(i) for i in str_s_idx2.split(',')]
    return sp1, sp2, s_idx1, s_idx2


def overlaps(p1, p2):
    mp1 = min(p1[0], p1[1])
    mp2 = min(p2[0], p2[1])
    if mp1 > mp2:
        if mp1 > p2[1] and mp1 > p2[0]:
            return True
    if mp2 > mp1:
        if mp2 > p1[0] and mp2 > p1[1]:
            return True
    return False


def check_consistency2(split1, split2):
    r1 = (min(split1), max(split1))
    r2 = (min(split2), max(split2))
    if not overlaps(r1, r2):
        return False
    else:
        return True


def check_consistency(split1_a, split2_a, a):
    print split1_a, split2_a
    assert isinstance(split1_a, list)
    assert isinstance(split2_a, list)
    inp_span_1 = min(split1_a), max(split1_a) + 1
    inp_span_2 = min(split2_a), max(split2_a) + 1
    out_span_1 = 0, len(split1_a)
    out_span_2 = len(split1_a), len(split1_a + split2_a)
    inp_in_a1 = len([i for i in a if inp_span_1[0] <= i < inp_span_1[1]])
    inp_in_a2 = len([i for i in a if inp_span_2[0] <= i < inp_span_2[1]])
    out_in_a1 = out_span_1[1] - out_span_1[0]
    out_in_a2 = out_span_2[1] - out_span_2[0]
    if inp_in_a1 == out_in_a1 and inp_in_a2 == out_in_a2:
        return True
    else:
        return False


def split(alignment, idx_a, idx_g):
    min_a = min(alignment)
    a_monotonic = [abs(idx - a) == min_a for idx, a in enumerate(alignment)]
    splits = []
    for m in range(1, len(alignment)):
        is_split = a_monotonic[m] and a_monotonic[m - 1]
        if m < len(alignment) - 1:
            is_split = is_split and a_monotonic[m + 1]
        else:
            pass
        if not is_split:
            split1_a = alignment[:m]
            split1_idx = idx_a[:m]
            split1_g = idx_g[:m]
            split2_a = alignment[m:]
            split2_idx = idx_a[m:]
            split2_g = idx_g[m:]
            # if check_consistency(split1_a, split2_a, a):
            if check_consistency2(split1_a, split2_a):
                min_1 = min(split1_a)
                min_2 = min(split2_a)
                swaps = min_1 > min_2
                splits.append((split1_a, split2_a, split1_idx, split2_idx, split1_g, split2_g, swaps))
            else:
                pass  # print 'skipping', m, alignment
    return splits


def check_for_heads(g1_phrase, g2_phrase, dep_parse):
    g1_g2 = False
    g2_g1 = False
    g1_g1 = False
    g2_g2 = False
    for g1a, g1b in product(g1_phrase, g1_phrase):
        if (g1a, g1b) in dep_parse:
            g1_g1 = True

    for g2a, g2b in product(g2_phrase, g2_phrase):
        if (g2a, g2b) in dep_parse:
            g2_g2 = True

    for g1, g2 in product(g1_phrase, g2_phrase):
        if (g1, g2) in dep_parse:
            # print (g1, g2), 'g1->g2'
            g1_g2 = True

    for g1, g2 in product(g2_phrase, g1_phrase):
        if (g1, g2) in dep_parse:
            # print (g1, g2), 'g2->g1'
            g2_g1 = True

    if g1_g2 and not g2_g1:
        # print 'valid split and group 1 is the head', g1_g2, g1_g1, g2_g1, g2_g2
        return True, 1
    elif g2_g1 and not g1_g2:
        # print 'valid split and group 2 is the head', g1_g2, g1_g1, g2_g1, g2_g2
        return True, 2
    elif not g1_g2 and not g2_g1:
        # print 'valid split no head/dependent relations', g1_g2, g1_g1, g2_g1, g2_g2
        return True, 0  # valid split no head/dependent interaction
    else:
        # print 'not a valid split', g1_g2, g1_g1, g2_g1, g2_g2
        return False, 0  # not a valid split


def get_swap_rules(coe_sentence, input_tok_group, output_tok_group, dep_parse):
    rules = []
    input_unique = [i[0] for i in groupby(input_tok_group)]
    output_unique = [i[0] for i in groupby(output_tok_group)]
    alignment = [output_unique.index(i) for i in input_unique]
    alignment_idx = range(len(alignment))
    min_a = min(alignment)
    a_monotonic = [abs(idx - a) == min_a for idx, a in enumerate(alignment)]
    a_monotonic_new = a_monotonic
    a_monotonic_new = [a_monotonic[idx + 1 - 1: idx + 1 + 2].count(0) == 0 for idx, am in enumerate(a_monotonic[1:])]
    list_of_lists = []
    prev_split = 0
    for idx, am in enumerate(a_monotonic_new):
        if idx > 0:
            if am != a_monotonic_new[idx - 1]:
                sub_list = a_monotonic_new[prev_split:idx]
                sub_alignment = alignment[prev_split:idx]
                sub_alignment_idx = alignment_idx[prev_split:idx]
                sub_g_idx = input_unique[prev_split:idx]
                prev_split = idx
                if False in sub_list:
                    list_of_lists.append((sub_alignment, sub_alignment_idx, sub_g_idx))
        if idx == len(a_monotonic_new) - 1:
            sub_list = a_monotonic_new[prev_split:]
            sub_alignment = alignment[prev_split:]
            sub_alignment_idx = alignment_idx[prev_split:]
            sub_g_idx = input_unique[prev_split:]
            if False in sub_list:
                list_of_lists.append((sub_alignment, sub_alignment_idx, sub_g_idx))

    for align, align_idx, sub_g_idx in list_of_lists:
        rs = []
        root_node = SplitNode([], align, [], align_idx, [], sub_g_idx, False, 2)
        _stack = [root_node]
        while len(_stack) > 0:
            sn = _stack.pop()
            if len(sn.split1) > 1:
                splits = split(sn.split1, sn.o_idx1, sn.g_idx1)
                for s1, s2, s_idx1, s_idx2, gidx1, gidx2, swaps in splits:
                    # print s1, 'splits ', s2, 'base', sn.split1
                    legal = True
                    head = 0
                    if swaps:
                        g_phrase1 = [coe_sentence.get_graph_by_id(gid).get_visible_phrase_with_idx('de')
                                     for gid in gidx1]
                        g_phrase2 = [coe_sentence.get_graph_by_id(gid).get_visible_phrase_with_idx('de')
                                     for gid in gidx2]
                        g_phrase1 = [val for sublist in g_phrase1 for val in sublist]
                        g_phrase2 = [val for sublist in g_phrase2 for val in sublist]
                        # print s1, s_idx1, g_phrase1, 'swaps with', s2, s_idx2, g_phrase2
                        legal, head = check_for_heads(g_phrase1, g_phrase2, dep_parse)
                    if legal:
                        sn_child = SplitNode(s1, s2, s_idx1, s_idx2, gidx1, gidx2, swaps, head)
                        sn.add_child(sn_child, 1)
                        _stack.append(sn_child)

            if len(sn.split2) > 1:
                splits = split(sn.split2, sn.o_idx2, sn.g_idx2)
                for s1, s2, s_idx1, s_idx2, gidx1, gidx2, swaps in splits:
                    # print s1, 'splits ', s2, 'base', sn.split2
                    legal = True
                    head = 0
                    if swaps:
                        g_phrase1 = [coe_sentence.get_graph_by_id(gid).get_visible_phrase_with_idx('de')
                                     for gid in gidx1]
                        g_phrase2 = [coe_sentence.get_graph_by_id(gid).get_visible_phrase_with_idx('de')
                                     for gid in gidx2]
                        g_phrase1 = [val for sublist in g_phrase1 for val in sublist]
                        g_phrase2 = [val for sublist in g_phrase2 for val in sublist]
                        # print s1, s_idx1, g_phrase1, 'swaps with', s2, s_idx2, g_phrase2
                        legal, head = check_for_heads(g_phrase1, g_phrase2, dep_parse)
                    if legal:
                        sn_child = SplitNode(s1, s2, s_idx1, s_idx2, gidx1, gidx2, swaps, head)
                        sn.add_child(sn_child, 2)
                        _stack.append(sn_child)

        root_node.keep_one()
        # print 'ok'
        rs = root_node.get_one_derivation(align, rs)
        rules += [r for r in rs if r[0]]
    return rules


if __name__ == '__main__':
    alignment = [0, 4, 0, 3, 2, 1, 5, 6, 7, 8, 10, 9, 11]
    input_tok_group = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 14, 13, 15, 16, 17, 18, 19, 22, 20, 20, 21, 21,
                       23, 24, 25, 26, 27, 28, 29, 30, 31]
    output_tok_group = [0, 1, 2, 3, 4, 5, 7, 6, 8, 9, 10, 11, 12, 13, 15, 14, 16, 17, 19, 18, 21, 20, 22, 23, 24, 25,
                        27, 26, 28, 29, 30, 31]
    # input_tok_group = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 14, 13, 15, 16, 17, 18, 19, 22, 20, 20, 21, 21,
    # 23, 24, 25]
    # output_tok_group = [0, 1, 2, 3, 4, 5, 7, 6, 8, 9, 10, 11, 12, 13, 15, 14, 16, 17, 19, 18, 21, 20, 22, 23, 24, 25]

    # input_tok_group = [0, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9, 10, 11, 10, 12, 13, 14, 14, 14, 15]
    # output_tok_group = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 10, 13, 12, 14, 15]
    # alignment = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 9, 11]
    input_unique = [i[0] for i in groupby(input_tok_group)]
    output_unique = [i[0] for i in groupby(output_tok_group)]
    alignment = [output_unique.index(i) for i in input_unique]
    alignment_idx = range(len(alignment))
    min_a = min(alignment)
    a_monotonic = [abs(idx - a) == min_a for idx, a in enumerate(alignment)]
    a_monotonic_new = [a_monotonic[idx - 1: idx + 2].count(0) == 0 for idx, am in enumerate(a_monotonic)]
    list_of_lists = []
    prev_split = 0
    for idx, am in enumerate(a_monotonic_new):
        if idx > 0:
            if am != a_monotonic_new[idx - 1]:
                sub_list = a_monotonic_new[prev_split:idx]
                sub_alignment = alignment[prev_split:idx]
                sub_alignment_idx = alignment_idx[prev_split:idx]
                prev_split = idx
                if False in sub_list:
                    list_of_lists.append((sub_alignment, sub_alignment_idx))
        if idx == len(a_monotonic_new) - 1:
            sub_list = a_monotonic_new[prev_split:]
            sub_alignment = alignment[prev_split:]
            sub_alignment_idx = alignment_idx[prev_split:]
            if False in sub_list:
                list_of_lists.append((sub_alignment, sub_alignment_idx))
    '''
    for s in split(a, 0, len(a)):
        print 'splits:', s[0], 'and', s[1]

    a = [0, 4, 3, 2, 1]
    for s in split(a, 0, 5):
        print 'splits:', s[0], s[1]

    a = [4, 3, 2, 1]
    for s in split(a, 0, 4):
        print 'splits:', s[0], s[1]

    a = [4, 3, 2, 1, 0]
    for s in split(a, 0, 5):
        print 'splits:', s[0], s[1]
    '''
    print 'wtf'
    for align, align_idx in list_of_lists:
        pdb.set_trace()
        root_node = SplitNode([], align, [], align_idx, False)
        _stack = [root_node]
        rules = []
        while len(_stack) > 0:
            sn = _stack.pop()
            sp1 = sn.split1
            idx1 = sn.o_idx1
            sp2 = sn.split2
            idx2 = sn.o_idx2
            if len(sp1) > 1:
                splits = split(sp1, idx1)
                for s1, s2, s_idx1, s_idx2, swaps in splits:
                    legal = True
                    head = 0
                    if swaps:
                        print s1, s2, 'swap', s_idx1, s_idx2
                    if legal:
                        sn_child = SplitNode(s1, s2, s_idx1, s_idx2, swaps, head)
                        sn.add_child(sn_child, 1)
                        _stack.append(sn_child)

            if len(sp2) > 1:
                splits = split(sp2, idx2)
                for s1, s2, s_idx1, s_idx2, swaps in splits:
                    legal = True
                    head = 0
                    if swaps:
                        print s1, s2, 'swaps', s_idx1, s_idx2
                    if legal:
                        sn_child = SplitNode(s1, s2, s_idx1, s_idx2, swaps, head)
                        sn.add_child(sn_child, 2)
                        _stack.append(sn_child)
        root_node.keep_one()
        # print 'ok'
        rules = root_node.get_one_derivation(align, rules)
        for r in rules:
            print r
