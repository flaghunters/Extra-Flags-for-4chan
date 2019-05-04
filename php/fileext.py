#!/usr/bin/python3

# this scripts finds files that don't have the correct extension
import os

extensions = [".png", ".txt"]

# traverse root directory, and list directories as dirs and files as files
dir_to_test = u'../flags'
count=0
print("The following files are neither pngs nor txts:")
for root, dirs, files in os.walk(dir_to_test):
    for file in files:
        current_file=os.path.join(root, file)
        if not (os.path.splitext(current_file)[1] in extensions):
            print(current_file)
            count+=1

print("\nTotal files found:",count)