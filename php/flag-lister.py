import os
import click
from pathlib import Path
import pyuca
import logging

logger = logging.getLogger(__name__)

ALL_FLAGS = Path(__file__).parent / "flag_list_api2.txt"
FLAG_LIST = "flag_list.txt"
PNG_EXT = ".png"
ROOT_DIR = "../flags"
ROOT_PATH = Path(__file__).parent / ROOT_DIR
CONTEXT_SETTINGS = dict(help_option_names=["-h", "--help"])

NEW_LINE = {"LF": "\n", "CRLF": "\r\n", "CR": "\r"}


@click.command(context_settings=CONTEXT_SETTINGS)
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose mode")
@click.option(
    "--redo-all",
    "-a",
    is_flag=True,
    default=False,
    help="Recreate all files from scratch.",
)
@click.option(
    "--new-line",
    "-n",
    type=click.Choice(["LF", "CRLF", "CR"], case_sensitive=False),
    default="LF",
    show_default=True,
    help="Choose the new line character",
)
def main(verbose: bool, redo_all: bool, new_line: str):
    """Traverses the root directory in search for invalid file extensions"""
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=log_level, format="%(message)s")

    sep = NEW_LINE[new_line]

    logger.info("Managing flag list files.")
    logger.debug("Working directory: %s", os.getcwd())
    logger.debug("Flags directory: %s", str(ROOT_PATH.absolute()))

    collator = pyuca.Collator()
    all_flags = set()

    for root, _, files in os.walk(ROOT_PATH):
        # skip the main folder as we don't store pngs for states.
        if ROOT_PATH.samefile(root):
            continue
        root_path = Path(root)
        logger.debug("Current dir: %s", root_path)
        pngs = [Path(file).stem for file in files if Path(file).suffix == PNG_EXT]
        pngs = sorted(pngs, key=collator.sort_key)
        all_flags.update(pngs)

        with open(root_path / FLAG_LIST, "a+t", encoding="utf-8") as flags:
            flags.seek(0)
            read_flags = flags.readlines()
            read_flags = [flag.rstrip() for flag in read_flags]
            if read_flags != pngs or redo_all:
                logger.info("Fixing: %s", root_path)
                flags.seek(0)
                flags.truncate()
                flags.writelines([png + sep for png in pngs])
    
    logger.info("Deleting api list...")
    with open(ALL_FLAGS, "wt", encoding="utf-8") as flags:
        logger.info("Creating api list...")
        all_flags_list = sorted(all_flags, key=collator.sort_key)
        flags.writelines([flag + sep for flag in all_flags_list])
        
    countries = []
    with open (os.path.join(ROOT_PATH,FLAG_LIST), encoding="utf-8") as f:
        countries = f.read().splitlines()
    countrydirs = []
    for subdir in os.listdir(ROOT_PATH):
        if os.path.isdir(os.path.join(ROOT_PATH,subdir)):
            countrydirs += [os.path.basename(subdir)]
    difference = list(set(countrydirs) - set(countries))
    inverse_difference = list(set(countries) - set(countrydirs))
    if len(difference) > 0:
        logger.info("New country(ies) added: %s", ", ".join(sorted(difference)))
    if len(inverse_difference) > 0:
        logger.info("Renamed or deleted: %s", ", ".join(sorted(inverse_difference)))
    with open (os.path.join(ROOT_PATH,FLAG_LIST), 'w', encoding="utf-8") as f:
        f.write('\n'.join(sorted(countrydirs, key=collator.sort_key))+'\n')


if __name__ == "__main__":
    main()
