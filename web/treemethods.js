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


function labelSwaps(rootPhraseTree) {
    var _stack = [];
    var pn;
    _stack.push(rootPhraseTree);
    while (_stack.length > 0) {
        pn = _stack.pop();
        if (pn.phraseChildren.length == 0) {
            pn.areChildrenSwapped = false
        } else {
            for (var i = pn.phraseChildren.length - 1; i > -1; i--) {
                var c = pn.phraseChildren[i];
                _stack.push(c);
            }

            if (pn.phraseChildren.length == 1) {
                pn.areChildrenSwapped = false
                var c1 = pn.phraseChildren[0]
                c1.areParentsSwapped = false
            } else {
                /*var c1 = pn.phraseChildren[0]
                 var c2 = pn.phraseChildren[1]
                 var unswappedphrase = c1.phrase + "_" + c2.phrase
                 var swappedphrase = c2.phrase + "_" + c1.phrase
                 var unswappeded = getEditDistance(pn.phrase, unswappedphrase)
                 var swappeded = getEditDistance(pn.phrase, swappedphrase)
                 if (unswappeded > swappeded) {
                 //has swapped
                 pn.areChildrenSwapped = true
                 c1.areParentsSwapped = true
                 c2.areParentsSwapped = true
                 console.log("a swap registered " + pn.phrase + " swapped:" + swappedphrase + " unswapped:" + unswappedphrase)
                 } else if (unswappeded != swappeded) {
                 //console.log("no swap registered " + pn.phrase + " swapped:" + swappedphrase + " unswapped:" + unswappedphrase)
                 } else {
                 console.log("ed are same");
                 }*/

                //find best split
                var unswapSplit = getBestSplit(pn.phrase, pn.phraseChildren, false)
                var swapSplit = getBestSplit(pn.phrase, pn.phraseChildren, true)
                if (swapSplit[0] < unswapSplit[0]) {
                    console.log("there is a swap between current node:" + pn.phrase + " and its children")
                    console.log(swapSplit[1] + " + " + swapSplit[2])
                    console.log(pn.phraseChildren[0].phrase + " + " + pn.phraseChildren[1].phrase)
                    pn.phrasePart1 = swapSplit[1]
                    pn.phrasePart2 = swapSplit[2]
                } else {
                    console.log("there is no swap")
                    console.log(unswapSplit[1] + " + " + unswapSplit[2]);
                    console.log(pn.phraseChildren[0].phrase + " + " + pn.phraseChildren[1].phrase);
                    pn.phrasePart1 = unswapSplit[1]
                    pn.phrasePart2 = unswapSplit[2]
                }

            }

        }
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
    var s1 = fullstringarray.slice(0, breakpoint).join("_")
    var s2 = fullstringarray.slice(breakpoint, fullstringarray.length).join("_")
    return [s1, s2]
}

function getBestSplit(fullstring, childrenNodes, doSwap) {
    var c1, c2
    if (doSwap) {
        c1 = childrenNodes[1].phrase
        c2 = childrenNodes[0].phrase
    } else {
        c1 = childrenNodes[0].phrase
        c2 = childrenNodes[1].phrase
    }

    var bestsplit = ["", ""]
    var ed = 100000
    var fullStringArray = fullstring.split("_")
    for (var bp = 1; bp < fullStringArray.length; bp++) {
        var splits = getSplits(fullStringArray, bp)
        var s1 = splits[0]
        var s2 = splits[1]
        var ced = getEditDistance(c1, s1) + getEditDistance(c2, s2)
        if (ced < ed) {
            ed = ced
            bestsplit[0] = s1
            bestsplit[1] = s2
        }
    }
    return [ed, bestsplit[0], bestsplit[1]]
}

