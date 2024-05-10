#!/usr/bin/python3

"""This scripts runs the optimizer on staged files. Needs optipng."""

import os
import click
from pathlib import Path
from git import Repo
from subprocess import Popen

OPTI = "optipng.exe"
FILE_EXT = "*.png"
TEMP_FILE = "temp.png"
ROOT_PATH = Path(__file__).parent.parent
CURRENT_PATH = Path(__file__).parent


@click.command(context_settings=dict(ignore_unknown_options=True))
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose mode")
def main(verbose: bool):
    """Find all staged flags and apply the optimizer to them."""

    occurrences = 0

    if verbose:
        print("About to optimize all staged flags.")

    head_commit = Repo(ROOT_PATH, search_parent_directories=True).head.commit

    diff = head_commit.diff(None, FILE_EXT)

    for f in diff:
        file_name = ROOT_PATH.joinpath(f.a_path).absolute()
        if file_name.exists():
            temp_file = CURRENT_PATH.joinpath(TEMP_FILE)
            os.rename(file_name, temp_file)
            if verbose:
                print("Processing f{file_name}")
            cmd = f'{OPTI} -quiet -o7 "{temp_file}" -strip all'
            Popen(cmd).communicate()
            os.rename(temp_file, file_name)
            occurrences += 1

    if verbose:
        print(f"Total files processed: {occurrences}")


if __name__ == "__main__":
    main()  # pylint: disable=no-value-for-parameter
