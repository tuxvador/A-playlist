#!/usr/bin/env python3
import requests
import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

playlist_ids = [
    '6y1H4Hhj24REfB4PEEpVlT',
    '48pncaxijSgQYUIeS6s6Jp'
]

def get_playlist_tracks(playlist_id):
    url = f'https://api.spotify.com/v1/playlists/{playlist_id}/tracks'
    
    # Get anonymous token
    token_url = 'https://open.spotify.com/get_access_token?reason=transport&productType=web_player'
    headers = {'User-Agent': 'Mozilla/5.0'}
    token_response = requests.get(token_url, headers=headers)
    token = token_response.json()['accessToken']
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(url, headers=headers)
    data = response.json()
    
    tracks = []
    for item in data.get('items', []):
        track = item.get('track', {})
        if track:
            artists = ', '.join([a['name'] for a in track.get('artists', [])])
            name = track.get('name', 'Unknown')
            year = track.get('album', {}).get('release_date', '')[:4]
            tracks.append({'artist': artists, 'song': name, 'year': year})
    
    return tracks

def create_pdf(tracks, filename):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width/2, height - inch, "Ghana Playlist - Merged")
    
    c.setFont("Helvetica", 10)
    y = height - 2*inch
    
    for i, track in enumerate(tracks, 1):
        line = f"{i}. {track['artist']} - {track['song']}"
        if track['year']:
            line += f" ({track['year']})"
        
        if y < inch:
            c.showPage()
            c.setFont("Helvetica", 10)
            y = height - inch
        
        c.drawString(50, y, line)
        y -= 15
    
    c.save()

if __name__ == '__main__':
    print('Fetching playlists...')
    all_tracks = []
    
    for playlist_id in playlist_ids:
        tracks = get_playlist_tracks(playlist_id)
        all_tracks.extend(tracks)
        print(f'Fetched {len(tracks)} tracks from playlist {playlist_id}')
    
    print(f'\nTotal tracks: {len(all_tracks)}')
    
    output_path = 'public/files-playlist/ghana-playlist.pdf'
    create_pdf(all_tracks, output_path)
    
    print(f'\n✅ PDF generated: {output_path}')
