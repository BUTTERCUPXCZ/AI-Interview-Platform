// Test if backend is reachable
const testConnection = async () => {
    try {
        console.log('Testing basic connection to backend...');

        // First test a simple health check endpoint (if it exists)
        const healthResponse = await fetch('http://localhost:3000/api/coding/question?domain=frontend&difficulty=beginner&language=javascript');
        console.log('Health check status:', healthResponse.status);

        if (healthResponse.ok) {
            const data = await healthResponse.json();
            console.log('✅ Backend is reachable and returning data');
            console.log('Sample response:', JSON.stringify(data, null, 2));
        } else {
            const errorText = await healthResponse.text();
            console.log('❌ Backend responded with error:');
            console.log('Status:', healthResponse.status, healthResponse.statusText);
            console.log('Error text:', errorText);
        }

    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('Make sure the backend server is running on http://localhost:3000');
    }
};

testConnection();