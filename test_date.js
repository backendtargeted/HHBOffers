const formatDate = (dateString) => {
    console.log('Input:', dateString);
    // Extract just the date part (YYYY-MM-DD) if it includes time
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);

    console.log('Parsed:', { year, month, day });

    // Use UTC date and explicitly format in UTC timezone to avoid conversion issues
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    console.log('UTC Date:', utcDate.toISOString());

    return utcDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC' // Explicitly use UTC timezone
    });
};

console.log('Test 1 (2023-12-01):', formatDate('2023-12-01'));
console.log('Test 2 (2023-12-01T00:00:00.000Z):', formatDate('2023-12-01T00:00:00.000Z'));
console.log('Test 3 (2023-11-30T19:00:00.000Z):', formatDate('2023-11-30T19:00:00.000Z'));
