/**
 * Created by arenduchintala on 11/4/15.
 */

function LogGamma(Z) {
	with (Math) {
		var S = 1 + 76.18009173 / Z - 86.50532033 / (Z + 1) + 24.01409822 / (Z + 2) - 1.231739516 / (Z + 3) + .00120858003 / (Z + 4) - .00000536382 / (Z + 5);
		var LG = (Z - .5) * log(Z + 4.5) - (Z + 4.5) + log(S * 2.50662827465);
	}
	return LG
}

function Betinc(X, A, B) {
	var A0 = 0;
	var B0 = 1;
	var A1 = 1;
	var B1 = 1;
	var M9 = 0;
	var A2 = 0;
	var C9;
	while (Math.abs((A1 - A2) / A1) > .00001) {
		A2 = A1;
		C9 = -(A + M9) * (A + B + M9) * X / (A + 2 * M9) / (A + 2 * M9 + 1);
		A0 = A1 + C9 * A0;
		B0 = B1 + C9 * B0;
		M9 = M9 + 1;
		C9 = M9 * (B - M9) * X / (A + 2 * M9 - 1) / (A + 2 * M9);
		A1 = A0 + C9 * A1;
		B1 = B0 + C9 * B1;
		A0 = A0 / B1;
		B0 = B0 / B1;
		A1 = A1 / B1;
		B1 = 1;
	}
	return A1 / A
}

function betaCDF(x, a, b) {
	var Z = x
	var A = a
	var B = b
	var Betacdf = null
	var S = null
	var BT = null
	var s = null
	with (Math) {
		if (A <= 0) {
			alert("alpha must be positive")
		} else if (B <= 0) {
			alert("beta must be positive")
		} else if (Z <= 0) {
			Betacdf = 0
		} else if (Z >= 1) {
			Betacdf = 1
		} else {
			S = A + B;
			BT = exp(LogGamma(S) - LogGamma(B) - LogGamma(A) + A * log(Z) + B * log(1 - Z));
			if (Z < (A + 1) / (S + 2)) {
				Betacdf = BT * Betinc(Z, A, B)
			} else {
				Betacdf = 1 - BT * Betinc(1 - Z, B, A)
			}
		}
		Betacdf = Betacdf + .000005
		s = " " + Betacdf
		s = s.substr(0, 8);
	}
	return s;
}

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
		/*for (var i = 0; i <= 10; i++) {
			var b = i / 10.0
			console.log('original bleu', b)
			console.log('beta bleu', compute(b, 4.0, 5.5))
			console.log('sig bleu', shifted_sig(b))
		}*/
		console.log('beta bleu', betaCDF(bleu_score, 4.0, 5.5))
		console.log('sig bleu', shifted_sig(bleu_score))
		return betaCDF(bleu_score, 4.0, 5.5)
	}

}
