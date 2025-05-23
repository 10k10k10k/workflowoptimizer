/**
 * Main application controller for AInything Workflow Optimizer
 * Initializes the application and manages high-level interactions
 */

// Global variables for tracking application state
let currentSearchQuery = '';
let currentFilterSettings = {};
let loadedModels = [];

/**
 * Initialize the application when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', async function() {
  // Initialize mobile menu
  initMobileMenu();
  
  // Load the about content
  loadAboutContent();
  
  try {
    // Load AI model data
    loadedModels = await loadAiModels();
    
    // Initialize UI components
    initializeUIComponents();
    
    // Set up event listeners
    setupEventListeners();
    
    // Process URL parameters (for direct linking to models or search terms)
    processUrlParameters();
    
    // Display initial results
    updateDisplayedResults();
    
  } catch (error) {
    console.error('Error initializing application:', error);
    showErrorState(error.message);
  }
});

/**
 * Initializes mobile menu toggle functionality
 */
function initMobileMenu() {
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
      mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('hidden');
    });
  }
}

/**
 * Loads and displays the About page content from Markdown
 */
async function loadAboutContent() {
  const aboutContainer = document.getElementById('about-content');
  
  if (aboutContainer) {
    try {
      const result = await fetchMarkdownWithYAML('about-ainything.md');
      if (result && result.content) {
        aboutContainer.innerHTML = result.content;
      } else {
        aboutContainer.innerHTML = `<p class="text-red-500">Failed to load About content.</p>`;
      }
    } catch (error) {
      console.error('Error loading About content:', error);
      aboutContainer.innerHTML = `
        <p class="text-red-500">Error loading About content: ${escapeHTML(error.message)}</p>
      `;
    }
  }
}

/**
 * Initializes all UI components after data is loaded
 */
function initializeUIComponents() {
  // Populate filter sections with options
  populateFilterOptions();
  
  // Initialize the budget slider
  initBudgetSlider();
  
  // Update result count display
  updateResultSummary(loadedModels.length, '', {});
}

/**
 * Populates filter options based on loaded models
 */
function populateFilterOptions() {
  const capabilities = getUniqueCapabilities();
  const inputTypes = getUniqueInputTypes();
  const outputTypes = getUniqueOutputTypes();
  
  populateCheckboxFilter('capabilities-filter-container', capabilities, 'capability');
  populateCheckboxFilter('input-types-filter-container', inputTypes, 'inputType');
  populateCheckboxFilter('output-types-filter-container', outputTypes, 'outputType');
}

/**
 * Populates a checkbox filter with the provided options
 * @param {string} containerId - ID of the container element
 * @param {string[]} options - Array of option strings to display
 * @param {string} namePrefix - Prefix for the checkbox names
 */
function populateCheckboxFilter(containerId, options, namePrefix) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  if (options.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">No options available</p>';
    return;
  }
  
  options.forEach(option => {
    const id = `${namePrefix}-${slugify(option)}`;
    const checkbox = document.createElement('div');
    checkbox.className = 'flex items-center';
    checkbox.innerHTML = `
      <input id="${id}" type="checkbox" name="${namePrefix}" value="${escapeHTML(option)}" 
        class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
      <label for="${id}" class="ml-2 block text-sm text-gray-700">${escapeHTML(option)}</label>
    `;
    container.appendChild(checkbox);
  });
}

/**
 * Initializes the budget slider functionality
 */
function initBudgetSlider() {
  const slider = document.getElementById('max-budget-slider');
  const display = document.getElementById('max-budget-display');
  
  if (slider && display) {
    // Set initial display value
    updateBudgetDisplay(slider.value);
    
    // Update display when slider changes
    slider.addEventListener('input', function() {
      updateBudgetDisplay(this.value);
    });
  }
}

/**
 * Sets up all event listeners for user interactions
 */
function setupEventListeners() {
  // Search button and input
  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  
  if (searchButton) {
    searchButton.addEventListener('click', function() {
      if (searchInput) {
        currentSearchQuery = searchInput.value.trim();
        updateDisplayedResults();
      }
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener('keyup', function(e) {
      if (e.key === 'Enter') {
        currentSearchQuery = this.value.trim();
        updateDisplayedResults();
      }
    });
  }
  
  // Apply filters button
  const applyFiltersButton = document.getElementById('apply-filters');
  if (applyFiltersButton) {
    applyFiltersButton.addEventListener('click', function() {
      currentFilterSettings = readCurrentFilterSettings();
      updateDisplayedResults();
    });
  }
  
  // Sort dropdown
  const sortSelect = document.getElementById('sort-by');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      currentFilterSettings.sortBy = this.value;
      updateDisplayedResults();
    });
  }
  
  // Back to results button
  const backButton = document.getElementById('back-to-results');
  if (backButton) {
    backButton.addEventListener('click', hideModelDetail);
  }
  
  // Handle navigation between sections
  document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        
        // Close mobile menu if it's open
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          const menuButton = document.getElementById('mobile-menu-button');
          if (menuButton) {
            menuButton.setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  });
  
  // Handle hash changes for model details
  window.addEventListener('hashchange', function() {
    processUrlParameters();
  });
}

