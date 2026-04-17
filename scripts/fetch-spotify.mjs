import https from 'https';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const playlists = [
  '6y1H4Hhj24REfB4PEEpVlT',
  '48pncaxijSgQYUIeS6s6Jp'
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function getPlaylistData(id) {
  const html = await fetchPage(`https://open.spotify.com/playlist/${id}`);
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (match) {
    const data = JSON.parse(match[1]);
    const playlist = data.props?.pageProps?.state?.data?.entity;
    return playlist?.tracks?.items || [];
  }
  return [];
}

async function main() {
  const allTracks = [];
  
  for (const id of playlists) {
    console.log(`Fetching playlist ${id}...`);
    const items = await getPlaylistData(id);
    items.forEach(item => {
      if (item.track) {
        allTracks.push({
          artist: item.track.artists?.map(a => a.name).join(', ') || 'Unknown',
          song: item.track.name || 'Unknown',
          year: item.track.albumOfTrack?.date?.year || ''
        });
      }
    });
    console.log(`Found ${items.length} tracks`);
  }
  
  console.log(`\nTotal tracks: ${allTracks.length}`);
  
  const outputPath = path.join(process.cwd(), 'public', 'files-playlist', 'ghana-playlist.pdf');
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(outputPath));
  
  doc.fontSize(20).text('Ghana Playlist - Merged', { align: 'center' });
  doc.moveDown(2);
  
  doc.fontSize(10);
  allTracks.forEach((track, i) => {
    const line = `${i + 1}. ${track.artist} - ${track.song}${track.year ? ` (${track.year})` : ''}`;
    doc.text(line);
  });
  
  doc.end();
  
  console.log(`\n✅ PDF generated: ${outputPath}`);
}

main().catch(console.error);
