__author__ = 'arenduchintala'
import codecs
import sys
import json
import re
from itertools import groupby
from editdistance import EditDistance
from collection_of_edits import Node, Graph, Sentence, get_edges


def find_parent(visible_nodes, align):
    s_in, a_in = ed.editdistance_simple(align[0].split(), align[1].split())
    a_in_list = [a[0] for a in a_in]
    eps_idx = a_in_list.index('<eps>')

    if eps_idx == 0:
        parent_str = a_in_list[1]
        before = False
    else:
        parent_str = a_in_list[eps_idx - 1]
        before = True

    parent_node = [vn for vn in visible_nodes if vn.s == parent_str][0]
    return parent_node, before


def get_adjacent_node(search_node, list_of_nodes):
    adjacent_nodes = []
    for n_idx, n in enumerate(list_of_nodes):
        if search_node == n:
            if n_idx > 0:
                an = list_of_nodes[n_idx - 1]
                if an.graph.id == search_node.graph.id:
                    adjacent_nodes.append(an)
            if n_idx < len(list_of_nodes) - 1:
                an = list_of_nodes[n_idx + 1]
                if an.graph.id == search_node.graph.id:
                    adjacent_nodes.append(an)
    if len(adjacent_nodes) > 0:
        return adjacent_nodes[0]
    else:
        return None


def get_idx_of_node(node, list_of_nodes):
    for n_idx, n in enumerate(list_of_nodes):
        if n.s == node.s and n.graph.id == node.graph.id:
            return n_idx
        else:
            pass
    return None


def get_changed_graph(align_str, nvo):
    consequtive_group_nodes = []
    group = []
    for n_idx, n in enumerate(nvo[1:]):
        pn = nvo[n_idx]
        if n.graph.id == pn.graph.id:
            if len(group) == 0:
                group.append(pn)
            group.append(n)
        else:
            if len(group) == 0:
                consequtive_group_nodes.append([pn])
            else:
                consequtive_group_nodes.append(group)

            group = [n]

    consequtive_group_nodes.append(group)
    for g in consequtive_group_nodes:
        svn = [n for n in g if n.visible]
        string_svn = ' '.join([n.s for n in svn])
        if string_svn == align_str:
            return g[0].graph
    sys.stderr.write('returning none as changing\n')
    return None


def get_node_by_str(graph, node_str):
    vn = [n for n in graph.nodes if n.visible]
    node_match = [n for n in vn if n.s == node_str]
    if len(node_match) == 1:
        return node_match[0]
    else:
        return None


def get_changed_node(changed_graph, new_string):
    current_visible_nodes = [n for n in changed_graph.nodes if n.visible]
    new_strings = new_string.split()
    if len(current_visible_nodes) == 1:
        return current_visible_nodes[0]
    else:
        current_visible_nodes = sorted(current_visible_nodes, key=lambda x: x.en_id)
        current_node_str = [n.s for n in current_visible_nodes]
        score, alignments = ed.editdistance_simple(current_node_str, new_strings)
        changed_str = None
        for align in alignments:
            if align[0].strip() != align[1]:
                changed_str = align[0]
        changed_nodes = [n for n in current_visible_nodes if n.s == changed_str]
        assert len(changed_nodes) == 1
        return changed_nodes[0]


def get_neighbor(node, nodes_in_visible_order, direction):
    sys.stderr.write('getting neighbor for ' + node.s + '\n')
    seen = False
    neighbor = []
    for _n in nodes_in_visible_order:

        if direction == 'right' and seen:
            neighbor.append(_n.graph.id)

        if direction == 'left' and not seen and _n != node:
            neighbor.insert(0, _n.graph.id)

        if _n.id == node.id and _n.graph.id == node.graph.id:
            seen = True
    neighbor = [x[0] for x in groupby(neighbor)]
    if direction == 'left':
        neighbor.append('*ST*')
    else:
        neighbor.append('*EN*')
    return neighbor


ed = EditDistance(None)

