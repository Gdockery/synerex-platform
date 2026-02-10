#!/bin/bash

newVal=$(</var/tmp/maxkvanew)
if test -f "/var/tmp/sdmlog"; then
  if test -f "/home/pi/maxkvaold"; then
	#echo "a=$a";
	#echo "b=$b";
	oldVal=$(</home/pi/maxkvaold)
	echo $newVal $oldVal

	if [ $newVal -gt $oldVal  ];
	then
	    echo $((newVal > oldVal))
	    echo $newVal > /home/pi/maxkvaold
	    sudo mv /var/tmp/sdmlogx /var/tmp/sdmlog
	fi;
  else
	echo $newVal > /home/pi/maxkvaold
	sudo mv /var/tmp/sdmlogx /var/tmp/sdmlog
  fi
else
	echo $newVal > /home/pi/maxkvaold
	sudo mv /var/tmp/sdmlogx /var/tmp/sdmlog
fi

