---
layout: post
title: "How Tmux Starts Up: An Adventure With Linux Tools"
date: 2014-11-25T13:58:45-05:00
---
Update! I mention below that there's some fork calls that appear to be missing. Here's the [solution](/2014/11/28/how-tmux-starts-up-an-adventure-with-linux-tools-updated.html).

Julia Evans visited Hacker School yesterday, and I got to work with her on a super neat problem. In the end, the question became *How does tmux start?*. Specifically:


In terminal 1:
{% highlight sh %}
$ tmux
{% endhighlight %}

Then in terminal 2:

{% highlight sh %}
$ pstree -pa | grep -C 3 tmux
  |   `-{knotify4},2192
  |-konsole,9081
  |   |-bash,9084
  |   |   `-tmux,9928
  |   |-{konsole},9082
  |   `-{konsole},9083
  |-krunner,2236
--
  |   |-{teamviewerd},1609
  |   |-{teamviewerd},1611
  |   `-{teamviewerd},1613
  |-tmux,9930 <----- Check it out! The parent is init
  |   |-bash,9931
  |   |   `-vim,10524
  |   |       |-python2,10532 /home/chase/.config/dotfiles/vim/bundle/YouCompleteMe/python/ycm/../../third_party/ycmd/ycmd ...
--
  |   |-bash,10728
  |   |   `-htop,10923
  |   `-bash,11874
  |       |-grep,12544 --color=auto -C 3 tmux
  |       `-pstree,12543 -pa
  |-udevd,437 --daemon
  |   |-udevd,5761 --daemon
{% endhighlight %}

Huh, looks like tmux has a parent of "init" (the one with pid `9930` here). But I started tmux in a terminal, which has the bash process running. This makes sense, because if the terminal closes tmux should still run. But how does it do it?

Here's the short, boring answer: it calls the `daemon` function in `unistd.h` on startup.

**But** here's the more interesting part -- how did we figure this out? We guessed it had to do something with forking and exiting processies, so let's see what's being forked!

### Attempt 1: `strace`
Let's see what is forking.
{% highlight sh %}
$ strace -o out -f tmux
# Then detach from tmux
$ cat out
# No mentions to fork!
{% endhighlight %}

Problem is, strace actually doesn't record the fork system call. I'm not sure why, but I'm guessing it's fork in particular that doesn't work. It does tell us when a process exits though. Oddly it never mentions the `9930` pid. Hmm.

### Attempt 2: `LD_PRELOAD`
What about wrapping the fork function? Fork is in `unistd.h`. If tmux is dynamically linking to that library, then we can [inject our own code](http://rafalcieslak.wordpress.com/2013/04/02/dynamic-linker-tricks-using-ld_preload-to-cheat-inject-features-and-investigate-programs/) in and print to a file whenever fork is called! Let's go!

{% highlight c %}
/* unfork.c */
#define _GNU_SOURCE
#include <dlfcn.h>
#include <unistd.h>
#include <stdio.h>

typedef pid_t (*orig_fork_f_type)();

pid_t fork()
{
    orig_fork_f_type orig_fork;
    FILE *f = fopen("/home/chase/fork_secrets.txt", "a");
    orig_fork = (orig_fork_f_type)dlsym(RTLD_NEXT,"fork");
    pid_t pid = orig_fork();
    if (f != NULL) {
        fprintf(f, "pid is %d\n", pid);
        fclose(f);
    }
    return pid;
}
{% endhighlight %}

Compile it:
{% highlight sh %}
gcc -shared -fPIC unfork.c -o unfork.so
{% endhighlight %}


Great! Now if edit the `LD_PRELOAD` environment variable, all calls to fork by tmux should go to this.
{% highlight sh %}
$ export LD_PRELOAD=/lib/x86_64-linux-gnu/libdl.so.2:/home/chase/hs/ld_preload_fun/unfork.so
{% endhighlight %}

The `dlsym` call in our unfork.c requires the `libdl` to be included for it to link correctly. As such, we include it in `LD_PRELOAD`.

Lets see if it worked!
{% highlight sh %}
$ tmux
# Detach from tmux (or open a new terminal)
$ pstree -pa | grep tmux
$ cat ~/fork_secrets.txt
{% endhighlight %}

Neat! We got a bunch of pids printed to the file. But, the critical missing one is the new tmux process that is the child of init. That's the one we care about!

### Attempt 3: Running the tmux source
That was neat, but we still don't have our answer. I got the tmux source running (I suggest using vagrant and compiling it in a virtual machine). Globally searching for `fork(` I found `server.c` had this function:

{% highlight c %}
server_start(int lockfd, char *lockfile)
{% endhighlight %}

Ah! Printing inside of here and running tmux shows that it is indeed called. Looking more into the function I see this:

{% highlight c %}
	if (daemon(1, 0) != 0)
{% endhighlight %}

Huh.. now we are getting close. The `daemon` standard library calls its own special fork, and not the standard library one. Here's proof:

{% highlight c %}
/* fork_test.c */
#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>
 
int my_daemon( int  nochdir, int  noclose )
{
   pid_t  pid;
 
   if ( !nochdir && chdir("/") != 0 )
       return -1;
   
   if ( !noclose )
   {
     int  fd = open("/dev/null", O_RDWR);
 
     if ( fd < 0 )
      return -1;
 
     if ( dup2( fd, 0 ) < 0 ||
      dup2( fd, 1 ) < 0 ||
          dup2( fd, 2 ) < 0 ) 
     {
       close(fd);
      return -1;
     }
     close(fd);
  }
  
   pid = fork();
   printf("inner daemon fork %d\n", pid);
   if (pid < 0)
    return -1;
 
   if (pid > 0)
    _exit(0);
 
   if ( setsid() < 0 )
     return -1;
 
   return 0;
}

int main()
{
    pid_t pid = fork();

    switch (pid) {
    case -1:
        printf("fork failed\n");
    case 0:
        printf("in the child\n");
        break;
    default:
        printf("parent: %d\n", pid);
        return 0;
    }

    printf("Hello world (from child)\n");
    printf("try to make a daemon\n");

    /* This is the special line!
     * If you change this to my_daemon, our fork will be called.
     * Otherwise, it will not.
     * Repro:
     * Compile with just "daemon"
     * ./fork_test
     * cat ~/fork_secrets.txt
     * pstree -pa | grep fork_test
     * Notice that the pid of the new tmux is hidden.
     * Now compile with "my_daemon" and do the same thing. You'll notice the
     * new process is there.
     */
    if (daemon(1, 0) != 0)
        printf("daemon tots failed\n");

    printf("I am a daemon now?\n");
    while (1) {

    }
    return 0;
}
{% endhighlight %}


### Why does daemon not call our special fork?
Here's my guess: daemon and fork are in the same library: `unistd.h`. Daemon doens't need to externally look for the fork function through dynamic linking because it already knows where it is. I haven't yet confirmed this though.

### Wait wait. How does tmux start up?
Right! So turns out the source just tells us, and all this debugging wasn't necessary at all :p. It forks a child in `server_start`, which then forks a further child and kills itself (by calling `daemon`). Now that that grandchild has no parent, `init` picks it up. Nice!
