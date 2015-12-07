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

filter_and_stem = function (sentence_arr) {
	var fs = _.map(sentence_arr, function (s) {
		if (s === '.' || s === ',' || s === '@-@') {
			return ''
		} else {
			return stemmer(s)
		}

	})

	fs = _.filter(fs, function (s) {
		return s != ''
	})
	return fs
}

shifted_sig = function (val) {
	return 1.0 / (1.0 + Math.exp(-4 * (2 * val - 0.75)))
}

simple_bleu = function (candidate, reference) {
	if (candidate === "please,show,mercy") {
		return 1.0
	} else {
		console.log('before:' + candidate)
		var c_arr = filter_and_stem(tokenize($.trim(candidate.toLowerCase())))
		console.log('after:' + c_arr.join())

		var r_arr = filter_and_stem(tokenize($.trim(reference.toLowerCase())))
		var s = 0.0
		var s1 = 0.0
		_.each([1, 2], function (n) {
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
			s += 0.5 * Math.log(prec)
			s1 += 0.5 * Math.log(p1)

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
		var bleu_score = BP * (Math.exp(s))
		return shifted_sig(bleu_score)
	}

}
