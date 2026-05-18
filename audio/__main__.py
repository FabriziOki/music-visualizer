import sys
import json

from .extractor import extract_features


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python -m audio <path/to/file.mp3|wav>", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]

    try:
        features = extract_features(path)
    except FileNotFoundError:
        print(f"Error: file not found — {path}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(features, indent=2))


main()
