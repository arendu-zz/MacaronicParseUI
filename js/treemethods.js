/**
 * Created by arenduchintala on 6/21/15.
 */

function getleaves(rootPhraseTree) {
    var _stack = [];
    var leaves = [];
    var pn;
    _stack.push(rootPhraseTree);
    while (_stack.length > 0) {
        pn = _stack.pop();
        if (pn.phraseChildren.length == 0) {
            pn.isLeaf = true;
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


function labelDescendentSwaps(rootPhraseTree) {
    var _stack = []
    var leaves = getleaves(rootPhraseTree)
    for (var i = 0; i < leaves.length; i++) {
        var pn = leaves[i]
        pn.areAnyDescendentsSwapping = false //leaves can not have any children that swap
        pn.areChildrenSwapped = false
        _stack.push(pn)

    }
    while (_stack.length > 0) {
        pn = _stack.shift() //pops from the front of the array
        var parent = pn.parent
        if (pn.parent != null && $.inArray(pn.parent, _stack) == -1) {
            _stack.push(parent)
        } else {
            //root has no parent.. so do nothing
        }
        for (var c = 0; c < pn.phraseChildren.length; c++) {
            pn.areAnyDescendentsSwapping = pn.areAnyDescendentsSwapping || pn.phraseChildren[c].areChildrenSwapped || pn.phraseChildren[c].areAnyDescendentsSwapping
        }
    }
}

function labelSwaps(rootPhraseTree) {
    var _stack = [];
    var pn;
    _stack.push(rootPhraseTree);
    while (_stack.length > 0) {
        pn = _stack.pop();
        if (pn.phraseChildren.length == 0) {
            pn.areChildrenSwapped = false
            pn.phrasePart1 = pn.phrase
        } else {
            for (var i = pn.phraseChildren.length - 1; i > -1; i--) {
                var c = pn.phraseChildren[i];
                _stack.push(c);
            }

            if (pn.phraseChildren.length == 1) {
                pn.areChildrenSwapped = false
                pn.phrasePart1 = pn.phrase
                pn.phrasePart2 = ""
                var c1 = pn.phraseChildren[0]
                c1.areParentsSwapped = false
            } else {

                //find best split

                var unswapSplit = getBestSplit(pn.phrase, pn.phraseChildren, "noswap")
                var swapSplit = getBestSplit(pn.phrase, pn.phraseChildren, "swap")
                var drop1Split = getBestSplit(pn.phrase, pn.phraseChildren, "drop1")
                var drop2Split = getBestSplit(pn.phrase, pn.phraseChildren, "drop2")
                var things = [unswapSplit, swapSplit, drop1Split, drop2Split]
                var mined = 10000
                var min_thing
                NodeList.prototype.forEach = Array.prototype.forEach
                things.forEach(function (thing) {
                    if (thing[0] < mined) {
                        min_thing = thing
                        mined = thing[0]
                    }
                });

                if (min_thing[3] == "swap") {
                    pn.phrasePart1 = min_thing[1]
                    pn.phrasePart2 = min_thing[2]
                    pn.areChildrenSwapped = true
                    var c1 = pn.phraseChildren[0]
                    var c2 = pn.phraseChildren[1]
                    c1.areParentsSwapped = true
                    c2.areParentsSwapped = true
                    //console.log("swap at children " + pn.phrase)
                }

                if (min_thing[3] == "drop1" || min_thing[3] == "drop2") {
                    pn.phrasePart1 = min_thing[1]
                    pn.phrasePart2 = min_thing[2]
                    pn.areChildrenSwapped = false
                    var c1 = pn.phraseChildren[0]
                    var c2 = pn.phraseChildren[1]
                    c1.areParentsSwapped = false
                    c2.areParentsSwapped = false
                }

                if (min_thing[3] == "noswap") {
                    pn.phrasePart1 = min_thing[1]
                    pn.phrasePart2 = min_thing[2]
                    pn.areChildrenSwapped = false
                    var c1 = pn.phraseChildren[0]
                    var c2 = pn.phraseChildren[1]
                    c1.areParentsSwapped = false
                    c2.areParentsSwapped = false
                }

            }

        }
        //console.log("node: " + pn.phrase + "\tSWAPPED: " + pn.areChildrenSwapped.toString() + " " + pn.areParentsSwapped.toString())
    }
    return true
}

function parsePhraseTree(phraseTreeStr) {
    //"1、2、3".split(/()/g) == ["1", "、", "2", "、", "3"]
    var numNT = 0;
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
            rootpn = _stack.pop();
            for (var c = 0; c < rootpn.phraseChildren.length; c++) {
                var pc = rootpn.phraseChildren[c];
                pc.setPhraseSiblings(rootpn.phraseChildren);
            }
            //rootpn = _stack[_stack.length - 1];
            //toppn = _stack[_stack.length - 1];
            //toppn.addPhraseChild(pn);
        } else {
            console.log("should never come here now.....");
            toppn = _stack[_stack.length - 1];
            pn = new PhraseNode(item, toppn);
            toppn.addPhraseChild(pn);
            _stack.push(pn);
        }
    }
    rootpn = _stack.pop();
    for (var c = 0; c < rootpn.phraseChildren.length; c++) {
        var pc = rootpn.phraseChildren[c];
        pc.setPhraseSiblings(rootpn.phraseChildren);
    }

    var num = 0;
    Q = []
    Q.push(rootpn)
    while (Q.length > 0) {
        pn = Q.shift();
        if (pn.phraseChildren.length > 0) {
            numNT++;
        }
        pn.num = num;
        num++
        for (var c = 0; c < pn.phraseChildren.length; c++) {
            pc = pn.phraseChildren[c]
            Q.push(pc);
        }
    }
    return [rootpn, numNT];
}

function getSplits(fullstringarray, breakpoint) {
    var s1, s2
    var joined = ""
    if (breakpoint == 0) {
        s1 = ""
    } else {
        s1 = fullstringarray.slice(0, breakpoint).join("_")
        joined = s1
    }

    if (breakpoint == fullstringarray.length) {
        s2 = ""
    } else {
        s2 = fullstringarray.slice(breakpoint, fullstringarray.length).join("_")
        if (joined == "") {
            joined = joined + s2
        } else {
            joined = joined + "_" + s2
        }

    }

    /*console.log("splits:" + s1 + "|||" + s2)
     console.log("2checking splits:" + fullstringarray.join("_"))*/

    assert(joined == fullstringarray.join("_"), "Checking the split function")
    return [s1, s2]
}

function checkChildDropped(fullstring, childrenNodes) {

}

function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

function getBestSplit(fullstring, childrenNodes, action) {
    //console.log("full string is: " + fullstring)
    var c1, c2
    if (action == "swap") {
        c1 = childrenNodes[1].phrase
        c2 = childrenNodes[0].phrase
    } else if (action == "noswap") {
        c1 = childrenNodes[0].phrase
        c2 = childrenNodes[1].phrase
    } else if (action == "drop2") {
        c1 = childrenNodes[0].phrase
        c2 = ""
    } else if (action == "drop1") {
        c1 = ""
        c2 = childrenNodes[1].phrase
    }

    var bestsplit = ["", ""]
    var ed = 100000
    var fullStringArray = fullstring.split("_")
    for (var bp = 0; bp <= fullStringArray.length; bp++) {
        var splits = getSplits(fullStringArray, bp)
        var s1 = splits[0]
        var s2 = splits[1]
        var ced1 = getEditDistance(c1, s1)
        var ced2 = getEditDistance(c2, s2)
        if (ced1 + ced2 < ed) {
            ed = ced1 + ced2
            bestsplit[0] = s1
            bestsplit[1] = s2

        }
    }
    return [ed, bestsplit[0], bestsplit[1], action]
}
