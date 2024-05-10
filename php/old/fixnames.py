"""Old stuff to convert french characters in flag names."""

import os, codecs, requests, json
from pathlib import Path

destFolder = Path(__file__).parent / "togloss" / "Tarn"


def extract_values(obj, key):
    """Pull all values of specified key from nested JSON."""
    arr = []

    def extract(obj, arr, key):
        """Recursively search for values of key in JSON tree."""
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, (dict, list)):
                    extract(v, arr, key)
                elif k == key:
                    arr.append(v)
        elif isinstance(obj, list):
            for item in obj:
                extract(item, arr, key)
        return arr

    results = extract(obj, arr, key)
    return results


files = [each for each in os.listdir(destFolder) if each.endswith(".png")]

valid = []
with codecs.open("names.txt", encoding="utf-8", mode="r") as names:
    valid = names.read().split("\n")

valid = [x.strip() for x in valid]

mangledValid = []
replDict = {
    " ": "",
    "_": "",
    "-": "",
    "'": "",
    "à": "a",
    "â": "a",
    "è": "e",
    "é": "e",
    "ê": "e",
    "ë": "e",
    "î": "i",
    "ï": "i",
    "ô": "o",
    "œ": "oe",
    "ù": "u",
    "û": "u",
    "ü": "u",
    "ÿ": "y",
    "ç": "c",
}

for x in valid:
    re = x.lower()
    for src, dest in replDict.items():
        re = re.replace(src, dest)
    mangledValid.append(re)

mangledDest = []
for x in files:
    re = x.lower()
    re = os.path.splitext(re)[0]
    for src, dest in replDict.items():
        re = re.replace(src, dest)
    mangledDest.append(re)

destDict = dict(zip(mangledValid, valid))
srcDict = dict(zip(files, mangledDest))

for f in files:
    if f in srcDict:
        mangled = srcDict[f]
        if mangled in destDict:
            newName = destDict[mangled] + ".png"
            os.replace(destFolder / f, destFolder / newName)
        else:
            r = requests.get(
                "https://fr.wikipedia.org/w/api.php?action=opensearch&search="
                + f.replace(".png", "")
                + "&limit=1&format=json"
            )
            extract = ""
            try:
                title = json.loads(r.text)[1][0]
                r2 = requests.get(
                    "https://fr.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles="
                    + title
                )
                extract = extract_values(r2.json(), "extract")[0]
            except:
                pass
            print(
                "not found:",
                os.path.splitext(f)[0],
                " / ",
                extract[0 : min(100, len(extract))],
            )
    else:
        # this shouldn't happen
        print("not found:", os.path.splitext(f)[0])

print("end.")
