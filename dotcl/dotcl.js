

regexp_words = /^\s*([^\s"\{\[]+)(\s+([^\s"\{\[]+))*/ ;

function tcl_match_tokens(text){
  var re = /(\s*)([^\s"\{\[\$]+|"(?:[^\"]|\\.)*")/gy ;
  //var re = /(\s*)([^\s"\{\[]+|"(?:[^\"]|\\.)*")/gy ;
  // re.lastIndex = 0;

  
  var matches;
  var start=0;
  var token_list = [];
  while(matches = re.exec(text)){
   console.log("matches", re.lastIndex, matches);
    var space = matches[1];
    var word  = matches[2];

    start = re.lastIndex; // + matches[0].length;

    start_char = text[start];
    switch(text[start]){
      case '$':
         console.log("see varialbe");
         word += tcl_match_variable(text, start);
         break; 
      case '[':
    } 

    token_list.push(word);
  }

  re_qstring = /"([^\"]|\\.)+"/

  console.log(token_list);
  console.log(start, text.substr(start));
}

function tcl_match_variable(text, start){
  var re = /\$(\w+)/gy ;
  re.lastIndex = start;
  console.log("variable", start, text);
  while(matches = re.exec(text)){
    console.log("subst variable", matches[1]);
    return '${' + matches[1] + '}';
  }
  return 'Error'; 
}

tcl_match_tokens("hello abc$time 123 {def}");
