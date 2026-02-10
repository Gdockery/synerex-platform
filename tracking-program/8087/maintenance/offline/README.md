# Offline maintenance of the Xeco VM and application <!-- omit in toc -->

There are three parts to the offline installation:
1. `code.zip` (the code pack) - contains the Xeco-Portal codebase
2. `node_modules.zip` (the `node_modules` pack) - a zip file containing all node modules required by the application
3. `package.box` - the `xeco-vm` box which serves as the base for creating a new VMs

Having this broken down in 3 parts should make the update process of any part simple and quick.

This document describes usual tasks related to the maintenance of offline instalations:
- [Re-generate the `code` pack](#re-generate-the-code-pack)
- [Re-generate the `node_modules` pack](#re-generate-the-nodemodules-pack)
- [Re-generate the `xeco-vm` box](#re-generate-the-xeco-vm-box)
- [Install `xeco-vm` box](#install-xeco-vm-box)
- [Create a Xeco VM instance](#create-a-xeco-vm-instance)

---

## Re-generate the `code` pack
>**REQUIRES**: github auth info

Two ways to do this:
1. Download and manually archive it:
   - Clone from github; will create a local `Xeco-Portal` folder:
    
            git clone https://github.com/Gdockery/Xeco-Portal.git
   - Zip it:

            zip -r code Xeco-Portal
   - This will yield `code.zip`
2. Or, download the zip directly from github https://github.com/Gdockery/Xeco-Portal/archive/master.zip
    **NOTE**: this needs login first

---

## Re-generate the `node_modules` pack
>**REQUIRES**: a running VM + code

- Login into the VM:

        vagrant ssh
- Reinstall the needed node modules:

        rm -rf node_modules/ ~/.node-gyp/ ~/.npm/; npm install
- Exit the VM
- Create the archive:

        zip -r --symlinks node_modules node_modules
- This will yield `node_modules.zip`

---

## Re-generate the `xeco-vm` box

- Create a folder that will hold the generated files
- Copy [`maintenance/offline/Vagrantfile.XecoVM`](./Vagrantfile.XecoVM) as `Vagrantfile` in your folder
- To create the VM, in that folder run:

        vagrant up
- Login:

        vagrant ssh
- Replace the generated authorized key with the default one, so the Vagrant script ca login after creating an instance of this box:

        echo "ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA6NF8iallvQVp22WDkTkyrtvp9eWW6A8YVr+kz4TjGYe7gHzIw+niNltGEFHzD8+v1I2YJ6oXevct1YeS0o9HZyN1Q9qgCgzUFtdOKLv6IedplqoPkcmF0aYet2PkEDo3MlTBckFXPITAMzF8dJSIFo9D8HfdOV0IAdx4O7PtixWKn5y2hMNG0zQPyUecp4pzC6kivAIhyfHilFR61RGL+GPXQ2MWZWFYbAGjyiYJnAmCP3NOTd0jMZEnDkbUvxhMmBYSdETk1rRgm+R4LOzFUGaHqHDLKLX+FIPKcF96hrucXzcWyLbIbEgE98OHlnVYCzRdK8jlqm8tehUc9c9WhQ== vagrant insecure public key" > ~/.ssh/authorized_keys
    **NOTE** key content: https://raw.githubusercontent.com/hashicorp/vagrant/master/keys/vagrant.pub
- Exit the VM
- Stop the VM:

        vagrant halt
- Create the box package:

        vagrant package --base
- This would have generated a `package.box` file in your folder

---

## Install `xeco-vm` box
>**REQUIRES**: getting the xeco-vm `package.box` file

- (optional) Remove previous `xeco-vm` installation:
 
        vagrant box remove xeco-vm
- Install the new `xeco-vm` box in Vagrant:
  
        vagrant box add --name xeco-vm package.box

---

## Create a Xeco VM instance
>**REQUIRES**: `xeco-vm` box to have been previously installed

- (optional) Destroy existing VM:

        vagrant destroy
- (optional) Decompress `code` pack if needed
- (optional) Decompress `node_modules` pack
- Copy [`maintenance/offline/Vagrantfile.Offline`](./Vagrantfile.Offline) as `Vagrantfile` into your folder
- Create the VM:

        vagrant up

---
