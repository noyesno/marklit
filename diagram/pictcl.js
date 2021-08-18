import TclInterp from './tcl.js';

let svg_anchor;
let svg_stack;
 
let PicSVG = {
  layout:{
    direction: "right"
  },
  svg_stack: [],

  reset: function(){
    this.layout.direction = "right";
  },

  place: function(direction, anchor){
    var prev_end, self_start;
    switch(direction){
      case "right" :
        prev_end   = anchor.east;
        self_start = "west"; 
        break;
      case "left" :
        prev_end   = anchor.west;
        self_start = "east"; 
        break;
      case "up" :
        prev_end   = anchor.north;
        self_start = "south"; 
        break;
      case "down" :
        prev_end   = anchor.south;
        self_start = "north"; 
        break;
    }
    if(anchor.end) {
      prev_end = anchor.end;
    }else if(!prev_end && anchor.center){
      prev_end = anchor.center;
    } 
    return [prev_end, self_start];
  },

  createElement: function(name, attrs){
    var xmlns = "http://www.w3.org/2000/svg";

    var svgElm = document.createElementNS(xmlns, name);
    if(attrs){
      for(var k in attrs){
        var value = attrs[k];
        if(value===null || value===undefined) continue;
        svgElm.setAttributeNS(null, k, value);
      }
    }
    return svgElm;
  },
  createText: function(attrs){
     attrs = Object.assign({
       stroke: "none",
       "text-anchor": "middle",
       "dominant-baseline":"middle",
     }, attrs);

     return this.createElement("text", attrs);
  },
  measureText: function(text, svg) {
    var svgElement = PicSVG.createElement("text");
    svgElement.textContent = text;

    svg.appendChild(svgElement);

    var bbox = svgElement.getBBox();

    svgElement.parentNode.removeChild(svgElement);

    return bbox;
  },
  locateObject: function(id, svg_stack){
    var toks = id.split(/\s+/);
    // console.log("locate diagram object", id, toks);
    id = toks.pop();
    var nth = toks.shift() || 1;
    nth = parseInt(nth); 

    // console.log("locate diagram object", id, toks);
    var loop_start, loop_stop, loop_step;
    if(toks[0]=="last"){
      loop_start = svg_stack.length - 1;
      loop_stop  = -1;
      loop_step  = -1; 
    }else{
      loop_start = 0;
      loop_stop  = svg_stack.length;
      loop_step  = 1; 
    }

    var obj_from;
    var count=0;
    for(loop_start; loop_start!=loop_stop; loop_start += loop_step){
      var item = svg_stack[loop_start];
      if(item.id == id || item.type==id){
        count++;
        // console.log("locate diagram object check", loop_start, count, item);
        if(nth>0 && count == nth){
          // console.log("locate diagram object found", loop_start, count, item);
          obj_from = item;
          break;
        }
      }
    }
    return obj_from;
  }
}

let tcl = new TclInterp();
tcl.eval("set abc 123");


let PicTcl = {
  args_text: function(args){
    for(var i=1, n=args.length; i<n; i++){
      if(args[i].content[0] != "-"){
        return args[i].content;
      } else {
        i++;
      }
    }
  },

  args_exist: function(args, name){
    for(var arg of args){
      if(arg.content == name) return true;
    }
    return false;
  },

  args_value: function(args, name, value){
    for(var i=1, n=args.length; i<n; i++){
      if(args[i].content == name) {
        value = args[i+1].content;
        break;
      }
    }
    return value;
  },
  args_index: function(args, name){
    for(var i=1, n=args.length; i<n; i++){
      if(args[i].content == name) {
        return i;
      }
    }
    return 0;
  }
}

