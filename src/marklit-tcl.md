Marklit - Markdown + Literate Programming
=========================================
+ keyword:  expander
+ language: tcl vim

"marklit" start with the idea of implement Literate Programming using markdown as markup for text.

For the code part, there are some possible choices on the markup syntax.

  1. Using Markdown code block
  2. Using [docstrip][] style
  3. Using [noweb][] style


``` @<block name@>
  <<use-other-chunk>>
```


## Markdown




### Inline Format

  * link - `[Link Text](link-url)` -> [Link Text](https://www)
  * code - `inline code`




  * http://www.wjduquette.com/expand

``` javascript hello
//set abc 123;
function def(){}
```

## Tclsh Hashbang

### %<=tclsh-hashbang>

```tcl
#!/usr/bin/env tclsh

set bin_dir [file dir [file normalize [info script]]]
set lib_dir [file join [file dir $bin_dir] lib]

tcl::tm::path add $lib_dir
```


## Expander

###  <=package-expander>

```tcl
package require TclOO
package provide expander

oo::class create expander {
  constructor {} {
      my variable context
      array set context {}
  }

  <<expander-cpush>>
  <<expander-cpop>>
  <<expander-cappend>>
  <<expander-cname>>

  <<expander-cset>>
  <<expander-cget>>

  <<expander-registry>>

  <<expander-textcmd>>

  self method expand {args} {
     set expander [expander new]
     set result [$expander expand {*}$args]
     $expander destroy
     return $result
  }

  <<expander-expand>>
}
```


#### <=expander-cpush>

```
    method cpush {cname} {
	my variable context

	set depth [incr context(depth)]
	# puts "-- cpush $depth $cname"
	set context($depth.cname) $cname
	set context($depth.text) ""
    }
```

#### %<=expander-cpop>

```tcl
    method cpop {cname} {
	my variable context

	set depth $context(depth)
	set text $context($depth.text)
	# assert $context($depth.cname)==$cname
	array unset context $depth@*
	array unset context $depth.*
	incr context(depth) -1
	return $text
    }
```

#### %<=expander-cappend>

```tcl
    method cappend {text} {
	my variable context

	set depth $context(depth)
	append context($depth.text) $text
    }
```

#### %<=expander-cname>

```tcl
    method cname {} {
	my variable context

	set depth $context(depth)
	return $context($depth.cname)
    }
```


#### %<=expander-cset>

```tcl
    method cset {name value} {
	my variable context
	set depth $context(depth)
	set context($depth@$name) $value
    }
```

#### %<=expander-cget>

```tcl
    method cget {name {value ""}} {
	my variable context
	set depth $context(depth)
        try {
	  set value $context($depth@$name)
        } finally {
          return $value
        }
    }
```

#### %<=expander-registry>

```tcl
    method registry {act args} {
        my variable registry_dict

        switch -- $act "set" {
          lassign $args section name value
          dict set registry_dict $section $name $value
        } "get" {
          lassign $args section name
          return [dict get $registry_dict $section $name]
        }
    }
```

### %<=expander-textcmd>

```tcl
    self method textcmd {text} {
      return $text
    }
```


### %<=expander-expand>

```tcl
    method expand {ch mark_start mark_end args} {
      <<expander-expand-args>>
      <<expander-expand-init>>

      my cpush "#root"
      set state "text"
      while {[gets $ch line]>=0} {
	append line "\n"
	while 1 {
	  switch -- $state "text" {
             <<expander-expand-text>>
	  } "macro" {
             <<expander-expand-macro>>
	  }
	}
      }
      set result [my cpop "#root"]

      return $result
    }
```


```tcl
  set ch [chan create read [stringchan new $text]]
  chan close $ch
```


### %<=expander-expand-args>

```tcl
      array set kargs {
	-evalcmd "uplevel #0"
	-textcmd "expander textcmd"
      }
      array set kargs $args
```


### %<=expander-expand-init>

```tcl
      my variable context
      unset -nocomplain context
      if {$mark_end eq "\n"} {
      }
```
      
      

### %<=expander-expand-text>

```tcl
	    set pos [string first $mark_start $line]
	    if {$mark_end eq "\n" && $pos==0 || $mark_end ne "\n" && $pos>=0} {
	      # puts "-- see $mark_start"
	      set state "macro"
	      set text_slice [string range $line 0 $pos-1]
	      my cappend [{*}$kargs(-textcmd) $text_slice]
	      my cpush "@"
	      set line [string range $line $pos+[string length $mark_start] end]
	    } else {
	      my cappend [{*}$kargs(-textcmd) $line]
	      # if {$mark_end ne "\n"} {
	      # }
	      break
	    }
```

### %<=expander-expand-macro>

```tcl
	    if {$mark_end eq "\n"} {
	      set pos [string length $line]
	    } else {
	      set pos [string first $mark_end $line]
	    }
	    if {$pos>=0} {
	      set state "text"

	      set text_slice [string range $line 0 $pos-1]
	      my cappend [{*}$kargs(-textcmd) $text_slice]

	      set macro [my cpop "@"]
	      set macro_result [{*}$kargs(-evalcmd) $macro]
	      my cappend $macro_result
	      set line [string range $line $pos+[string length $mark_end] end]
	    } else {
	      my cappend [{*}$kargs(-textcmd) $line]
	      break
	    }
```


## docstrip

### %<=package-docstrip>

```

<<docstrip-package-require>>

namespace eval docstrip {

  <<docstrip-extract>>
  <<docstrip-tangle>>
  <<docstrip-tangle-f>>
  <<docstrip-tangle-x>>

  namespace export extract
  namespace export tangle
  namespace export tangle-f
  namespace export tangle-x
  namespace ensemble create
}
```

### %<=docstrip-expr>

```tcl
    proc docstrip-expr {guard_expr} {
      variable docstrip_terminals
      expr [regsub -all -- {[^()|&!]+} $guard_expr {[info exists docstrip_terminals(&)]}]
    }
```

### %<=docstrip-expand>

```tcl
  <<docstrip-expr>>

    proc docstrip-evalcmd {expander line} {
      if [regexp -- {^<([=*/+-]?)([^>]*)>(.*)$} $line - modifier guard_expr line] {
        # ...
      } elseif [regexp -- {^(@)} $line - modifier] {
        # ...
      } elseif { 0 && [regexp -- {^!\s*(.*)} $line - command]} {
        set modifier "!"
      } else {
        return
      }

      switch -- $modifier {
	"*" {
	  $expander cpush $guard_expr
          return
	}
	"=" {
	  $expander cpush $guard_expr
	  $expander cset name $guard_expr
	  $expander cset type "snippet"
          return
	}
        "@" -
	"/" {
          if {$modifier eq "@"} {
            set guard_expr [$expander cname]
          }
          set ctype  [$expander cget type]
          set cname  [$expander cget name]
	  set text [$expander cpop $guard_expr]
          switch -- $ctype "snippet" {
            $expander registry set snippet $cname $text
            return
          } default {
	    if [docstrip-expr $guard_expr] {
	      return $text
	    } else {
	      return
            }
          } ;# end switch
	}
	"+" {
	  if [docstrip-expr $guard_expr] {
	    return $line
	  }
	}
	"-" {
	  if ![docstrip-expr $guard_expr] {
	    return $line
	  }
	}
      } ;# end switch
      return
    }

```

### %<=docstrip-extract>

```tcl

    proc extract {text terminals} {
      variable docstrip_terminals
      unset -nocomplain docstrip_terminals
      foreach term $terminals {
	set docstrip_terminals($term) 1
      }
      set expander [expander new]
      set result [
        $expander expand $text "%" "\n" \
          -evalcmd [list [namespace which docstrip-evalcmd] $expander] \
          -textcmd [list [namespace which docstrip-textcmd] $expander ] \
      ]
      $expander destroy
      return $result
    }

  <<docstrip-expand>>
  <<docstrip-textcmd>>
```

# %<=docstrip-textcmd>

```tcl
    proc docstrip-textcmd {expander text} {
      if [regexp {^\s*<<[^>]+>>\s*$} $text] {
        set snippet [$expander registry get snippet "include"]
        set text $snippet
      }
      return $text
    }
    
```

### tangle

### %<=docstrip-tangle>

```tcl
    proc tangle {ch root} {

      <<docstrip-tangle-parse>>
      <<docstrip-tangle-tangle>>
      <<docstrip-tangle-cleanup>>

      return $result
    }

    <<docstrip-tangle-expand>>
```

### %<=docstrip-tangle-x>

```tcl
  proc tangle-x {fpath root} {
    set slave [interp create]

    lassign [argv-split $::argv "--"] argv_head argv_tail
    $slave eval [list set ::argv $argv_tail]

    try {
      set result "" 

      $slave eval info script $fpath
      set code [tangle-f $fpath $root]
      return [$slave eval $code]
    }
  }

```

### %<=docstrip-tangle-f>

```tcl
  proc tangle-f {fpath root} {
      set fp [open $fpath "r"]
      set code [tangle $fp $root]
      close $fp
      return $code
  }
```

### %<=package-argv>

```tcl
package ifneeded argv-util 0.1 {
    package provide argv-util 0.1
    
    proc argv-split {argv {separator "--"}} {
	set pos [lsearch $argv $separator]
	if {$pos>=0} {
	  return [list [lrange $argv 0 $pos-1] [lrange $argv $pos+1 end]]
	} else {
	  return [list $argv {}]
	}
    }
}
```


### %<=docstrip-tangle-parse>

```tcl
      set expander [expander new]
      set result [
        $expander expand $ch "%" "\n" \
          -evalcmd [list [namespace which docstrip-evalcmd] $expander] \
      ]
```

### %<=docstrip-tangle-tangle>

```tcl
      set ch_code [chan create {write read} [stringchan new ""]]
      set code [tangle-expand $ch_code $root $expander]
      chan seek $ch_code 0 start
      set result [chan read $ch_code]
      chan close $ch_code
```

#### %<=docstrip-tangle-cleanup>

```tcl
      $expander destroy
```

### %<=docstrip-tangle-expand>

```tcl
    proc tangle-expand {ch chunk expander} {
        # puts $ch "# debug: expand chunk $chunk"
        set text [$expander registry get snippet $chunk]
        set buffer ""
        foreach line [split $text "\n"] {
          if [regexp {^\s*<<([^>]+)>>\s*$} $line - chunk_name] {
            puts -nonewline $ch [tangle-expand $ch $chunk_name $expander]
          } else {
            puts $ch $line
          }
        }
        return $buffer
    }
```

#### %<=docstrip-package-require>

```tcl
  package require stringchan
```


### weave

%<=docstrip-weave>
%</docstrip-weave>

### %<=marklit-test-tangle>

```tcl
  <<tclsh-hashbang>>

  <<package-expander>>
  <<package-docstrip>>

  lassign $::argv chunk
  set code [docstrip tangle stdin $chunk]
  puts $code
  exit
```

## marklit

### %<=marklit>

```tcl
  <<tclsh-hashbang>>

  <<package-expander>>
  <<package-docstrip>>
  <<package-argv>>
  package require argv-util

  <<marklit-tangle>>

  set argv [lassign $::argv action]
  switch -- $action "tangle" {
      marklit-tangle {*}$argv 
  } "help" {
      puts "Usage:"
      puts ""
      puts "  marklit tangle -f input.marklit root"
      puts "  marklit tangle -x input.marklit root"
      puts ""
  } default {
      puts "MarkLit = Markdown + Literate Programming"
  }
  exit
```

### %<=marklit-tangle>

```tcl
proc marklit-tangle {args} {
    set terminals [lassign $args act file_path chunk]

    switch -- $act {
      "-f" {
	set result [docstrip tangle-f $file_path $chunk]
	puts $result
      }
      "-x" {
	set result [docstrip tangle-x $file_path $chunk]
	puts $result
      }
    }

}
```


## docstrip sourcefrom

### %<=docstrip-sourcefrom>

```tcl
proc sourcefrom {fpath terminals} {
  set fp [open $fpath "r"]
  set text [read $fp]
  close $fp

  try {
    set result "" 
    set old_script [info script]

    info script $fpath
    set code [extract $fpath $terminals]
    set result [uplevel 1 $code]
  } finally {
    info script $old_script
  }

  return $result
}
```

## Test Our Docstrip

### %<=test-our-docstrip>

```tcl
    <<package-docstrip>>

    set docstrip_text {
      <<text-docstrip-1>>
    }

    puts [docstrip extract $docstrip_text debug]
    puts [docstrip extract $docstrip_text no-debug]
```

%<=text-docstrip-1>


%<*debug>
  proc debug {message} {
    puts "debug: $message"
  }
%</debug>
%<-debug> proc debug {args} {}



%</text-docstrip-1>

## Test Our Expander

### %<=test-our-expander>

```tcl
proc strong {args} {
  return "<em>"
}
proc /strong {args} {
  return "</em>"
}

set text {
  Hello expander.
  Some [strong]bold[/strong] text.
  This is last line. 
}

set result [expander expand $text "\[" "\]" ]

puts "===="
puts $result
puts "===="
```

```tcl
exit


set terminals [lassign $docstrip_argv act file_path]

switch -- $act {
  "-f" {
    set fp [open $file_path]
    set text [read $fp] 
    close $fp
    set result [docstrip::extract $text $terminals]
    puts $result
  }
  "-x" {
    docstrip::sourcefrom $file_path $terminals
  }
}
```

