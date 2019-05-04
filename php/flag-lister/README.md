# flag-lister

This folders contain the sources of flag-lister. It's been developed using IntelliJ Idea Community Edition so this folder contains everything needed to build the .jar file.

This project is intended to replace and extend the previous flag-lister made by an anonimous previous /flag/tist.

The main improvements wrt the previous version are:

- the smart mode enabled by the `-s` command line flag. This updates only the flag-list.txt files that need to be updated and not the complete remake of all of them. For common operations on the repository this cuts the running times by at least an order of magnitude.
- the possibility to choose the end line character for your system with the `-n <number>` flag.


# Changelog

## v1.1 May 2019

added the command line options and refactor of some portions of the code

## v1.0? before 2017?
Added everything