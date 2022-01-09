Simulate docstrip with expander
===============================

To simulate `docstrip`, we can define brackets as below

```
docstrip-expander setbrackets "\n%" "\n"
```

The directive in docstrip become macros in expander. But the macro names is dynamic, not fixed.

Fortunately, expander support user defined `evelcmd`. So, the solution would look like below:

```
docstrip-expander evalcmd literate-docstrip-evalcmd

proc literate-docstrip-evalcmd {macro} {
  switch -glob -- $macro {
    "<\\**>" {
      set name [string trim $macro "<*>"]
      $expander cpush $name
      return
    } "</*>" {
      set name [string trim $macro "</>"]
      set text [$expander cpop $name]

      if {[docstrip-expr $name]} {
        return $text
      } else {
        return ""
      }
    }
  } 
}
```

## docstrip expression

`docstrip-expr` is used to evaluate docstrip expression. 

With Tcl, we can convert it into a Tcl expression and use `expr` to evaluate the result.

One challenge is how to hanle the terminal not defined. We have two choice.

```tcl
proc docstrip-expr {docstrip_expr} {
    try {
      expr $docstrip_expr
      return 1
    } trap {TCL READ VARNAME} {} {
      return 0
    }
}
```


### %<*tcltest>

```tcl
package require tcltest
tcltest::configure -verbose "start"
```

### %<*test-trap-read-variable>
```tcl
tcltest::test "trap-read-unknown-variable" "read unknown plain variable" {
    try {
      set a 1
      expr {$a && $b}
    } trap {TCL LOOKUP VARNAME} {} {
      puts $::errorCode
      set ::errorCode
    }
} "TCL LOOKUP VARNAME b"

tcltest::test "trap-read-unknown-array-element" "read unknown array element" {
    try {
      set a 1
      array set arr {}
      expr {$a && $arr(b)}
    } trap {TCL READ VARNAME} {} {
      puts $::errorCode
      set ::errorCode
    }
} "TCL READ VARNAME"
```

Another choice is using `trace` to set missing terminal value to false.

```tcl
trace add variable docstrip_vars read [list docstrip-terminal]

proc docstrip-terminal {*terminal_vars name args} {
  upvar ${*terminal_vars} terminal_vars

  if ![info exist terminal_vars($name)] {
    set terminal_vars($name) 0
    return 0
  } else {
    return 1
  }
}
```

## literate-docstrip


First, let's start from the entry point proc `literate-docstrip`

```tcl
proc literate-docstrip {text terminals args} {
  set result [docstrip-expander expand $text]
  return $result
}
```
