#!/usr/bin/python3

"""This script finds folders with no associated flag png."""

import os
from pathlib import Path
import click

ROOT_DIR = "../flags"
ROOT_PATH = Path(__file__).parent / ROOT_DIR


@click.command(context_settings=dict(ignore_unknown_options=True))
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose mode")
def main(verbose: bool):
    """Traverses the root directory to find folders with no associated flag image"""

    occurrences = 0

    if verbose:
        print("The following directories have no associated flag png:")

    for root, dirs, files in os.walk(ROOT_PATH):
        # skip the main folder as we don't store pngs for states.
        if ROOT_PATH.samefile(root):
            continue
        current_relative = Path(root).relative_to(ROOT_PATH)
        for current_name in dirs:
            image_name = current_name + ".png"
            if image_name not in files:
                print(current_relative.joinpath(current_name))
                occurrences += 1
        for current_file in files:
            current_path = Path(current_file)
            current_stem = current_path.stem
            if current_stem != current_stem.lstrip().rstrip():
                print(current_relative.joinpath(current_file))

    if verbose:
        print(f"Total occurrences found: {occurrences}")


if __name__ == "__main__":
    main()  # pylint: disable=no-value-for-parameter