tcl.registerCommand("box", function(interp, args){
  var anchor = svg_stack.top();
  console.debug("draw box at", anchor);
  var ox, oy;

  var cx, cy, rx, ry;
  var text = PicTcl.args_text(args);
  var ipadx = 12, ipady = 8;

  rx = 60;
  ry = 50;

  var textBox = PicSVG.measureText(text, svg);
  console.log("textBox", textBox);
  if(PicTcl.args_exist(args, "-compact")){
    rx = Math.ceil(textBox.width/2)  + ipadx;
    ry = Math.ceil(textBox.height/2) + ipady;
  }else{
    rx = Math.ceil(textBox.width/2)  + ipadx;
    ry = Math.ceil(textBox.height*3.2/2) + ipady;
  }

  var padx = parseInt(PicTcl.args_value(args, "-padx", 0));
  var pady = PicTcl.args_value(args, "-pady", 0);

  var direction = PicSVG.layout.direction;
  var [prev_end, self_start] = PicSVG.place(direction, anchor);


  switch(self_start){
    case "west": 
      cx = prev_end.x + rx + padx;
      cy = prev_end.y;
      break;
    case "east": 
      cx = prev_end.x - rx - padx;
      cy = prev_end.y;
      break;
    case "north": 
      cx = prev_end.x;
      cy = prev_end.y + ry + pady;
      break;
    case "south": 
      cx = prev_end.x;
      cy = prev_end.y - ry - pady;
      break;
  }

  var attr_stroke = PicTcl.args_value(args, "-stroke");
  var attr_fill   = PicTcl.args_value(args, "-fill");
  var shape_attrs = {
    x: cx-rx, y: cy-ry, width: rx*2, height: ry*2,
    "stroke-width": 2,
    fill: "none",
  };

  if(attr_stroke){
     shape_attrs.stroke = attr_stroke;
  }
  if(attr_fill){
     shape_attrs.fill   = attr_fill;
  }

  var shape = PicSVG.createElement("rect", shape_attrs);

  svg.appendChild(shape);

  if(text){
     var svg_text = PicSVG.createText({x:cx, y:cy});
     svg_text.textContent = text;
     svg.appendChild(svg_text);
  }

  if(PicTcl.args_exist(args,"-dashed")){
    shape.setAttribute("stroke-dasharray", "6");
  }

  var new_anchor = {}; // Object.assign({}, anchor);
  new_anchor.type  = "box";
  new_anchor.east  = {x: cx+rx, y: cy};
  new_anchor.west  = {x: cx-rx, y: cy};
  new_anchor.south = {x: cx, y: cy+ry};
  new_anchor.north = {x: cx, y: cy-ry};
  svg_stack.push(new_anchor);
});
tcl.registerCommand("cell", tcl.getCommand("box").func);



tcl.registerCommand("line", function(interp, args){
  var shape_type = args[0].content;
  var anchor = svg_stack.top();
  console.log("line", anchor);
  var ox, oy;

  var cx, cy, rx, ry;
  var direction = PicTcl.args_value(args, "-flow") || PicSVG.layout.direction;

  rx = 30;
  ry = 30;

  var padx = parseInt(PicTcl.args_value(args, "-padx", 0));
  var pady = PicTcl.args_value(args, "-pady", 0);

  var x_scale = 1, y_scale = 1;

  var anchor_start, anchor_end;

  var [prev_end, self_start] = PicSVG.place(direction, anchor);
  anchor_start = prev_end;
  var arg_from = PicTcl.args_value(args, "-from");
  var arg_to   = PicTcl.args_value(args, "-to");
  if(arg_from){
    var [id_from, anchor_from="center"] = arg_from.split('.');
    var obj_from = PicSVG.locateObject(id_from, svg_stack);
    anchor_start = obj_from[anchor_from];


    if(arg_to){
      var [id_to,   anchor_to="center"]   = arg_to.split('.');
      var obj_to   = PicSVG.locateObject(id_to, svg_stack);
      console.log("obj_from", obj_from, "obj_to", obj_to); 
      anchor_end   = obj_to[anchor_to];
      // layout = "none";
    }
  }
  prev_end = anchor_start;



  switch(self_start){
    case "west": 
      cx = prev_end.x + rx + padx;
      cy = prev_end.y;
      ry = 0;
      break;
    case "east": 
      cx = prev_end.x - rx - padx;
      cy = prev_end.y;
      ry = 0;
      x_scale = -1;
      break;
    case "north": 
      cx = prev_end.x + padx;
      cy = prev_end.y + ry + pady;
      rx = 0;
      break;
    case "south": 
      cx = prev_end.x;
      cy = prev_end.y - ry - pady;
      rx = 0;
      y_scale = -1;
      break;
  }

  var x1, x2, y1, y2;
  if(anchor_end){
      x1 = anchor_start.x + padx;
      y1 = anchor_start.y + pady ;
      x2 = anchor_end.x + padx;
      y2 = anchor_end.y + pady;
  
  }else{ 
      x1 = cx-rx*x_scale;
      y1 = cy-ry*y_scale;
      x2 = cx+rx*x_scale;
      y2 = cy+ry*y_scale;
  }

  var shape;

  if(shape_type.match(/arrow|line/)){
    // ...
    shape = PicSVG.createElement("line", {
      x1: x1, y1: y1, x2: x2, y2: y2,
      fill: "none",
    });  
  } else {
    shape = PicSVG.createElement("path", {
      d: `M ${x1} ${y1} L ${cx} ${cy} L ${x2} ${y2}`, 
      fill: "none",
    });  
  }

  if(shape_type=="arrow"){
    switch(PicTcl.args_value(args, "-arrow")){
      case "start": case "<-":
        shape.setAttributeNS(null, "marker-start", "url(#triangle)");
        break; 
      case "end": case "->":
      default:
        shape.setAttributeNS(null, "marker-end", "url(#triangle)");
    }
  }else if(shape_type=="wire"){
    if(PicTcl.args_exist(args, "-diode")){
      shape.setAttributeNS(null, "marker-mid", "url(#diode)");
    } else if(PicTcl.args_exist(args, "-resistor")){
      shape.setAttributeNS(null, "marker-mid", "url(#resistor)");
    }
  }

  if(PicTcl.args_exist(args,"-dashed")){
    shape.setAttribute("stroke-dasharray", "6");
  }

  svg.appendChild(shape);

  var new_anchor = {}; // Object.assign({}, anchor);
  new_anchor.type  = shape_type;
  new_anchor.east  = {x: cx+rx, y: cy};
  new_anchor.west  = {x: cx-rx, y: cy};
  new_anchor.south = {x: cx, y: cy+ry};
  new_anchor.north = {x: cx, y: cy-ry};
  new_anchor.end   = {x: cx+rx*x_scale, y: cy+ry*y_scale};
  PicSVG.layout.direction = direction;  // TOOD
  svg_stack.push(new_anchor);

  var text = PicTcl.args_text(args);
  if(text){
     var text_x = cx, text_y = cy;
     var text_valign = null;
     if(PicTcl.args_exist(args, "-below")) {
       text_x = new_anchor.south.x;
       text_y = new_anchor.south.y;
       text_valign = "hanging";
     }
     // hanging
     var svg_text = PicSVG.createText({x:text_x, y:text_y, "dominant-baseline":text_valign});
     svg_text.textContent = text;
     svg.appendChild(svg_text);
  }

});

