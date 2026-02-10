#!/bin/bash

if [ -d "/mnt/volume_nyc1_01" ]; then
	# This is the DO server
	BackupRoot="/mnt/volume_nyc1_01/db-entities-backup"
	DbUser="root"
else
	# This is a factory server
	BackupRoot="/home/xcorp/db-entities-backup"
	DbUser="xeco_staging"
fi

writeEntities()
{
	cd $BackupRoot
	Moment=`date +%Y-%m-%d_%H:%M`
	mysqldump -u $DbUser -pxecopass --ignore-table=xeco.meterdata --ignore-table=xeco.meterdata_clone --ignore-table=xeco.meterdataaggregate --ignore-table=xeco.permeterdataaggregate xeco > db.entities.sql
	zip "$1/db.entities.$Moment.zip" db.entities.sql
	rm db.entities.sql
}

deletedOlderThan() {
	find $BackupRoot/last-7-days -mtime +$1 -type f -delete
}

mkdir -p $BackupRoot/last-7-days
mkdir -p $BackupRoot/all-time

case $1 in
	"hourly")
		writeEntities last-7-days
		deletedOlderThan 7
		;;
	"weekly")
		writeEntities all-time
		;;
	*)
		echo "unrecognized option! nothing to be done here"
		;;
esac
