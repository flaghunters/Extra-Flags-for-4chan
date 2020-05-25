#!/usr/bin/python3

# this scripts finds empty flag folders (or with just the .txt file)
import os

extensions = [".png"]

# traverse root directory, and list directories as dirs and files as files
dir_to_test = u'../flags'
print("The following directories don't contain any flags:")
for root, dirs, files in os.walk(dir_to_test):
    if len(files)==0:
        print(root)
        continue
    count=0
    for file in files:
        current_file=os.path.join(root, file)
        if (os.path.splitext(current_file)[1] in extensions):
            count+=1
            break
    if count==0:
        print(root)
        continue

#print("\nTotal folders found:",count)