tcl.registerCommand("arrow", tcl.getCommand("line").func);
tcl.registerCommand("wire",  tcl.getCommand("line").func);



tcl.registerCommand("circle", function(interp, args){
  var anchor = svg_stack.top();
  console.log(anchor);
  var ox, oy;

  var cx, cy, cr;
  var direction = PicTcl.args_value(args, "-flow") || PicSVG.layout.direction;

  cr = PicTcl.args_value(args, "-size") || 50;
  cr = parseInt(cr);

  var padx = parseInt(PicTcl.args_value(args, "-padx", 0));
  var pady = parseInt(PicTcl.args_value(args, "-pady", 0));
  var fill_color = "none";

  var is_dot = (args[0].content=="dot");

  if(is_dot){
    cr = 3;
    fill_color = "black";
  }

  var [prev_end, self_start] = PicSVG.place(direction, anchor);

  switch(self_start){
    case "west":
      cx = prev_end.x + cr + padx;
      cy = prev_end.y;
      break;
    case "east":
      cx = prev_end.x - cr - padx;
      cy = prev_end.y;
      break;
    case "north":
      cx = prev_end.x + padx;
      cy = prev_end.y + cr + pady;
      break;
    case "south":
      cx = prev_end.x + padx;
      cy = prev_end.y - cr - pady;
      break;
  }

  var color_stroke = PicTcl.args_value(args, "-color");
  if(color_stroke){
    if(is_dot){
      fill_color = color_stroke;
    }
  }

  var circle = PicSVG.createElement("circle", {
    cx: cx, cy: cy, r: cr,
    fill: fill_color,
    "stroke-width": 2
  });  

  if(PicTcl.args_exist(args,"-dashed")){
    circle.setAttribute("stroke-dasharray", "6");
  }

  svg.appendChild(circle);

  var text = PicTcl.args_text(args);
  if(text){
     var svg_text = PicSVG.createText({ x:cx, y:cy });
     svg_text.textContent = text;
     if(color_stroke){
       svg_text.setAttribute("fill", color_stroke);
     }
     svg.appendChild(svg_text);
  }

  var new_anchor = {}; // Object.assign({}, anchor);
  new_anchor.type  = "circle";
  new_anchor.east   = {x: cx+cr, y: cy};
  new_anchor.west   = {x: cx-cr, y: cy};
  new_anchor.south  = {x: cx,    y: cy+cr};
  new_anchor.north  = {x: cx,    y: cy-cr};
  new_anchor.center = {x: cx, y: cy};
  new_anchor.ne     = {x: cx+cr*Math.cos(Math.PI/4), y: cy-cr*Math.cos(Math.PI/4)};
  new_anchor.nw     = {x: cx-cr*Math.cos(Math.PI/4), y: cy-cr*Math.cos(Math.PI/4)};

  var shape_id = PicTcl.args_value(args,"-id");
  if(shape_id) new_anchor.id = shape_id;

  svg_stack.push(new_anchor);
});
tcl.registerCommand("dot", tcl.getCommand("circle").func);


