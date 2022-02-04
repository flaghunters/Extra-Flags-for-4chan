#!/usr/bin/python3

"""This scripts finds empty flag folders (or with just the .txt file)."""

import os
from pathlib import Path
import click

FILE_EXTS = [".png"]
ROOT_DIR = u'../flags'
ROOT_PATH = Path(ROOT_DIR)

@click.command(context_settings=dict(ignore_unknown_options=True))
@click.option("--verbose", "-v",
              is_flag=True,
              help="Enable verbose mode")
def main(verbose: bool):
    """Traverses the tree to look for files without flags."""

    occurrences = 0

    if verbose:
        print("The following folders don't contain any flags:")

    for root, _, files in os.walk(ROOT_DIR):
        # skip the main folder as we don't store pngs for states.
        if ROOT_PATH.samefile(root):
            continue

        current_relative = Path(root).relative_to(ROOT_DIR)
        count = 0
        for file in files:
            current_file = Path(file)
            if current_file.suffix in FILE_EXTS:
                count += 1
                break
        if count == 0:
            print(current_relative)
            occurrences += 1
            continue

    if verbose:
        print(f"Total occurrences found: {occurrences}")

if __name__ == "__main__":
    main() # pylint: disable=no-value-for-parameter
