---
layout: post
title: "Installing \"Probabilistic Programming & Bayesian Methods for Hackers\""
date: 2014-11-10T12:56:35-05:00
---

Setting up [Probabilistic Programming & Bayesian Methods for Hackers](http://camdavidsonpilon.github.io/Probabilistic-Programming-and-Bayesian-Methods-for-Hackers/#using-the-book) was a bit tricky. Here's what worked for me on Ubuntu 12.04:

<!--TODO can't use backticks in subbullets :/-->
<!--TODO too much spacing towards subbullets-->
<!--TODO coloring.. -->
~~~~~
sudo apt-get install libsqlite3-dev
~~~~~
* Install https://github.com/yyuu/pyenv
* Install https://github.com/yyuu/pyenv-virtualenv
    * I suggest not using "$ echo 'eval "$(pyenv virtualenv-init -)"' >> ~/.bash\_profile". Just activate when necessary using "pyenv activate <name>".
    * Note that when making a new virtualenv, it is global and not created in the current directory (like normal virtualenv).

~~~~~
pyenv install 2.7.8
pyenv virtualenv venvtwo
git clone https://github.com/CamDavidsonPilon/Probabilistic-Programming-and-Bayesian-Methods-for-Hackers
cd <that folder name>
pip install -r requirements.txt
# It should now work!
ipython notebook
~~~~~


