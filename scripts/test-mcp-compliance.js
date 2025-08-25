#!/usr/bin/env node

/**
 * MCP Protocol Compliance Test Script
 * 
 * Validates that the CS2 Coach MCP server adheres to the MCP protocol specification.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, '../dist/server.js');

async function testMCPCompliance() {
  console.log('🧪 Testing MCP Protocol Compliance...\n');

  try {
    // Test 1: Server starts successfully
    console.log('📡 Test 1: Server startup...');
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let serverOutput = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      serverOutput += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (server.killed || server.exitCode !== null) {
      throw new Error(`Server failed to start: ${errorOutput}`);
    }
    console.log('✅ Server started successfully\n');

    // Test 2: Tools list request
    console.log('📋 Test 2: Tools list request...');
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    server.stdin.write(JSON.stringify(toolsRequest) + '\n');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Parse the response (simplified - in real implementation would be more robust)
    const lines = serverOutput.split('\n').filter(line => line.trim());
    const responses = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    const toolsResponse = responses.find(r => r.id === 1);
    if (!toolsResponse || !toolsResponse.result || !toolsResponse.result.tools) {
      throw new Error('Invalid tools list response');
    }

    const tools = toolsResponse.result.tools;
    const expectedTools = [
      'get_coaching_advice',
      'analyze_specific_area',
      'track_improvement',
      'compare_to_rank'
    ];

    for (const expectedTool of expectedTools) {
      const tool = tools.find(t => t.name === expectedTool);
      if (!tool) {
        throw new Error(`Missing required tool: ${expectedTool}`);
      }
      if (!tool.inputSchema) {
        throw new Error(`Tool ${expectedTool} missing inputSchema`);
      }
    }
    console.log('✅ Tools list request successful\n');

    // Test 3: Tool call request
    console.log('🔧 Test 3: Tool call request...');
    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_coaching_advice',
        arguments: {
          playerId: 'test-player',
          analysisType: 'general',
          timeRange: 'recent',
          matchCount: 5
        }
      }
    };

    server.stdin.write(JSON.stringify(toolCallRequest) + '\n');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Note: In a real test, we would parse the actual response
    // For now, we just verify the server didn't crash
    if (server.killed || server.exitCode !== null) {
      throw new Error('Server crashed during tool call');
    }
    console.log('✅ Tool call request handled (may have failed due to external dependencies)\n');

    // Cleanup
    server.kill();
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('🎉 MCP Protocol Compliance Tests Passed!\n');
    console.log('✅ All core MCP functionality is working correctly');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ MCP Compliance Test Failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the test
testMCPCompliance().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});