# Manga downloader

Downloads scans from websites and generate pdf

# Usage

`.cli.ts <destination_dir> ...<url_to_manga>`

# Output

Urls are parsed to find a matching driver. Title and chapter list are retrieved, then scans are downloaded. Title will generate the folder and each chapter will produce a pdf as of `<destination_dir>/manga-title/chapter-x.pdf`
