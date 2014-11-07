---
layout: post
title: "6.828 Setup on a VM (With Vagrant)"
date: 2014-11-07T17:33:45-05:00
---

## Intro

If you’re interested in doing MIT’s 6.828 class, I was able to get all the tools set up on a virtual machine through these steps. There’s a good chance you’ll have to make a few changes when you get to lab5 (the file system), but until then this should work great!

These instructions are a combination of 

* [http://read.seas.harvard.edu/cs261/2011/tools.html](http://read.seas.harvard.edu/cs261/2011/tools.html)
* [http://sipb.mit.edu/iap/6.828/lab/lab1/](http://sipb.mit.edu/iap/6.828/lab/lab1/)

## Prerequisites

* Vagrant

## Setup Steps

~~~~~~
$ vagrant box add 64 [https://cloud-images.ubuntu.com/vagrant/precise/current/precise-server-cloudimg-amd64-vagrant-disk1.box](https://cloud-images.ubuntu.com/vagrant/precise/current/precise-server-cloudimg-amd64-vagrant-disk1.box)
$ sudo apt-get install gcc-multilib
$ sudo apt-get install git
$ git clone https://exokernel.scripts.mit.edu/joslab.git lab
$ wget [http://read.seas.harvard.edu/cs261/src/qemu-0.15.0-jos.tar.bz2](http://read.seas.harvard.edu/cs261/src/qemu-0.15.0-jos.tar.bz2)$ sudo aptitude install libsdl1.2-dev$ tar xjf qemu-0.15.0-jos.tar.bz2$ cd qemu-0.15.0-jos
$ ./configure --prefix=/usr/local --target-list="i386-softmmu x86_64-softmmu"
$ make
$ sudo make install
~~~~~~

**Now install gdb**

~~~~~~
$ cd ~
$ wget [http://ftpmirror.gnu.org/gdb/gdb-6.8a.tar.gz](http://ftpmirror.gnu.org/gdb/gdb-6.8a.tar.gz)
$ tar xf gdb-6.8a.tar.gz
$ cd gdb-6.8
$ ./configure --target=i386-jos-elf --program-prefix=i386-jos-elf- \              --disable-werror
$ make
$ sudo make install

# Make a link to the gdb installation
$ sudo ln -s ~/gdb-6.8/gdb/gdb /usr/bin/gdb
~~~~~~

**Move lab into /vagrant. This allows you to edit the files locally on your computer**

~~~~~~
$ mv ~/lab /vagrant/
~~~~~~

**Now test it!**

*Test 1:*

~~~~~~
$ cd /vagrant/lab
$ make qemu-nox
  # (to exit type ctrl+a, x)
~~~~~~


It should look something like this:

~~~~~~
vagrant@vagrant-ubuntu-precise-64:~/lab$ make qemu-nox
+ as kern/entry.S
+ cc kern/entrypgdir.c
+ cc kern/init.c
+ cc kern/console.c
+ cc kern/monitor.c
+ cc kern/printf.c
+ cc kern/kdebug.c
+ cc lib/printfmt.c
+ cc lib/readline.c
+ cc lib/string.c
+ ld obj/kern/kernel
+ as boot/boot.S
+ cc -Os boot/main.c
+ ld boot/boot
boot block is 382 bytes (max 510)
+ mk obj/kern/kernel.img
sed "s/localhost:1234/localhost:26001/" < .gdbrc.tmpl > .gdbrc
***
*** Use Ctrl-a x to exit qemu
***
qemu -nographic -hda obj/kern/kernel.img -serial mon:stdio -gdb tcp::26001 -D qemu.log 

Could not open option rom 'sgabios.bin': No such file or directory

6828 decimal is XXX octal!
entering test_backtrace 5
entering test_backtrace 4
entering test_backtrace 3
entering test_backtrace 2
entering test_backtrace 1
entering test_backtrace 0
leaving test_backtrace 0
leaving test_backtrace 1
leaving test_backtrace 2
leaving test_backtrace 3
leaving test_backtrace 4
leaving test_backtrace 5

Welcome to the JOS kernel monitor!

Type 'help' for a list of commands.

K> 
~~~~~~

*Test 2:*

In one terminal (not in qemu):

~~~~~~
$ make qemu-nox-gdb
~~~~~~

In another one (also ssh’d in):

~~~~~~
$ make gdb
~~~~~~

There should be no errors.

If this all works, you’re ready for 828!! 