if __name__ == '__main__':
    # annotation_file = sys.argv[1]
    annotations = codecs.open('../web/an.test', 'r', 'utf-8').read().strip()
    sentence_obj_list = []
    for s_idx, sentence in enumerate(annotations.split('===')):
        if sentence.strip() != '':
            S = Sentence(s_idx, '', '', '')
            prev_matches = None
            for sent in sentence.split('\n'):
                if sent.strip() != '':
                    action = sent.split(':')[1].strip()
                    matches = re.findall(r'\[.*?\]', sent.strip())
                    matches = [m[1:-1] for m in matches]
                    if action.strip() == '':
                        S.graphs = []
                        nodes_in_visible_order = []
                        for m_idx, m in enumerate(matches):
                            g = Graph(m_idx)
                            S.graphs.append(g)
                            for w_idx, w in enumerate(m.split()):
                                n = Node(id=len(g.nodes), s=w, en_id=w_idx, de_id=None, lang='en', visible=True)
                                n.visible = True
                                n.graph = g
                                g.nodes.append(n)
                                nodes_in_visible_order.append(n)

                        for node in nodes_in_visible_order:
                            in_left_gids = get_neighbor(node, nodes_in_visible_order, 'left')
                            in_right_gids = get_neighbor(node, nodes_in_visible_order, 'right')
                            if node.er_lang == "en":
                                node.en_left = in_left_gids
                                node.en_right = in_right_gids
                            else:
                                node.de_left = in_left_gids
                                node.de_right = in_right_gids

                        prev_matches = matches

                    elif action.strip() == 'T.E' or action.strip() == 'T.G':
                        to_lang = 'en' if action.strip().split('.')[1] == 'E' else 'de'
                        sys.stderr.write('action translate intermediate english\n')
                        score, alignments = ed.editdistance_simple(prev_matches, matches)
                        new_nodes = []
                        for align in alignments:
                            if align[0] != align[1]:
                                sys.stderr.write('change' + align[0] + ' ' + align[1] + '\n')
                                changed_graph = get_changed_graph(align[0], nodes_in_visible_order)
                                score_in, alignments_in = ed.editdistance_simple(align[0].split(), align[1].split())
                                remove_nodes = []
                                add_nodes = []
                                insertion_parent = None
                                for a_idx, a_in in enumerate(alignments_in):

                                    if a_in[1] != a_in[0]:
                                        cn = None

                                        if a_in[0] == '<eps>':
                                            sys.stderr.write('insertion\n')
                                            pass
                                        else:
                                            cn = get_node_by_str(changed_graph, a_in[0])
                                            remove_nodes.append(cn)

                                        if a_in[1] != '<eps>':
                                            w = a_in[1]
                                            n = Node(id=None, s=w, en_id=None, de_id=None, lang=to_lang, visible=False)
                                            add_nodes.append((n, cn))

                                if len(remove_nodes) == 0 and len(add_nodes) == 1:
                                    # todo: handle insertion
                                    vn = [n for n in changed_graph.nodes if n.visible]
                                    rn, before = find_parent(vn, align)
                                    new_add_nodes = []

                                    if before:
                                        copy_n = Node(id=len(changed_graph.nodes), s=rn.s, en_id=None, de_id=None,
                                                      lang=rn.lang, visible=False)
                                        new_add_nodes = [copy_n, add_nodes[0][0]]
                                    else:
                                        copy_n = Node(id=len(changed_graph.nodes), s=rn.s, en_id=None, de_id=None,
                                                      lang=rn.lang, visible=False)
                                        new_add_nodes = [add_nodes[0][0], copy_n]

                                    assert rn.visible
                                    rn.visible = False
                                    rn_idx = get_idx_of_node(rn, nodes_in_visible_order)
                                    nodes_in_visible_order.pop(rn_idx)
                                    for w_idx, a in enumerate(new_add_nodes):
                                        a.visible = True
                                        a.en_id = rn.en_id + w_idx
                                        a.graph = changed_graph
                                        a.id = len(changed_graph.nodes)
                                        changed_graph.nodes.append(a)
                                        changed_graph.edges += get_edges(rn, a)
                                        nodes_in_visible_order.insert(rn_idx + w_idx, a)
                                        new_nodes.append(a)

                                    pass
                                elif len(remove_nodes) == 1 and len(add_nodes) == 0:
                                    # todo: handle deletion
                                    adjacent_node = get_adjacent_node(remove_nodes[0], nodes_in_visible_order)
                                    if adjacent_node is None:
                                        raise NotImplementedError()
                                    remove_nodes.append(adjacent_node)
                                    # now combine remove node and adjacent node
                                    min_rn_idx = min(
                                        [get_idx_of_node(rn, nodes_in_visible_order) for rn in remove_nodes])
                                    for rn in remove_nodes:
                                        assert rn.visible
                                        rn.visible = False
                                        rn_idx = get_idx_of_node(rn, nodes_in_visible_order)
                                        nodes_in_visible_order.pop(rn_idx)

                                    en_id = min([r.en_id for r in remove_nodes])
                                    a = Node(id=len(adjacent_node.graph.nodes), s=adjacent_node.s, en_id=en_id,
                                             de_id=None,
                                             lang=adjacent_node.lang, visible=False)
                                    a.visible = True
                                    a.graph = changed_graph
                                    a.id = len(changed_graph.nodes)
                                    changed_graph.nodes.append(a)
                                    nodes_in_visible_order.insert(min_rn_idx, a)
                                    new_nodes.append(a)

                                    for rn in remove_nodes:
                                        changed_graph.edges += get_edges(rn, a)
                                    pass

                                elif len(remove_nodes) == 1 and len(add_nodes) == 1:
                                    # todo: handle substitution
                                    a = add_nodes[0][0]
                                    rn = add_nodes[0][1]
                                    assert rn.visible
                                    rn.visible = False
                                    rn_idx = get_idx_of_node(rn, nodes_in_visible_order)
                                    nodes_in_visible_order.pop(rn_idx)
                                    a.en_id = rn.en_id
                                    a.visible = True
                                    a.graph = changed_graph
                                    a.id = len(changed_graph.nodes)
                                    changed_graph.nodes.append(a)
                                    changed_graph.edges += get_edges(rn, a)
                                    nodes_in_visible_order.insert(rn_idx, a)
                                    new_nodes.append(a)
                                    pass
                                elif len(remove_nodes) == 1 and len(add_nodes) > 1:
                                    # todo: handle multiple children translation
                                    rn = remove_nodes[0]
                                    assert rn.visible
                                    rn.visible = False
                                    rn_idx = get_idx_of_node(rn, nodes_in_visible_order)
                                    nodes_in_visible_order.pop(rn_idx)
                                    for w_idx, (a, c) in enumerate(add_nodes):
                                        a.en_id = rn.en_id + w_idx
                                        a.visible = True
                                        a.graph = changed_graph
                                        a.id = len(changed_graph.nodes)
                                        changed_graph.nodes.append(a)
                                        changed_graph.edges += get_edges(rn, a)
                                        nodes_in_visible_order.insert(rn_idx + w_idx, a)
                                        new_nodes.append(a)
                                    pass
                                elif len(remove_nodes) > 1 and len(add_nodes) == 1:
                                    # todo: handle combining
                                    en_id = min([r.en_id for r in remove_nodes])
                                    min_rn_idx = min(
                                        [get_idx_of_node(rn, nodes_in_visible_order) for rn in remove_nodes])
                                    for rn in remove_nodes:
                                        assert rn.visible
                                        rn.visible = False
                                        rn_idx = get_idx_of_node(rn, nodes_in_visible_order)
                                        nodes_in_visible_order.pop(rn_idx)
                                    a = add_nodes[0][0]
                                    a.en_id = en_id
                                    a.visible = True
                                    a.graph = changed_graph
                                    a.id = len(changed_graph.nodes)
                                    changed_graph.nodes.append(a)
                                    nodes_in_visible_order.insert(min_rn_idx, a)
                                    new_nodes.append(a)

                                    for rn in remove_nodes:
                                        changed_graph.edges += get_edges(rn, a)
                                    pass

                            else:
                                sys.stderr.write('no change in graph' + align[0] + ' ' + align[1] + '\n')

                        for node in new_nodes:
                            in_left_gids = get_neighbor(node, nodes_in_visible_order, 'left')
                            in_right_gids = get_neighbor(node, nodes_in_visible_order, 'right')
                            if node.er_lang == "en":
                                node.en_left = in_left_gids
                                node.en_right = in_right_gids
                            else:
                                node.de_left = in_left_gids
                                node.de_right = in_right_gids

                        new_nodes = []
                        prev_matches = matches

                    elif action.strip() == 'ER':
                        sys.stderr.write('action external reorder\n')
                        # 2 possible external re-orderings split reordering or
                        # whole reordering
                        score, alignments = ed.editdistance_simple(prev_matches, matches)
                        claimed_graph_ids = []
                        for align in alignments:
                            if align[0] == align[1]:

                                unchanged_graph = get_changed_graph(align[0], nodes_in_visible_order)
                                if unchanged_graph is not None:
                                    claimed_graph_ids.append(unchanged_graph.id)
                        unclaimed_graph_ids = []
                        for g in S.graphs:
                            if g.id in claimed_graph_ids:
                                pass
                            else:
                                unclaimed_graph_ids.append(g.id)

                        if len(unclaimed_graph_ids) == 1:
                            changed_graph = [g for g in S.graphs if g.id == unclaimed_graph_ids[0]][0]
                            sites = {}
                            site_nodes = {}
                            a_idx = 0
                            reordered_nodes = []
                            for align in alignments:

                                if align[1] != align[0]:
                                    sites[a_idx] = align[1].split()
                                    pm = align[0]
                                    for w in pm.split():
                                        if w != '<eps>':
                                            changed_node = get_node_by_str(changed_graph, w)
                                            reordered_nodes.append(changed_node)
                                            changed_node_idx = get_idx_of_node(changed_node, nodes_in_visible_order)
                                            nodes_in_visible_order.pop(changed_node_idx)
                                else:
                                    pass  # sys.stderr.write('no reordering in ', align
                                a_idx += len(align[1].split())

                            for a_idx, ns_list in sites.items():
                                for ns in ns_list:
                                    cn = [n for n in reordered_nodes if n.s == ns][0]
                                    cn_list = site_nodes.get(a_idx, [])
                                    cn_list.append(cn)
                                    site_nodes[a_idx] = cn_list

                            for a_idx, cn_list in site_nodes.items():
                                for cn_idx, cn in enumerate(cn_list):
                                    nodes_in_visible_order.insert(a_idx + cn_idx, cn)
                        elif len(unclaimed_graph_ids) == 2:

                            first_node_idxs = []
                            for u_id in unclaimed_graph_ids:
                                changed_graph = [g for g in S.graphs if g.id == u_id][0]
                                first_node = sorted([vn for vn in changed_graph.nodes if vn.visible])[0]
                                changed_first_node_idx = get_idx_of_node(first_node, nodes_in_visible_order)
                                first_node_idxs.append((changed_first_node_idx, changed_graph))
                            first_node_idxs = sorted(first_node_idxs)
                            remove_order_cg = [cg for fn, cg in first_node_idxs]
                            first_node_idxs = sorted(first_node_idxs, reverse=True)
                            add_order_mark = [fn for fn, cg in first_node_idxs]

                            for fn, cg in zip(add_order_mark, remove_order_cg):
                                vn = [vn for vn in cg.nodes if vn.visible]
                                svn = sorted(vn, key=lambda x: x.en_id)
                                for w_idx, n in enumerate(svn):
                                    n_idx = get_idx_of_node(n, nodes_in_visible_order)
                                    nodes_in_visible_order.pop(n_idx)
                                    nodes_in_visible_order.insert(fn + w_idx, n)

                        else:
                            assert len(unclaimed_graph_ids) == 1 or len(unclaimed_graph_ids) == 2

                        for node in nodes_in_visible_order:
                            node.er_lang = "de"
                            in_left_gids = get_neighbor(node, nodes_in_visible_order, 'left')
                            in_right_gids = get_neighbor(node, nodes_in_visible_order, 'right')
                            node.de_left = in_left_gids
                            node.de_right = in_right_gids

                        prev_matches = matches


                    elif action.strip() == 'IR':
                        sys.stderr.write('action internal reorder\n')
                        score, alignments = ed.editdistance_simple(prev_matches, matches)
                        modified_nodes = []
                        for align in alignments:
                            if align[0] != align[1]:
                                changed_graph = get_changed_graph(align[0], nodes_in_visible_order)
                                vn = [vn for vn in changed_graph.nodes if vn.visible]
                                modified_nodes = vn
                                first_idx = 10000
                                for n in vn:
                                    n_idx = get_idx_of_node(n, nodes_in_visible_order)
                                    nodes_in_visible_order.pop(n_idx)
                                    if n_idx < first_idx:
                                        first_idx = n_idx

                                str_vn = [(n.s, n) for n in vn]
                                str_vn_new = align[1].split()
                                for ns, n in str_vn:
                                    new_idx = str_vn_new.index(ns)
                                    n.de_id = new_idx

                                svn = sorted(vn, key=lambda x: x.de_id)
                                for w_idx, n in enumerate(svn):
                                    nodes_in_visible_order.insert(w_idx + first_idx, n)
                        for node in modified_nodes:
                            node.er_lang = "de"
                            in_left_gids = get_neighbor(node, nodes_in_visible_order, 'left')
                            in_right_gids = get_neighbor(node, nodes_in_visible_order, 'right')
                            node.de_left = in_left_gids
                            node.de_right = in_right_gids
                            '''neighbor_nodes = node.graph.get_neighbor_nodes(node, 'en')
                            stack = [n for n in neighbor_nodes if len(n.de_right) == 0 and len(n.de_left) == 0]
                            current_de_l = node.de_left
                            current_de_r = node.de_right
                            while len(stack) > 0:
                                n = stack.pop()
                                n.de_left = current_de_r
                                n.de_right = current_de_r'''

                        prev_matches = matches

                    elif action.strip() == 'TFG':
                        new_nodes = []
                        for pm, m in zip(prev_matches, matches):
                            changed_graph = get_changed_graph(pm, nodes_in_visible_order)
                            for d_idx, (pm_n, m_n) in enumerate(zip(pm.split(), m.split())):
                                if pm_n != m_n:
                                    sys.stderr.write('sub ' + pm_n + '-->' + m_n + '\n')
                                    rn = get_node_by_str(changed_graph, pm_n)
                                    a = Node(id=len(changed_graph.nodes), s=m_n, en_id=rn.en_id, de_id=d_idx, lang='de',
                                             visible=False)
                                    assert rn.visible
                                    rn.visible = False
                                    rn_idx = get_idx_of_node(rn, nodes_in_visible_order)
                                    nodes_in_visible_order.pop(rn_idx)
                                    if rn.de_id is not None:
                                        a.de_id = rn.de_id
                                    a.visible = True
                                    a.graph = rn.graph
                                    a.en_left = rn.en_left
                                    a.en_right = rn.en_right
                                    changed_graph.nodes.append(a)
                                    changed_graph.edges += get_edges(rn, a)
                                    nodes_in_visible_order.insert(rn_idx, a)
                                    new_nodes.append(a)
                                elif pm_n == m_n:
                                    sys.stderr.write('sub ' + pm_n + '-->' + m_n + '\n')
                                    rn = get_node_by_str(changed_graph, pm_n)
                                    rn.de_id = d_idx
                                    # a = Node(id=len(changed_graph.nodes), s=m_n, en_id=rn.en_id, de_id=d_idx, lang='de',
                                    #         visible=False)
                                    #assert rn.visible
                                    #rn.visible = False
                                    #rn_idx = get_idx_of_node(rn, nodes_in_visible_order)
                                    #nodes_in_visible_order.pop(rn_idx)
                                    #if rn.de_id is not None:
                                    #    a.de_id = rn.de_id
                                    #a.visible = True
                                    #a.graph = rn.graph
                                    #a.en_left = rn.en_left
                                    #a.en_right = rn.en_right
                                    #changed_graph.nodes.append(a)
                                    #changed_graph.edges += get_edges(rn, a)
                                    #nodes_in_visible_order.insert(rn_idx, a)
                                    new_nodes.append(rn)

                        for node in new_nodes:
                            in_left_gids = get_neighbor(node, nodes_in_visible_order, 'left')
                            in_right_gids = get_neighbor(node, nodes_in_visible_order, 'right')
                            node.de_left = in_left_gids
                            node.de_right = in_right_gids

                        sys.stderr.write('translate final german\n')

                        for g in S.graphs:
                            sys.stderr.write('prop de order\n')
                            g.propagate_de_order()
                            sys.stderr.write('prop de id\n')
                            g.propagate_de_id()
                            for n in g.nodes:
                                n.graph = None  # to avoid circular reference

                        sentence_obj_list.append(S)
    sys.stderr.write('done\n')
    sentence_str_list = []
    for s in sentence_obj_list:
        jstr = json.dumps(s, indent=4, sort_keys=True)
        print jstr
        # jstr = ' '.join(jstr.split())
        sentence_str_list.append(jstr)