Marklit in Awk
==============
+ tags: awk


## The Motivation

* Marklit file is essentially a Markdown file.
* View markdown file have many choices. 
* tangle code from marklit is the requirement.
* `awk` is ready for use in almost all linux system. 
* A `marklit-tangle.awk` would help.


## Two Pass Parsing

We can use a 2-pass parsing.

### <=test-2pass.awk>
```awk
BEGIN {
  ARGV[ARGC] = ARGV[ARGC-1];
  ARGC++;
}

FNR==1 {
  print ARGIND, FILENAME
}
```

## <=marklit-tangle.awk>

```awk
#!/usr/bin/awk -f

BEGIN {
  ARGV[ARGC] = ARGV[ARGC-1];
  ARGC++;
}

ARGIND==1 {
  print ARGIND, FILENAME
}

ARGIND==2 {
  print ARGIND, FILENAME
}
```

