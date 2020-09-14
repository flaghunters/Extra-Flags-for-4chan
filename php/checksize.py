#!/usr/bin/python3

# WARNING
# needs pillow
# python -m pip install pillow

# this script finds flags with wrong resolution or suspiciously high disk size.
import os,io,sys
from PIL import Image  # uses pillow

threshold = 800 #bytes
extensions = [".png"]

# traverse root directory, and list directories as dirs and files as files
dir_to_test = u'../flags'
print("The following files have non standard dimensions or suspiciously high file size:")
for root, dirs, files in os.walk(dir_to_test):
    for current_file in files:
        if not (os.path.splitext(current_file)[1] in extensions):
            continue
        fullname=os.path.join(root,current_file)
        im = Image.open(fullname)
        if (im.height != 11 or (im.height == 11 and im.width != 16 and im.width !=11)):
            print(fullname, im.size)
            continue
        if os.path.getsize(fullname)>threshold:
            print(fullname, os.path.getsize(fullname),"bytes")
            #os.system('optipng.exe -o7 -strip all "%s"' % fullname)
