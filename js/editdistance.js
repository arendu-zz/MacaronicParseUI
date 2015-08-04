/**
 * Created by arenduchintala on 8/2/15.
 */


function makeArrayOf(value, length) {
    var arr = [], i = length;
    while (i --) {
        arr[i] = value;
    }
    return arr;
}


function Create2DArray(rows, columns) {
    var arr = [];

    for (var i = 0; i < rows; i ++) {
        arr[i] = makeArrayOf(0, columns);
    }

    return arr;
}

function getTuple(a, b) {
    return [a, b];
}

function edObj(score, prev, tok) {
    var self = this
    this.score = score
    this.prev = prev
    this.tok = tok

}

function minObj(a, b, c) {
    if (a.score <= b.score) {
        if (a.score <= c.score) {
            return a
        } else {
            return c
        }
    } else {
        if (b.score <= c.score) {
            return b
        } else {
            return c
        }
    }
}

function bt(cf, arr1, arr2) {
    var i = arr1.length
    var j = arr2.length
    var alignments = []
    while (i > 0 && j > 0) {
        var edobj = cf[getTuple(i, j)]
        i = edobj.prev[0]
        j = edobj.prev[1]
        alignments.unshift(getTuple(edobj.tok[0], edobj.tok[1]))

    }
    return alignments
}

function editdistance(arr1, arr2) {
    var substitution_cost = 1
    var insertion_cost = 1
    var deletion_cost = 1
    var table = Create2DArray(arr1.length + 1, arr2.length + 1)
    var came_from = {}
    for (var i = 0; i < arr1.length + 1; i ++) {
        table[i][0] = deletion_cost * i
        came_from[getTuple(i, 0)] = getTuple(getTuple(i - 1, 0), getTuple(arr1[i - 1], '<eps>'))
    }

    for (var j = 0; j < arr2.length + 1; j ++) {
        table[0][j] = insertion_cost * j
        came_from[getTuple(0, j)] = getTuple(getTuple(0, j - 1), getTuple('<eps>', arr2[j - 1]))
    }

    var diag = null
    var top = null
    var left = null
    for (var i = 1; i < arr1.length + 1; i ++) {
        for (var j = 1; j < arr2.length + 1; j ++) {
            if (arr1[i - 1] == arr2[j - 1]) {
                diag = table[i - 1][i - 1] + 0
            } else {
                diag = table[i - 1][j - 1] + substitution_cost
            }
            top = table[i][j - 1] + insertion_cost
            left = table[i - 1][j] + deletion_cost

            var diag_obj = new edObj(diag, getTuple(i - 1, j - 1), getTuple(arr1[i - 1], arr2[j - 1]))
            var top_obj = new edObj(top, getTuple(i, j - 1), getTuple('<eps>', arr2[j - 1]))
            var left_obj = new edObj(left, getTuple(i - 1, j), getTuple(arr1[i - 1], '<eps>'))
            var best_obj = minObj(diag_obj, top_obj, left_obj)
            table[i][j] = best_obj.score
            came_from[getTuple(i, j)] = best_obj


        }
    }
    var alignments = bt(came_from, arr1, arr2)
    console.log(alignments)
    var o = {}
    o.ed = table[arr1.length][arr2.length]
    o.alignments = alignments
    return o
}

