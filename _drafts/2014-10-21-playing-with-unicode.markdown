---
layout: post
title: "Playing With Unicode"
date: 2014-10-21T21:31:14-04:00
---


I believe Unicode is one of those topics that many Computer Scientists say they know but they might not deeply understand it. I changed once I realized how neat it was to experiment/play with it. [Connor Osborn](https://www.hackerschool.com/private) and I did this today at [Hacker School](https://www.hackerschool.com/).

###Theory and Vocabulary
**Unicode** is a [set of mappings](http://en.wikipedia.org/wiki/List_of_Unicode_characters), from **code points** (integers) to descriptions. Here's some examples:

| Hex | Decimal | Name | 
| :------------- |-------------:|---------:|
| 0x003E | 62 | GREATER-THAN SIGN      |    
| 0x003F | 63 | QUESTION MARK          |    
| 0x0040 | 64 | COMMERCIAL AT          |    
| 0x0041 | 65 | LATIN CAPITAL LETTER A |    
| 0x0042 | 66 | LATIN CAPITAL LETTER B |    
| 0x0043 | 67 | LATIN CAPITAL LETTER C |    
| 0x0989 | 2441 | BENGALI LETTER U | 

A **glyph** is a visible representation of a unicode character. A **font** is a set of glyphs. Its input is a *code point* and the output is a *glyph* that shows up on a computer screen. It figures out which *glyph* to draw by looking up what the character is in the unicode table. The table above has the following glyphs, under one font: > ?  @ A B C উ



### Playtime!!

Let's print out the letter "u" (*code point* 175, which is `75` in hex, denoted `0x75`):

~~~~~
$ echo -e "\u75"
u
~~~~~

Let's print the one with a diaresis on top of it:

A **non-spacing (combining) mark** is a *code point* that does not take up a character width. It's generally used in addition with some letter, like diaresis (*code point* 0x308). Let's check it out in bash:

~~~~~
$ echo -e "\u75\u308"
ü
~~~~~
Here u (U+75, meaning the code point `0x75` which is 117) has a diär̈ës̈is̈ put on it (U+308).

Let's try other letters:

~~~~~~~
$ echo -e "\u76\u308"
v̈
$ echo -e "\u77\u308"
ẅ
~~~~~~~

We can also add a line above it:

~~~~~
$ echo -e "\u75\u308\u304"
ǖ

# Switched
$ echo -e "\u75\u308\u304"
ṻ
~~~~~

Oh my! One of these two might look very odd to you. That's because we're doing some unintended sequences of unicode, so the glyph library of your browser may be doing odd things.

Try out other glyphs!

- Highlight these: ǖ   ṻ   
- Copy them into a terminal (you don't have to do anything with them)
- Copy them into [sublime](http://www.sublimetext.com/) I find that sublime treats the *non spacing marks* as full width characters! Sounds reasonable to me.
- Try another text editor (note vim in your terminal has the same glyph rendering as the terminal itself)

### Encodings

But Chase, "What about the utf-8, latin-1, ascii business? Isn't that part of unicode?" The answer is actually no! But they do work closely with each other.

An **encoding** is a set of rules to get from an integer to bytes that the computer stores in memory or on disk. Note this has nothing to do with unicode. It's just a way to encode and decode numbers. But frequently these encoders are used to encode and decode numbers that represent *code points*.

#### Wikipedia on UTF-8
**UTF-8** is the most popular encoding of unicode. [Wikipedia](http://en.wikipedia.org/wiki/UTF-8#Description) has a wonderful description of it, which I've restated [here](/2014/10/21/wikipedia-on-utf-8.html).

### UTF-8 Playtime!!

Let me first introduce you to **xxd**. It takes some input stream of bytes and outputs it in hex:

~~~~~~~
$ echo -en "abcdefghijklmnopqrstuvwxyz" | xxd # -n skips printing a new line
0000000: 6162 6364 6566 6768 696a 6b6c 6d6e 6f70  abcdefghijklmnop
0000010: 7172 7374 7576 7778 797a                 qrstuvwxyz
~~~~~~~~
Notice here how `a` is represented by `0x61` (which is `97` in decimal), `b` is `0x62`, etc.
Also notice the `0000010` on the second line. That's just saying the text has wrapped and it's printing `0x10`<sup>th</sup> byte (`16`<sup>th</sup>).

Wikipedia has the Euro Sign, €, example. Let's verify the encoding: 

~~~~~~~
$ echo -en "\u20ac" # The code point € for is U+20AC
€

# Now let's get that encoding in hex:
$ echo -en "\u20ac" | xxd
0000000: e282 ac
~~~~~~~

And that is indeed `0xE2 82 AC`, as Wikipedia says!

### Thoughtful Details

#### UTF-8 is not space efficient
Notice that in the [Wikipedia table](http://localhost:4000/assets/utf8-table.png) that when using 2 bytes, there are 11 x's. So that's 2^11 = 2048 possible entries. But it's stated that the code point range is from 0x80 to 0x7FF. That's 1920 possible entries. Why aren't these the same? The answer is that UTF-8 sacrifices memory efficiency for simplicity. Or maybe it's also because Ken Thompson came up with UTF-8 on a napkin :p  TODO link (Connor)

#### Unicode redundancies


