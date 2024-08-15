import eventSourcesJSON from '@/assets/event_sources.json';

export interface Tag {
  name: string;
  visible: boolean;
}

// Helper function to extract source names from URLs
function extractSourceNames(urls: string[]): string[] {
  return urls.map(url => {
    const parts = url.split('/');
    return parts[parts.length - 1]; // Returns the last segment after the last '/'
  });
}

export function getAllTags(): Tag[] {
  const tagsSet = new Set<string>();
  
  // Extract the source names from the configuration
  const sourceNames = extractSourceNames(eventSourcesJSON.appConfig.eventApiToGrab);

  // Iterate over each source type in eventSourcesJSON using the source names
  sourceNames.forEach(sourceName => {
    const eventSourceArray = eventSourcesJSON[sourceName];
    if (eventSourceArray) {
      eventSourceArray.forEach(source => {
        source.filters.forEach(filter => {
          if (Array.isArray(filter) && filter.length > 0) {
            const firstFilterElement = filter[0];
            if (Array.isArray(firstFilterElement)) {
              // If the first element itself is an array, iterate through it
              firstFilterElement.forEach(subTag => {
                if (typeof subTag === 'string') {
                  tagsSet.add(subTag);
                }
              });
            } else if (typeof firstFilterElement === 'string') {
              // If it's a single string, add it directly
              tagsSet.add(firstFilterElement);
            }
          }
        });
      });
    }
  });

  const hiddenTags = new Set(eventSourcesJSON.appConfig.tagsHidden);

  // Convert the set of tags into an array of Tag objects, setting visibility based on hiddenTags
  return Array.from(tagsSet).map(tag => ({
    name: tag,
    visible: !hiddenTags.has(tag)
  }));
}
