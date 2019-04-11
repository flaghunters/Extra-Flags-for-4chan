#!/usr/bin/python3

# this script finds folders with no associated flag png.
import os


def is_in(list_to_check, string_to_check):
    result = False
    if any(string_to_check in s for s in list_to_check):
        result = True
    return result


# traverse root directory, and list directories as dirs and files as files
dir_to_test = u'../flags'
print("The following directories have no associated flag png:")
for root, dirs, files in os.walk(dir_to_test):
    for current_name in dirs:
        if not is_in(files, current_name):
            print(os.path.join(root, current_name))


# pseudocode:
# get set of dirs
# get set of png files
# check dir, compare to set of png files
# if match, continue
# if no match, print dir filename
