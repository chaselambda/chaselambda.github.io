---
layout: post
title: "Hella Fast Command Line Navigation"
date: 2014-11-07T16:02:18-05:00
---

Here's a command you can add to your bash alias that allows you to **fuzzy search over your popularly visited directories**:

~~~~~
alias g="new_loc=\$(cat ~/.local/share/autojump/autojump.txt | sort -n | grep -Po '^[^\s]+\s+(\K.*)' | fzf +s -e) && cd \"\$new_loc\""
~~~~~

This requires both [autojump](https://github.com/joelthelion/autojump) and [fzf](https://github.com/junegunn/fzf) to be installed. Autojump's job here is to keep track of your most visited directories. It saves these entries at `~/.local/share/autojump/autojump.txt` (found by running `j -s`).

We then sort the entries by most popular: `sort -n`

And then remove the first column of the results: `grep -Po '^[^\s]+\s+(\K.*)'`

Finally, we pipe all of that to `fzf`, which gives us fuzzy search ability of the list of directories. The `+s` flag stops `fzf` from sorting the list.

