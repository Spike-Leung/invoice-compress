#!/usr/bin/env bash
date=`date '+%Y%m'`

if test $1;
then date=$1
fi

mu find 发票 and date:$date and not flag:attach --format='xml' > temp/mail.xml
ts-node src/index
