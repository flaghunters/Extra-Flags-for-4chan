#!/bin/bash

# generate_flag_list
# Bash script to generate a list of all flags in the flags subdir
# Created for flaghunters by WhatIsThisImNotGoodWithComputers (ohgod AT whatisthisimnotgoodwithcomputers DOT com)

#vars
#FILE default="./flag_list.txt"
FILE="./flag_list.txt"
PATH_RELATIVE=../flegs/*/

rm "${FILE}"
ls -R $PATH_RELATIVE > "${FILE}"
sed -i '/:/d' "${FILE}"
sed -i '/^$/d' "${FILE}"
sed -i 's/.png//g' "${FILE}"

exit 0
