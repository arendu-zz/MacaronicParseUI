/**
 * Created by arenduchintala on 6/18/15.
 */
function PhraseNode(phrase, parent) {
    this.phrase = phrase;
    this.num = -1;
    this.parent = parent;
    this.wordTable = null;
    this.isLeaf = false;
    this.phraseChildren = [];
    this.phraseSiblings = [];
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