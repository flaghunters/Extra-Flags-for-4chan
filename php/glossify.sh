#!/bin/bash

# Depends on imagemagicks composite
# Made by ohgod AT whatisthisimnotgoodwithcomputers DOT com

GLOSS_TEMPLATE="Gloss Template 3 (Use this one).png"

for flag in togloss/*;
do
	echo -e "Glossing: \033[05;44;33m$flag\033[0m..."
	$(composite "$GLOSS_TEMPLATE" "$flag" "$flag")
	echo "Done"
done

echo -e "Running \033[05;44;33moptipng\033[0m..."
$(optipng -o7 togloss/*)

exit 0
