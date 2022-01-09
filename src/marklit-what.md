Marklit & Literate Programming
==============================

## Literate Programming

  * http://literateprogramming.com/

Usually, programmer write code for computer to compile or execute, and use comments embeded in code to write for human to read.

With Literate Programming, people start from writing text, and embed code into the text. And later generate source code and docs from the writing. 


> Literate programming is the art of preparing programs for human readers. 
> -- noweb

## web & noweb

It's interesting that the utility for literate programming is named "WEB" - not the "Web" for internet.

`web` is for Pasal language; `cweb` - named after `web` is for C/C++.

Later, `noweb` is developed for simplicity, extensibility and language-independence.

## tangle & weave

  * `tangle` - 缠成一团
    - Generate source code
    - `"twist together or entwine into a confusing mass"`
  * `weave` - 编织 
    - Generate documentation

It's interesting that the word /tangle/ implies the generated code is "a confusing mass".
While the word /weave/ implies the generated document is carefully organized.

[noweb-hacker-guide] : https://www.cs.tufts.edu/~nr/noweb/guide.html
[nuweb] : https://www.cs.tufts.edu/~nr/noweb/nuweb.html

## noweb Syntax

  * noweb - https://www.cs.tufts.edu/~nr/noweb/
    - https://github.com/nrnrnr/noweb
  * [The noweb Hacker's Guide][noweb-hacker-guide]


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

  * nuweb - http://nuweb.sourceforge.net/
    * https://github.com/sosterwalder/nuweb
  * [nuweb User's Guide (v1.60)](http://nuweb.sourceforge.net/nuwebdoc.pdf)
  * [nuweb source/document](http://nuweb.sourceforge.net/nuweb.pdf)
  * [nuweb 0.87b Document](https://www.cs.tufts.edu/~nr/noweb/nuweb.html)

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

## Obsidian

 * Obsidian - https://obsidian.md/
 * on top of a local folder of Markdown files.
 * graph view
 * backlink

