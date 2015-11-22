// tokenize(str)
// extracts semantically useful tokens from a string containing English-language sentences
// @param {String}    the string to tokenize
// @returns {Array}   contains extracted tokens

function tokenize(str) {

   var punct='\\['+ '\\!'+ '\\"'+ '\\#'+ '\\$'+              // since javascript does not
             '\\%'+ '\\&'+ '\\\''+ '\\('+ '\\)'+             // support POSIX character
             '\\*'+ '\\+'+ '\\,'+ '\\\\'+ '\\-'+             // classes, we'll need our
             '\\.'+ '\\/'+ '\\:'+ '\\;'+ '\\<'+              // own version of [:punct:]
             '\\='+ '\\>'+ '\\?'+ '\\@'+ '\\['+
             '\\]'+ '\\^'+ '\\_'+ '\\`'+ '\\{'+
             '\\|'+ '\\}'+ '\\~'+ '\\]',

       re=new RegExp(                                        // tokenizer
          '\\s*'+            // discard possible leading whitespace
          '('+               // start capture group #1
            '\\.{3}'+            // ellipsis (must appear before punct)
          '|'+               // alternator
            '\\w+\\-\\w+'+       // hyphenated words (must appear before punct)
          '|'+               // alternator
            '\\w+\'(?:\\w+)?'+   // compound words (must appear before punct)
          '|'+               // alternator
            '\\w+'+              // other words
          '|'+               // alternator
            '['+punct+']'+        // punct
          ')'                // end capture group
        );

   // grep(ary[,filt]) - filters an array
   //   note: could use jQuery.grep() instead
   // @param {Array}    ary    array of members to filter
   // @param {Function} filt   function to test truthiness of member,
   //   if omitted, "function(member){ if(member) return member; }" is assumed
   // @returns {Array}  all members of ary where result of filter is truthy

   function grep(ary,filt) {
     var result=[];
     for(var i=0,len=ary.length;i++<len;) {
       var member=ary[i]||'';
       if(filt && (typeof filt === 'Function') ? filt(member) : member) {
         result.push(member);
       }
     }
     return result;
   }

   return grep( str.split(re) );   // note: filter function omitted 
                                   //       since all we need to test 
                                   //       for is truthiness
} // end tokenize()
