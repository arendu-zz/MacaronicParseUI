/**
 * Created by arenduchintala on 8/13/15.
 */

function NP(i, c, m, parent, gap) {
	var self = this
	this.a = i
	this.c = c
	this.m = m
	this.gap = gap
	this.children = []
	this.parent = parent
	if (parent != null) {
		this.path = parent.path.concat([i])
	} else {
		this.path = []
	}
	this.populate_children = function () {
		if (self.c >= self.m) {
			//console.log('stop')
		} else {
			if (self.parent == null) {
				var max = self.c
			} else {
				var max = self.c < self.gap + self.a + 1 ? self.c : self.gap + self.a + 1
			}
			for (var i = self.a + 1; i <= max; i++) {
				var child = new NP(i, self.c + 1, self.m, self, self.gap)
				child.populate_children()
				self.children.push(child)
			}
		}
	}
}
function is_contiguous(list) {
	var i = 1
	while (list[0] == list[i] && i < list.length - 1) {
		i++
	}
	var gap = list[0] < list[i] ? +1 : -1 // if numbers are increasing gap should always be 1, if numbers are decreasing gap should be -1
	for (var i = 1; i < list.length; i++) {
		var g = list[i] - list[i - 1]
		if (g == gap) {
		} else {
			return false
		}
	}
	return true
}

function sortNumber(a, b) {
	return a - b;
}

function get_possible_configurations(length_of_items, length_of_items_to_insert, gap) {
	var root = new NP(-1, length_of_items, length_of_items + length_of_items_to_insert, null, gap)
	root.populate_children()
	var paths = []
	var stack = []
	stack.push(root)
	while (stack.length > 0) {
		var np = stack.pop()
		if (np.children.length == 0) {
			paths.push(np.path)
		} else {
			for (var i = 0; i < np.children.length; i++) {
				stack.push(np.children[i])
			}
		}
	}
	return paths
}

function removeFromArray(item) {
	var what, a = arguments, L = a.length, ax;
	while (L && this.length) {
		what = a[--L];
		while ((ax = this.indexOf(what)) !== -1) {
			this.splice(ax, 1);
		}
	}
	return this;
}
function pad_array(arr, to_lenght) {
	for (var i = arr.length; i < to_lenght; i++) {
		arr.push('*')
	}
	return arr
}
function __test__() {
	var paths = get_possible_configurations(13, 3, 0)
	for (var l in paths) {
		//console.log(paths[l])
		paths[l].sort()
		console.log(paths[l])
	}
	console.log("ok")
}
//__test__()

