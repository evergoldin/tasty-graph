interface KindleNote {
    title: string;
    highlight: string;
    location: string;
    date: string;
}

export function parseKindleClippings(text: string, maxNotes: number = 20): KindleNote[] {
    const notes = text.split('==========')
        .filter(note => note.trim().length > 0)
        .map(note => {
            const lines = note.trim().split('\n').filter(line => line.trim().length > 0);
            
            if (lines.length < 2) return null;

            const title = lines[0].trim();
            const metadata = lines[1].trim();
            const highlight = lines.slice(2).join('\n').trim();

            // Extract location and date from metadata
            const locationMatch = metadata.match(/Location (\d+-\d+)/);
            const dateMatch = metadata.match(/Added on (.+?)(?=\s*$)/);

            return {
                title,
                highlight,
                location: locationMatch ? locationMatch[1] : '',
                date: dateMatch ? dateMatch[1] : ''
            };
        })
        .filter((note): note is KindleNote => note !== null)
        .slice(0, maxNotes);

    return notes;
} 