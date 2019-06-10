# Quick overview of the contents of this folder

## flag-lister.jar

Note: this requires java to be installed

This Java archive walks through the /flags folder and creates all the .txt files in each subfolder plus the flag_api_php2.txt file in this folder.

The .txt files in the /flag folder are downloaded by the plugin to display the list of selectable flags at each stage of the Extra Flags Setup process.

The sources of this .jar are in the /flag-lister folder. Refer to the README.md file there for further details.

### How to run flag-lister.jar

Use the scripts flag-lister.sh (on Unix systems) or flag-lister.bat (on Windows systems) to run the application.

If you want more control you can run it from the command line like this:

```
java -jar file-lister.jar [-h] [-n <number>] [-s] [-v]
```

where:

  - `-h`  shows the help message
  - `-n  <number>` sets the end line character according to `number`:
    - 0 for Windows style
    - 1 for Unix style (default)
    - 2 for Mac style
  - `-s`  enables the smart mode that avoids deleting the files that are already good instead of wiping everything to make them again from scratch
  - `-v`  displays the version information

## flag_list_api2.txt

Contains all the flag names in the repositories.
This gets updated by running the flag-lister.jar

## get_flag_api2.php and post_flag_api2.php

These files are the copies of the logic behind the server where user flags are stored. The first handle the request sent by the browser to get the flags that have to be shown on a given page, the latter handles the upload of the flag names when an extraflags user posts a new reply.

## Gloss Template*.png

The gloss layers that should be used when making flags.

## typo.py

Checks if each folder has its correpsonding flag.

This congruence if fundamental for the plugin or it can't navigate through flag levels properly.

E.g.
`United States\Minnesota`
need to have a `United States\Minnesota.png` flag or the plugin won't be able to see Minnesota's counties.

## fileext.py

Checks if the /flags folder contains only .png and .txt files.

It happens many times that operating systems use particular files and folders to manage their stuff (desktop.ini and .DS_store I'm looking at you) or flag makers forget to use the correct extension and produce .jpg of .gif files.

## emptyfolder.py

Checks if the /flags folders do actually contain at least a flag.

It may happen that a folder was created, but next level regionals were never added. The result is an empty folder or just an empty flag_list.txt file.

## checksize.py

Checks if the flags have standard dimensions (16x11, 11x11) and an usual file size (&lt;1KB).
The former may be totally fine for some exceptional cases but it's most likely a mistake made by the guy that made the flag in a hurry, the latter may indicate that the flags haven't undergone an optimization stage and/or contain useless metadata or color profiles.

Modern versions of Paint.NET and GIMP usually do optimize their output, but it may happen for some unknown reason that the file is still bloated. In this case no run of optipng will reduce the size to a more reasonable one and the files need to be exported again.
