/**
 * Created by arenduchintala on 6/18/15.
 */
function PhraseNode(phrase, parent) {
    this.phrase = phrase;
    this.phrasePart1 = ""
    this.phrasePart2 = ""
    this.num = -1;
    this.parent = parent;
    this.areChildrenSwapped = false
    this.areParentsSwapped = false
    this.wordTable = null;
    this.isLeaf = false;
    this.phraseChildren = [];
    this.phraseSiblings = [];
    this.areLeftDescendentsSwapping = false
    this.areRightDescendentsSwapping = false


    this.addPhraseChild = function (phraseNode) {
        this.phraseChildren.push(phraseNode);
    }

    this.setPhraseSiblings = function (phraseSiblings) {
        this.phraseSiblings = phraseSiblings;
    }

    this.setWordTable = function (wordTable) {
        this.wordTable = wordTable;
    }
    this.toString = function () {
        return "PhraseNode:" + this.phrase;
    }
    this.isMyAncestor = function (pn) {
        var isAncestor = false
        var a_parent = this.parent;
        while (a_parent != null) {
            //console.log("ancestor:" + a_parent.phrase + (a_parent == pn));
            if (a_parent == pn) {
                isAncestor = true;
            }
            a_parent = a_parent.parent;
        }
        return isAncestor;
    }
}

getEditDistance = function (a, b) {
    if (a.length == 0) return b.length;
    if (b.length == 0) return a.length;

    var matrix = [];

    // increment along the first column of each row
    var i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    var j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b[i - 1] == a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, // insertion
                            matrix[i - 1][j] + 1)); // deletion
            }
        }
    }

    return matrix[b.length][a.length];
};