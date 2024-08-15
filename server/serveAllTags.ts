import { promises as fs } from 'fs';
import path from 'path';

// Type definitions for your events, adjust as necessary
interface EventSource {
    googleCalendar: Array<{
        filters: Array<Array<string> | string>;
    }>;
}

// Function to read and parse the JSON file
async function readEventSources(): Promise<EventSource> {
    const filePath = path.join(__dirname, '../assets/event_sources.json'); // Adjust the path accordingly
    const jsonData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(jsonData);
}

// Function to extract unique tags
async function extractTags(): Promise<string[]> {
    const eventSources = await readEventSources();
    const tagsSet = new Set<string>();
    eventSources.googleCalendar.forEach(source => {
        source.filters.forEach(filter => {
            const firstElement = filter[0];
            if (Array.isArray(firstElement)) {
                firstElement.forEach(tag => tagsSet.add(tag));
            } else {
                tagsSet.add(firstElement);
            }
        });
    });
    return Array.from(tagsSet);
}

// Example of exporting the function to be used in an API endpoint setup
export { extractTags };

