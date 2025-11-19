/**
 * Global Wealth Distribution Visualization
 *
 * This script loads wealth distribution data and creates an interactive
 * bar chart showing custom wealth brackets defined by the user.
 *
 * Dataset: UBS Global Wealth Report 2023 (2022 data)
 * URL: https://www.ubs.com/global/en/family-office-uhnw/reports/global-wealth-report-2023.html
 *
 * Transformations applied:
 * - Aggregated Statista wealth bracket data (under $10k, $10k-$100k, $100k-$1M, over $1M)
 * - Calculated total wealth per bracket using population counts and estimated averages
 * - Normalized to percentage shares for both population and wealth
 */

// Global state
let wealthData = null;
let chart = null;
let thresholds = [0, 10000, 100000, 1000000]; // Default thresholds
let axisMode = 'percentage'; // 'percentage' or 'absolute'

// Initialize the application
async function init() {
    try {
        // Load wealth data
        const response = await fetch('./data/wealth_distribution.json');
        wealthData = await response.json();

        // Set up event listeners
        setupEventListeners();

        // Render initial bracket controls
        renderBracketControls();

        // Compute and render chart
        updateVisualization();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load wealth distribution data. Please ensure data/wealth_distribution.json exists.');
    }
}

// Set up event listeners
function setupEventListeners() {
    document.getElementById('add-bracket-btn').addEventListener('click', addBracket);

    document.querySelectorAll('input[name="axis-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            axisMode = e.target.value;
            updateVisualization();
        });
    });
}

// Render bracket control inputs
function renderBracketControls() {
    const container = document.getElementById('brackets-list');
    container.innerHTML = '';

    // Sort thresholds
    thresholds.sort((a, b) => a - b);

    thresholds.forEach((threshold, index) => {
        const row = createBracketRow(threshold, index);
        container.appendChild(row);
    });
}

