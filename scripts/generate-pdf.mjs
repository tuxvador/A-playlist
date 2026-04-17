import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const playlist1 = JSON.parse(fs.readFileSync('/tmp/playlist1.json', 'utf8'));
const playlist2 = JSON.parse(fs.readFileSync('/tmp/playlist2.json', 'utf8'));

const allTracks = [];

[playlist1, playlist2].forEach(playlist => {
  playlist.items?.forEach(item => {
    if (item.track) {
      allTracks.push({
        artist: item.track.artists?.map(a => a.name).join(', ') || 'Unknown',
        song: item.track.name || 'Unknown',
        year: item.track.album?.release_date?.split('-')[0] || ''
      });
    }
  });
});

console.log(`Total tracks: ${allTracks.length}`);

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

console.log(`✅ PDF generated: ${outputPath}`);
