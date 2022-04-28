#!/usr/bin/env bash
# mkdir temp2
# mail not contains pdf
mu find 发票 and date:20220401..20220430 and not flag:attach --format='xml' > temp/mail.xml
# mu find 发票 date:20220401..20220430 flag:attach --exec "mu extract -a --target-dir=temp"
# mv temp/*.pdf pdf/
