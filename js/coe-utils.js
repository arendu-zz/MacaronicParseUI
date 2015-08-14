/**
 * Created by arenduchintala on 8/13/15.
 */

function NP(i, c, m, parent) {
    var self = this
    this.a = i
    this.c = c
    this.m = m
    this.children = []
    this.parent = parent
    if (parent != null) {
        this.path = parent.path.concat([i])
    } else {
        this.path = []
    }


    this.populate_children = function () {
        if (self.c >= self.m) {
            console.log('stop')
        } else {
            for (var i = self.a + 1; i <= self.c; i ++) {
                var child = new NP(i, self.c + 1, self.m, self)
                child.populate_children()
                self.children.push(child)
            }
        }
    }
}

function get_paths(num_insertions, num_nodes) {
    var root = new NP(- 1, num_insertions, num_insertions + num_nodes, null)
    root.populate_children()
    var paths = []
    var stack = []
    stack.push(root)
    while (stack.length > 0) {
        var np = stack.pop()
        if (np.children.length == 0) {
            paths.push(np.path)
        } else {
            for (var i = 0; i < np.children.length; i ++) {
                stack.push(np.children[i])
            }
        }
    }
    return paths
}

function pad_array(arr, to_lenght) {
    for (var i = arr.length; i < to_lenght; i ++) {
        arr.push('*')
    }
    return arr
}

function __test__() {
    var root = new NP(- 1, 3, 6, null)
    root.populate_children()
    var paths = get_paths(root)
    for (var l in paths) {
        console.log(paths[l].join(','))
    }
    console.log("ok")
}


