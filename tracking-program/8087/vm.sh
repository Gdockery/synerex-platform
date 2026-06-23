#!/bin/bash

VM_NAME="Synerex-Portal_default_1543627446179_9563"

case $1 in
    start)
        read -sp 'Encryption password: ' PASSWORD

        echo $PASSWORD > .password

        echo ""

        VBoxManage startvm "$VM_NAME" --type headless
        VBoxManage controlvm "$VM_NAME" addencpassword "xcorp" ".password"

        rm .password
        ;;

    stop)
        VBoxManage controlvm "$VM_NAME" acpipowerbutton
        ;;

    poweroff)
        VBoxManage controlvm "$VM_NAME" poweroff
        ;;

    status)
        VBoxManage showvminfo "$VM_NAME" | grep "State:"
        ;;

    info)
        VBoxManage showvminfo "$VM_NAME"
        ;;

    ssh)
        ssh -p 2222 vagrant@${VAGRANT_HOST}
        ;;

    *)
        echo "Usage: $0 {start|stop|poweroff|status|info|ssh}"
        exit 1
esac
