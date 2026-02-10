#!/bin/bash

NUM=`/bin/journalctl -n 20000 | /bin/grep "ollup" | /usr/bin/wc -l`

/bin/echo $NUM

/bin/echo "Time: $(date)"

if (( $NUM < 1 )); then
	/bin/echo "Time: $(date) Rollup stopped, restarting" >> /vagrant/restartedRollup
	/bin/systemctl stop rollup
    # call the curl
    /usr/bin/curl -X POST "${ROLLUP_SERVICE_URL}/daily-calculations"
    /bin/sleep 15 
	/bin/systemctl start rollup
fi