// Create a single bracket row
function createBracketRow(threshold, index) {
    const row = document.createElement('div');
    row.className = 'bracket-row';

    const input = document.createElement('input');
    input.type = 'number';
    input.value = threshold;
    input.min = 0;
    input.step = 1000;
    input.placeholder = 'Min wealth (USD)';

    input.addEventListener('blur', () => {
        const newValue = parseFloat(input.value);
        if (!isNaN(newValue) && newValue >= 0) {
            thresholds[index] = newValue;
            // Remove duplicates and sort
            thresholds = [...new Set(thresholds)].sort((a, b) => a - b);
            renderBracketControls();
            updateVisualization();
        } else {
            input.value = threshold; // Reset to old value
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
        thresholds.splice(index, 1);
        renderBracketControls();
        updateVisualization();
    });

    row.appendChild(input);
    row.appendChild(deleteBtn);

    return row;
}

// Add a new bracket
function addBracket() {
    // Add a new threshold slightly above the highest existing one
    const maxThreshold = Math.max(...thresholds);
    const newThreshold = maxThreshold > 0 ? maxThreshold * 2 : 10000;
    thresholds.push(newThreshold);
    renderBracketControls();
    updateVisualization();
}

// Compute bracket aggregations from underlying bins
function computeBrackets() {
    if (thresholds.length === 0) {
        return [];
    }

    // Sort thresholds
    const sortedThresholds = [...thresholds].sort((a, b) => a - b);

    // Create brackets
    const brackets = sortedThresholds.map((threshold, i) => {
        const min = threshold;
        const max = i < sortedThresholds.length - 1 ? sortedThresholds[i + 1] : null;
        return {
            min,
            max,
            population_count: 0,
            total_wealth_usd: 0
        };
    });

    // Aggregate data from bins into brackets
    wealthData.bins.forEach(bin => {
        const binMin = bin.min_wealth_usd;
        const binMax = bin.max_wealth_usd;
        const binPop = bin.population_count;
        const binWealth = bin.total_wealth_usd;

        brackets.forEach(bracket => {
            const bracketMin = bracket.min;
            const bracketMax = bracket.max;

            // Determine overlap between bin and bracket
            const overlapFraction = calculateOverlap(binMin, binMax, bracketMin, bracketMax);

            if (overlapFraction > 0) {
                bracket.population_count += binPop * overlapFraction;
                bracket.total_wealth_usd += binWealth * overlapFraction;
            }
        });
    });

    // Calculate shares
    const totalPop = wealthData._metadata.total_adult_population;
    const totalWealth = wealthData._metadata.total_global_wealth_usd;

    brackets.forEach(bracket => {
        bracket.population_share = bracket.population_count / totalPop;
        bracket.wealth_share = bracket.total_wealth_usd / totalWealth;
    });

    return brackets;
}

// Calculate overlap fraction between a bin and a bracket
function calculateOverlap(binMin, binMax, bracketMin, bracketMax) {
    // Handle open-ended bin (binMax === null means infinity)
    const effectiveBinMax = binMax === null ? Infinity : binMax;
    const effectiveBracketMax = bracketMax === null ? Infinity : bracketMax;

    // Find intersection
    const overlapMin = Math.max(binMin, bracketMin);
    const overlapMax = Math.min(effectiveBinMax, effectiveBracketMax);

    if (overlapMin >= overlapMax) {
        return 0; // No overlap
    }

    // For open-ended ranges, use full overlap if there's any intersection
    if (binMax === null) {
        if (bracketMax === null) {
            // Both open-ended: if bracket starts within bin, full overlap
            return bracketMin >= binMin ? 1 : 0;
        } else {
            // Bin is open, bracket is not
            // Fraction based on bracket range
            if (bracketMin >= binMin) {
                return 1;
            } else {
                return 0;
            }
        }
    }

    // Calculate fraction of bin that overlaps with bracket
    const binRange = effectiveBinMax - binMin;
    const overlapRange = overlapMax - overlapMin;

    return overlapRange / binRange;
}

// Compute remainder stats (population and wealth not covered)
function computeRemainder(brackets) {
    const totalPop = wealthData._metadata.total_adult_population;
    const totalWealth = wealthData._metadata.total_global_wealth_usd;

    const coveredPop = brackets.reduce((sum, b) => sum + b.population_count, 0);
    const coveredWealth = brackets.reduce((sum, b) => sum + b.total_wealth_usd, 0);

    return {
        covered_population_count: coveredPop,
        covered_population_share: coveredPop / totalPop,
        not_covered_population_count: totalPop - coveredPop,
        not_covered_population_share: (totalPop - coveredPop) / totalPop,
        covered_wealth_usd: coveredWealth,
        covered_wealth_share: coveredWealth / totalWealth,
        not_covered_wealth_usd: totalWealth - coveredWealth,
        not_covered_wealth_share: (totalWealth - coveredWealth) / totalWealth
    };
}

// Update visualization (chart and summary)
function updateVisualization() {
    if (thresholds.length === 0) {
        showNoDataMessage();
        return;
    }

    hideNoDataMessage();

    const brackets = computeBrackets();
    const remainder = computeRemainder(brackets);

    renderChart(brackets);
    renderSummary(remainder);
}

// Show "no data" message
function showNoDataMessage() {
    document.getElementById('chart-container').style.display = 'none';
    document.getElementById('no-data-message').style.display = 'flex';

    // Clear summary
    document.getElementById('adults-covered').textContent = '-';
    document.getElementById('adults-not-covered').textContent = '-';
    document.getElementById('wealth-covered').textContent = '-';
    document.getElementById('wealth-not-covered').textContent = '-';
}

// Hide "no data" message
function hideNoDataMessage() {
    document.getElementById('chart-container').style.display = 'block';
    document.getElementById('no-data-message').style.display = 'none';
}

// Render the bar chart
function renderChart(brackets) {
    const ctx = document.getElementById('wealth-chart').getContext('2d');

    // Prepare labels
    const labels = brackets.map((b, i) => {
        if (b.max === null) {
            return `≥ ${formatCurrency(b.min)}`;
        } else {
            return `${formatCurrency(b.min)} – ${formatCurrency(b.max)}`;
        }
    });

    // Prepare data based on axis mode
    const data = brackets.map(b => {
        if (axisMode === 'percentage') {
            return b.population_share * 100;
        } else {
            return b.population_count;
        }
    });

    // Prepare tooltips
    const tooltips = brackets.map(b => ({
        population_share: (b.population_share * 100).toFixed(2),
        population_count: formatNumber(b.population_count),
        wealth_share: (b.wealth_share * 100).toFixed(2),
        total_wealth: formatCurrency(b.total_wealth_usd)
    }));

    // Destroy existing chart
    if (chart) {
        chart.destroy();
    }

    // Create new chart
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: axisMode === 'percentage' ? '% of Global Adult Population' : 'Number of Adults',
                data: data,
                backgroundColor: 'rgba(76, 175, 80, 0.7)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const tooltip = tooltips[context.dataIndex];
                            return [
                                `Population: ${tooltip.population_share}% (${tooltip.population_count} people)`,
                                `Wealth: ${tooltip.wealth_share}% (${tooltip.total_wealth})`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: axisMode === 'percentage' ? 'Percentage of Adult Population (%)' : 'Number of Adults'
                    },
                    ticks: {
                        callback: function(value) {
                            if (axisMode === 'percentage') {
                                return value.toFixed(1) + '%';
                            } else {
                                return formatNumber(value);
                            }
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Wealth Bracket (USD per adult)'
                    }
                }
            }
        }
    });
}

// Render summary panel
function renderSummary(remainder) {
    document.getElementById('adults-covered').textContent =
        `${(remainder.covered_population_share * 100).toFixed(2)}% (${formatNumber(remainder.covered_population_count)} people)`;

    document.getElementById('adults-not-covered').textContent =
        `${(remainder.not_covered_population_share * 100).toFixed(2)}% (${formatNumber(remainder.not_covered_population_count)} people)`;

    document.getElementById('wealth-covered').textContent =
        `${(remainder.covered_wealth_share * 100).toFixed(2)}% (${formatCurrency(remainder.covered_wealth_usd)})`;

    document.getElementById('wealth-not-covered').textContent =
        `${(remainder.not_covered_wealth_share * 100).toFixed(2)}% (${formatCurrency(remainder.not_covered_wealth_usd)})`;
}

// Format number with K/M/B suffixes
function formatNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    } else {
        return num.toFixed(0);
    }
}

// Format currency
function formatCurrency(amount) {
    return '$' + formatNumber(amount);
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
