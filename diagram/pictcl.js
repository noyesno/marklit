PicSVG = {
  createElement: function(name, attrs){
    var xmlns = "http://www.w3.org/2000/svg";

    var svgElm = document.createElementNS(xmlns, name);
    if(attrs){
      for(var k in attrs){
        svgElm.setAttributeNS(null, k, attrs[k]);
      }
    }
    return svgElm;
  },

  measureText: function(text, svg) {
    var svgElement = PicSVG.createElement("text");
    svgElement.textContent = text;

    svg.appendChild(svgElement);

    var bbox = svgElement.getBBox();

    svgElement.parentNode.removeChild(svgElement);

    return bbox;
  }
}

tcl = new TclInterp();
tcl.eval("set abc 123");


PicTcl = {
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
  }
}

tcl.registerCommand("box", function(interp, args){
  var anchor = svg_stack.top();
  console.log(anchor);
  var ox, oy;

  var cx, cy, rx, ry;
  var direction = anchor.flow;
  var text = PicTcl.args_text(args);
  var ipadx = 12, ipady = 8;

  rx = 50;
  ry = 30;

  var textBox = PicSVG.measureText(text, svg);
  console.log("textBox", textBox);
  rx = Math.ceil(textBox.width/2)  + ipadx;
  ry = Math.ceil(textBox.height/2) + ipady;

  var padx = parseInt(PicTcl.args_value(args, "-padx", 0));
  var pady = PicTcl.args_value(args, "-pady", 0);

  switch(direction){
    case "east": case "right":
      ox = anchor.east.x;
      oy = anchor.east.y;
      cx = ox + rx + padx;
      cy = oy;
      break;
    case "west": case "left":
      ox = anchor.west.x;
      oy = anchor.west.y;
      cx = ox - rx - padx;
      cy = oy;
      break;
    case 'down': case 'south':
      ox = anchor.south.x;
      oy = anchor.south.y;
      cx = ox;
      cy = oy+ry;
      break;
    case 'up': case 'north':
      ox = anchor.north.x;
      oy = anchor.north.y;
      cx = ox;
      cy = oy-ry;
      break;
  }

  var attr_stroke = PicTcl.args_value(args, "-stroke");
  var attr_fill   = PicTcl.args_value(args, "-fill");
  var shape_attrs = {
    x: cx-rx, y: cy-ry, width: rx*2, height: ry*2,
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
     var svg_text = PicSVG.createElement("text", {
       x:cx, y:cy,
       "text-anchor": "middle",
       "dominant-baseline":"middle",
     });
     svg_text.textContent = text;
     svg.appendChild(svg_text);
  }

  var new_anchor = Object.assign({}, anchor);
  new_anchor.east  = {x: cx+rx, y: cy};
  new_anchor.west  = {x: cx-rx, y: cy};
  new_anchor.south = {x: cx, y: cy+ry};
  new_anchor.north = {x: cx, y: cy-ry};
  svg_stack.push(new_anchor);
});



