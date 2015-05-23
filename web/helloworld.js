/**
 * Created by arenduchintala on 5/20/15.
 */

function add(num1, num2) {
    return num1 + num2
}
function changetext(id){
    $(id).html($(id).html()+" "+$(id).html());
    $('body').append("<p>Hello world.</p>")
}
function getsent(){
    return "a new sentence";
    //for w in sent:
    //    $('body'.append("<span id='id'+w >w</span>");
}