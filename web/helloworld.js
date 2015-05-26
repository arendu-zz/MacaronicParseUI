/**
 * Created by arenduchintala on 5/20/15.
 */
var rootPhraseNode;

function ready() {
    var sentence = "this is a test sentence";
    var phraseTreeStr = "(S (NP I) (VP (V saw) (X him)))";
    rootPhraseNode = parsePhraseTree(phraseTreeStr);
    var phraseLeaves = getleaves(rootPhraseNode);
    console.log("done...");
    showsent(phraseLeaves);
}
function removeEmptyStrings(val) {
    return !(val == "" || val == " ");
}
function getleaves(rootPhraseTree) {
    var _stack = [];
    var leaves = [];
    var pn;
    _stack.push(rootPhraseTree);
    while (_stack.length > 0) {
        pn = _stack.pop();
        if (pn.phraseChildren.length == 0) {
            leaves.push(pn);
        } else {
            for (var i = pn.phraseChildren.length - 1; i > -1; i--) {
                var c = pn.phraseChildren[i];
                _stack.push(c);
            }
        }
    }
    return leaves;
}
function parsePhraseTree(phraseTreeStr) {
    //"1、2、3".split(/()/g) == ["1", "、", "2", "、", "3"]
    var _phraseTreeList = phraseTreeStr.replace(/\s\s+/g, ' ').split(/(\(|\)|\s)/g).filter(removeEmptyStrings)
    //console.log(_phraseTreeList);
    _phraseTreeList.pop();
    _phraseTreeList.shift(); //discard outter brackets
    var _stack = [];
    var item, nextItem, pn, toppn, rootpn;
    nextItem = _phraseTreeList.shift()
    pn = new PhraseNode(nextItem, null);
    _stack.push(pn);

    while (_stack.length > 0 && _phraseTreeList.length > 0) {
        item = _phraseTreeList.shift()
        if (item == "(") {
            nextItem = _phraseTreeList.shift()
            toppn = _stack[_stack.length - 1];
            pn = new PhraseNode(nextItem, toppn);
            toppn.addPhraseChild(pn);
            _stack.push(pn);
        } else if (item == ")") {
            _stack.pop();
            rootpn = _stack.pop();
        } else {
            toppn = _stack[_stack.length - 1];
            pn = new PhraseNode(item, toppn);
            toppn.addPhraseChild(pn);
            _stack.push(pn);
        }
    }
    return rootpn;
}

function spanClicked(e) {
    console.log("a span has been clicked:" + e.target.id);
    var tablenum = e.target.id.split(",")[1];
    var wordTable = document.getElementById(tablenum);
    var pn = wordTable.phraseNode;
    var rownum = parseInt(e.target.id.split(",")[2]);
    if (rownum == 0) {
        console.log("phrase: " + pn.phrase + "clicked, go up to parent");
        goUpToParent(wordTable);
    } else {
        var pn = wordTable.phraseNode;
        console.log("phrase: " + pn.phrase + "clicked, go down to children")
        goDonwToChildren(wordTable);

    }
    e.stopPropagation();
}

function goUpToParent(wordTable) {
    var pn = wordTable.phraseNode;
    pn.isMyAncestor(pn);
    var parentPhraseNode = wordTable.phraseNode.parent;
    if (parentPhraseNode != null) {
        var containerDiv = wordTable.parentNode;
        var parentWordTable = createWordTable(wordTable.id, parentPhraseNode);
        containerDiv.insertBefore(parentWordTable, wordTable);
        removeDescents(parentWordTable);
    }
    redoIds(containerDiv);
}
function removeDescents(wordTable) {
    var containerDiv = wordTable.parentNode;
    var setForRemoval = []
    NodeList.prototype.forEach = Array.prototype.forEach
    var children = containerDiv.childNodes;
    children.forEach(function (item) {
        if (item.phraseNode.isMyAncestor(wordTable.phraseNode)) {
            setForRemoval.push(item);
        }
    });

    for (var i = 0; i < setForRemoval.length; i++) {
        var rem = setForRemoval[i];
        console.log(rem.phraseNode.phrase + " is being removed");
        containerDiv.removeChild(rem);
    }
}
function goDonwToChildren(wordTable) {
    if (wordTable.phraseNode.phraseChildren.length > 0) {
        var currentid = parseInt(wordTable.id);
        var containerDiv = wordTable.parentNode;
        for (var i = 0; i < wordTable.phraseNode.phraseChildren.length; i++) {
            var pn = wordTable.phraseNode.phraseChildren[i];
            var cwt = createWordTable(currentid + i, pn);
            containerDiv.insertBefore(cwt, wordTable);
        }
        containerDiv.removeChild(wordTable);
        redoIds(containerDiv);
    } else {
        console.log("phrase node:" + wordTable.phraseNode.phrase + " has no children");
    }
}

