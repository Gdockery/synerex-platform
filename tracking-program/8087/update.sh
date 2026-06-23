#!/bin/bash

SERVICES="rollup device-processor mqtt-http web"
PASSPHRASE="Dag_lMSOpBntO9LQf9mrlgyOIchgDry"
TMP="/tmp/synerex-update"
SERVICE_PIPE="/tmp/synerex-update-service"

TEMP_FILES=()


prepare()
{
	case $1 in

		tempFolder)
			mkdir -p "$TMP"
			tempFolderCreated=1
			;;
		
		servicePipe)
			mkfifo $SERVICE_PIPE
			servicePipeCreated=1
			;;

	esac
}

willCleanup()
{
	TEMP_FILES+=($1)
}

cleanup()
{
	if [ $tempFolderCreated ]; then rm -rf "$TMP"; fi
	if [ $servicePipeCreated ]; then rm -f "$SERVICE_PIPE"; fi

	for i in "${TEMP_FILES[@]}"
	do
		[ -f $i ] && rm -f $i
		[ -d $i ] && rm -rf $i
	done
}

err()
{
	echo "$1"
	exit 1
}

assertWritable()
{
	rm -rf "$1"
	if [ -e $1 ]
	then
		err "Error: can not remove $1"
	fi

	touch "$1"
	if [ ! -f $1 ]
	then
		err "Error: can not create $1"
	fi

	rm -f "$1"
}

trap cleanup EXIT


case $1 in
	apply)
		assertWritable $TMP
		prepare tempFolder

		if [ ! -f $2 ]
		then
			err "Error: Missing input file"
		fi

		gpg -o "$TMP/tar" -d --batch --passphrase "$PASSPHRASE" "$2"
		if [ $? -gt 0 ]
		then
			err "Error: Could not decrypt"
		fi

		sudo rm -f $2

		cd "$TMP"

		tar -xhzf tar
		if [ $? -gt 0 ]
		then
			err "Error: Could not uncompress"
		fi

		sudo rm -f tar

		targetFolder="/vagrant"
		if [ -d $3 ]
		then
			targetFolder=$3
		fi

		eval "sudo systemctl stop $SERVICES"
		sudo rm -rf "$targetFolder-rollback"
		sudo cp -a "$targetFolder" "$targetFolder-rollback"

		# remove old files
		while read line; do
			rm -f "$targetFolder/$line"
		done <.oldFiles
		rm -f .oldFiles

		# remove old folders
		while read line; do
			rm -rf "$targetFolder/$line"
		done <.oldFolders
		rm .oldFolders

		# create new folders
		while read line; do
			mkdir -p "$targetFolder/$line"
		done <.newFolders
		rm .newFolders

		# copy/overwrite new files
		find . -type f -exec mv -f "{}" "$targetFolder/{}" \;

		rm /tmp/synerex-update-status
		eval "sudo systemctl start $SERVICES"
		;;

	rollback)
		targetFolder="/vagrant"
		if [ -d $2 ]
		then
			targetFolder=$2
		fi

		if [ ! -d "$targetFolder-rollback" ]
		then
			err "Error: Missing rollback folder"
		fi

		eval "sudo systemctl stop $SERVICES"
		sudo rm -rf "$targetFolder"
		sudo mv "$targetFolder-rollback" "$targetFolder"
		rm /tmp/synerex-update-status
		eval "sudo systemctl start $SERVICES"
		;;

	encrypt)
		gpg -c --batch --passphrase "$PASSPHRASE" -a 2>/dev/null <&0
		;;

	decrypt)
		gpg -d --batch --passphrase "$PASSPHRASE" 2>/dev/null <&0
		;;

	request-apply)
		if [ ! -p $SERVICE_PIPE ]
		then
			err "Error: Update service not running?"
		fi

		echo "apply $2 $3" >$SERVICE_PIPE
		;;

	request-rollback)
		if [ ! -p $SERVICE_PIPE ]
		then
			err "Error: Update service not running?"
		fi

		echo "rollback $2" >$SERVICE_PIPE
		;;

	service)
		prepare servicePipe

		while true
		do
			read line <$SERVICE_PIPE
			eval "$0 $line"
		done
		;;

	list-files)
		assertWritable $2
		
		sourceFolder="/vagrant"
		if [ -d $3 ]
		then
			sourceFolder=$3
		fi

		cd "$sourceFolder"

		echo "--- folders ---" > "$2"

		echo "Listing folders..."
		find . -path "./.*" -prune -o -type d -print >> "$2"

		# IGNORING LINKS, as all of them right now are for node modules "binaries"

		echo "--- checksums ---" >> "$2"

		echo "Computing file checksums..."
		find . -path "./.*" -prune -o -type f -exec crc32 "{}" + >> "$2"
		;;

	pack)
		assertWritable "$3"
		assertWritable "$3.tar"
		willCleanup "$3.tar"

		if [ ! -e $2 ]
		then
			err "Error: Missing input"
		fi

		workDir=`dirname "$2"`
		fileName=`basename "$2"`

		tar -czf "$3.tar" -C "$workDir" "$fileName"
		gpg -o "$3" -c --batch --passphrase "$PASSPHRASE" "$3.tar"
		;;

	pack-list)
		assertWritable "$3"
		assertWritable "$3.tar"
		willCleanup "$3.tar"

		if [ ! -f $2 ]
		then
			err "Error: Missing input file list"
		fi

		tar -czf "$3.tar" -T "$2"
		gpg -o "$3" -c --batch --passphrase "$PASSPHRASE" "$3.tar"
		;;

	unpack)
		assertWritable "$2.tar"
		willCleanup "$2.tar"

		targetFolder=`dirname "$2"`
		if [ -d $3 ]
		then
			targetFolder=$3
		fi

		if [ ! -f $2 ]
		then
			err "Error: Missing input file"
		fi

		gpg -o "$2.tar" -d --batch --passphrase "$PASSPHRASE" "$2"
		if [ $? -gt 0 ]
		then
			err "Error: Could not decrypt"
		fi

		tar -xhzf "$2.tar" -C $targetFolder
		if [ $? -gt 0 ]
		then
			err "Error: Could not uncompress"
		fi
		;;

	*)
		err "Usage: $0 {create <outputFile>|(apply|request-apply) <inputFile>|(rollback|request-rollback)|service|(encrypt|decrypt) message}"
		;;
esac
