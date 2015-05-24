/**
 * Created by arenduchintala on 5/20/15.
 */

function add(num1, num2) {
    return num1 + num2
}
function changetext(id) {
    $(id).html($(id).html() + " " + $(id).html());

}
function getsent() {
    return "a new sentence";
    //for w in sent:
    //    $('body'.append("<span id='id'+w >w</span>");
}
function ready() {
    var sentence = "this is a test sentence";
    showsent(sentence);
    /*var tableProto = Object.create(HTMLTableElement.prototype);


     Object.defineProperty(tableProto, 'middleTxt', {
     value: "middletxt", writable: true
     });

     var wordTable = document.registerElement('word-table', {
     prototype: tableProto
     });*/


}
function spanClicked(e) {
    console.log("a span has been clicked:" + e.target.id);
    var tablenum = e.target.id.split(",")[1];
    var rownum = parseInt(e.target.id.split(",")[2]);
    if (rownum == 0) {
        merge(tablenum);
    } else {
        split(tablenum);
    }
    e.stopPropagation();
}

function split(tableNum) {
    var currentid = tableNum;
    var i = (parseInt(tableNum))
    var insertAfterId = (parseInt(tableNum) - 1).toString();
    var insertAfterTable = document.getElementById(insertAfterId);
    var currentTable = document.getElementById(tableNum);
    console.log("need to split " + currentTable.id);
    var parentDiv = currentTable.parentNode;

    var txt2split = currentTable.middleTxt.split(" ");
    if (txt2split.length == 1) {
        console.log("can not split...")

    } else {
        for (var o = 0; o < txt2split.length; o++) {
            //var elem = tableCreate(i, 3, 1, stringarr[i]);
            var elem1 = createWordTable(i + o, txt2split[o]);

            parentDiv.insertBefore(elem1, currentTable);
        }
        parentDiv.removeChild(currentTable);
        redoIds(parentDiv);
    }

}

function redoIds(parentDiv) {
    NodeList.prototype.forEach = Array.prototype.forEach
    var children = parentDiv.childNodes;
    var i = 0;
    children.forEach(function (item) {
        item.setNewId(i);
        item.setMiddleTxt(item.middleTxt);
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
        var parentDiv = currentTable.parentNode;
        parentDiv.insertBefore(mergedTable, currentTable);
        parentDiv.removeChild(currentTable);
        parentDiv.removeChild(neighborTable);
        redoIds(parentDiv);
    }

}

function showsent(stringStr) {
    var lineDiv = document.createElement("div");
    lineDiv.id = "myLineDiv";
    document.body.appendChild(lineDiv);
    var stringarr = stringStr.split(" ");
    for (var i = 0; i < stringarr.length; i++) {
        //var elem = tableCreate(i, 3, 1, stringarr[i]);
        var elem = createWordTable(i, stringarr[i]);
        lineDiv.appendChild(elem);
    }
}


function createWordTable(numid, txt) {
    wordTable = document.createElement("table");
    wordTable.id = numid.toString();
    wordTable.middleTxt = txt;
    wordTable.style.display = "inline-block";
    wordTable.style.float = "left";
    for (var i = 0; i < 3; i++) {
        var tr = wordTable.insertRow();
        for (var j = 0; j < 1; j++) {

            var td = tr.insertCell();
            if (i == 1) {
                td.innerHTML = wordTable.middleTxt + "," + wordTable.id;
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

    wordTable.setMiddleTxt = function (newmiddleTxt) {
        this.middleTxt = newmiddleTxt;
        this.rows[1].cells[0].innerHTML = this.middleTxt + "," + this.id;
    }

    wordTable.setNewId = function (newId) {
        this.id = newId.toString();
        this.rows[0].cells[0].id = "cell," + newId.toString() + ",0";
        this.rows[2].cells[0].id = "cell," + newId.toString() + ",2";
    }

    return wordTable;

}