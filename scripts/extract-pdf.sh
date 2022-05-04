#!/usr/bin/env bash
date=`date '+%Y%m'`

if test $1;
then date=$1
fi

mkdir temp
mkdir pdf
mu find 发票 date:$date flag:attach --exec "mu extract -a --target-dir=temp"
mv temp/*.pdf pdf/