tcl.registerCommand("move", function(interp, args){
  var anchor = svg_stack.top();
  var gap = 20;

  var new_anchor = {}; // Object.assign({}, anchor);

  var direction = PicSVG.layout.direction;
  if(PicTcl.args_exist(args, "-down")){
    direction = "down";
  }else if(PicTcl.args_exist(args, "-up")){
    direction = "up";
  }else if(PicTcl.args_exist(args, "-left")){
    direction = "left";
  }else if(PicTcl.args_exist(args, "-right")){
    direction = "right";
  }

  console.log("move", args);
  switch(direction){
    case "down":
      console.log("move down");
      new_anchor.center = anchor.south;
      new_anchor.center.y += gap;
      PicSVG.layout.direction = "down";
      break;
    case "up":
      console.log("move up");
      new_anchor.center = anchor.north;
      new_anchor.center.y -= gap;
      PicSVG.layout.direction = "up";
      break;
    case "left":
      new_anchor.center = anchor.west;
      new_anchor.center.x -= gap;
      PicSVG.layout.direction = "left";
      break;
    case "right":
      new_anchor.center = anchor.east;
      new_anchor.center.x += gap;
      PicSVG.layout.direction = "right";
      break;
  }


  svg_stack.push(new_anchor);
});

tcl.registerCommand("layout", function(interp, args){
  var anchor = svg_stack.top();
  var gap = 20;

  var cmdname = args[0].content;
  switch(cmdname){
     case "down":
       PicSVG.layout.direction = "down";   
       break;
     case "up":
       PicSVG.layout.direction = "up";   
       break;
     case "left":
       PicSVG.layout.direction = "left";   
       break;
     case "right":
       PicSVG.layout.direction = "right";   
       break;
     default:
       // TODO: unknown
       break;
  }
});
tcl.registerCommand("down", tcl.getCommand("layout").func);
tcl.registerCommand("left", tcl.getCommand("layout").func);
tcl.registerCommand("right", tcl.getCommand("layout").func);
tcl.registerCommand("up", tcl.getCommand("layout").func);

function PicDiagram(el, pictcl_code){
  svg_anchor = {
    flow: 'right',
    east:  {x:0, y:0},
    south: {x:0, y:0},
    west:  {x:0, y:0},
    north: {x:0, y:0},
  };
  
  svg_stack = [svg_anchor];
  svg_stack.top = function(){
    return this[this.length-1];
  };
  PicSVG.reset();

  var svg;

  if(typeof(el)=="string"){
    el = document.querySelector(el);
  }

  if(el.tagName=="CODE"){
    var newsvg = PicSVG.createElement("svg");
    var preNode = el.parentElement;
    var figure = document.createElement("figure");
    preNode.parentElement.replaceChild(figure, preNode);
    figure.appendChild(newsvg);
    figure.appendChild(preNode);
    svg = newsvg; 
    pictcl_code = pictcl_code || el.textContent;
    preNode.style.display = 'none';
    svg.addEventListener('dblclick', function(){
      if(preNode.style.display == 'none'){
        preNode.style.display = 'block';
      }else{
        preNode.style.display = 'none';
      }
    });
  }else{
    svg = el;
    pictcl_code = pictcl_code || el.parentElement.querySelector("script[type='text/pictcl']").text;
  }

  svg.setAttribute("stroke", "black");

  window.svg = svg;
  tcl.eval(pictcl_code);

  var padx= 16, pady=16;

  var svgbox = svg.getBBox();
  svgbox.x      -= padx;
  svgbox.width  += padx*2;
  svgbox.y      -= pady;
  svgbox.height += pady*2;

  svg.setAttribute("viewBox", [svgbox.x, svgbox.y, svgbox.width, svgbox.height].join(' '));
  svg.setAttribute("width",  svgbox.width);
  svg.setAttribute("height", svgbox.height);
}


export default PicDiagram;
export {PicSVG};
