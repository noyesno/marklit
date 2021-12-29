import "./webtk.js"

// window.define = webtk.define.bind(webtk);
// window.define.amd = true;

webtk.define("marked", null, "https://cdn.jsdelivr.net/npm/marked/marked.min.js", function(){
  console.log("loaded marked");
});

webtk.require(["./marklit.md.css"]);

webtk.define("runmode", ["runmode-css"], "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/addon/runmode/runmode-standalone.js", function(){
  console.log("loaded runmode");
});
webtk.define("runmode-css", null, "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/lib/codemirror.css", function(){
  console.log("loaded runmode-css");
});

webtk.define("runmode-tcl", ["runmode"], "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/mode/tcl/tcl.js");
webtk.define("runmode-javascript", ["runmode"], "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/mode/javascript/javascript.js");

webtk.require(["marked"], function(){
  console.log("marklit start parse");
  marklit_start();
});

function marklit_start(){
  var marked_text = []; // document.body.innerHTML;
  var marked_nodes = [];
  var marked_fragment = new DocumentFragment();
  var article = document.createElement("article");

  Array.prototype.every.call(document.body.childNodes, function(node){
    if(node.nodeName=="SCRIPT"){
      return false;
    }
    marked_nodes.push(node);
    if(node.nodeName=="#text"){
      marked_text.push(node.textContent);
    }else{
      marked_text.push(node.outerHTML);
    }
    return true;
  }, marked_nodes);

  marked_nodes.forEach(function(node){
    marked_fragment.append(node);
  });


  marked_text = marked_text.join('');
  console.log(marked_text);
  console.log("marked", window.marked);

  article.classList.add("cm-s-default");
  article.innerHTML = marked.parse(marked_text);
  document.body.prepend(article);

  var code_lang_src_lut = {
    "tcl": "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/mode/tcl/tcl.js",
    "javascript": "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/mode/javascript/javascript.js",
  };

  var code_lang_set = {
  };

  document.body.querySelectorAll("pre > code").forEach(function(el){
    var code_lang = (el.className.match(/language-(\w+)/) || [])[1];
    if(code_lang && code_lang_src_lut[code_lang]){
      code_lang_set[code_lang] = code_lang_src_lut[code_lang];
    }
  });

  for(let code_lang in code_lang_set){
    var code_lang_src = code_lang_set[code_lang];
    // webtk.require([`language-${code_lang}`]
    console.log("task highlight", code_lang);
    webtk.require([`runmode-${code_lang}`], function(){
      console.log("start highlight", code_lang);
      document.body.querySelectorAll(`pre > code.language-${code_lang}`).forEach(function(el){
          var code = el.innerText; // el.innerHTML || el.innerText;
          // code = code.replace(/&gt;/g, '<');
          // var code_lang = (el.className.match(/language-(\w+)/) || [])[1];
          console.log(code_lang, code);
          var html = CodeMirror.runMode(code, code_lang, el);
          // console.log(html);
      });
    });
  }
}

