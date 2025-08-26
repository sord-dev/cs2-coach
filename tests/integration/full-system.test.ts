
import request from 'supertest';
import { startRestServer } from './testServer';
import { createPlayerProfile, createAnalysis, createValidLeetifyMatchData } from '../test-data';

jest.mock('../../src/services/leetify/index', () => {
  const actual = jest.requireActual('../../src/services/leetify/index');
  return {
    ...actual,
    LeetifyAPIClient: jest.fn().mockImplementation(() => ({
      getPlayerProfile: jest.fn().mockResolvedValue(createPlayerProfile()),
      getMatchHistory: jest.fn().mockResolvedValue([createValidLeetifyMatchData()]),
    })),
  };
});

describe('End-to-End Coaching Tool Flow (REST)', () => {
  let serverInstance: any;
  let baseUrl: string;

  beforeAll(async () => {
    const { server, url, close } = await startRestServer();
    serverInstance = { server, close };
    baseUrl = url;
  });

  afterAll(async () => {
    if (serverInstance) await serverInstance.close();
  });

  it('should return a valid coaching response', async () => {
    const playerProfile = createPlayerProfile();
    const res = await request(baseUrl)
      .post('/api/coaching-advice')
      .send({
        playerId: playerProfile.playerId,
        matchCount: 5,
      })
      .set('Content-Type', 'application/json');
  expect(res.status).toBe(200);
  expect(res.body.response).toBeDefined();
  expect(res.body.response).toHaveProperty('recommendations');
  });
});
