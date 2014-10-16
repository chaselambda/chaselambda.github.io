---
layout: post
title: "Mouse Driver Troubles"
date: 2014-10-16T12:10:54-04:00
---
### I want to make a USB Button
My friend and I are working on a class to teach High School students how to get a computer to "paint" a digital image. The inspiration comes from taking [Frédo Durand's](http://people.csail.mit.edu/fredo/) 6.815 class. In it, we implemented a [technique](http://www.heathershrewsbury.com/dreu2010/wp-content/uploads/2010/07/PainterlyRenderingWithCurvedBrushStrokesOfMultipleSizes.pdf) where directions and both high and low frequency parts of the image are accounted for. DRon, my
co-teacher made a really neat [animated version](http://web.mit.edu/dron/www/portfolio/graphics/paint/fire.gif).

Anyways! I thought it would be great to have a button the students could press to add the next "paintstroke" to the image, to help them understand the algorithm. There's a bunch of [USB Buttons](http://help.sparkbooth.com/kb/building-your-own-photo-booth/usb-button-keyboard-replacements) out there, but I figured it would be great if I could make my own.

The premise is to get a mouse, and tell Linux that it's not actually a mouse but just a regular `input_event` device. Then I could write a program that listens to the file created in `/dev/input/eventX`. Whenever the button is pressed, the reader of that file will then notice.


<!--[<img src="/assets/insignia-mouse.jpg" title="Mouse from BestBuy" style="width: 100px; float: right; margin-left: 20px"/>](http://www.bestbuy.com/site/insignia-usb-optical-mouse-black-gray/3489023.p;jsessionid=F3D22E1210BAA80ECEC731E0C08C17BE.bbolsp-app01-173?id=1219091717352&skuId=3489023&st=insignia%20mouse&cp=1&lp=11)-->

### I bought a mouse
I went out and bought a mouse from Best Buy. After plugging it in, I looked at the output of `/proc/bus/input/devices`:


~~~~~~~~
I: Bus=0003 Vendor=05b8 Product=3280 Version=0111
N: Name="PixArt USB Optical Mouse"
P: Phys=usb-0000:00:1a.0-1.1/input0
S: Sysfs=/devices/pci0000:00/0000:00:1a.0/usb1/1-1/1-1.1/1-1.1:1.0/input/input85
U: Uniq=
H: Handlers=mouse3 event5 
B: PROP=0
B: EV=17
B: KEY=ff0000 0 0 0 0
B: REL=103
B: MSC=10
~~~~~~~~

I verified that if I ran either `sudo cat /dev/input/mouse3` or `sudo cat /dev/input/event5` and moved the mouse that I could see streaming output.

Now here's the challenge, I need to have the system *not* recognize this as a mouse, but instead as a module that I've installed.

Let's dive down a bit. When unplugging and pluggint he device in and then running `dmesg`, I get 

~~~~~~
[272055.191824] usb 1-1.1: new low-speed USB device number 23 using ehci-pci
[272055.288221] usb 1-1.1: New USB device found, idVendor=05b8, idProduct=3280
[272055.288232] usb 1-1.1: New USB device strings: Mfr=1, Product=2, SerialNumber=0
[272055.288238] usb 1-1.1: Product: USB Optical Mouse
[272055.288243] usb 1-1.1: Manufacturer: PixArt
[272055.291101] input: PixArt USB Optical Mouse as /devices/pci0000:00/0000:00:1a.0/usb1/1-1/1-1.1/1-1.1:1.0/input/input88
[272055.291774] hid-generic 0003:05B8:3280.004A: input,hidraw2: USB HID v1.11 Mouse [PixArt USB Optical Mouse] on usb-0000:00:1a.0-1.1/input0
~~~~~~
Ah! hid-generic. We can verify that hid-generic is being loaded by running `sudo rmmod hid_generic`, then unplugging and replugging the mouse in and seeing if it got reinstalled by running `sudo lsmod | grep hid_generic`.

Checking out the [code](http://lxr.free-electrons.com/source/drivers/hid/hid-generic.c?v=3.8#L33), we see this:

<!--TODO why can't I put _'s in ~~~ blocks?-->
    static const struct hid_device_id hid_table[] = {
        { HID_DEVICE(HID_BUS_ANY, HID_GROUP_GENERIC, HID_ANY_ID, HID_ANY_ID) },
        { }
    };

Ok, this is the `id_table` of `hid_generic`. It seems this is used to match handlers (code that will run given an event) to devices. Check it out in [input.c](http://lxr.free-electrons.com/source/drivers/input/input.c?v=3.8):


<!-- TODO my code spacing is too large... took out the new lines -->
<!-- TODO c highlighting -->
    static const struct input_device_id *input_match_device(struct input_handler *handler,
                                struct input_dev *dev) {
        const struct input_device_id *id;
        for (id = handler->id_table; id->flags || id->driver_info; id++) {
            if (id->flags & INPUT_DEVICE_ID_MATCH_BUS)
                if (id->bustype != dev->id.bustype)
                    continue;
            if (id->flags & INPUT_DEVICE_ID_MATCH_VENDOR)
                if (id->vendor != dev->id.vendor)
                    continue;
            if (id->flags & INPUT_DEVICE_ID_MATCH_PRODUCT)
                if (id->product != dev->id.product)
                    continue;
            if (id->flags & INPUT_DEVICE_ID_MATCH_VERSION)
                if (id->version != dev->id.version)
                    continue;
            if (!bitmap_subset(id->evbit, dev->evbit, EV_MAX))
                continue;
            ...

I'm taking a guess that a similar thing is happening when modules are installed on USB plug-in events. I'm also guessing that `{ HID_DEVICE(HID_BUS_ANY, HID_GROUP_GENERIC, HID_ANY_ID, HID_ANY_ID) },` matches my mouse, which has bus, group, vendor, and product ids encoded on the device.

Cool! So I understand why the `hid_generic` module is installed when I plug in my mouse. But why is my mouse actually working, and why is it creating the file `/dev/input/mouse3`? What is it that my mouse tells the computer that says "treat me as a mouse!".

One good idea is looking to see if the vendor/product id is somewhere hardcoded in the kernel. This happens all the time for other modules. Given that `idVendor=05b8, idProduct=3280`[^vendor] for this mouse (as shown in `/proc/bus/input/devices`), I searched for `0x05b8` and `0x3280`, but could not find either referencing this mouse.

<!-- TODO put tics around file name; style it so it's still small but has a background -->
[^vendor]: I got this from /proc/bus/input/devices. Note this makes sense, as the mouse is made by Agiler, which [has id 0x05b8](https://usb-ids.gowdy.us/read/UD/)
