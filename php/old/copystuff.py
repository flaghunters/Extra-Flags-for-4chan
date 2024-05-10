"""old stuff to replace all flags with halloween ones."""

import os, shutil, random

masks = [".png"]

dir_to_test = "../flags"
dir_to_src = "./xmas"

flags = os.listdir(dir_to_src)
nflags = len(flags)

# flags = ['Spoooky1.png','Spoooky2.png','Spoooky3.png','Spoooky4.png','Spoooky5.png']

# dirs = os.listdir(dir_to_test)
#
# for dir in dirs:
#   destdir = dir_to_test + "/" + dir
#   if not os.path.isdir(destdir):
#     continue
#   destfile = destdir + "/Spoooky.png"
#   idx = random.randint(0,len(flags)-1)
#   shutil.copyfile(flags[idx],destfile)
#
# print(dirs)

for dirpath, dirnames, filenames in os.walk(dir_to_test):
    print(dirpath)
    # exclude gloss templates and such
    if dirpath[-6:] == "/flags":
        continue
    pngs = [f for f in filenames if os.path.splitext(f)[1] in masks]
    for filename in pngs:
        idx = random.randint(0, nflags - 1)
        srcfile = dir_to_src + "/" + flags[idx]
        destfile = dirpath + "/" + filename
        try:
            shutil.copyfile(srcfile, destfile)
        except:
            print("Exception raised copying a flag in : " + dirpath + "/" + filename)
