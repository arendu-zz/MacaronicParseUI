/**
 * Created by arenduchintala on 5/20/15.
 */


var mllist = []

function mysliderfunc(valnum) {
    console.log("current slider:" + valnum.toString())
    currentSlider = valnum
    NodeList.prototype.forEach = Array.prototype.forEach
    mllist.forEach(function (item) {
        item.setSliderNum(valnum)
    });
}

function startsWith(string1, string2) {
    var res = string1.substring(0, string2.length);
    if (res == string2) {
        return true
    } else {
        return false
    }
}

function ready() {
    var sentence = "this is a test sentence";
    var phraseTreeStr = "(since_their_articles_appeared_,_the_price_of_gold_has_moved_up_still_further. (since_the_publication_of_their_article,_the_gold_price_has_risen_still_further (since (seit)) (the_publication_of_their_article,_the_gold_price_has_risen_still_further (the_publication_of_their_article,_the_gold_price_is_risen_still_further (the_publication_of_their_article (the_publication (the (der)) (publication (Veröffentlichung)) ) (their_article (their (ihrer)) (article (Artikel))))(the_gold_price_is_risen_still_further (the_gold_price_is (is (ist)) (the_gold_price (the (der)) (gold_price (Goldpreis)))) (risen_still_further (still_further (still (noch)) (further (weiter))) (risen (gestiegen))))))) (. (.)))"
    var items = parsePhraseTree(phraseTreeStr);
    var rootPhraseNode = items[0]
    var numNT = items[1]
    var macline = new MacaronicLine(0, rootPhraseNode, numNT)
    macline.addToDoc()
    macline.displayPhrases()
    mllist.push(macline)

    var items = parsePhraseTree("(But_there_remains_a_big_question_how? (But_there_remains_a_big_question (But (Aber))  (there_remains_a_big_question (remains_a_big_question (a_big_question (a (eine))  (big_question (big (große))  (question (Frage))))  (remains (bleibt)))))  (how? (Wie?)))");
    var rootPhraseNode = items[0]
    var numNT = items[1]
    var macline = new MacaronicLine(1, rootPhraseNode, numNT)
    macline.addToDoc()
    macline.displayPhrases();
    mllist.push(macline)

    var items = parsePhraseTree("(Growth_and_jobs_need_to_be_promoted_with_equal_zeal. (Growth_and_jobs_need_to_be_promoted_with_equal_zeal (Growth_and_jobs (Growth (Wachstum))  (and_jobs (and (und))  (jobs (Arbeitsplätze))))  (need_to_be_promoted_with_equal_zeal (must (müssen))  (to_be_promoted_with_equal_zeal (be_promoted_with_equal_zeal (with_equal_zeal (with (mit))  (equal_zeal (equal (gleicher))  (resolve (Entschlossenheit))))  (be_promoted (promoted (gefördert))  (be (werden)))))))  (. (.)))")
    var rootPhraseNode = items[0]
    var numNT = items[1]
    var macline = new MacaronicLine(2, rootPhraseNode, numNT)
    macline.addToDoc()
    macline.displayPhrases();
    mllist.push(macline)

    var items = parsePhraseTree("(The_need_for_immediate_action_is_clear. (The_need_for_immediate_action_is_clear (The_need_for_immediate_action (The (That (Dass)))  (need_for_immediate_action (immediate_action (immediate (immediately (sofort)))  (action (acted (gehandelt))))  (need_for (be_must, (be (werden))  (must, (must (muss))  (, (,)))))))  (is_clear (is (ist))  (clear (eindeutig))))  (. (.)))")
    var rootPhraseNode = items[0]
    var numNT = items[1]
    var macline = new MacaronicLine(3, rootPhraseNode, numNT)
    macline.addToDoc()
    macline.displayPhrases();
    mllist.push(macline)

    var items = parsePhraseTree("(A_big_new_push_for_growth_is_therefore_vital. (A_big_new_push_for_growth_is_therefore_vital (A_big_new_push_for_growth (A (Ein))  (big_new_push_for_growth (big_new (strong_new (new (neuer))  (strong (, (,))  (strong (starker)))))  (push_for_growth (Wachstumsanschub))))  (is_therefore_vital (is (ist))  (therefore_vital (therefore (daher))  (vital (unverzichtbar)))))  (. (.)))")
    var rootPhraseNode = items[0]
    var numNT = items[1]
    var macline = new MacaronicLine(4, rootPhraseNode, numNT)
    macline.addToDoc()
    macline.displayPhrases();
    mllist.push(macline)

    /*var items = parsePhraseTree("(S (NP (I)) (VP (V (saw)) (X (him))))");
     var rootPhraseNode = items[0]
     var numNT = items[1]
     var macline = new MacaronicLine(5, rootPhraseNode, numNT)
     macline.addToDoc()
     macline.displayPhrases();
     mllist.push(macline)*/

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

function createWordTable(numid, phraseNode, macaronicline) {
    var wordTable = document.createElement("table");
    wordTable.numid = numid
    wordTable.macaronicline = macaronicline
    wordTable.id = 'ml,' + macaronicline.id.toString() + ',wt,' + numid.toString();
    wordTable.phraseNode = phraseNode;
    wordTable.phraseNode.setWordTable(wordTable);
    wordTable.style.display = "inline-block";
    wordTable.style.float = "left";
    wordTable.highlighted = false;
    for (var i = 0; i < 3; i++) {
        var tr = wordTable.insertRow();
        for (var j = 0; j < 1; j++) {
            var td = tr.insertCell();
            if (i == 1) {
                if (wordTable.phraseNode.isLeaf) {
                    td.innerHTML = wordTable.phraseNode.phrase.replace(/_/g, " ")
                    td.style.color = "#E3530D";
                } else {
                    td.innerHTML = wordTable.phraseNode.phrase.replace(/_/g, " ") //+ "," + wordTable.phraseNode.num
                }


            } else {
                td.appendChild(document.createTextNode(""));
                td.id = wordTable.id + ",c," + i.toString();
                td["rownum"] = i
                td.addEventListener("click", macaronicline.spanClicked, false);
                td.addEventListener("mouseover", macaronicline.highlight, false);
                td.addEventListener("mouseout", macaronicline.unhighlight, false);
                td.height = "10px";
                td["wordtable"] = wordTable;

            }
            //td.style.border = "1px solid black";
            if (i == 1 && j == 1) {
                td.setAttribute('rowSpan', '2');
            }

        }
    }

    wordTable.getTopLeftCoordinate = function () {
        var jtd = $(this.rows[0].cells[0])
        return jtd.offset();
    }

    wordTable.getBottomCellCoordinate = function () {
        var jtd = $(this.rows[2].cells[0])
        return jtd.offset();
    }

    wordTable.unLightHighlight = function (position) {
        this.highlighted = false
        this.rows[position].cells[0].style.opacity = 0.0
        this.rows[position].cells[0].style.backgroundColor = "grey"
        this.rows[1].cells[0].style.opacity = 1
    }

    wordTable.lightHighlight = function (position) {
        this.highlighted = true
        this.rows[position].cells[0].style.opacity = 0.0
        this.rows[position].cells[0].style.backgroundColor = "grey"
        this.rows[1].cells[0].style.opacity = 0.3
    }

    wordTable.setPhraseNode = function (newPhraseNode) {
        this.phraseNode = newPhraseNode;
        this.rows[1].cells[0].innerHTML = this.phraseNode.phrase.replace(/_/g, " ") //+ "," + this.phraseNode.num
    }

    wordTable.setNewId = function (newId) {
        this.numid = newId
        this.id = 'ml,' + this.macaronicline.id.toString() + ',wt,' + this.numid.toString();
        this.rows[0].cells[0].id = "cell," + newId.toString() + ",0";
        this.rows[2].cells[0].id = "cell," + newId.toString() + ",2";
    }

    return wordTable;

}

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

function MacaronicLine(lineid, rootPhraseNode, numNT) {
    var self = this
    self.id = lineid
    self["numSteps"] = numNT * 2
    self["stepSize"] = parseInt(100 / self.numSteps)
    self["previewDiv"] = null
    self["prevDirection"] = "going forward"
    self["prevZone"] = 0
    self["prevValNum"] = 0
    self["timer"] = null;
    self["lineDiv"] = document.createElement("div");
    self.lineDiv.class = "macaronicLine"
    self["isPreviewState"] = false

    this.lineDiv.id = "lineDiv" + lineid.toString()
    self["rootPhraseNode"] = rootPhraseNode


    self.addToDoc = function () {
        document.body.appendChild(this.lineDiv)
    }
    self.removeFromDoc = function () {
        this.lineDiv.parentNode.removeChild(this.lineDiv)
    }

    self.displayPhrases = function () {
        self.addToDoc()
        var phraseLeaves = getleaves(this.rootPhraseNode);
        for (var i = 0; i < phraseLeaves.length; i++) {
            var pn = phraseLeaves[i];
            //var elem = tableCreate(i, 3, 1, stringarr[i]);
            var elem = createWordTable(i, pn, this);
            self.lineDiv.appendChild(elem);
        }

    }

    self.spanClicked = function (e) {
        console.log("a span has been clicked:" + e.target.id);
        var wordTable = e.target.wordtable
        console.log("span clicked event: its wt is ml class:" + wordTable.id);
        var rownum = e.target.rownum
        var pn = wordTable.phraseNode;
        if (rownum == 0) {
            console.log("phrase: " + pn.phrase + "clicked, go up to parent");
            self.goUpToParent(wordTable);
        } else {
            var pn = wordTable.phraseNode;
            console.log("phrase: " + pn.phrase + "clicked, go down to children")
            self.goDownToChildren(wordTable);

        }
        self.unhighlight(e);
        e.stopPropagation();
    }

    self.previewParent = function (wordTable, top, left) {


        if (self.previewDiv != null) {
            self.previewDiv.wordTable.unLightHighlight(0)
            self.previewDiv.wordTable.unLightHighlight(2)
            var p = self.previewDiv.parentNode
            if (p != null) {
                p.removeChild(self.previewDiv);
            }
            self.isPreviewState = false;
            self.previewDiv = null;
        }

        var parentPhraseNode = wordTable.phraseNode.parent;
        if (parentPhraseNode != null) {
            self.isPreviewState = true;
            //createAndAddPreview(wordTable, true, self)
            self.previewDiv = document.createElement("div")
            self.previewDiv["wordTable"] = wordTable
            //self.previewDiv.style.border = "1px solid black";
            var previewSpan = document.createElement("span")
            self.previewDiv.id = "previewOverlay" + self.id.toString()
            //$("body").append(self.previewDiv);
            self.lineDiv.appendChild(self.previewDiv)

            self.previewDiv.appendChild(previewSpan)

            previewSpan.innerHTML = parentPhraseNode.phrase.replace(/_/g, " ")
            var elem = $(self.previewDiv);
            elem.css({
                position: 'absolute',
                top: top,
                left: left,
                zIndex: -1
            });
        }

    }

    self.previewChildren = function (wordTable) {

        if (self.previewDiv != null) {
            self.previewDiv.wordTable.unLightHighlight(0)
            self.previewDiv.wordTable.unLightHighlight(2)
            var p = self.previewDiv.parentNode
            if (p != null) {
                p.removeChild(self.previewDiv);
            }
            self.isPreviewState = false;
            self.previewDiv = null;
        }

        if (wordTable.phraseNode.phraseChildren.length > 0) {
            self.isPreviewState = true;
            //createAndAddPreview(wordTable, false, self);

            self.previewDiv = document.createElement("div")
            self.previewDiv["wordTable"] = wordTable
            self.previewDiv.id = "previewOverlay" + self.id.toString();
            //self.previewDiv.style.border = "1px solid black";
            for (var i = 0; i < wordTable.phraseNode.phraseChildren.length; i++) {
                var pn = wordTable.phraseNode.phraseChildren[i];
                var previewSpan = document.createElement("span")
                //previewSpan.style.border = "1px solid black";
                previewSpan.innerHTML = pn.phrase.replace(/_/g, " ")
                self.previewDiv.appendChild(previewSpan)

                if (i == wordTable.phraseNode.phraseChildren.length - 1) {

                } else {
                    var previewSpan = document.createElement("span")
                    previewSpan.innerHTML = "-"
                    self.previewDiv.appendChild(previewSpan)

                }
            }
            //$("body").append(self.previewDiv);
            self.lineDiv.appendChild(self.previewDiv)
            self.isPreviewState = true;
            var elem = $(self.previewDiv);
            //var jtd = $(e.currentTarget)
            var pos = wordTable.getBottomCellCoordinate()
            console.log("mouse over box location is" + 0 + "," + 0)
            elem.css({
                position: 'absolute',
                top: pos.top,
                left: pos.left,
                zIndex: -1
            });
        } else {
            console.log("phrase node:" + wordTable.phraseNode.phrase + " has no children");
        }
    }

    self.highlightWordTable = function (wordTable, rownum) {
        if (rownum == 0) {
            var left = 10000
            var top = 10000
            var parentWordTable = wordTable.phraseNode.parent;
            var containerDiv = wordTable.parentNode;
            var children = containerDiv.childNodes;
            NodeList.prototype.forEach = Array.prototype.forEach
            children.forEach(function (item) {
                if (startsWith(item.id, "previewOverlay")) {

                } else {
                    var pn = item.phraseNode;
                    if (pn.isMyAncestor(parentWordTable)) {
                        item.lightHighlight(rownum);
                        var jtdpos = item.getTopLeftCoordinate();
                        if (jtdpos.left < left) {
                            left = jtdpos.left
                        }
                        if (jtdpos.top < top) {
                            top = jtdpos.top
                        }
                    }
                }

            });
            self.previewParent(wordTable, top, left);
        } else {
            wordTable.lightHighlight(rownum);
            self.previewChildren(wordTable)
        }
    }

    self.highlight = function (e) {
        var wordTable = e.target.wordtable
        console.log("highlight event: its wt is ml class:" + wordTable.id);
        self.highlightWordTable(wordTable, e.target.rownum)
        e.stopImmediatePropagation();

    }

    self.goDownToChildren = function (wordTable) {
        self.previewDiv = document.getElementById("previewOverlay" + self.id.toString())
        if (self.previewDiv != null) {
            self.previewDiv.parentNode.removeChild(self.previewDiv);
        }
        if (wordTable.phraseNode.phraseChildren.length > 0) {
            var currentid = parseInt(wordTable.id);
            var containerDiv = wordTable.parentNode;
            for (var i = 0; i < wordTable.phraseNode.phraseChildren.length; i++) {
                var pn = wordTable.phraseNode.phraseChildren[i];
                var cwt = createWordTable(currentid + i, pn, self);
                containerDiv.insertBefore(cwt, wordTable);
            }
            containerDiv.removeChild(wordTable);
            self.redoIds(containerDiv);
        } else {
            console.log("phrase node:" + wordTable.phraseNode.phrase + " has no children");
        }
    }
    self.goUpToParent = function (wordTable) {
        self.previewDiv = document.getElementById("previewOverlay" + self.id.toString())
        if (self.previewDiv != null) {
            self.previewDiv.parentNode.removeChild(self.previewDiv);
        }
        var pn = wordTable.phraseNode;
        pn.isMyAncestor(pn);
        var parentPhraseNode = wordTable.phraseNode.parent;
        if (parentPhraseNode != null) {
            var containerDiv = wordTable.parentNode;
            var parentWordTable = createWordTable(wordTable.id, parentPhraseNode, self);
            containerDiv.insertBefore(parentWordTable, wordTable);
            self.removeDescents(parentWordTable);
        } else {
            console.log("parent phrase node seems to be null.... nothing to do..")
        }
        self.redoIds(containerDiv);
    }

    self.removeDescents = function (wordTable) {
        var containerDiv = wordTable.parentNode;
        var setForRemoval = []
        NodeList.prototype.forEach = Array.prototype.forEach
        var children = containerDiv.childNodes;
        children.forEach(function (item) {
            if (startsWith(item.id, "previewOverlay")) {
                console.log("ignoreding previewOverlay:" + item.id)
            } else if (item.phraseNode.isMyAncestor(wordTable.phraseNode)) {
                setForRemoval.push(item);
            }
        });

        for (var i = 0; i < setForRemoval.length; i++) {
            var rem = setForRemoval[i];
            //console.log(rem.phraseNode.phrase + " is being removed");
            containerDiv.removeChild(rem);
        }
    }


    self.redoIds = function (containerDiv) {
        NodeList.prototype.forEach = Array.prototype.forEach
        var children = containerDiv.childNodes;
        var i = 0;
        children.forEach(function (item) {
            if (startsWith(item.id, "previewOverlay")) {

            } else {
                item.setNewId(i);
                item.setPhraseNode(item.phraseNode);//just for debugging
                i++;
            }

        });
    }


    self.unhighlight = function (e) {
        var wordTable = e.target.wordtable
        console.log("unhiligh event: its wt is ml class:" + wordTable.id);
        self.unhighlightWordTable(wordTable, e.target.rownum)
        e.stopImmediatePropagation()
    }

    self.unhighlightWordTable = function (wordTable, rownum) {
        var containerDiv = wordTable.parentNode;
        if (containerDiv != null) {
            var children = containerDiv.childNodes;
            NodeList.prototype.forEach = Array.prototype.forEach
            children.forEach(function (item) {
                if (startsWith(item.id, "previewOverlay")) {

                } else {
                    var pn = item.phraseNode;
                    item.unLightHighlight(0);
                    item.unLightHighlight(2);
                }

            });
        }


        self.previewDiv = document.getElementById("previewOverlay" + self.id.toString())
        if (self.previewDiv != null) {
            self.previewDiv.parentNode.removeChild(self.previewDiv);
        }
    }

    self.stepclickUp = function () {
        self.previewDiv = document.getElementById("previewOverlay" + self.id.toString())
        if (self.previewDiv != null) {
            self.previewDiv.parentNode.removeChild(self.previewDiv);
        }
        //console.log("something stepclick")
        var maxnum = 0
        var maxid = -1
        var children = self.lineDiv.childNodes;
        NodeList.prototype.forEach = Array.prototype.forEach
        children.forEach(function (item) {
            if (startsWith(item.id, "previewOverlay")) {

            } else {
                var pn = item.phraseNode;
                if (pn.num > maxnum) {
                    maxnum = pn.num;
                    maxid = item.id
                }
            }


        });
        var wordTable = document.getElementById(maxid);
        if (wordTable != null) {
            //console.log("max num right now is" + maxnum + " with phrase " + wordTable.phraseNode.phrase)
            if (wordTable.highlighted) {
                self.goUpToParent(wordTable);
            } else {
                self.highlightWordTable(wordTable, 0);
            }
        } else {
            console.log("word table is null..")
        }


    }

    self.stepclickDown = function () {
        //console.log("go down automated...")

        var minnum = 100000
        var minid = -1
        var children = self.lineDiv.childNodes;
        NodeList.prototype.forEach = Array.prototype.forEach
        children.forEach(function (item) {
            if (startsWith(item.id, "previewOverlay")) {
                console.log("ignore previewOverlay:" + item.id)
            } else {
                var pn = item.phraseNode;
                if (pn.num < minnum && pn.phraseChildren.length > 0) {
                    minnum = pn.num;
                    minid = item.id
                }
            }


        });

        var wordTable = document.getElementById(minid);
        if (wordTable != null) {
            //console.log("min num right now is" + minnum + " with phrase " + wordTable.phraseNode.phrase)
            if (wordTable.highlighted) {
                self.goDownToChildren(wordTable)
            } else {
                self.highlightWordTable(wordTable, 2)
            }
        } else {
            console.log("word table is null..")
        }

    }


    self.tickDown = function () {
        self.currentCellNum--;
        self.stepclickDown();
        if (Math.abs(self.currentCellNum - self.sliderNum) < 1) {
            self.stop()
        } else {
            self.timer = null;
            self.goDown();        // restart the timer
        }
    }
    self.tickUp = function () {
        self.stepclickUp();
        self.currentCellNum++;
        console.log("from timer:  current" + self.currentCellNum + " slider:" + self.sliderNum)
        if (Math.abs(self.currentCellNum - self.sliderNum) < 1) {
            self.stop()
        } else {
            self.timer = null;
            self.goUp();        // restart the timer
        }

    }
    self.setSliderNum = function (valnum) {

        var direction = "going forward"
        if (valnum < self.prevValNum) {
            direction = "going back"

        } else {
            direction = "going foward"

        }

        //console.log(direction)
        var zone = Math.floor(valnum / self.stepSize)
        if (self.prevZone == zone) {
            console.log("same zone.." + direction + " zone:" + zone.toString())
        } else if (self.prevZone < zone) {
            console.log("new zone.." + direction + " zone:" + zone.toString() + " prevZone:" + self.prevZone.toString())
            var zonediff = Math.abs(self.prevZone - zone)
            if (self.isPreviewState && self.prevDirection == "going back") {
                console.log("1:is a preview state.. so must undo the last preview...")

                var soa = self.undoStepClick();
                if (soa) {
                    zonediff = zonediff - 1;
                    console.log("1: a preview has been undone...")
                } else {
                    console.log("1:no preview to remove...")
                }
            } else {
                console.log("1:prevzone < zone not undoing preview... " + self.isPreviewState + " prevdi:" + self.prevDirection)
            }

            for (var s = 0; s < zonediff; s++) {
                self.stepclickUp();
            }
            self.prevZone = zone;
            self.prevDirection = direction;
        } else {
            console.log("new zone.." + direction + " zone:" + zone.toString() + " prevZone:" + self.prevZone.toString())
            var zonediff = Math.abs(self.prevZone - zone)

            if (self.isPreviewState && self.prevDirection == "going foward") {
                console.log("2:is a preview state.. so must undo the last preview...")
                var soa = self.undoStepClick();
                if (soa) {
                    zonediff = zonediff - 1;
                    console.log("2: a preview has been undone...")
                } else {
                    console.log("2:no preview to remove...")
                }
            } else {
                console.log("2:prevzone > zone not undoing preview... " + self.isPreviewState + " prevdi:" + self.prevDirection)
            }

            for (var s = 0; s < zonediff; s++) {
                self.stepclickDown();
            }
            self.prevZone = zone;
            self.prevDirection = direction;
        }

        self.prevValNum = valnum;

        if (valnum == 0) {
            direction = "going forward"
            self.prevDirection = direction
        }
        if (valnum == 100) {
            direction = "going back"
            self.prevDirection = direction;
        }
    }

    self.undoStepClick = function () {
        var statusOfAction = false
        var wt = null
        if (self.previewDiv != null) {
            self.previewDiv.wordTable.unLightHighlight(0)
            self.previewDiv.wordTable.unLightHighlight(2)
            wt = self.previewDiv.wordTable
            var p = self.previewDiv.parentNode
            if (p != null) {
                p.removeChild(self.previewDiv);
            }
            self.previewDiv = null
            self.isPreviewState = false
            statusOfAction = true;
        }
        if (wt != null) {
            self.unhighlightWordTable(wt, 0)
        }
        return statusOfAction
    }
    self.stop = function () {
        clearTimeout(self.timer);
        self.timer = null;
    }

    self.goDown = function () {
        if (self.timer == null) {
            self.timer = setTimeout(self.tickDown, 4);
        }
    }

    self.goUp = function () {
        if (self.timer == null) {
            self.timer = setTimeout(self.tickUp, 4);
        }
    }


}