/**
 * Processes URL parameters and hash for direct navigation
 */
function processUrlParameters() {
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    // Check for model parameter
    const modelName = params.get('model');
    if (modelName) {
      displayModelDetail(decodeURIComponent(modelName));
      return;
    }
    
    // Check for search parameter (not implemented yet, placeholder)
    const searchQuery = params.get('search');
    if (searchQuery) {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = decodeURIComponent(searchQuery);
        currentSearchQuery = searchInput.value;
        updateDisplayedResults();
      }
    }
  }
}

/**
 * Updates displayed results based on current search and filters
 */
function updateDisplayedResults() {
  showLoadingState();
  
  try {
    // Apply search query first
    let filteredModels = loadedModels;
    
    if (currentSearchQuery) {
      filteredModels = filterModelsBySearchQuery(filteredModels, currentSearchQuery);
    }
    
    // Then apply filters
    if (!currentFilterSettings || Object.keys(currentFilterSettings).length === 0) {
      currentFilterSettings = readCurrentFilterSettings();
    }
    
    filteredModels = applyAllActiveFilters(filteredModels, currentFilterSettings);
    
    // Display the filtered models
    displaySearchResults(filteredModels);
    
    // Update result summary
    updateResultSummary(filteredModels.length, currentSearchQuery, currentFilterSettings);
    
  } catch (error) {
    console.error('Error updating results:', error);
    showErrorState('Error filtering results: ' + error.message);
  } finally {
    hideLoadingState();
  }
}

/**
 * Updates the result count and heading based on search/filter state
 * @param {number} count - Number of models being displayed
 * @param {string} searchQuery - Current search query
 * @param {Object} filters - Current filter settings
 */
function updateResultSummary(count, searchQuery, filters) {
  const headingElement = document.getElementById('result-heading');
  const countElement = document.getElementById('result-count');
  
  if (!headingElement || !countElement) return;
  
  // Determine heading text based on search/filter state
  let headingText = 'All AI Models';
  
  const hasActiveFilters = filters.freeOnly || 
                         filters.freeTrials || 
                         (filters.capabilities && filters.capabilities.length > 0) ||
                         (filters.inputTypes && filters.inputTypes.length > 0) ||
                         (filters.outputTypes && filters.outputTypes.length > 0) ||
                         (typeof filters.maxBudget === 'number' && filters.maxBudget < 50);
  
  if (searchQuery && hasActiveFilters) {
    headingText = `Results for "${escapeHTML(searchQuery)}" with filters`;
  } else if (searchQuery) {
    headingText = `Results for "${escapeHTML(searchQuery)}"`;
  } else if (hasActiveFilters) {
    headingText = 'Filtered AI Models';
  }
  
  headingElement.textContent = headingText;
  countElement.textContent = `Showing ${count} model${count !== 1 ? 's' : ''}`;
}

/**
 * Displays error state in the results area
 * @param {string} message - Error message to display
 */
function showErrorState(message) {
  const resultsGrid = document.getElementById('results-grid');
  if (!resultsGrid) return;
  
  resultsGrid.innerHTML = `
    <div class="col-span-full py-12 text-center">
      <svg class="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
              d="M12 9v3.75m9.344-2.198c-.109.63-.5 1.146-1.025 1.404a1.1 1.1 0 0 1-.55.165c-.49 0-.908-.257-1.14-.476-.364-.344-.47-.877-.338-1.33L19.4 5.5l1.293 1.293c.282.283.454.668.477 1.068a1.75 1.75 0 0 1-.45 1.35l-8.3 10.166a1.75 1.75 0 0 1-2.716.002l-8.301-10.17a1.75 1.75 0 0 1 .048-2.417l1.29-1.293L3.5 5.5c.1.529.21 1.087-.339 1.439-.236.22-.653.475-1.14.475a1.1 1.1 0 0 1-.55-.164c-.525-.259-.916-.775-1.027-1.408a1.738 1.738 0 0 1 .314-1.377l2.156-2.92c.326-.44.836-.7 1.378-.7h14.012c.543 0 1.052.26 1.378.7l2.156 2.92c.375.508.457 1.161.27 1.74l-.088.332" />
      </svg>
      <h3 class="mt-4 text-xl font-semibold text-gray-800">Error</h3>
      <p class="mt-2 text-gray-600">${escapeHTML(message)}</p>
      <button id="retry-button" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Retry
      </button>
    </div>
  `;
  
  // Add event listener to retry button
  const retryButton = document.getElementById('retry-button');
  if (retryButton) {
    retryButton.addEventListener('click', async function() {
      try {
        // Reload AI models and update display
        loadedModels = await loadAiModels();
        updateDisplayedResults();
      } catch (error) {
        console.error('Error retrying model load:', error);
        showErrorState(error.message);
      }
    });
  }
}

