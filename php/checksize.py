#!/usr/bin/python3

"""This files parses the flags in search for files with non standard resolution
   or suspiciously high disk size.

Remarks:
  depends on pillow:
    python -m pip install pillow
"""

import os
from pathlib import Path
from enum import Enum
import click
from PIL import Image  # uses pillow


class Mode(Enum):
    """Enum defining if the function should look for excessive
    file size, irregular dimensions or both.
    """

    BOTH = 0
    FILESIZE = 1
    DIMENSIONS = 2


THRESHOLD = 800  # bytes
FILE_EXTS = [".png"]
ROOT_DIR = "../flags"
ROOT_PATH = Path(__file__).parent / ROOT_DIR


@click.command(context_settings=dict(ignore_unknown_options=True))
@click.option("--verbose", "-v", is_flag=True, help="Enable verbose mode")
@click.option(
    "--mode",
    type=click.Choice(list([m.name for m in Mode]), case_sensitive=False),
    default=Mode.BOTH.name,
    help="Select the checking mode",
)
def main(verbose: bool, mode: str):
    """Parses the flags in search for files with non standard resolution (like 16x11 or 11x11)
    or suspiciously high disk size.
    """

    selected_mode: Mode = Mode[mode]
    occurrences = 0

    if verbose:
        print(
            "The following files have non standard dimensions or suspiciously high file size:"
        )

    for root, _, files in os.walk(ROOT_PATH):
        # skip the main folder as we don't store pngs for states.
        if ROOT_PATH.samefile(root):
            continue

        current_root = Path(root)
        current_relative = current_root.relative_to(ROOT_PATH)

        for current_file in files:
            if Path(current_file).suffix not in FILE_EXTS:
                continue

            full_name = current_root.joinpath(current_file)
            relative_name = current_relative.joinpath(current_file)
            if selected_mode != Mode.FILESIZE:
                image = Image.open(full_name)
                if image.height != 11 or image.width not in [11, 16]:
                    print(f"{relative_name}\t{image.size}")
                    occurrences += 1
                    continue

            if selected_mode != Mode.DIMENSIONS:
                file_size = full_name.stat().st_size
                if file_size > THRESHOLD:
                    print(f"{relative_name}\t{file_size} bytes")
                    occurrences += 1

    if verbose:
        print(f"Total occurrences found: {occurrences}")


if __name__ == "__main__":
    main()  # pylint: disable=no-value-for-parameter
