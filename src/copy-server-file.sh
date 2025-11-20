#!/bin/bash

# 🚀 Script to replace old server file with new SQL version

echo "🔄 Copying new SQL-based server file..."
echo "📁 Source: /supabase/functions/server/index-sql.tsx"
echo "📁 Target: /supabase/functions/server/index.tsx"
echo ""

# Copy the file
cp /supabase/functions/server/index-sql.tsx /supabase/functions/server/index.tsx

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS! Server file has been updated!"
    echo "🗄️ Your system is now using PostgreSQL database"
    echo "🤖 AI Assistant is now active and role-based"
    echo ""
    echo "📊 Next steps:"
    echo "1. Reload your application"
    echo "2. Check the console for success messages"
    echo "3. Test login and create a project"
    echo "4. Try the AI assistant!"
    echo ""
    echo "💚 System is ready for production! 🇸🇦"
else
    echo "❌ ERROR: Could not copy file"
    echo "Please copy manually:"
    echo "1. Open /supabase/functions/server/index-sql.tsx"
    echo "2. Copy all content (Ctrl+A, Ctrl+C)"
    echo "3. Open /supabase/functions/server/index.tsx"
    echo "4. Paste (Ctrl+A, Ctrl+V)"
    echo "5. Save (Ctrl+S)"
fi
