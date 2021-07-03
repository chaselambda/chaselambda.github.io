---
layout: post
title: "Apple keyboard patch in Linux 3.8"
date: 2014-10-09T15:20:23-04:00
---


I'm really excited to do some pair programming at [Hacker School](http://hackerschool.com), and I find that one of the best ways to pair program is to have two keyboards and two mice. I went out to Best Buy[^bestbuy] to get a wireless mouse and Apple Keyboard. It only took a few seconds to realize that the keyboard was not what I wanted it to be.

1. The function keys were off by default. For example, F1 would increase the brightness of the screen
2. There were some other wrong mappings, like the tilde
3. The alt and windows key were flipped.

I found the answer to the first two problems [here](http://anrieff.net/abs/viewpost.php?lang=en&id=44).

However problem 3 was a tricky nut to crack. Turns out that the simple fix for this was implemented in Linux 3.13, but I am running 3.8. Compare the two sources, specifically for the addition of swap\_opt\_cmd:

- <http://lxr.free-electrons.com/source/drivers/hid/hid-apple.c?v=3.8>
- <http://lxr.free-electrons.com/source/drivers/hid/hid-apple.c?v=3.13>

The solution is to copy some the code from 3.12 and put it in the 3.8 module. Then install that changed module. We’ll start with how to install a kernel module, and then go over what code to change.

### Compiling hid-apple.c
I first [copied](http://www.tldp.org/LDP/lkmpg/2.6/html/x181.html) a simple Makefile:

{::comment}
TODO indent.. 
{:/comment}
~~~~~~
obj-m += hid-apple.o
all:
make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules
clean:
make -C /lib/modules/$(shell uname -r)/build M=$(PWD) clean
~~~~~~



I then installed kernel headers, so the <linux/*.h> files at the top could be resolved:

`$ sudo apt-get install linux-kernel-headers`

I put this in the same directory as `hid-apple.c` and then ran

`$ make`

Looks like the `hid-ids.h` cannot be understood. But, looking into the [file](http://lxr.free-electrons.com/source/drivers/hid/hid-ids.h?v=3.8), it doesn’t have any extra dependencies. So I just copied all of those files in place of the `#include "hid-ids.h"`.

Now running `make` works! Fantastic. You should see that there’s now a `hid-apple.ko` file in the output. That’s the kernel module we’ll be using.

### Installing the Compiled Module
What we need to know is three commands here:

- `lsmod` - lists the installed kernel modules
- `rmmod` - removes a currently installed kernel module

You should see that the hid\_apple module is currently installed:

`$ lsmod | grep apple`

Uninstall it:

`$ rmmod hid_apple`

Back up the current apple kernel module

``$ sudo cp /lib/modules/`(uname -r)`/kernel/drivers/hid/hid-apple.ko ~/hid-apple.ko.bak``

Then replace it with our newly compiled module.

``$ sudo cp ~/your-compilation-directory/hid-apple.ko  /lib/modules/`(uname -r)`/kernel/drivers/hid/hid-apple.ko``

Now unplug the keyboard and plug it back in. The kernel module should automatically be loaded:

`$ lsmod | grep apple`

Neato! Now we actually want to change the 3.8 apple module to include the swap\_opt\_cmd parts.

### Changing the 3.8 Module to Support swap\_opt\_cmd
Here’s the [diff](http://chaselambda.com/gists/apple-kernel-support/3.8diff.txt), and here’s the final 3.8 [file](http://chaselambda.com/gists/apple-kernel-support/hid-apple.c) that I used. Now run `make` on that new file in your compilation directory. Then remove the currently installed module and copy yours over:

`$ rmmod hid_apple`
``$ sudo cp ~/your-compilation-directory/hid-apple.ko  /lib/modules/`(uname -r)`/kernel/drivers/hid/hid-apple.ko``

Finally, unplug and replug the keyboard. Hopefully it works. Check by running:

`$ ls /sys/module/hid_apple/parameters/`

If swap\_opt\_cmd is there, then your changes probably worked!

Now you should be able to do what the cool 3.13 people can:

`$ echo "1" > /sys/module/hid\_apple/parameters/swap\_opt\_cmd`

That’s it! You should have your alt and windows keys flipped in linux 3.8 :)
Persisting the Changes
If you’d like these changes to persist between restarts, try [this](http://askubuntu.com/a/531233/103700) for fnmode, swap\_opt\_cmd, and iso\_layout.
There are also [other methods](https://help.ubuntu.com/community/AppleKeyboard).


Thanks to [Julia Evans](http://jvns.ca/) for pairing with me to solve this!

### Details
When working on this, we found two non obvious finicky parts about kernel modules:

1. Module names *might* matter. To be safe we named everything hid-apple so that there wouldn’t be a problem there.
2. If there’s a kernel module installed and you delete the associated .ko file but do not uninstall the module, then no kernel module will be automatically loaded upon plugging in the keyboard because an applicable keyboard is already running. So make sure to uninstall modules before plugging the keyboard in.
hi
 
[^bestbuy]: Turns out Amazon and Ebay are more expensive than the Apple store and Best Buy!
