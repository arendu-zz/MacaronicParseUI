#!/home/arenduc1/local/python/bin/python
__author__ = 'arenduchintala'
import codecs
from optparse import OptionParser
import sys
from pprint import pprint
reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'

class TopList(object):
    def __init__(self):
        self._list = []
    

    def get_list(self):
        return self._list

    def add(self, prob, token):
        if len(self._list) < 5:
            self._list.append((prob, token))
        else:
            # already have 5 items so drop the least prob
            min_prob_token = min(self._list)
            min_prob = min_prob_token[0]
            min_token = min_prob_token[1]
            if min_prob < prob:
                self._list = [(p, t) for p, t in self._list if p != min_prob]
                assert len(self._list) < 5
                self._list.append((prob, token))
            else:
                pass

  
if __name__ == '__main__':
    opt = OptionParser()
    #opt.add_option('--lex1', dest="lex_e2f", default='lex1.e2f.small.pruned')
    opt.add_option('--lex2', dest="lex_f2e", default='lex1.f2e.small.pruned')
    opt.add_option('-e', dest='intermediate', default='basic.edges.txt')
    (options, _) = opt.parse_args()
    '''lex_e2f = {}
    for l in codecs.open(options.lex_e2f, 'r', 'utf-8').readlines():
        items = l.strip().split()
        prob = float(items[2].strip())
        tok2 = items[1].strip()
        tok1 = items[0].strip()
        tl = lex_e2f.get(tok2, TopList())
        tl.add(prob, tok1)
        lex_e2f[tok2] = tl
        if len(tl.get_list()) == 5:
            pdb.set_trace()
    '''
    lex_f2e = {}
    for l in codecs.open(options.lex_f2e, 'r', 'utf-8').readlines():
        items = l.strip().split()
        prob = float(items[2].strip())
        tok2 = items[1].strip()
        tok1 = items[0].strip()
        tl = lex_f2e.get(tok2, TopList())
        tl.add(prob, tok1)
        lex_f2e[tok2] = tl  # (en| fr)

    for b in codecs.open(options.intermediate, 'r', 'utf-8').readlines():
        [en,fr] = b.strip().split()
        tl = lex_f2e.get(fr.strip(),None)
        if tl is not None:
            m = [(pe,e_tok) for pe, e_tok in tl.get_list() if e_tok == en]
            if len(m) == 0: #en is not in the top 5
                (best_en_prob, best_en_tok) = max(tl.get_list())
                print en, fr, best_en_tok
            else:
                pass




