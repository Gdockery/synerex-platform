#!/bin/bash

mysql -uxeco_staging -pxecopass -e "select * from synerex.project;" > output.txt 

