#!/usr/bin/python3

"""This scripts finds files that don't have the correct extension."""

import os
from pathlib import Path
import click

FILE_EXTS = [".png", ".txt"]
ROOT_DIR = u'../flags'
ROOT_PATH = Path(ROOT_DIR)

@click.command(context_settings=dict(ignore_unknown_options=True))
@click.option("--verbose", "-v",
              is_flag=True,
              help="Enable verbose mode")
def main(verbose: bool):
    """Traverses the root directory in search for invalid file extensions"""

    occurrences = 0

    if verbose:
        print("The following files are neither pngs nor txts:")

    for root, _, files in os.walk(ROOT_DIR):
        # skip the main folder as we don't store pngs for states.
        if ROOT_PATH.samefile(root):
            continue
        root_path = Path(root)
        for file in files:
            current_file = root_path.joinpath(file)
            if current_file.suffix not in FILE_EXTS:
                print(current_file)
                occurrences += 1

    if verbose:
        print(f"Total files found: {occurrences}")

if __name__ == "__main__":
    main() # pylint: disable=no-value-for-parameter
