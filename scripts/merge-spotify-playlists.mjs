import https from 'https';
import fs from 'fs';

const playlists = [
  '6y1H4Hhj24REfB4PEEpVlT',
  '48pncaxijSgQYUIeS6s6Jp'
];

async function fetchPlaylist(id) {
  return new Promise((resolve, reject) => {
    https.get(`https://open.spotify.com/embed/playlist/${id}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractTracks(html) {
  const tracks = [];
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const playlistName = titleMatch ? titleMatch[1].replace(' - playlist by Spotify | Spotify', '').trim() : '';
  
  const jsonMatch = html.match(/Spotify\.Entity\s*=\s*({.*?});/s);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (data.tracks?.items) {
        data.tracks.items.forEach(item => {
          if (item.track) {
            tracks.push({
              artist: item.track.artists?.map(a => a.name).join(', ') || 'Unknown',
              song: item.track.name || 'Unknown',
              year: item.track.album?.release_date?.split('-')[0] || ''
            });
          }
        });
      }
    } catch (e) {}
  }
  
  return { playlistName, tracks };
}

function generatePDF(tracks) {
  let pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 6 0 R >>
stream
BT
/F1 16 Tf
50 750 Td
(Ghana Playlist - Merged) Tj
0 -30 Td
/F2 10 Tf
`;

  tracks.forEach((track, i) => {
    const line = `${i + 1}. ${track.artist} - ${track.song}${track.year ? ` (${track.year})` : ''}`;
    pdf += `(${line.replace(/[()\\]/g, '\\$&')}) Tj\n0 -15 Td\n`;
  });

  pdf += `ET
endstream
endobj
6 0 obj
${pdf.split('stream')[1].split('endstream')[0].length}
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
0000000361 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
%%EOF`;

  return pdf;
}

async function main() {
  console.log('Fetching playlists...');
  const allTracks = [];
  
  for (const id of playlists) {
    const html = await fetchPlaylist(id);
    const { tracks } = extractTracks(html);
    allTracks.push(...tracks);
    console.log(`Fetched ${tracks.length} tracks from playlist ${id}`);
  }
  
  console.log(`\nTotal tracks: ${allTracks.length}`);
  
  const pdf = generatePDF(allTracks);
  fs.writeFileSync('public/files-playlist/ghana-playlist.pdf', pdf);
  
  console.log('\n✅ PDF generated: public/files-playlist/ghana-playlist.pdf');
}

main().catch(console.error);
