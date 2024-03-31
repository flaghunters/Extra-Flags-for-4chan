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


@click.command(context_settings=CONTEXT_SETTINGS)
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose mode")
def main(verbose: bool):
    """Traverses the root directory in search for invalid file extensions"""
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=log_level, format="%(message)s")

    sep = "\n"  # os.linesep

    logger.info("Managing flag list files.")
    logger.debug("Working directory: %s", os.getcwd())
    logger.debug("Flags directory: %s", str(ROOT_PATH.absolute()))

    collator = pyuca.Collator()
    the_mega_list = set()

    for root, _, files in os.walk(ROOT_PATH):
        # skip the main folder as we don't store pngs for states.
        if ROOT_PATH.samefile(root):
            continue
        root_path = Path(root)
        logger.debug("Current dir: %s", root_path)
        pngs = [Path(file).stem for file in files if Path(file).suffix == PNG_EXT]
        pngs = sorted(pngs, key=collator.sort_key)
        the_mega_list.update(pngs)

        with open(root_path / FLAG_LIST, "r+t", encoding="utf-8") as flags:
            read_flags = flags.readlines()
            read_flags = [flag[:-1] for flag in read_flags]
            if read_flags != pngs:
                logger.info("Fixing: %s", root_path)
                flags.seek(0)
                flags.truncate()
                flags.writelines(sep.join(pngs))

    logger.info("Deleting api list...")
    with open(ALL_FLAGS, "wt", encoding="utf-8") as flags:
        logger.info("Creating api list...")
        the_mega_list = sorted(the_mega_list, key=collator.sort_key)
        flags.writelines(sep.join(the_mega_list))


if __name__ == "__main__":
    main()  # pylint: disable=no-value-for-parameter
