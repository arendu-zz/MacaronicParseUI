__author__ = 'arenduchintala'
import codecs
from optparse import OptionParser
from itertools import groupby
from collection_of_edits import Sentence, Node, Graph, EN_LANG, DE_LANG, START, END, get_edges
import json
import sys
import operator
import pdb

'''
reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'
'''
VIS_LANG = 'de'


def get_contiguous(lst):
    ranges = []
    for k, g in groupby(enumerate(lst), lambda (i, x): i - x):
        group = map(operator.itemgetter(1), g)
        ranges.append((group[0], group[-1]))
    return ranges


def get_lr(input_list, output_list):
    input_unique = [i[0] for i in groupby(input_list)]
    output_unique = [i[0] for i in groupby(output_list)]
    input_lr = {}
    for idx, i in enumerate(input_unique):
        l = input_unique[idx - 1] if 0 < idx  else '**'
        r = input_unique[idx + 1] if idx < len(input_unique) - 1 else '**'
        input_lr[i] = (l, r)
    output_lr = {}
    for idx, i in enumerate(output_unique):
        l = output_unique[idx - 1] if 0 < idx else '**'
        r = output_unique[idx + 1] if idx < len(output_unique) - 1 else '**'
        output_lr[i] = (l, r)
    return input_lr, output_lr


def mark_swaps_transfers_interrupts(input_tok_group, output_tok_group):
    swaps_inp = []
    swaps_out = []
    separatee_inp = []
    separator_inp = []
    separatee_out = []
    separator_out = []
    transfer = []
    for i in set(input_tok_group):
        tmp = [idx_x for idx_x, x in enumerate(input_tok_group) if x == i]
        c = get_contiguous(tmp)
        if len(c) == 2:
            c0 = c[0][1]
            c1 = c[1][0]
            middle_idxs = range(c0 + 1, c1)
            interrupting_group = [input_tok_group[mi] for mi in middle_idxs]
            separatee_inp.append(i)
            separator_inp.append(interrupting_group)
            # print 'discontiguous input', c, i, interrupting_group
        elif len(c) == 1:
            pass
            # print 'contiguous input'
        else:
            pass

        for i in set(output_tok_group):
            tmp = [idx_x for idx_x, x in enumerate(output_tok_group) if x == i]
            c = get_contiguous(tmp)
            if len(c) == 2:
                c0 = c[0][1]
                c1 = c[1][0]
                middle_idxs = range(c0 + 1, c1)
                interrupting_group = [output_tok_group[mi] for mi in middle_idxs]
                separatee_out.append(i)
                separator_out.append(interrupting_group)
                # print 'discontiguous output', c, i, interrupting_group
            elif len(c) == 1:
                pass
                # print 'contiguous ouput'
            else:
                pass

        interrupts_inp_flat = [item for sublist in separator_inp for item in sublist]
        interrupts_out_flat = [item for sublist in separator_out for item in sublist]

        input_lr, output_lr = get_lr(input_tok_group, output_tok_group)

        for i, (li, ri) in input_lr.items():
            (lo, ro) = output_lr[i]
            if li == ro and lo != ri and i not in interrupts_inp_flat and i not in separatee_inp and ro not in separatee_out and ro not in interrupts_out_flat:
                swaps_inp.append(i)
                swaps_out.append(ro)

        input_chk_transfer = [swap_notation(i, swaps_inp, swaps_out) for i in input_tok_group]
        output_chk_transfer = [swap_notation(i, swaps_inp, swaps_out) for i in output_tok_group]
        input_lr, output_lr = get_lr(input_chk_transfer, output_chk_transfer)

        for i, (li, ri) in input_lr.items():
            (lo, ro) = output_lr[i]
            if li != lo and ri != ro:
                if i not in swaps_inp and i not in swaps_out and isinstance(i, int):
                    transfer.append(i)

        return swaps_inp, swaps_out, transfer


def swap_notation(i, swap_i, swap_o):
    if i in swap_i:
        return i, swap_o[swap_i.index(i)]
    elif i in swap_o:
        return swap_i[swap_o.index(i)], i
    else:
        return i


def check_symmetric(wa_list):
    inp_wa, out_wa = make_inp_out(wa_list)
    inp_wa_sym = check_wa_dict(inp_wa)
    out_wa_sym = check_wa_dict(out_wa)
    return inp_wa_sym and out_wa_sym


