---
layout: post
title: "Wikipedia on UTF-8"
date: 2014-10-21T23:28:28-04:00
---

I found the [Wikipedia](http://en.wikipedia.org/wiki/UTF-8#Description) article on UTF-8 a bit wordy, but at parts very beautiful. Here's are the parts I find most useful, with minor edits.

### Design
The design of UTF-8 can be seen in this table of the scheme as originally proposed by Dave Prosser and subsequently modified by Ken Thompson (the x characters are replaced by the bits of the code point):
<img src="/assets/utf8-table.png"/>

<p>The first 128 characters (US-ASCII) need one byte. The next 1,920 characters need two bytes to encode. This covers the remainder of almost all <a href="/wiki/Latin_alphabets" title="Latin alphabets">Latin alphabets</a>, and also <a href="/wiki/Greek_alphabet" title="Greek alphabet">Greek</a>, <a href="/wiki/Cyrillic_script" title="Cyrillic script">Cyrillic</a>, <a href="/wiki/Coptic_alphabet" title="Coptic alphabet">Coptic</a>, <a href="/wiki/Armenian_alphabet" title="Armenian alphabet">Armenian</a>, <a href="/wiki/Hebrew_alphabet" title="Hebrew alphabet">Hebrew</a>, <a href="/wiki/Arabic_alphabet" title="Arabic alphabet">Arabic</a>, <a href="/wiki/Syriac_alphabet" title="Syriac alphabet">Syriac</a> and <a href="/wiki/T%C4%81na" title="Tāna" class="mw-redirect">Tāna</a> alphabets, as well as <a href="/wiki/Combining_Diacritical_Marks" title="Combining Diacritical Marks">Combining Diacritical Marks</a>. Three bytes are needed for characters in the rest of the <a href="/wiki/Mapping_of_Unicode_character_planes" title="Mapping of Unicode character planes" class="mw-redirect">Basic Multilingual Plane</a> (which contains virtually all characters in common use). Four bytes are needed for characters in the <a href="/wiki/Mapping_of_Unicode_characters" title="Mapping of Unicode characters" class="mw-redirect">other planes of Unicode</a>, which include less common <a href="/wiki/CJK_characters" title="CJK characters">CJK characters</a>, various historic scripts, mathematical symbols, and <a href="/wiki/Emoji" title="Emoji">emoji</a> (pictographic symbols).</p>

### Examples
<p>Consider the encoding of the <a href="/wiki/Euro_sign" title="Euro sign">Euro sign</a>, €.</p>
<ol>
<li>The Unicode code point for "€" is U+20AC.</li>
<li>According to the scheme table above, this will take three bytes to encode, since it is between U+0800 and U+FFFF.</li>
<li>Hexadecimal <code>20AC</code> is binary <code>0010000010101100</code>. The two leading zeros are added because, as the scheme table shows, a three-byte encoding needs <i>exactly</i> sixteen bits from the code point.</li>
<li>Because it is a three-byte encoding, the leading byte starts with three 1s, then a 0 (<code>1110</code>&#160;...)</li>
<li>The remaining bits of this byte are taken from the code point (<code>1110<span style="color:blue;">0010</span></code>), leaving ...&#160;<code>000010101100</code>.</li>
<li>Each of the continuation bytes starts with <code>10</code> and takes six bits of the code point (so <code>10<span style="color:green;">000010</span></code>, then <code>10<span style="color:red;">101100</span></code>).</li>
</ol>
<p>The three bytes <code>1110<span style="color:blue;">0010</span></code> <code>10<span style="color:green;">000010</span></code> <code>10<span style="color:red;">101100</span></code> can be more concisely written in hexadecimal, as <code><span style="color:blue;">E2</span> <span style="color:green;">82</span> <span style="color:red;">AC</span></code>.</p>
<p>The following table summarises this conversion, as well as others with different lengths in UTF-8. The colors indicate how bits from the code point are distributed among the UTF-8 bytes. Additional bits added by the UTF-8 encoding process are shown in black.</p>
<img src="/assets/utf8-examples.png"/>

### Why is Unicode Awesome?
<p>The great features of this scheme are as follows:</p>
<ul>
<li><i>Backward compatibility:</i> One-byte codes are used only for the ASCII values 0 through 127. In this case the UTF-8 code has the same value as the ASCII code. The high-order bit of these codes is always 0.</li>
<li><i>Clear distinction between multi-byte and single-byte characters:</i> Code points larger than 127 are represented by multi-byte sequences, composed of a <i>leading byte</i> and one or more <i>continuation bytes</i>. The leading byte has two or more high-order 1s followed by a 0, while continuation bytes all have '10' in the high-order position.</li>
<li><i>Self synchronization:</i> Single bytes, leading bytes, and continuation bytes do not share values. This makes the scheme <a href="/wiki/Self-synchronizing_code" title="Self-synchronizing code">self-synchronizing</a>, allowing the start of a character to be found by backing up at most five bytes (three bytes in actual UTF‑8 per <a class="external mw-magiclink-rfc" rel="nofollow" href="//tools.ietf.org/html/rfc3629">RFC 3629</a> restriction, see above).</li>
<li><i>Clear indication of code sequence length:</i> The number of high-order 1s in the leading byte of a multi-byte sequence indicates the number of bytes in the sequence, so that the length of the sequence can be determined without examining the continuation bytes.</li>
<li><i>Code structure:</i> The remaining bits of the encoding are used for the bits of the code point being encoded, padded with high-order 0s if necessary. The high-order bits go in the lead byte, lower-order bits in succeeding continuation bytes. The number of bytes in the encoding is the minimum required to hold all the significant bits of the code point.</li>
</ul>
