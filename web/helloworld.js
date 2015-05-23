/**
 * Created by arenduchintala on 5/20/15.
 */

function add(num1, num2) {
    return num1 + num2
}
function changetext(id) {
    $(id).html($(id).html() + " " + $(id).html());
    $('body').append("<p>Hello world.</p>")
    showsent();
}
function getsent() {
    return "a new sentence";
    //for w in sent:
    //    $('body'.append("<span id='id'+w >w</span>");
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
    var currentTable = document.getElementById("tbl," + tableNum);
    console.log("need to split " + currentTable.id);

}

function merge(tableNum) {
    var currentTable = document.getElementById("tbl," + tableNum);
    var neighborTable = "tbl," + (parseInt(tableNum) + 1).toString();
    console.log("need to merge " + currentTable.id + " and " + neighborTable);
   
}


function showsent() {
    var lineDiv = document.createElement("div");
    lineDiv.id = "myLineDiv";
    document.body.appendChild(lineDiv);
    var stringStr = "thi is a string";
    var stringarr = stringStr.split(" ");
    for (var i = 0; i < stringarr.length; i++) {
        var elem = tableCreate(i, 3, 1, stringarr[i]);
        lineDiv.appendChild(elem);
    }
}

function TxtNode() {
    this.txt = "default next";
    this.childTxtNodes = [];
    this.parentTxtNode = null;
    var x = document.createElement("SPAN");
}

function main() {
    var anode = new TxtNode();
    var bnode = new TxtNode();
    var cnode = new TxtNode();
    anode.childTxtNodes.concat(bnode);
    bnode.parentTxtNode = anode;
    anode.childTxtNodes.concat(cnode);
    cnode.parentTxtNode = anode;
}


function tableCreate(tablenum, numrows, numcols, middleTxt) {
    var body = document.body,
        tbl = document.createElement('table');
    tbl.id = "tbl," + tablenum.toString();
    //tbl.style.border = "1px solid black";
    tbl.style.display = "inline-block";
    tbl.style.float = "left";
    for (var i = 0; i < numrows; i++) {
        var tr = tbl.insertRow();
        for (var j = 0; j < numcols; j++) {
            if (i == 2 && j == 1) {
                break;
            } else {
                var td = tr.insertCell();
                if (i == 1) {
                    td.appendChild(document.createTextNode(middleTxt));
                } else {
                    td.appendChild(document.createTextNode(""));
                    td.id = "cell," + tablenum.toString() + "," + i.toString();
                    td.addEventListener("click", spanClicked, false);
                    td.height = "10px";
                }
                td.style.border = "1px solid black";
                if (i == 1 && j == 1) {
                    td.setAttribute('rowSpan', '2');
                }
            }
        }
    }
    return tbl;
    //body.appendChild(tbl);
}