def check_wa_dict(wa_dict):
    for k, v in wa_dict.items():
        if len(v) > 1:
            for v_ind in v:
                for v_all in wa_dict.values():
                    if v_ind in v_all and v_all is not v:
                        return False
    return True


def make_inp_out(wa_list):
    inp_wa = {}
    out_wa = {}
    for inp_a, out_a in wa_list:
        tmp = inp_wa.get(tuple([inp_a]), set([]))
        tmp = set(list(tmp))
        tmp.add(out_a)
        inp_wa[tuple([inp_a])] = tuple(list(tmp))
        tmp = out_wa.get(tuple([out_a]), set([]))
        tmp = set(list(tmp))
        tmp.add(inp_a)
        out_wa[tuple([out_a])] = tuple(list(tmp))

    return inp_wa, out_wa


def get_coverage(wa_list, original_wa_list):
    original_inp = set([i[0] for i in original_wa_list])
    original_out = set([i[1] for i in original_wa_list])
    current_inp = set([i[0] for i in wa_list])
    current_out = set([i[1] for i in wa_list])
    return len(original_inp - current_inp) + len(original_out - current_out)


def insert_epsilon_edge(wa_original, inp_phrase, out_phrase):
    wa = [a for a in wa_original]
    inp_cov = [0] * len(inp_phrase)
    out_cov = [0] * len(out_phrase)
    inp_pos_ratio = [float(idx) / len(inp_phrase) for idx, i in enumerate(inp_phrase)]
    out_pos_ratio = [float(idx) / len(out_phrase) for idx, i in enumerate(out_phrase)]
    while 0 in inp_cov or 0 in out_cov:
        for i, o in wa:
            inp_cov[i] = 1
            out_cov[o] = 1
        for i_idx, (pos_ratio, ic) in enumerate(zip(inp_pos_ratio, inp_cov)):
            if ic == 0:
                out_pos_ratio_diff = [(abs(pos_ratio - pr), o_idx) for o_idx, pr in enumerate(out_pos_ratio)]
                out_pos_ratio_diff.sort()
                best_out_alignment_idx = out_pos_ratio_diff[0][1]
                wa.append((i_idx, best_out_alignment_idx))
        for i, o in wa:
            inp_cov[i] = 1
            out_cov[o] = 1
        for o_idx, (pos_ratio, oc) in enumerate(zip(out_pos_ratio, out_cov)):
            if oc == 0:
                inp_pos_ratio_diff = [(abs(pos_ratio - pr), i_idx) for i_idx, pr in enumerate(inp_pos_ratio)]
                inp_pos_ratio_diff.sort()
                best_inp_alignment_idx = inp_pos_ratio_diff[0][1]
                wa.append((best_inp_alignment_idx, o_idx))
        for i, o in wa:
            inp_cov[i] = 1
            out_cov[o] = 1
    return wa


def make_symmetric(wa_list):
    _stack = []
    _stack.append((0, wa_list))
    while len(_stack) > 0:
        _stack.sort()
        curr_coverage, curr_wa_list = _stack.pop(0)
        if check_symmetric(curr_wa_list):
            return curr_coverage, curr_wa_list
        else:
            for i in range(0, len(curr_wa_list)):
                copy_wa_list = [item for idx, item in enumerate(curr_wa_list) if idx != i]
                # print 'removing an item', copy_wa_list, ' form ', curr_wa_list
                _stack.append((get_coverage(copy_wa_list, wa_list), copy_wa_list))
    return 0, []


def remove_subset(d):
    # print 'checking remove subset', d
    del_d = set([])
    for k, v in d.items():
        set_k = set(list(k))
        set_v = set(list(v))
        for sk, sv in d.items():
            set_sk = set(list(sk))
            set_sv = set(list(sv))
            # print 'compare', set_k, set_sk
            if set_k != set_sk and set_k.issubset(set_sk):
                del_d.add(tuple(set_k))
    # print 'delete', del_d, 'in ', d.keys()
    return del_d


