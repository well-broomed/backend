
const server = require('./server.js');
const request = require('supertest');

describe('server', () => {
    describe('GET /api/users', () => {
        it('should return a status of 200 (OK)', async () => {
            const response = await request(server).get('/api/users');

            expect(response.status).toBe(200);
        })

        it('should return JSON', async () => {
            const response = await request(server).get('/api/users');

            expect(response.type).toBe('application/json');
        })

        
    })
})