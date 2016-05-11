ls -1d -- */ | sed 's/\/$//' | sed 's/\ /\\\ /g'> .dir.txt
while read directory
do
	cd "$PWD/$directory";
	ls -p1 | grep -v / | sed -e 's/\..*$//' | grep -v "flag_list" > flag_list.txt;
	cd ".."
done < .dir.txt
	
ls -p1 | grep -v / | sed -e 's/\..*$//' | grep -v "flag_list" > flag_list.txt