def untangle_wa(wa_list):
    inp_wa_2_out_wa = {}
    out_wa_2_inp_wa = {}
    merged = {}
    for inp_a, out_a in wa_list:
        tmp = inp_wa_2_out_wa.get(tuple([inp_a]), set([]))
        tmp.add(out_a)
        inp_wa_2_out_wa[tuple([inp_a])] = tmp
        tmp = out_wa_2_inp_wa.get(tuple([out_a]), set([]))
        tmp.add(inp_a)
        out_wa_2_inp_wa[tuple([out_a])] = tmp

    # print 'before'

    same = False
    p_r_i = None
    p_r_o = None
    while not same:
        del_inp = set([])
        del_out = set([])
        for ko, vi in out_wa_2_inp_wa.items():
            for v in vi:
                update1 = inp_wa_2_out_wa.get(tuple([v]), set([]))
                update2 = inp_wa_2_out_wa.get(tuple(vi), set([]))
                inp_wa_2_out_wa[tuple(vi)] = update1.union(update2)
                del_inp.add(tuple([v]))
        for ki, vo in inp_wa_2_out_wa.items():
            for v in vo:
                update1 = out_wa_2_inp_wa.get(tuple([v]), set([]))
                update2 = out_wa_2_inp_wa.get(tuple(vo), set([]))
                out_wa_2_inp_wa[tuple(vo)] = update1.union(update2)
                del_out.add(tuple([v]))
        # print 'after'
        r_i = remove_subset(inp_wa_2_out_wa)
        r_o = remove_subset(out_wa_2_inp_wa)
        if r_i == p_r_i and r_o == p_r_o:
            same = True
        else:
            same = False
        p_r_i = r_i
        p_r_o = r_o



    # print 'deleting subsets'
    for rem_ro in p_r_o:
        del out_wa_2_inp_wa[rem_ro]
    for rem_ri in p_r_i:
        del inp_wa_2_out_wa[rem_ri]

    for k, v in inp_wa_2_out_wa.items():
        inp_wa_2_out_wa[k] = tuple(list(v))
    return inp_wa_2_out_wa


def make_edges(from_nodes, to_nodes):
    edges = []
    for fn in from_nodes:
        for tn in to_nodes:
            edges += get_edges(fn, tn)
    return edges


def get_output_phrase_as_spans(output_phrases):
    op_spans = []
    st_idx = 0
    end_idx = 0
    for op in output_phrases:
        l = len(op.split()) - 1
        end_idx = st_idx + l
        op_spans.append((st_idx, end_idx))
        st_idx = end_idx + 1
    return op_spans


def get_groups_that_external_reorder(input_tok_group, output_tok_group):
    reordering_groups = []
    for i_idx, inp_group in enumerate(input_tok_group):
        o_idxes = [o_idx for o_idx, out_group in enumerate(output_tok_group) if out_group == inp_group]
        if len(o_idxes) > 1:
            reordering_groups.append(inp_group)
        else:
            inp_group_left = [ig for igx, ig in enumerate(input_tok_group) if igx == i_idx - 1]
            inp_group_right = [ig for igx, ig in enumerate(input_tok_group) if igx == i_idx + 1]
            out_group_left = [og for ogx, og in enumerate(output_tok_group) if ogx == o_idxes[0] - 1]
            out_group_right = [og for ogx, og in enumerate(output_tok_group) if ogx == o_idxes[0] + 1]
            if inp_group_left == out_group_left and inp_group_right == out_group_right:
                pass
            else:
                reordering_groups.append(inp_group)
    return reordering_groups


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


def min_visible_word_position(graph, vis_lang):
    n_ids = []
    for n in graph.nodes:
        if n.visible and n.lang == vis_lang:
            if vis_lang == EN_LANG:
                n_ids.append(n.en_id)
            else:
                n_ids.append(n.de_id)
    n_ids.sort()
    return n_ids[0]


def sort_groups_by_lang(graphs, vis_lang):
    graph_tuple = [(min_visible_word_position(g, vis_lang), g) for g in graphs]
    graph_tuple.sort()
    graph_tuple = [g for mv, g in graph_tuple]
    graph_by_ids = []
    for sorted_g_idx, g in enumerate(graph_tuple):
        g.initial_order = sorted_g_idx
        g.external_reorder_by = vis_lang
        graph_by_ids.append((g.initial_order, g))
    graph_by_ids.sort()
    graphs = [g for gio, g in graph_by_ids]
    return graphs


