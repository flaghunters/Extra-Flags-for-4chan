package com.whatisthisimnotgoodwithcomputers;

import java.io.*;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.Collator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

public class Main {
    private static final String FLAG_LIST_API2 = "flag_list_api2.txt";
    private static final String FLAG_LIST = "flag_list.txt";
    private static final String WORKING_DIR = (new File(System.getProperty("user.dir"))).getAbsolutePath();
    private static final String FLAG_DIR = (new File(System.getProperty("user.dir"))).getParentFile().getAbsolutePath() + "/flags";
    private static HashSet<String> apiSet = new HashSet();

    private static String newLineChar = "\n";
    private static boolean smartMode = false;

    private static final int CRLF=0;
    private static final int LF  =1;
    private static final int CR  =2;

    private static String versionMessage = "flag-lister v1.1\n"+
            "Ebinbuddha 2019\n"+
            "Based upon 'flag-lister' made by some older flagtist\n";

    private static String helpMessage = "flag-lister [-h] [-n number] [-s] [-v]\n\n"+
            "[-h] prints this help text\n"+
            "[-n number] sets the new line char\n"+
            "\t0: Windows (default)\n\t1: Unix\n\t2: Mac\n"+
            "[-s] replaces only files that need replacement. May take longer but spares your SSD\n"+
            "[-v] prints version\n";

    public Main() {
    }

    private static void parseArgs(String[] args) throws Exception {
        for (int i=0; i<args.length; ++i){
            // set the smart mode
            if ("-s".equals(args[i])) {
                smartMode=true;
                continue;
            }

            // set the new line character
            if ("-n".equals(args[i]) && i< args.length-1){
                setNewLineChar(Integer.parseInt(args[++i]));
                continue;
            }

            // print version message
            if ("-v".equals(args[i])) {
                System.out.println(versionMessage);
                System.exit(0);
            }

            if ("-h".equals(args[i])) {
                System.out.println(helpMessage);
                System.exit(0);
            }
        }
    }

    private static void setNewLineChar(int newLineCharEnum) throws Exception {
        switch (newLineCharEnum) {
            case CRLF:
                newLineChar = "\r\n";
                break;
            case LF:
                newLineChar = "\n";
                break;
            case CR:
                newLineChar ="\r";
                break;
            default:
                throw new Exception("Invalid new line character.");
        }
    }

    private static void printCurrentDirectory(String path) {
        System.out.println("Current dir: "+path);
    }

    private static void manageFileList(String path, String[] fileList) throws IOException{
        String filePath = path + "/" + FLAG_LIST;
        printCurrentDirectory(path);

        File flagListFile = new File(filePath);

        if (smartMode && flagListFile.exists()) {
            ArrayList<String> savedList = (ArrayList<String>) Files.readAllLines(Paths.get(filePath), Charset.forName("UTF-8"));
            // skip if lists are equal
            if (areSortedListsEqual(savedList,fileList)) {return;}
        }

        // create it again
        flagListFile.delete();
        System.out.println("Creating new list file...");
        BufferedWriter outputWriter = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(flagListFile), "UTF-8"));

        for(int i = 0; i < fileList.length; ++i) {
            outputWriter.write(fileList[i]);
            outputWriter.write(newLineChar);
        }

        outputWriter.flush();
        outputWriter.close();
    }

    private static boolean areSortedListsEqual(ArrayList<String> list1, String[] list2) {
        int l1 = list1.size();
        int l2 = list2.length;
        if (l1 != l2) {
            return false;
        }
        for (int i = 0; i <= list1.size() - 1; ++i) {
            if (! list1.get(i).equals(list2[i])) {return false;}
        }
        return true;
    }

    private static void handleApiFile() throws IOException{
        System.out.println("Deleting api list...");
        File api2ListFile = new File(WORKING_DIR + "/" + FLAG_LIST_API2);
        api2ListFile.delete();

        System.out.println("Creating api list...");
        List<String> apiList = new ArrayList(apiSet);
        Collections.sort(apiList, new Comparator<String>() {
            public int compare(String o1, String o2) {
                if (o1.startsWith(o2)) {
                    return 1;
                } else if (o2.startsWith(o1)) {
                    return -1;
                } else {
                    Collator usCollator = Collator.getInstance(Locale.US);
                    return usCollator.compare(o1, o2);
                }
            }
        });
        // remove garbage
        apiList.remove(".DS_Store");
        BufferedWriter bufferedWriter = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(WORKING_DIR + "/" + FLAG_LIST_API2), "UTF-8"));
        Iterator i$ = apiList.iterator();

        while(i$.hasNext()) {
            String stringEntry = (String)i$.next();
            bufferedWriter.write(stringEntry);
            bufferedWriter.write(newLineChar);
        }

        bufferedWriter.flush();
        bufferedWriter.close();
    }

    private static void handleSubDir(String folderString) throws IOException {
        File currentDir = new File(folderString);
        String[] pngs = currentDir.list(new FilenameFilter() {
            public boolean accept(File current, String name) {
                return (new File(current, name)).isFile() && ".png".equalsIgnoreCase(name.substring(name.lastIndexOf('.')));
            }
        });

        for(int i = 0; i < pngs.length; ++i) {
            pngs[i] = pngs[i].replace(".png", "");
        }

        Arrays.sort(pngs, new Comparator<String>() {
            public int compare(String o1, String o2) {
                if (o1.startsWith(o2)) {
                    return 1;
                } else if (o2.startsWith(o1)) {
                    return -1;
                } else {
                    Collator usCollator = Collator.getInstance(Locale.US);
                    return usCollator.compare(o1, o2);
                }
            }
        });

        manageFileList(folderString,pngs);

        // now iterate for all folders
        apiSet.addAll(Arrays.asList(pngs));
        String[] folders = currentDir.list(new FilenameFilter() {
            public boolean accept(File current, String name) {
                return (new File(current, name)).isDirectory();
            }
        });
        Arrays.sort(folders, new Comparator<String>() {
            public int compare(String o1, String o2) {
                if (o1.startsWith(o2)) {
                    return 1;
                } else if (o2.startsWith(o1)) {
                    return -1;
                } else {
                    Collator usCollator = Collator.getInstance(Locale.US);
                    return usCollator.compare(o1, o2);
                }
            }
        });

        for(int i = 0; i < folders.length; ++i) {
            handleSubDir(folderString + "/" + folders[i]);
        }

    }

    public static void main(String[] args) throws Exception {
        parseArgs(args);

        System.out.println("WORKING_DIR " + WORKING_DIR);
        System.out.println("FLAG_DIR " + FLAG_DIR);

        // get the flag directories
        File file = new File(FLAG_DIR);
        String[] countryDirectories = file.list(new FilenameFilter() {
            public boolean accept(File current, String name) {
                return (new File(current, name)).isDirectory();
            }
        });
        Arrays.sort(countryDirectories);

        // make country directories list
        System.out.println("Managing country list txt file...");
        manageFileList(FLAG_DIR,countryDirectories);

        // make sublocations txt files
        System.out.println("Recreating sublocations txt files...");

        for(int i = 0; i < countryDirectories.length; ++i) {
            handleSubDir(FLAG_DIR + "/" + countryDirectories[i]);
        }

        // make api file
        handleApiFile();
    }
}
