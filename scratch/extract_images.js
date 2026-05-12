
async function run() {
  const response = await fetch('https://cerap-inades.org/index.php/edition-cerap');
  const html = await response.text();
  const matches = html.matchAll(/src="([^"]+com_booklibrary[^"]+)"/g);
  for (const m of matches) {
    console.log(m[1]);
  }
}
run();
