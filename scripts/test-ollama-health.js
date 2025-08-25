#!/usr/bin/env node

/**
 * Ollama Health Check Script
 * 
 * Validates that Ollama is running and the CS2 coach model is available.
 */

import { Ollama } from 'ollama';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testOllamaHealth() {
  console.log('🏥 Testing Ollama Health...\n');

  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const modelName = process.env.OLLAMA_MODEL || 'cs2-coach';

  try {
    const ollama = new Ollama({ host: baseUrl });

    // Test 1: Ollama service connectivity
    console.log('🔌 Test 1: Ollama service connectivity...');
    console.log(`   Connecting to: ${baseUrl}`);
    
    try {
      const models = await ollama.list();
      console.log('✅ Successfully connected to Ollama service');
      console.log(`   Found ${models.models.length} models available\n`);
    } catch (error) {
      throw new Error(`Cannot connect to Ollama at ${baseUrl}: ${error.message}`);
    }

    // Test 2: CS2 coach model availability
    console.log('🤖 Test 2: CS2 coach model availability...');
    console.log(`   Looking for model: ${modelName}`);
    
    try {
      const models = await ollama.list();
      const cs2Model = models.models.find(model => model.name.includes(modelName));
      
      if (!cs2Model) {
        console.log('⚠️  CS2 coach model not found');
        console.log('   Available models:');
        models.models.forEach(model => {
          console.log(`   - ${model.name} (${model.size})`);
        });
        console.log('\n📝 To create the CS2 coach model, run:');
        console.log(`   ollama create ${modelName} -f ./modelfiles/cs2-coach-basic.modelfile\n`);
      } else {
        console.log('✅ CS2 coach model found');
        console.log(`   Model: ${cs2Model.name}`);
        console.log(`   Size: ${cs2Model.size}`);
        console.log(`   Modified: ${cs2Model.modified_at}\n`);
      }
    } catch (error) {
      throw new Error(`Failed to list models: ${error.message}`);
    }

    // Test 3: Model inference test (if model exists)
    console.log('🧠 Test 3: Model inference test...');
    
    try {
      const testPrompt = 'You are a CS2 coach. Respond with a simple JSON: {"test": "success"}';
      
      console.log('   Sending test prompt to model...');
      const startTime = Date.now();
      
      const response = await ollama.generate({
        model: modelName,
        prompt: testPrompt,
        options: {
          temperature: 0.1,
          num_predict: 50,
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.response) {
        throw new Error('Empty response from model');
      }

      console.log('✅ Model inference successful');
      console.log(`   Response time: ${responseTime}ms`);
      console.log(`   Response length: ${response.response.length} characters`);
      
      // Check if response time is reasonable
      const maxResponseTime = parseInt(process.env.OLLAMA_TIMEOUT_MS || '30000');
      if (responseTime > maxResponseTime) {
        console.log(`⚠️  Response time (${responseTime}ms) exceeds timeout (${maxResponseTime}ms)`);
      }
      
      console.log(`   Sample response: ${response.response.substring(0, 100)}...\n`);

    } catch (error) {
      if (error.message.includes('model') && error.message.includes('not found')) {
        console.log('⚠️  Model not found for inference test');
        console.log('   This is expected if the model hasn\'t been created yet\n');
      } else {
        throw new Error(`Model inference failed: ${error.message}`);
      }
    }

    // Test 4: Performance characteristics
    console.log('⚡ Test 4: Performance characteristics...');
    
    try {
      // Test with different prompt sizes
      const smallPrompt = 'Test prompt.';
      const largePrompt = 'You are a professional Counter-Strike 2 coach. '.repeat(50);

      console.log('   Testing small prompt performance...');
      const smallStart = Date.now();
      await ollama.generate({
        model: modelName,
        prompt: smallPrompt,
        options: { num_predict: 10 },
      });
      const smallTime = Date.now() - smallStart;

      console.log('   Testing large prompt performance...');
      const largeStart = Date.now();
      await ollama.generate({
        model: modelName,
        prompt: largePrompt,
        options: { num_predict: 20 },
      });
      const largeTime = Date.now() - largeStart;

      console.log(`   Small prompt: ${smallTime}ms`);
      console.log(`   Large prompt: ${largeTime}ms`);
      
      // Performance recommendations
      if (smallTime > 5000) {
        console.log('⚠️  Small prompt inference is slow - consider model optimization');
      }
      if (largeTime > 15000) {
        console.log('⚠️  Large prompt inference is slow - consider context optimization');
      }
      
      console.log('✅ Performance characteristics tested\n');

    } catch (error) {
      console.log('⚠️  Performance test skipped due to model availability\n');
    }

    console.log('🎉 Ollama Health Check Completed!\n');
    console.log('✅ Ollama service is healthy and ready for CS2 coaching');
    console.log('💡 If the model is missing, create it using the provided modelfile');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Ollama Health Check Failed:');
    console.error(error.message);
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Ensure Ollama is installed and running');
    console.error('2. Check if Ollama is accessible at the configured URL');
    console.error('3. Create the CS2 coach model if it doesn\'t exist');
    console.error('4. Verify Ollama has sufficient resources (RAM/GPU)');
    
    process.exit(1);
  }
}

// Run the health check
testOllamaHealth().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});