tcl.registerCommand("line", function(interp, args){
  var anchor = svg_stack.top();
  console.log("line", anchor);
  var ox, oy;

  var cx, cy, rx, ry;
  var direction = PicTcl.args_value(args, "-flow") || anchor.flow;

  rx = 30;
  ry = 30;

  var padx = parseInt(PicTcl.args_value(args, "-padx", 0));
  var pady = PicTcl.args_value(args, "-pady", 0);

  var x_scale = 1, y_scale = 1;

  switch(direction){
    case "east": case "right":
      ox = anchor.east.x;
      oy = anchor.east.y;
      cx = ox + rx + padx;
      cy = oy;
      ry = 0;
      break;
    case "west": case "left":
      ox = anchor.west.x;
      oy = anchor.west.y;
      cx = ox - rx - padx;
      cy = oy;
      ry = 0;
      x_scale = -1;
      break;
    case 'down': case 'south':
      ox = anchor.south.x;
      oy = anchor.south.y;
      cx = ox;
      cy = oy+ry;
      rx = 0;
      break;
    case 'up': case 'north':
      ox = anchor.north.x;
      oy = anchor.north.y;
      y_scale = -1;
      cx = ox;
      cy = oy-ry;
      rx = 0;
      break;
  }

  var shape = PicSVG.createElement("line", {
    x1: cx-rx*x_scale, y1: cy-ry*y_scale, 
    x2: cx+rx*x_scale, y2: cy+ry*y_scale, 
    fill: "none",
  });  

  if(args[0].content=="arrow"){
    shape.setAttributeNS(null, "marker-end", "url(#triangle)");
  }

  svg.appendChild(shape);

  var text = PicTcl.args_text(args);
  if(text){
     var svg_text = PicSVG.createElement("text", {
       x:cx, y:cy,
       "text-anchor": "middle",
       "dominant-baseline":"middle",
     });
     svg_text.textContent = text;
     svg.appendChild(svg_text);
  }

  var new_anchor = Object.assign({}, anchor);
  new_anchor.east  = {x: cx+rx, y: cy};
  new_anchor.west  = {x: cx-rx, y: cy};
  new_anchor.south = {x: cx, y: cy+ry};
  new_anchor.north = {x: cx, y: cy-ry};
  new_anchor.flow  = direction;
  svg_stack.push(new_anchor);
});

tcl.registerCommand("arrow", tcl.getCommand("line").func);



tcl.registerCommand("circle", function(interp, args){
  var anchor = svg_stack.top();
  console.log(anchor);
  var ox, oy;

  var cx, cy, cr;
  var direction = anchor.flow;

  cr = 50;

  var padx = parseInt(PicTcl.args_value(args, "-padx", 0));
  var pady = PicTcl.args_value(args, "-pady", 0);

  switch(direction){
    case "east": case "right":
      ox = anchor.east.x;
      oy = anchor.east.y;
      cx = ox + cr + padx;
      cy = oy;
      break;
    case 'down': case 'south':
      ox = anchor.south.x;
      oy = anchor.south.y;
      cx = ox;
      cy = oy+cr;
      break;
  }

  var circle = PicSVG.createElement("circle", {
    cx: cx, cy: cy, r: cr,
    fill: "none",
  });  

  svg.appendChild(circle);

  var text = PicTcl.args_text(args);
  if(text){
     var svg_text = PicSVG.createElement("text", {
       x:cx, y:cy,
       "text-anchor": "middle",
       "dominant-baseline":"middle",
     });
     svg_text.textContent = text;
     svg.appendChild(svg_text);
  }

  var new_anchor = Object.assign({}, anchor);
  new_anchor.east  = {x: cx+cr, y: cy};
  new_anchor.south = {x: cx, y: cy+cr};
  svg_stack.push(new_anchor);
});


tcl.registerCommand("move", function(interp, args){
  var anchor = svg_stack.top();
  var gap = 20;

  var new_anchor = Object.assign({}, anchor);

  console.log("move", args);
  if(PicTcl.args_exist(args, "-down")){
    console.log("move down");
    new_anchor.south.y += gap;
    new_anchor.flow = 'down';
  }else if(PicTcl.args_exist(args, "-right")){
    new_anchor.east.x += gap;
    new_anchor.flow = 'right';
  }else{
    new_anchor.east.x += gap;
  }


  svg_stack.push(new_anchor);
});

function PicDiagram(svg, pictcl_code){
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


  window.svg = svg;
  var pictcl_code = svg.parentElement.querySelector("script[type='text/pictcl']").text;
  tcl.eval(pictcl_code);

  var padx= 10, pady=10;

  var svgbox = svg.getBBox();
  svgbox.x      -= padx;
  svgbox.width  += padx*2;
  svgbox.y      -= pady;
  svgbox.height += pady*2;

  svg.setAttribute("viewBox", [svgbox.x, svgbox.y, svgbox.width, svgbox.height].join(' '));
  svg.setAttribute("width", svgbox.width);
  svg.setAttribute("height", svgbox.height);
}

