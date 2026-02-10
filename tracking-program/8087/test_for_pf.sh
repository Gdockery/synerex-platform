#!/bin/bash

if ! test -f "/home/pi/stayoff"; then
  if test -f "/home/pi/turnon"; then
    if test -f "/home/pi/pfison" && ! test -f "/home/pi/OFF"; then
      echo "pf is on"
      sudo rm /home/pi/pfisoff
    else 
      echo "turn on pf"
      /opt/sdm630/sdm630_on
      sudo rm /home/pi/turnon
      sudo rm /home/pi/pfisoff
      sudo touch /home/pi/pfison
    fi
  fi

  if test -f "/home/pi/turnoff"; then
    if test -f "/home/pi/pfisoff"; then
      echo "pf is off"
      sudo rm /home/pi/pfison
    else 
      echo "turn off pf"
      /opt/sdm630/sdm630_off
      sudo rm /home/pi/turnoff
      sudo rm /home/pi/pfison
      sudo touch /home/pi/pfisoff
    fi
  fi
else
  /opt/sdm630/sdm630_off
  sudo rm /home/pi/turnoff
  sudo rm /home/pi/pfison
  sudo touch /home/pi/pfisoff
fi
