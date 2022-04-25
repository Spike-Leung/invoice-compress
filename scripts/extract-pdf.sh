#!/usr/bin/env bash
mkdir temp
mkdir pdf
mu find 发票 date:20220401..20220430 flag:attach --exec "mu extract -a --target-dir=temp"
mv temp/*.pdf pdf/
