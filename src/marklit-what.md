Marklit & Literate Programming
==============================

## Literate Programming

  * http://literateprogramming.com/

Usually, people write code for computer, and use comment to write for human reading.

With Literate Programming, people start from writing text, and embed code into the text. And later generate source code and docs from the writing. 

## web & noweb

It's interesting that the utility for literate programming is named "WEB" - not the "Web" for internet.

`web` is for Pasal language; `cweb` - named after `web` is for C/C++.

Later, `noweb` is developed for simplicity, extensibility and language-independence.

## tangle & weave

  * `tangle` 
    - Generate source code
    - `"twist together or entwine into a confusing mass"`
  * `weave`  
    - Generate documentation

It's interesting that the word /tangle/ implies the generated code is "a confusing mass".
While the word /weave/ implies the generated document is carefully organized.

## noweb Syntax

  * noweb - https://www.cs.tufts.edu/~nr/noweb/
    - https://github.com/nrnrnr/noweb


```noweb
start text block

<<hello code>>=
code block

@
text block

<<main>>=
  main code block 
  <<hello code>>
  above line reference the named code block

@
```

## nuweb

  * nuweb - https://github.com/nrnrnr/noweb

With /noweb/, inside a code block, the only tricky part is include another code block.

/nuweb/ goes a little further, by allowing calling a user defined macro inside a code block.

With this design, code block can be seen as a template language. This certainly provide more flexibility.

/nuweb/ also support directive to write a code block into a specified file. With this feature, generating whole source code file tree becomes possible. Even /noweb/ still only allow writing all the generated code into stdout - user can save it into a file with command line option or IO redirect.

The ability of output multiple files actually turn /nuweb/ input file into a database. LeoEditor and Holo extend this usage model.

## Leo Editor

  * Leo - http://leoeditor.com/


## docstrip usage model

`docstrip` by default keep top level text, so we can say it start from a source code file and generate a new source code file - with some lines stripped away.

So we can say its usage model would be:

  1. strip out useful info from source code file to "protect" the intelectual property. 
  2. behaves like `#if ... #endif` as a preprocessor 

So strictly speacking, docstrip is not a literal programming tool.

On the other hand, if we change the behavior to by default suppress top level text, it can play like a literate programming tool. 

## docstrip & Markdown

If we write docstrip file top level text with - for example - Markdown text, we can easily by default get a documentation - by run `docstrip` without a terminal. And get source code by providing one ore more terminals.


## docstrip Syntax


```
%<<DOCSTRIP-TEXT
%<*foo>
  set a 123
%<*bar>
  set b 456
%</bar>
%</foo>

% docstrip plain text
%% meta comment - code comment line

%<+foo> set c 789
%<-bar> set d 987
%DOCSTRIP-TEXT
```

  * `%<*foo>` and `%</foo>` - code block
    * `%<*!foo>`
    * `%<*foo|bar>`
    * `%<*foo&bar>`
  * `%<+foo>` and `%<-foo>` - one line code
    * `%<+foo>` - semantically like `%<*foo>`
    * `%<-foo>` - semantically like `%<*!foo>`
    * Essentially just a syntax sugar of code block.

```tcl
docstrip::extract $text $terminals {*}$options
```

The docstrip syntax, we can say it's a mix of directive macro and plain text.

## C/C++ Preprocess

Semantically, for the code block part, we can do the same with C/C++ preprocessor.

```c
#if foo
  set a 123
  #if bar
  set b 456
  #endif
#endif
```

It can be preprocessed with below `gcc` command:

```
gcc -Dfoo -E input_file
```

  * option `-E` stands for preprocess only

## expander

Tcl package `expander` is designed to process macros in text. It can be used to simulate `docstrip`.

```
[foo]
set a 123
[bar]
set b 456
[/bar]
[/foo]
```

With `expander`, 

  * `[foo]`  -> `proc foo`
  * `[/foo]` -> `proc /foo`

Char `[` and `]` is used to mark start and end of expander macro.

## Simulate docstrip with expander

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

%<*tcltest>
package require tcltest
tcltest::configure -verbose "start"
%</tcltest>

%<*test-trap-read-variable>
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
%</test-trap-read-variable>

Another choice is using `trace` to set missing terminal value to false.

```
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
