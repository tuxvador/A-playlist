import spotifyUrlInfo from 'spotify-url-info';
const getData = spotifyUrlInfo(fetch).getData;
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const playlistUrls = [
  'https://open.spotify.com/playlist/6y1H4Hhj24REfB4PEEpVlT',
  'https://open.spotify.com/playlist/48pncaxijSgQYUIeS6s6Jp'
];

async function main() {
  const allTracks = [];
  
  for (const url of playlistUrls) {
    console.log(`Fetching ${url}...`);
    const data = await getData(url);
    
    const tracks = data.trackList || [];
    
    tracks.forEach(item => {
      allTracks.push({
        artist: item.subtitle || 'Unknown',
        song: item.title || 'Unknown',
        year: ''
      });
    });
    
    console.log(`Found ${tracks.length} tracks`);
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
