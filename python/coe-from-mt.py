__author__ = 'arenduchintala'
import sys
import codecs
from optparse import OptionParser
from pprint import pprint

reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'


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
    opt.add_option('--e2f', dest='e2f', default='../web/newstest2013/lex1.e2f.small')
    opt.add_option('--f2e', dest='f2e', default='../web/newstest2013/lex1.f2e.small')
    (options, _) = opt.parse_args()

    input_mt = codecs.open(options.input_mt, 'r', 'utf-8').readlines()
    output_mt = codecs.open(options.output_mt, 'r', 'utf-8').readlines()
    assert len(input_mt) == len(output_mt)
    for input_line, output_line in zip(input_mt, output_mt)[:2]:
        input_sent = input_line.strip().split()
        input_coverage = ['0'] * len(input_sent)
        output_items = output_line.strip().split('|')
        output_phrases = [oi.strip() for idx, oi in enumerate(output_items) if idx % 2 == 0 and oi.strip() != '']
        output_meta = [tuple(om.split(',wa=')) for idx, om in enumerate(output_items) if idx % 2 != 0]
        # print output_phrases, len(output_phrases)
        # print output_meta, len(output_meta)
        assert len(output_phrases) == len(output_meta)
        phrase_dict = {}
        for idx, (op, om) in enumerate(zip(output_phrases, output_meta)):
            span = tuple([int(i) for i in om[0].split('-')])
            wa = [tuple([int(i) for i in a.split('-')]) for a in om[1].split()]
            sym_coverage, sym_wa = make_symmetric(wa)
            assert sym_coverage == 0
            untangle = untangle_wa(sym_wa)
            op_split = op.split()
            ip_split = input_sent[span[0]:span[1] + 1]
            print '***********wa:'
            pprint(wa)
            pprint(untangle)
            for iu, ou in untangle.items():
                print '***group***'
                print iu, ou
                for iu_idx in iu:
                    print ip_split[iu_idx],
                print '---',
                for ou_idx in ou:
                    print op_split[ou_idx],
                print ''
            print '************'
            input_coverage[span[0]: span[1] + 1] = ['1'] * ((span[1] + 1) - span[0])
            print op.split(), '----', input_sent[span[0]:span[1] + 1], '-----', wa
        assert '0' not in input_coverage



