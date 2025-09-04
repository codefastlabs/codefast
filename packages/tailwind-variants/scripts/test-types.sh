#!/bin/bash

# Test script that runs both TypeScript type checking and Jest tests
# This ensures that both type inference and runtime tests pass

echo "🔍 Running TypeScript type checking..."
npx tsc --noEmit --project .

if [ $? -eq 0 ]; then
    echo "✅ TypeScript type checking passed"
else
    echo "❌ TypeScript type checking failed"
    echo "This means the library has type inference issues that need to be fixed!"
    exit 1
fi

echo ""
echo "🧪 Running Jest tests..."
pnpm test tests/types/type-inference.test.ts

if [ $? -eq 0 ]; then
    echo "✅ Jest tests passed"
else
    echo "❌ Jest tests failed"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Both type inference and runtime behavior are working correctly."
