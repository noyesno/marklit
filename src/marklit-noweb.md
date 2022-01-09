marklit2noweb - use noweb to process marklit
============================================
+ tags: noweb

```awk
#!/usr/bin/awk -f

/^##* +%?<=[^>]+>/ {
  match($0, /^##* +%?<=([^>]+)>/, matches);
  chunk = matches[1];
}

/^```/ {
  printf "<<%s>>=\n", chunk;
  getline;
  while(! /^```/){
    print;
    getline;
  }
  printf "@\n\n";
}
```

## Extract `marklit2noweb.awk`

```sh
cat marklit-awk.md \
| sed -n '/^```awk/,/^```/ p' \
| sed '1 d; $ d' \
> marklit2noweb.awk
```
