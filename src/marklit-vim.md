marklit Vim Syntax
==================


## Vim Syntax

%<=vim-marklit-syntax>
  <<vim-syntax-link>>
  <<vim-syntax-code>>
  <<vim-syntax-code-tcl>>
%</vim-marklit-syntax>

%<=vim-syntax-link> .vim
    " link [Title](url)
    syntax match docLink /\[[^\]]\+\]([^()]*)/ contains=linkText,linkHref
    syntax match linkText /\[[^\]]\+\]/ contained nextgroup=linkHref
    syntax match linkHref /([^()]\+)/ contained conceal "cchar=^
    highlight link linkText Underlined 
    highlight link linkHref Comment
%</vim-syntax-link>

%<=vim-syntax-code> .vim
    syntax region Type start=/\z(`\)/ end=/\z1/ oneline keepend concealends
%</vim-syntax-code>

%<=vim-syntax-code-tcl> .vim
  if search('env tclsh', "wn") > 0
    syntax include @codeTcl syntax/tcl.vim
    unlet! b:current_syntax
  endif
%</vim-syntax-code-tcl>
