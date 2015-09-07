#!/home/arenduc1/local/python/bin/python
__author__ = 'arenduchintala'
import sys
import codecs
from optparse import OptionParser
reload(sys)
sys.setdefaultencoding('utf-8')
sys.stdin = codecs.getreader('utf-8')(sys.stdin)
sys.stdout = codecs.getwriter('utf-8')(sys.stdout)
sys.stdout.encoding = 'utf-8'

if __name__ == '__main__':
    fp =  sys.argv[1]
    inp = []
    for line in open(fp, 'r').readlines():
        items = line.split('|')
        tokens = [i.strip() for idx,i in enumerate(items) if idx%2 == 0 and i.strip() != '']
        info = [i.strip() for idx,i in enumerate(items) if idx%2 != 0 and i.strip() != '']
        info = [','.join(i.split(',')[:2]) for i in info]
        re_items = [i1+'|' + i2.strip()+'|' for i1, i2 in zip(tokens, info)]
        print ' '.join(re_items)
