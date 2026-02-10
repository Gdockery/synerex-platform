#!/bin/bash

mysql -uxeco_staging -pxecopass -e "select * from xeco.project;" > output.txt 

