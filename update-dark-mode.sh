#!/bin/bash
# Quick script to add dark mode classes to common patterns

# This is a helper script - run manually with care
echo "This script helps identify patterns to update"
echo "Use find/replace in your IDE with these patterns:"
echo ""
echo "1. bg-white -> bg-white dark:bg-gray-800"
echo "2. text-gray-900 -> text-gray-900 dark:text-white"  
echo "3. text-gray-600 -> text-gray-600 dark:text-gray-400"
echo "4. border-gray-300 -> border-gray-300 dark:border-gray-600"
echo "5. px-6 (in tables) -> px-3 sm:px-6"
echo "6. text-3xl (headers) -> text-2xl sm:text-3xl"
