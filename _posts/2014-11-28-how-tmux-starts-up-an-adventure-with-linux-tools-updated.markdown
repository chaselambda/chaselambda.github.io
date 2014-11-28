---
layout: post
title: "How Tmux Starts Up: An Adventure With Linux Tools [Updated]"
date: 2014-11-28T12:25:41-05:00
---

The Hero of the Day award goes to [Joey Geralnik](https://twitter.com/jgeralnik)! He sent me an email detailing what I was missing in my [previous post](/2014/11/25/how-tmux-starts-up-an-adventure-with-linux-tools.html), mainly:
* There's a syscall called clone that is nearly equivalent to fork
* I was looking at the wrong source for the daemon library call

With this in mind, let's do a better investigation. As a reminder, our main goal here is to see how tmux gets put as a child of "init" when we launch it. We know that this ends up happening by using pstree:


{% highlight sh %}
$ pstree -pa | egrep "(tmux|init|bash)"
init,1
  |-kdeinit4,2074
  |   |-bash,2655
  |   |-bash,24723
  |   |   `-tmux,30394 <---------- Tmux originally started here
  |-start_kdeinit,2073 +kcminit_startup
  |-tmux,30396 <------------------ But now it is owned by init
  |   |-bash,30397
  |   `-bash,30725
  |       |-egrep,32332 --color=auto -e (tmux|init|bash)
{% endhighlight %}

### Attempt 1: `strace`
**In terminal 1**
{% highlight sh %}
$ strace -o out -f tmux
{% endhighlight %}

**In terminal 2**
{% highlight sh %}
$ pstree -pa | egrep "(tmux|init|bash)"
init,1
  |-kdeinit4,2074                  
  |   |-bash,2655
  |   |   |-egrep,1646 --color=auto (tmux|init|bash)
  |   |-bash,24723
  |   |   `-strace,1118 -o out -f tmux
  |   |       `-tmux,1119
  |   |           `-(tmux,1120)
  |-start_kdeinit,2073 +kcminit_startup
  |-tmux,1121
  |   `-bash,1122
{% endhighlight %}

This is as before: tmux with pid `1121` has a parent of `init`. One odd thing you might notice is that there's also `-(tmux,1120)`. We'll see in a second that that process has called exit. It's still there because of strace (I'm not sure what specificically).

I'll now exit from tmux and dig through the output, looking for where pid `1121` originated:

{% highlight sh %}
$ vim out
.....
1120  <... clone resumed> child_stack=0, flags=CLONE_CHILD_CLEARTID|CLONE_CHILD_SETTID|SIGCHLD, child_tidptr=0x7f52b93389d0) = 1121
1120  exit_group(0)                     = ?
{% endhighlight %}

Hey check it out! Process 1120 calls clone, which creates the 1121 process, and then *right after* exits! That's it then, we don't need a next attempt :)

But hey, I'll verify my understanding and fix my mistakes in the previous post.

### Attempt 2: `LD_PRELOAD`
This is still going to fail for us as before, we'll see why in a second.

### Attempt 3: Running the tmux source
By jumping through the tmux source (see [the old Attempt 3](/2014/11/25/how-tmux-starts-up-an-adventure-with-linux-tools.html)), I'm able to find that daemon is being called. But I was looking at the wrong source file before! So where is the daemon source?

{% highlight sh %}
$ ldd --version
ldd (Ubuntu EGLIBC 2.15-0ubuntu10.7) 2.15
Copyright (C) 2012 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
{% endhighlight %}

This says my computer (Ubuntu 12.04) is using eglibc 2.15. Eglibc says it strives "to be source and binary compatible with GLIBC". I could get eglibc with subversion, but it's going to be pretty much equivalent to glibc, so I'll just download [that](http://ftp.gnu.org/gnu/libc/). Or we can just find some off version glibc that's probably the same thing, which is what Joey did:

> As far as daemon not calling your fork, my first guess was that daemon calls the syscall clone directly. Opening up the source code, however, is as simple as googling "glibc daemon github", which yields [https://github.com/lattera/glibc/blob/master/misc/daemon.c](https://github.com/lattera/glibc/blob/master/misc/daemon.c)
> 
> There we can easily see that rather than calling fork, daemon calls __fork. Searching the github repository we can find [https://github.com/lattera/glibc/blob/master/nptl/sysdeps/unix/sysv/linux/fork.c](https://github.com/lattera/glibc/blob/master/nptl/sysdeps/unix/sysv/linux/fork.c), which shows in the last three lines:
> 
> weak_alias (__libc_fork, __fork)
> libc_hidden_def (__fork)
> weak_alias (__libc_fork, fork)
> 
> So fork and __fork actually both end up calling __libc_fork!
> 
> By the way, if you look at that same file on lines 129-134 you can see that rather that calling the fork glibc calls ARCH_FORK(). ARCH_FORK is defined per platform, with the interesting implementations being 32 bit and 64 bit intel:
> 
> [https://github.com/lattera/glibc/blob/master/nptl/sysdeps/unix/sysv/linux/i386/fork.c](https://github.com/lattera/glibc/blob/master/nptl/sysdeps/unix/sysv/linux/i386/fork.c)
> [https://github.com/lattera/glibc/blob/master/nptl/sysdeps/unix/sysv/linux/x86_64/fork.c](https://github.com/lattera/glibc/blob/master/nptl/sysdeps/unix/sysv/linux/x86_64/fork.c)

In essence, we can see that daemon is going to be calling the "clone" syscall directly, so we can't use LD_PRELOAD to intercept it. This is why Attempt 2 will have the same problem as before: there will be a missing fork call. We could have, however, intercept the daemon library call in the first place, which *then* would have told us that tmux was calling daemon. This could have allowed us to just skip the tmux source dive if we were interested in what library calls were being made.

### Lessons Learned
* `LD_PRELOAD` has its limits. In this case, the glibc "daemon" was what we needed to intercept in addition to fork.
* [glibc](http://www.gnu.org/software/libc/) is what's on my computer (pretty much, it's actually [eglibc](http://www.eglibc.org/home)). I can get the source from there.
* clone is a syscall! Here's a [list](http://man7.org/linux/man-pages/man2/syscalls.2.html) of them.


