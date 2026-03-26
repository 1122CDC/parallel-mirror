import subprocess
import sys

def run():
    result = subprocess.run(
        ['npm', 'install', '--save-dev', '@tailwindcss/vite'],
        check=False,
    )
    return result.returncode

if __name__ == "__main__":
    sys.exit(run())
