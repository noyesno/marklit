
(function(window){
    window.webtk = window.webtk || {};
    var self = window.webtk;

    self.modules = self.modules || {};

    self.element = function(selector){
        return document.querySelector(selector);
    }

    self.fragment = function(html){
      var fragment = document.createDocumentFragment();
      fragment.innerHTML = html;
      return fragment;
    }

    self.prepend = function(parent, node){
      node = typeof(node)=="string"?self.fragment(node):node;
      parent.insertBefore(node, parent.firstElementChild);
      return self;
    }


    self.domready = function(callback){
       switch(document.readyState){
         case "loading":
             document.addEventListener("DOMContentLoaded", callback);
             break;
         case "interactive":
         case "complete":
             callback.call();
             break;
         default:
             console.warn("unknow document.readyState", document.readyState);
       }
    };
    self.docready = function(callback){
       switch(document.readyState){
         case "loading":
         case "interactive":
             window.addEventListener("load", callback);
             break;
         case "complete":
             callback.call();
             break;
         default:
             console.warn("unknow document.readyState", document.readyState);
       }
    };

    self.hide = function(sel){
       document.querySelectorAll(sel).forEach(function(el){
         el.style.display = 'none';
       });
    };

    self.show = function(sel){
       document.querySelectorAll(sel).forEach(function(el){
         el.style.display = 'block';
       });
    };

    // <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css"/>
    //<script src="https://cdn.jsdelivr.net/npm/zepto@1.2.0/dist/zepto.min.js" integrity="sha256-vrn14y7WH7zgEElyQqm2uCGSQrX/xjYDjniRUQx3NyU=" crossorigin="anonymous"></script>

    self.define = function (name, deps, creator, callback) {
      if(0){
        console.log("amd.define() see", name, deps, creator, document.currentScript);

        if(typeof(name)=="string"){
          // define("name", [deps], function(){}) 
        } else {
          // define([deps], function(){}) 
          creator = deps ;
          deps = name;
        }
      }

      console.log("amd.define() use", name, deps, creator);
      if(typeof(creator)=="string" && creator.match(/^https?:|\//)){
        var src = creator;  // TODO:
        if(!src.match(/^https?:/)){
          if(import.meta){
            src = import.meta.url.replace(/[^\/]+$/, src);
            console.log("rewrite src", src);
          }
        }
        creator = function(){
          return self.load(name, null, src, callback);
        };
      }

      deps = deps || [];

      this.modules[name] = {
        name: name,
        deps: deps,
        create: creator,
        value: null,
        ready: false,

        load: function(){
          var modules = this.deps.map(function(m){
            return self.modules[m].load();
          });
          if(this.ready){
            return Promise.resolve(this.value);
          }else if(this.promise){
            console.log("reuse module load", name);
            return this.promise;
          }else{
            var module = this;
            console.log("load module", module, modules);
            this.promise = new Promise(function(resolve, reject){
              Promise.all(modules).then(function(){
                Promise.resolve(module.create()).then(function(value){;
                  module.value = value; 
                  module.ready = true;
                  resolve(value);
                });
              });
            });
            return this.promise;
          }
        }
      };

      // TODO:lazy load
      if(0){
        this.modules[name].load();
      }

      return;
    };

    self.load = function(name, deps, src, callback, integrity) {
       console.log("fetch resource", name, src);
       var defer; 
       if(deps===true){
          defer = true;
          deps = [];
       } else {
          defer = false;
          deps = deps || [];
       }
       deps = typeof(deps)=="string"?deps.trim().split(/\s+/):deps;

       src = src || name;

       return new Promise(function(resolve, reject){
           var modules = deps.map(function(m){return self.modules[m];});

	      function onload(){ if(callback) callback(); resolve(); };

              if(src.match(/\.css$/)){
                var css  = document.createElement('link');
                css.rel  = "stylesheet"; 
                css.href = src;
                css.onload = onload;
		document.head.append(css);
              } else {
		  let script = document.createElement('script');
		  script.src = src;
                  if(src.match(/#module/)){
                    script.type = "module";
                  }

                  if(defer){
		    script.defer = true;
		    script.async = false;
                  }else{
		    script.async = true;
		    script.defer = false;
                  }

		  if(integrity){
		    script.integrity=integrity;
		    script.setAttribute("crossorigin","anonymous");
		  }
		  document.head.append(script);
		  script.onload = onload;
              }
       });
    }; // end .load()

    self.require = function(deps, setup){
        deps = deps || [];
        deps = typeof(deps)=="string"?deps.trim().split(/\s+/):deps;
        console.log("require", deps);

        var modules = deps.map(function(m){
          if(!self.modules[m] && m.match(/^https?:|\//)){
            var src = m;
            self.define(m, null, src);
          }
          if(!self.modules[m]){
            console.error("unknown module", m);
          }
          return self.modules[m].load();
        });

        Promise.all(modules).then(setup);
    }

    self.debounce = function(func, delay){
      var timer;
      return function(){
        if(timer) clearTimeout(timer);
        timer = setTimeout(func, delay);
      }
    }

    self.unwrap = function(el, init){
        let dom = el.firstElementChild;
        let widget = el.parentElement.replaceChild(dom, el);
        return init(dom); 
    }

    self.toggle = function(element, show){
      if(typeof(element)=="string"){
	element = document.querySelector(element);
      }

      if(element==null) return;

      if(show==="class"){
         [element.className, element.dataset.class] = [element.dataset.class, element.className]; 
         return;
      }

      var style = element.style;
      style.display=(show===true || show!==false && style.display=='none')?'unset':'none';
    };

    return self;
}(window));