function split(tableNum) {
    var currentid = tableNum;
    var i = (parseInt(tableNum))
    var insertAfterId = (parseInt(tableNum) - 1).toString();
    var insertAfterTable = document.getElementById(insertAfterId);
    var currentTable = document.getElementById(tableNum);
    console.log("need to split " + currentTable.id);
    var containerDiv = currentTable.parentNode;

    var txt2split = currentTable.middleTxt.split(" ");
    if (txt2split.length == 1) {
        console.log("can not split...")

    } else {
        for (var o = 0; o < txt2split.length; o++) {
            //var elem = tableCreate(i, 3, 1, stringarr[i]);
            var elem1 = createWordTable(i + o, txt2split[o]);

            containerDiv.insertBefore(elem1, currentTable);
        }
        containerDiv.removeChild(currentTable);
        redoIds(containerDiv);
    }

}

function redoIds(containerDiv) {
    NodeList.prototype.forEach = Array.prototype.forEach
    var children = containerDiv.childNodes;
    var i = 0;
    children.forEach(function (item) {
        item.setNewId(i);
        item.setPhraseNode(item.phraseNode);//just for debugging
        i++;
    });
}
function merge(tableNum) {
    var neighborTableId = (parseInt(tableNum) + 1).toString();
    var neighborTable = document.getElementById(neighborTableId);
    var currentTable = document.getElementById(tableNum);
    if (neighborTable == null) {
        console.log("can not merge this with anything");
        console.log("no neighbor with id:" + neighborTableId)
    } else {
        console.log("need to merge " + currentTable.id + " and " + neighborTable.id);
        var newMiddleTxt = currentTable.middleTxt + " " + neighborTable.middleTxt;
        var mergedTable = createWordTable(tableNum, newMiddleTxt);
        var containerDiv = currentTable.parentNode;
        containerDiv.insertBefore(mergedTable, currentTable);
        containerDiv.removeChild(currentTable);
        containerDiv.removeChild(neighborTable);
        redoIds(containerDiv);
    }

}

function showsent(phraseNodes) {
    var lineDiv = document.createElement("div");
    lineDiv.id = "myLineDiv";
    document.body.appendChild(lineDiv);

    for (var i = 0; i < phraseNodes.length; i++) {
        var pn = phraseNodes[i];
        //var elem = tableCreate(i, 3, 1, stringarr[i]);
        var elem = createWordTable(i, pn);
        lineDiv.appendChild(elem);
    }
}


function createWordTable(numid, phraseNode) {
    wordTable = document.createElement("table");
    wordTable.id = numid.toString();
    wordTable.phraseNode = phraseNode;
    wordTable.style.display = "inline-block";
    wordTable.style.float = "left";
    for (var i = 0; i < 3; i++) {
        var tr = wordTable.insertRow();
        for (var j = 0; j < 1; j++) {
            var td = tr.insertCell();
            if (i == 1) {
                td.innerHTML = wordTable.phraseNode.phrase + "," + wordTable.id;
            } else {
                td.appendChild(document.createTextNode(""));
                td.id = "cell," + numid.toString() + "," + i.toString();
                td.addEventListener("click", spanClicked, false);
                td.height = "10px";
            }
            td.style.border = "1px solid black";
            if (i == 1 && j == 1) {
                td.setAttribute('rowSpan', '2');
            }

        }
    }

    wordTable.setPhraseNode = function (newPhraseNode) {
        this.phraseNode = newPhraseNode;
        this.rows[1].cells[0].innerHTML = this.phraseNode.phrase + "," + this.id;
    }

    wordTable.setNewId = function (newId) {
        this.id = newId.toString();
        this.rows[0].cells[0].id = "cell," + newId.toString() + ",0";
        this.rows[2].cells[0].id = "cell," + newId.toString() + ",2";
    }

    return wordTable;

}

function PhraseNode(phrase, parent) {
    this.phrase = phrase;
    this.parent = parent;
    this.phraseChildren = [];
    this.addPhraseChild = function (phraseNode) {
        this.phraseChildren.push(phraseNode);
    }

    this.toString = function () {
        return "PhraseNode:" + this.phrase;
    }
    this.isMyAncestor = function (pn) {
        var isAncestor = false
        var a_parent = this.parent;
        while (a_parent != null) {
            console.log("ancestor:" + a_parent.phrase + (a_parent == pn));
            if (a_parent == pn) {
                isAncestor = true;
            }
            a_parent = a_parent.parent;
        }
        return isAncestor;
    }

}