if __name__ == '__main__':
    # wa = [(0, 0), (1, 0), (1, 1), (2, 1)]
    # wa_sym = make_symmetric(wa)
    # print 'sym:', wa_sym
    # wa = [(0, 0), (1, 0), (1, 1), (2, 0), (2, 2), (3, 2), (4, 2)]
    # wa_sym = make_symmetric(wa)
    # print 'sym:', wa_sym
    # exit()
    opt = OptionParser()
    # insert options here

    opt.add_option('-i', dest='input_mt', default='../web/newstest2013/newstest2013.input.tok.1')
    opt.add_option('-o', dest='output_mt', default='../web/newstest2013/newstest2013.output.1.wa')
    # opt.add_option('--e2f', dest='e2f', default='../web/newstest2013/lex1.e2f.small')
    # opt.add_option('--f2e', dest='f2e', default='../web/newstest2013/lex1.f2e.small')
    (options, _) = opt.parse_args()

    input_mt = codecs.open(options.input_mt, 'r', 'utf-8').readlines()
    output_mt = codecs.open(options.output_mt, 'r', 'utf-8').readlines()
    assert len(input_mt) == len(output_mt)
    sent_idx = 0
    eps_word_alignment = 0
    coe_sentences = []
    for input_line, output_line in zip(input_mt, output_mt)[:50]:

        sys.stderr.write('SENT' + str(sent_idx) + '\n')
        input_sent = input_line.strip().split()
        output_items = output_line.strip().split('|')
        output_phrases = [oi.strip() for idx, oi in enumerate(output_items) if idx % 2 == 0 and oi.strip() != '']
        output_sent = ' '.join(output_phrases).split()
        output_spans = get_output_phrase_as_spans(output_phrases)
        output_meta = [tuple(om.split(',wa=')) for idx, om in enumerate(output_items) if idx % 2 != 0]
        input_spans = [tuple([int(i) for i in om[0].split('-')]) for om in output_meta]
        wa_per_span = [[tuple([int(i) for i in a.split('-')]) for a in om[1].split()] for om in output_meta]
        input_tok_group = [-1] * len(input_sent)
        output_tok_group = [-1] * len(output_sent)

        sys.stderr.write('input sent:' + ' '.join(input_sent) + '\n')
        sys.stderr.write('output sent:' + ' '.join(output_sent) + '\n')

        coe_sentence = Sentence(sent_idx, ' '.join(input_sent), ' '.join(output_sent), None)
        sent_idx += 1
        assert len(wa_per_span) == len(input_spans) == len(output_spans)
        phrase_dict = {}
        input_coverage = [0] * len(input_sent)
        group_idx = 0
        for idx, (out_span, inp_span, wa) in enumerate(zip(output_spans, input_spans, wa_per_span)):
            out_phrase = output_sent[out_span[0]:out_span[1] + 1]
            inp_phrase = input_sent[inp_span[0]:inp_span[1] + 1]
            # print '\t phrases:', input_sent[inp_span[0]:inp_span[1] + 1], '-', output_sent[out_span[0]:out_span[1] + 1]
            # print '\t phrase spans:', inp_span, '-', out_span
            # print '\twa:', wa
            wa_no_null = insert_epsilon_edge(wa, input_sent[inp_span[0]:inp_span[1] + 1],
                                             output_sent[out_span[0]:out_span[1] + 1])
            # print '\twa-no-null:', wa_no_null
            sym_coverage, sym_wa = make_symmetric(wa_no_null)
            # print '\tsym wa2:', sym_wa
            assert sym_coverage == 0
            untangle = untangle_wa(sym_wa)
            # print '\tfinal wa:', untangle
            final_groups = {}
            for iu in sorted(untangle):
                ou = untangle[iu]
                if len(iu) > 1:
                    assert len(ou) == 1  # or (len(iu) == 2 and len(ou) == 2)
                    pass
                if len(ou) > 1:
                    assert len(iu) == 1  # or (len(iu) == 2 and len(ou) == 2)
                    pass
                final_groups[group_idx] = (iu, ou, inp_span, out_span)
                coe_graph = Graph(group_idx)
                # sys.stderr.write('\t\tGROUP' + str(group_idx) + '\n')
                # sys.stderr.write('\t\t\t')
                to_nodes = []
                node_idx = 0
                for iu_idx in iu:
                    assert inp_phrase[iu_idx] == input_sent[inp_span[0] + iu_idx]
                    input_coverage[inp_span[0] + iu_idx] = 1
                    input_tok_group[inp_span[0] + iu_idx] = group_idx
                    n = Node(node_idx, input_sent[inp_span[0] + iu_idx], None, inp_span[0] + iu_idx, DE_LANG,
                             VIS_LANG == DE_LANG,
                             None, None, None, None, True, False, False)
                    node_idx += 1
                    to_nodes.append(n)
                    # sys.stderr.write(' ' + input_sent[inp_span[0] + iu_idx] + ' ')

                # sys.stderr.write('---')
                from_nodes = []
                for ou_idx in ou:
                    assert out_phrase[ou_idx] == output_sent[out_span[0] + ou_idx]
                    output_tok_group[out_span[0] + ou_idx] = group_idx
                    n = Node(node_idx, output_sent[out_span[0] + ou_idx], out_span[0] + ou_idx, None, EN_LANG,
                             VIS_LANG == EN_LANG,
                             None, None, None, None, False, True, False)
                    node_idx += 1
                    from_nodes.append(n)
                    # sys.stderr.write(' ' + output_sent[out_span[0] + ou_idx] + ' ')

                # sys.stderr.write('\n')
                if len(from_nodes) > 1:
                    assert len(to_nodes) == 1  # or (len(iu) == 2 and len(ou) == 2)
                    pass
                if len(to_nodes) > 1:
                    assert len(from_nodes) == 1  # or (len(iu) == 2 and len(ou) == 2)
                    pass
                coe_graph.edges = make_edges(from_nodes, to_nodes)
                coe_graph.nodes = from_nodes + to_nodes
                coe_sentence.graphs.append(coe_graph)
                group_idx += 1
                # input_coverage[inp_span[0]: inp_span[1] + 1] = ['1'] * ((inp_span[1] + 1) - inp_span[0])

        coe_sentence.graphs = sort_groups_by_lang(coe_sentence.graphs, VIS_LANG)

        if 0 in input_coverage:
            # print 'bad coverage:', input_coverage
            eps_word_alignment += 1
            assert 0 not in input_coverage
        sys.stderr.write(' '.join([str(i) for i in input_tok_group]) + '\n')
        sys.stderr.write(' '.join([str(i) for i in output_tok_group]) + '\n')
        swaps_inp, swaps_out, transfer = mark_swaps_transfers_interrupts(input_tok_group, output_tok_group)
        swaps_str = ' '.join([str(i) + ',' + str(j) for i, j in zip(swaps_inp, swaps_out)])
        transfer_str = ','.join([str(i) for i in transfer])
        sys.stderr.write('swaps:' + swaps_str + '\n')
        sys.stderr.write('transfer:' + transfer_str + '\n')
        # er_groups = get_groups_that_external_reorder(input_tok_group, output_tok_group)
        # er_groups = set(er_groups)
        # sys.stderr.write('reorders:' + ' '.join([str(i) for i in er_groups]) + '\n')
        for g in coe_sentence.graphs:
            if g.id in swaps_inp + swaps_out + transfer:
                g.er = True
                if g.id in swaps_inp:
                    g.swaps_with = [swaps_out[swaps_inp.index(g.id)]]
                if g.id in swaps_out:
                    g.swaps_with = [swaps_inp[swaps_out.index(g.id)]]
                if g.id in transfer and g.swaps_with is None:
                    g.transfers = True
            for n in g.nodes:
                if n.lang == EN_LANG:
                    assert n.s == output_sent[n.en_id]
                    n.en_left = [START] + output_tok_group[:n.en_id]
                    n.en_left.reverse()
                    n.en_right = output_tok_group[n.en_id + 1:] + [END]
                if n.lang == DE_LANG:
                    assert n.s == input_sent[n.de_id]
                    n.de_left = [START] + input_tok_group[:n.de_id]
                    n.de_left.reverse()
                    n.de_right = input_tok_group[n.de_id + 1:] + [END]

            propagate(g)

            for n in g.nodes:
                assert n.en_id is not None and n.de_id is not None
                assert n.en_left is not None and n.de_left is not None
                assert n.en_right is not None and n.de_right is not None

        # sys.stderr.write('done sent' + str(sent_idx) + '\n')
        json_sentence_str = json.dumps(coe_sentence, indent=4, sort_keys=True)
        coe_sentences.append(' '.join(json_sentence_str.split()))
    sys.stderr.write('done' + str(eps_word_alignment) + ' errors\n')
    print 'var json_str_arr = ', coe_sentences





