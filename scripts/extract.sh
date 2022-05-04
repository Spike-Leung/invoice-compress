#!/usr/bin/env bash
echo "Empty pdf folder..."
rm -rfI ./pdf

echo "\n\nExtract mail with pdf..."
./scripts/extract-pdf.sh $1

echo "\n\nExtract mail with links..."
./scripts/extract-link.sh $1

echo "Compress all pdf invoice"
date=`date '+%Y%m'`
zip -v ./pdf/invoce_$date.zip ./pdf/*.pdf
