import eventSourcesJSON from '@/assets/event_sources.json';

const typedEventSourcesJSON : { [key: string]: any } = eventSourcesJSON;

export interface Tag {
  name: string;
  isVisible: boolean;
  isHidden: boolean;
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
    const eventSourceArray : Array<Source> = typedEventSourcesJSON[sourceName];
    if (eventSourceArray) {
      eventSourceArray.forEach(source => {
        source.filters.forEach((filter: Filter) => {
          const filterTags = filter.tags || [];
          filterTags.forEach(filterTag => {
            if (typeof filterTag === 'string') {
              tagsSet.add(filterTag);
            }
          });
        });
      });
    }
  });

  const tagsHidden = new Set(eventSourcesJSON.appConfig.tagsHidden);

  // Convert the set of tags into an array of Tag objects, setting visibility based on tagsHidden
  return Array.from(tagsSet).map(tag => ({
    name: tag,
    isVisible: !tagsHidden.has(tag),  //Whether a tag is visible, this is meant to be updated on the user side
    isHidden: tagsHidden.has(tag),    //Whether a tag indicates that it ought to be hidden. This is permanent, if a tag has isHidden true then any event with it ought to be hidden forever
  }));
}
