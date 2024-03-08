import { ref, watch } from 'vue';

// Initialize the theme based on user preference or default to 'default'
const theme = ref<'light' | 'dark' | 'default'>('default');

// Determine the system preference
const systemPreference = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

// Function to set the theme directly
function setTheme(newTheme: 'light' | 'dark' | 'default') {
    theme.value = newTheme;
}

// Function to toggle the theme
// Adapt toggleTheme for three states
function toggleTheme() {
    if (theme.value === 'default') {
        theme.value = systemPreference() === 'light' ? 'dark' : 'light';
    } else {
        theme.value = theme.value === 'light' ? 'dark' : 'default'; // toggles through dark -> default -> light
    }
}

// Function to dynamically load the theme stylesheet
function loadThemeStyles() {
    if (typeof window === 'undefined') return;
    
    let finalTheme = theme.value === 'default' ? systemPreference() : theme.value;
    const themeStyleUrl = finalTheme === 'light' ? '/css/light.css' : '/css/dark.css';
    const generalStyleUrl = '/css/style.css';

    // Remove the existing theme-specific stylesheet if it exists
    const existingThemeLinkElement = document.head.querySelector('link[data-theme-style]');
    if (existingThemeLinkElement) {
        document.head.removeChild(existingThemeLinkElement);
    }

    // Create and append the new theme-specific stylesheet
    const themeLinkElement = document.createElement('link');
    themeLinkElement.rel = 'stylesheet';
    themeLinkElement.href = themeStyleUrl;
    themeLinkElement.setAttribute('data-theme-style', '');
    document.head.appendChild(themeLinkElement);

    // Ensure the general stylesheet is loaded
    let generalStyleLinkElement = document.head.querySelector('link[data-general-style]');
    if (!generalStyleLinkElement) {
        generalStyleLinkElement = document.createElement('link');
        generalStyleLinkElement.rel = 'stylesheet';
        generalStyleLinkElement.href = generalStyleUrl;
        generalStyleLinkElement.setAttribute('data-general-style', '');
        document.head.appendChild(generalStyleLinkElement);
    }
}

// Watch for changes in the theme and apply the corresponding stylesheet
watch(theme, () => {loadThemeStyles();}, { immediate: true });

export function useTheme() {
    return { theme, setTheme, toggleTheme };
}
