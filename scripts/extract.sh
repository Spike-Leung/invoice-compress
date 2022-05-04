#!/usr/bin/env bash
# https://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux
BYellow='\033[1;33m'
BGreen='\033[1;32m'
echo "${BYellow}Empty pdf folder..."
rm -rfI ./pdf/*

echo "\n\n${BYellow}Extract mail with pdf..."
./scripts/extract-pdf.sh $1

echo "\n\n${BYellow}Extract mail with links..."
./scripts/extract-link.sh $1

echo "${BYellow}Compress all pdf invoice"
date=`date '+%Y%m'`
zip -q ./pdf/invoce_$date.zip ./pdf/*.pdf

echo "${BGreen}Done! You can find your invoice under ./pdf folder :)"
open ./pdf
