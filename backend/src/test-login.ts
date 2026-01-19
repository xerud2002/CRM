import axios from 'axios';

async function testLogin() {
    try {
        const res = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'alex.burcea@holdemremovals.co.uk',
            password: '123456'
        });
        console.log('✅ Login Successful!');
        console.log('Token:', res.data.accessToken ? 'Present' : 'Missing');
        console.log('User:', res.data.user);
    } catch (error) {
        console.error('❌ Login Failed:', error.response?.status, error.response?.data);
    }
}

testLogin();
