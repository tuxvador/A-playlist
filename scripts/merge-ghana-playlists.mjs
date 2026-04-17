import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import https from 'https';

const playlistIds = [
  '6y1H4Hhj24REfB4PEEpVlT',
  '48pncaxijSgQYUIeS6s6Jp'
];

async function fetchPlaylistEmbed(playlistId) {
  return new Promise((resolve, reject) => {
    https.get(`https://open.spotify.com/embed/playlist/${playlistId}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractTracks(html) {
  const tracks = [];
  const jsonMatch = html.match(/"tracks":\{"items":(\[.*?\])\}/s);
  
  if (jsonMatch) {
    try {
      const items = JSON.parse(jsonMatch[1]);
      items.forEach(item => {
        if (item.track) {
          tracks.push({
            artist: item.track.artists?.map(a => a.name).join(', ') || 'Unknown',
            song: item.track.name || 'Unknown',
            year: item.track.album?.release_date?.split('-')[0] || ''
          });
        }
      });
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  }
  
  return tracks;
}

async function main() {
  console.log('Fetching playlists...');
  const allTracks = [];
  
  for (const id of playlistIds) {
    const html = await fetchPlaylistEmbed(id);
    const tracks = extractTracks(html);
    allTracks.push(...tracks);
    console.log(`Fetched ${tracks.length} tracks from playlist ${id}`);
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
