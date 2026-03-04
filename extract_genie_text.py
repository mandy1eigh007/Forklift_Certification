import bs4

print("Starting script")

with open('telehandler-class7-plus-forklift-1-5/index.html', 'r', encoding='utf-8') as f:
    soup = bs4.BeautifulSoup(f, 'html.parser')

pages = soup.find_all(['div'], class_=['page', 'imgpage'])

print(f"Found {len(pages)} pages")

with open('extracted_text.txt', 'w', encoding='utf-8') as out:
    for i, page in enumerate(pages, start=1):
        genie_col = page.find('div', class_='<mark>Genie</mark>-col')
        out.write(f"Page {i}: genie_col found: {genie_col is not None}\n")
        if genie_col:
            # Remove watermark if present
            watermark = genie_col.find('div', class_='watermark')
            if watermark:
                watermark.decompose()
            # Get text, ignoring images
            text = genie_col.get_text(separator='\n', strip=True)
            if text.strip():
                out.write(f"Page {i}:\n{text}\n\n")
            else:
                out.write(f"Page {i}: (Image page)\n\n")

print("Done")