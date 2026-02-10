#!/bin/bash

if test -f "/home/pi/lastknowntime"; then
	echo "lastknowntime exists."
	printf -v beg '%(%s)T\n' $((`cat /home/pi/lastknowntime`))
	printf -v now '%(%s)T\n' $((`date +%s`))
	printf -v elapsed '%(%s)T\n' $((now-beg))
	echo beg=$beg now=$now elapsed=$elapsed

	if (($elapsed > 120)) ; then
		echo `date` >> /home/pi/timetracking
		echo beg=$beg now=$now elapsed=$elapsed >> /home/pi/timetracking
		echo "time changed" >> /home/pi/timetracking
		sudo killall python2
	fi
	if (($elapsed < -120)) ; then
		echo `date` >> /home/pi/timetracking
		echo beg=$beg now=$now elapsed=$elapsed >> /home/pi/timetracking
		echo "time changed backward" >> /home/pi/timetracking
		sudo killall python2
	fi

fi

date +%s > /home/pi/lastknowntime
