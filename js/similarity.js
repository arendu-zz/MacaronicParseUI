/**
 *
 * Created by arenduchintala on 2/20/16.
 */


cosine_similarity = function (x, y) {
	var dot = 0.0
	var a = 0.0
	var b = 0.0
	for (var i = 0; i < x.length; i++) {
		dot += x[i] * y[i]
		a = a + (x[i] * x[i])
		b = b + (y[i] * y[i])
	}
	a = Math.sqrt(a)
	b = Math.sqrt(b)
	return dot / (a * b)

}

get_glove_vec = function (s) {

	if (typeof s === 'string') {
		return var_glove[s]
	} else {
		var y = _.range(50).map(function () {
			return 0.0
		})
		for (var w = 0; w < s.length; w++) {
			var word = s[w]
			var gw = var_glove[word]
			if (gw != null) {
				var y = y.map(function (_, i) {
					return y[i] + gw[i];
				});
			}
		}

		return y

	}
}