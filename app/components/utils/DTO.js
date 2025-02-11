



export default function EntryDTO(entry, args = []) {
    return Object.keys(entry).reduce((acc, key) => {
        if (!args.includes(key)) {
            acc[key] = entry[key];
        }
        return acc;
    }, {});
}

export function EntriesDTO(entries, args = []) {
    return entries.map(entry => EntryDTO(entry, args));
}
