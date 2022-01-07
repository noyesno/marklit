import "./webtk.js"

// window.define = webtk.define.bind(webtk);
// window.define.amd = true;

webtk.define("marked", null, "https://cdn.jsdelivr.net/npm/marked/marked.min.js", function(){
  console.log("loaded marked");
  marked.use({
    tokenizer: {
      fences: function(src){
        // fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
        var matches;
          console.log("check", src);
        if(matches = src.match(/^<<([^>]+)>>=([^\n]*)\n(?:|([\s\S]*?)\n)@(\n|\s[^\n]*\n|$)/)){
          console.log("see noweb");
          var raw = matches[0];
          var text = matches[3] || '' ;
          return {
            type: 'code',
            raw,
            lang: matches[2],
            chunk: matches[1],
            text
          };
        }else{
          console.log("return false");
          return false;
        }
      }
    },
    renderer: {
      code: function(code, infoline, escaped){
        console.log("render code", arguments);
        var matches;
        var code_attrs = [];
        var file_label = "";
        if (matches = infoline.match(/(\w+)/)){
           code_attrs.push(`class="language-${matches[1]}"`);
           code_attrs.push(`data-lang="${matches[1]}"`);
        }
        if (matches = infoline.match(/file:(\S+)/) || infoline.match(/-file (\S+)/)){
           code_attrs.push(`data-file="${matches[1]}"`);
           file_label = `<label>${matches[1]}</label>`;
        }

        if (matches = infoline.match(/<<=([^>]+)>>/)){
           var chunk_name = matches[1].trim();
           code_attrs.push(`data-chunk="${chunk_name}"`);
           file_label = `<label>&lt;&lt;${chunk_name}&gt;&gt;</label>`;
        }
        return `<pre>${file_label}<code ${code_attrs.join(' ')}>${code}</code></pre>`;
      }
    }
  });
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
  // return;
  var marked_text = []; // document.body.innerHTML;
  var marked_nodes = [];
  var marked_fragment = new DocumentFragment();
  var article = document.createElement("article");
  article.classList.add("marklit");

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

