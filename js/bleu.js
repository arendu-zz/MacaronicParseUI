/**
 * Created by arenduchintala on 11/4/15.
 */

n_gram = function (a, n) {
	var grams = []
	for (var i = 0; i <= a.length - n; i++) {
		grams.push(a.slice(i, i + n).join([separator = " "]))
	}
	//console.log(grams, n)
	return grams
}

simple_bleu = function (candidate, reference) {
	var c_arr = $.trim(candidate).split(/\s+/)
	var r_arr = $.trim(reference).split(/\s+/)
	console.log(c_arr)
	console.log(r_arr)
	var s = 0.0
	var s1 = 0.0
	_.each([1, 2, 3, 4], function (n) {
		var r_grams = n_gram(r_arr, n)
		var c_grams = n_gram(c_arr, n)

		var tp = 0
		_.each(c_grams, function (gram) {
			if ($.inArray(gram, r_grams) !== -1) {
				tp += 1
			}
		})
		var prec = (tp + 1) / (c_grams.length + 1)
		var p1 = 1 / (c_grams.length + 1)
		//console.log('prec+1: ', prec)
		s += 0.25 * Math.log(prec)
		s1 += 0.25 * Math.log(p1)

	})
	//console.log("s", s)
	var c = c_arr.length
	var r = r_arr.length
	var BP = 0
	if (c > r) {
		BP = 1.0
	} else {
		BP = Math.exp(1.0 - (r / c))

	}
	//console.log("BP", BP)
	return BP * (Math.exp(s))

}